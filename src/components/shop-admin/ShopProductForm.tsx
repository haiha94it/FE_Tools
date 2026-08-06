"use client";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { shopImageUrl } from "@/lib/shop-utils";
import { toast } from "@/lib/toast";
import { zaloShopService } from "@/services/zalo-shop.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { useZaloShopAdminStore } from "@/stores/use-zalo-shop-admin-store";
import type { ShopProductVariant, ShopVariantOption } from "@/types/zalo-shop";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";

const HOT_BANNER_SAMPLES_URL =
  "https://drive.google.com/drive/folders/185X4nWZgbh3ojNvv78UXm6iWU8CJOoAR?usp=sharing";
const MAX_PRODUCT_IMAGES = 5;

/** UI: 1 tên thuộc tính + nhiều giá trị (Màu → Đen/Đỏ/Tím) */
interface AttrGroup {
  name: string;
  values: string[];
}

const emptyAttrGroups = (): AttrGroup[] => [{ name: "", values: [] }];

const emptyVariant = (): ShopProductVariant => ({
  classify: "",
  price: "",
  promotion_price: "",
  total_quantity: "",
  sold_quantity: 0,
  options: [],
});

function optionsToGroups(options?: ShopVariantOption[]): AttrGroup[] {
  if (!options?.length) return emptyAttrGroups();
  const map = new Map<string, string[]>();
  for (const option of options) {
    const name = (option.name ?? "").trim();
    const value = (option.value ?? "").trim();
    if (!name && !value) continue;
    const list = map.get(name) ?? [];
    if (value && !list.includes(value)) list.push(value);
    map.set(name, list);
  }
  if (map.size === 0) return emptyAttrGroups();
  return Array.from(map.entries()).map(([name, values]) => ({ name, values }));
}

function groupsToOptions(groups: AttrGroup[]): ShopVariantOption[] {
  const out: ShopVariantOption[] = [];
  for (const group of groups) {
    const name = group.name.trim();
    for (const raw of group.values) {
      const value = raw.trim();
      if (!name && !value) continue;
      out.push({ name, value });
    }
  }
  return out;
}

function splitValueTokens(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

interface ShopProductFormProps {
  categoryId: number;
  /** Tên danh mục hiển thị UI — không show id hệ thống */
  categoryName?: string;
  productId?: number;
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/40">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-white/90">{title}</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export default function ShopProductForm({
  categoryId,
  categoryName,
  productId,
}: ShopProductFormProps) {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? "");
  const saveProduct = useZaloShopAdminStore((s) => s.saveProduct);
  const isLoading = useZaloShopAdminStore((s) => s.isLoading);
  const imageRef = useRef<HTMLInputElement>(null);
  const hotImageRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [sellOption, setSellOption] = useState(0);
  const [linkZalo, setLinkZalo] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<ShopProductVariant[]>([emptyVariant()]);
  /** Parallel variants: nhóm thuộc tính UI (tên 1 lần + list giá trị) */
  const [attrGroups, setAttrGroups] = useState<AttrGroup[][]>([emptyAttrGroups()]);
  /** Draft ô nhập giá trị — key `${variantIdx}-${groupIdx}` */
  const [valueDrafts, setValueDrafts] = useState<Record<string, string>>({});
  const [isHot, setIsHot] = useState(false);
  const [imageHot, setImageHot] = useState<string | null>(null);
  const [isFlashSale, setIsFlashSale] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(Boolean(productId));
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingHot, setUploadingHot] = useState(false);
  const [parsingQr, setParsingQr] = useState(false);
  const [isDraggingImages, setIsDraggingImages] = useState(false);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await zaloShopService.listProducts({
          employeeId: userId,
          categoryId,
        });
        const product = response.results.find((p) => p.id === productId);
        if (cancelled || !product) return;
        setTitle(product.title);
        setDescription(product.description ?? "");
        setPhone(product.phone_number ?? "");
        setSellOption(product.sell_option ?? 0);
        setLinkZalo(product.link_zalo ?? "");
        setImages(product.images ?? []);
        setIsHot(Boolean(product.is_hot));
        setImageHot(product.image_hot ?? null);
        setIsFlashSale(Boolean(product.is_flash_sale));
        const nextVariants =
          product.variants.length > 0
            ? product.variants.map((v) => ({ ...v, options: v.options ?? [] }))
            : [emptyVariant()];
        setVariants(nextVariants);
        setAttrGroups(
          nextVariants.map((v) => optionsToGroups(v.options)),
        );
        setValueDrafts({});
      } finally {
        if (!cancelled) setLoadingProduct(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, userId, categoryId]);

  const handleUploadFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (files.length === 0) {
      toast.error("Chỉ chấp nhận file ảnh (JPG, PNG, WEBP, GIF, …)");
      return;
    }
    if (images.length + files.length > MAX_PRODUCT_IMAGES) {
      toast.error(`Mỗi sản phẩm tối đa ${MAX_PRODUCT_IMAGES} ảnh`);
      return;
    }

    setUploadingImages(true);
    let ok = 0;
    let fail = 0;
    try {
      for (const file of files) {
        try {
          const path = await zaloShopService.uploadFile(file);
          if (!path) {
            fail += 1;
            continue;
          }
          setImages((prev) =>
            prev.length >= MAX_PRODUCT_IMAGES ? prev : [...prev, path],
          );
          ok += 1;
        } catch {
          fail += 1;
        }
      }
      if (ok > 0) {
        toast.success(ok === 1 ? "Tải ảnh thành công" : `Đã tải ${ok} ảnh`);
      }
      if (fail > 0) {
        toast.error(fail === 1 ? "Tải ảnh thất bại" : `${fail} ảnh tải thất bại`);
      }
    } finally {
      setUploadingImages(false);
      if (imageRef.current) imageRef.current.value = "";
    }
  };

  const handleUploadHotBanner = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Banner hot chỉ nhận file ảnh");
      return;
    }
    setUploadingHot(true);
    try {
      const path = await zaloShopService.uploadFile(file);
      if (!path) {
        toast.error("Tải banner hot thất bại");
        return;
      }
      setImageHot(path);
      toast.success("Đã tải banner hot");
    } catch {
      toast.error("Tải banner hot thất bại");
    } finally {
      setUploadingHot(false);
      if (hotImageRef.current) hotImageRef.current.value = "";
    }
  };

  const handleParseQr = async (file: File) => {
    setParsingQr(true);
    try {
      const link = await zaloShopService.getLinkZaloFromQr(file);
      setLinkZalo(link);
      toast.success("Đã lấy link Zalo từ mã QR");
    } catch {
      toast.error("Không đọc được mã QR. Kiểm tra ảnh QR cá nhân/OA.");
    } finally {
      setParsingQr(false);
      if (qrRef.current) qrRef.current.value = "";
    }
  };

  const handleImageDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDraggingImages(true);
    }
  };

  const handleImageDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDraggingImages(false);
    }
  };

  const handleImageDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleImageDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDraggingImages(false);
    if (uploadingImages) return;
    const { files } = e.dataTransfer;
    if (files?.length) {
      void handleUploadFiles(files);
    }
  };

  const updateVariant = (
    index: number,
    key: keyof ShopProductVariant,
    value: string | number,
  ) => {
    setVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const updateAttrGroupName = (
    variantIndex: number,
    groupIndex: number,
    name: string,
  ) => {
    setAttrGroups((prev) => {
      const next = prev.map((groups) => groups.map((g) => ({ ...g, values: [...g.values] })));
      while (next.length <= variantIndex) next.push(emptyAttrGroups());
      const groups = [...(next[variantIndex] ?? emptyAttrGroups())];
      groups[groupIndex] = { ...groups[groupIndex], name };
      next[variantIndex] = groups;
      return next;
    });
  };

  const addAttrGroup = (variantIndex: number) => {
    setAttrGroups((prev) => {
      const next = prev.map((groups) => groups.map((g) => ({ ...g, values: [...g.values] })));
      while (next.length <= variantIndex) next.push(emptyAttrGroups());
      next[variantIndex] = [...(next[variantIndex] ?? emptyAttrGroups()), { name: "", values: [] }];
      return next;
    });
  };

  const removeAttrGroup = (variantIndex: number, groupIndex: number) => {
    setAttrGroups((prev) => {
      const next = prev.map((groups) => groups.map((g) => ({ ...g, values: [...g.values] })));
      const groups = [...(next[variantIndex] ?? emptyAttrGroups())];
      if (groups.length <= 1) {
        next[variantIndex] = emptyAttrGroups();
      } else {
        groups.splice(groupIndex, 1);
        next[variantIndex] = groups;
      }
      return next;
    });
  };

  const commitAttrValues = (
    variantIndex: number,
    groupIndex: number,
    raw: string,
  ) => {
    const tokens = splitValueTokens(raw);
    if (tokens.length === 0) return;
    setAttrGroups((prev) => {
      const next = prev.map((groups) => groups.map((g) => ({ ...g, values: [...g.values] })));
      while (next.length <= variantIndex) next.push(emptyAttrGroups());
      const groups = [...(next[variantIndex] ?? emptyAttrGroups())];
      const group = { ...groups[groupIndex], values: [...groups[groupIndex].values] };
      for (const token of tokens) {
        if (!group.values.includes(token)) group.values.push(token);
      }
      groups[groupIndex] = group;
      next[variantIndex] = groups;
      return next;
    });
    setValueDrafts((prev) => {
      const next = { ...prev };
      delete next[`${variantIndex}-${groupIndex}`];
      return next;
    });
  };

  const removeAttrValue = (
    variantIndex: number,
    groupIndex: number,
    valueIndex: number,
  ) => {
    setAttrGroups((prev) => {
      const next = prev.map((groups) => groups.map((g) => ({ ...g, values: [...g.values] })));
      const groups = [...(next[variantIndex] ?? emptyAttrGroups())];
      const values = [...groups[groupIndex].values];
      values.splice(valueIndex, 1);
      groups[groupIndex] = { ...groups[groupIndex], values };
      next[variantIndex] = groups;
      return next;
    });
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, emptyVariant()]);
    setAttrGroups((prev) => [...prev, emptyAttrGroups()]);
  };

  const removeVariant = (variantIndex: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== variantIndex));
    setAttrGroups((prev) => prev.filter((_, i) => i !== variantIndex));
    setValueDrafts({});
  };

  const copyVariant = (variantIndex: number) => {
    setVariants((prev) => {
      const clone = JSON.parse(
        JSON.stringify(prev[variantIndex]),
      ) as ShopProductVariant;
      delete clone.id;
      return [...prev, clone];
    });
    setAttrGroups((prev) => {
      const source = prev[variantIndex] ?? emptyAttrGroups();
      const clone = source.map((g) => ({ name: g.name, values: [...g.values] }));
      return [...prev, clone];
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Tên sản phẩm là bắt buộc");
      return;
    }
    if (!description.trim()) {
      toast.error("Mô tả là bắt buộc");
      return;
    }
    if (images.length === 0) {
      toast.error("Cần ít nhất một hình ảnh");
      return;
    }
    if (images.length > MAX_PRODUCT_IMAGES) {
      toast.error(`Tối đa ${MAX_PRODUCT_IMAGES} ảnh sản phẩm`);
      return;
    }
    if (!variants[0]?.classify) {
      toast.error("Cần ít nhất một phân loại");
      return;
    }
    if (sellOption === 1 && !linkZalo.trim()) {
      toast.error("Thêm link liên hệ Zalo");
      return;
    }
    if (isHot && !imageHot) {
      toast.error("Bật banner hot thì cần tải ảnh banner hot");
      return;
    }
    for (const variant of variants) {
      const sold = Number(variant.sold_quantity ?? 0);
      const total = Number(variant.total_quantity ?? 0);
      if (sold > total) {
        toast.error(
          `Phân loại "${variant.classify || "…"}": đã bán không được lớn hơn tồn kho`,
        );
        return;
      }
    }

    const toNum = (v: string | number | null | undefined, fallback = 0) => {
      if (v === "" || v == null) return fallback;
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    };

    const cleanedVariants = variants.map((v, idx) => ({
      ...v,
      price: toNum(v.price),
      promotion_price: toNum(v.promotion_price, 0),
      total_quantity: toNum(v.total_quantity),
      sold_quantity: toNum(v.sold_quantity, 0),
      options: groupsToOptions(attrGroups[idx] ?? emptyAttrGroups()),
    }));

    await saveProduct({
      id_account: userId,
      id_category: categoryId,
      title: title.trim(),
      description: description.trim(),
      phone_number: phone,
      sell_option: sellOption,
      images,
      variants: cleanedVariants,
      link_zalo: sellOption === 1 ? linkZalo.trim() || null : null,
      is_hot: isHot,
      is_flash_sale: isFlashSale,
      image_hot: isHot ? imageHot : null,
      ...(productId ? { id_product: productId } : {}),
    });
    toast.success(productId ? "Đã cập nhật sản phẩm" : "Đã tạo sản phẩm");
    router.push(`/shop/categories/${categoryId}`);
  };

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="w-full min-w-0 space-y-6"
    >
      {categoryName ? (
        <p className="-mt-2 text-sm text-gray-500">
          Danh mục:{" "}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {categoryName}
          </span>
        </p>
      ) : null}

      {/* Cơ bản */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
          Thông tin cơ bản
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên sản phẩm *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên sản phẩm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mô tả *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              placeholder="Mô tả chi tiết sản phẩm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Số điện thoại
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Hotline liên hệ"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Hình thức bán
            </label>
            <select
              value={sellOption}
              onChange={(e) => setSellOption(Number(e.target.value))}
              className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value={0}>Đặt hàng qua giỏ</option>
              <option value={1}>Liên hệ Zalo trực tiếp</option>
            </select>
          </div>
        </div>
      </section>

      {/* Ảnh + hot + flash */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Hình ảnh & hiển thị
          </h3>
          <button
            type="button"
            onClick={() => imageRef.current?.click()}
            disabled={uploadingImages || images.length >= MAX_PRODUCT_IMAGES}
            className="inline-flex min-h-11 touch-manipulation items-center text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50 sm:min-h-0"
          >
            + Thêm ảnh
          </button>
          <input
            ref={imageRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                void handleUploadFiles(e.target.files);
              }
            }}
          />
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (!uploadingImages && images.length < MAX_PRODUCT_IMAGES) {
              imageRef.current?.click();
            }
          }}
          onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!uploadingImages && images.length < MAX_PRODUCT_IMAGES) {
                imageRef.current?.click();
              }
            }
          }}
          onDragEnter={handleImageDragEnter}
          onDragLeave={handleImageDragLeave}
          onDragOver={handleImageDragOver}
          onDrop={handleImageDrop}
          className={`rounded-xl border-2 border-dashed p-4 transition sm:p-5 ${
            isDraggingImages
              ? "border-brand-500 bg-brand-50/80 dark:border-brand-400 dark:bg-brand-500/10"
              : "border-gray-300 bg-gray-50/60 hover:border-brand-400 dark:border-gray-700 dark:bg-gray-800/40 dark:hover:border-brand-500/50"
          } ${uploadingImages ? "pointer-events-none opacity-70" : "cursor-pointer"}`}
        >
          <div className="mb-3 text-center">
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {isDraggingImages
                ? "Thả ảnh vào đây"
                : uploadingImages
                  ? "Đang tải ảnh…"
                  : "Kéo thả ảnh vào đây hoặc bấm để chọn"}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              JPG, PNG, WEBP, GIF — tối đa {MAX_PRODUCT_IMAGES} ảnh (
              {images.length}/{MAX_PRODUCT_IMAGES})
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {images.map((img, idx) => (
              <div
                key={`${img}-${idx}`}
                className="group relative h-24 w-24 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={shopImageUrl(img)}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() =>
                    setImages((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="absolute right-1 top-1 min-h-8 min-w-8 touch-manipulation rounded bg-black/60 px-1.5 py-0.5 text-xs text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
            {images.length === 0 && !uploadingImages ? (
              <p className="w-full text-center text-sm text-gray-500">
                Chưa có ảnh sản phẩm
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <ToggleRow
            title="Banner sản phẩm hot"
            description="Hiển thị banner chương trình đặc biệt phía trên trang sản phẩm"
            checked={isHot}
            onChange={setIsHot}
          />

          {isHot ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-800/40">
              <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-300">
                Ảnh banner hot *
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={uploadingHot}
                  onClick={() => hotImageRef.current?.click()}
                  className="inline-flex min-h-11 items-center rounded-lg border border-dashed border-gray-300 px-3 text-sm text-gray-600 hover:border-brand-400 hover:text-brand-600 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
                >
                  {uploadingHot ? "Đang tải…" : imageHot ? "Đổi banner" : "Tải banner"}
                </button>
                <input
                  ref={hotImageRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleUploadHotBanner(file);
                  }}
                />
                {imageHot ? (
                  <div className="group relative h-20 w-32 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <Image
                      src={shopImageUrl(imageHot)}
                      alt="Banner hot"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => setImageHot(null)}
                      className="absolute right-1 top-1 rounded bg-black/60 px-1.5 text-xs text-white"
                    >
                      ×
                    </button>
                  </div>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                <a
                  href={HOT_BANNER_SAMPLES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-600 hover:underline"
                >
                  Tải banner mẫu
                </a>{" "}
                hoặc tự thiết kế.
              </p>
            </div>
          ) : null}

          <ToggleRow
            title="Flash Sale & đồng hồ đếm ngược"
            description="Hiển thị thanh Flash Sale kèm đếm ngược kích thích mua hàng"
            checked={isFlashSale}
            onChange={setIsFlashSale}
          />
        </div>
      </section>

      {/* Phân loại + thuộc tính */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Phân loại & giá
          </h3>
          <button
            type="button"
            onClick={addVariant}
            className="inline-flex min-h-11 touch-manipulation items-center text-sm font-medium text-brand-600 hover:text-brand-700 sm:min-h-0"
          >
            + Thêm phân loại
          </button>
        </div>
        <div className="space-y-4">
          {variants.map((variant, index) => {
            const groups = attrGroups[index] ?? emptyAttrGroups();
            return (
            <div
              key={index}
              className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-800/50"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-gray-500">
                  Phân loại {index + 1}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => copyVariant(index)}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    Sao chép
                  </button>
                  {variants.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-xs text-error-600"
                    >
                      Xóa
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    Tên / mã phân loại *
                  </label>
                  <Input
                    value={String(variant.classify)}
                    onChange={(e) =>
                      updateVariant(index, "classify", e.target.value)
                    }
                    placeholder="VD: Size M / SP001"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    Tồn kho
                  </label>
                  <Input
                    type="number"
                    value={String(variant.total_quantity)}
                    onChange={(e) =>
                      updateVariant(index, "total_quantity", e.target.value)
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    Đã bán
                  </label>
                  <Input
                    type="number"
                    value={String(variant.sold_quantity ?? 0)}
                    onChange={(e) =>
                      updateVariant(index, "sold_quantity", e.target.value)
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    Giá bán thực tế (₫)
                  </label>
                  <Input
                    type="number"
                    value={String(variant.price)}
                    onChange={(e) =>
                      updateVariant(index, "price", e.target.value)
                    }
                    placeholder="0"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-2">
                  <label className="mb-1 block text-xs text-gray-500">
                    Giá niêm yết cũ (₫) — gạch ngang trên storefront
                  </label>
                  <Input
                    type="number"
                    value={String(variant.promotion_price ?? "")}
                    onChange={(e) =>
                      updateVariant(index, "promotion_price", e.target.value)
                    }
                    placeholder="Thường cao hơn giá bán"
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Thuộc tính (màu, size, …)
                  </label>
                  <button
                    type="button"
                    onClick={() => addAttrGroup(index)}
                    className="text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    + Thêm loại thuộc tính
                  </button>
                </div>
                <p className="mb-3 text-[11px] text-gray-500">
                  Gõ tên 1 lần (VD: Màu), rồi thêm nhiều giá trị: Đen, Đỏ, Tím
                  (Enter hoặc dấu phẩy).
                </p>
                <div className="space-y-3">
                  {groups.map((group, gIdx) => {
                    const draftKey = `${index}-${gIdx}`;
                    const draft = valueDrafts[draftKey] ?? "";
                    return (
                      <div
                        key={gIdx}
                        className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/60"
                      >
                        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                          <Input
                            value={group.name}
                            onChange={(e) =>
                              updateAttrGroupName(index, gIdx, e.target.value)
                            }
                            placeholder="Tên thuộc tính (Màu, Size…)"
                            className="sm:max-w-xs"
                          />
                          <button
                            type="button"
                            onClick={() => removeAttrGroup(index, gIdx)}
                            className="text-xs text-error-600 sm:ml-auto"
                          >
                            Xóa loại
                          </button>
                        </div>
                        <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800/50">
                          {group.values.map((val, vIdx) => (
                            <span
                              key={`${val}-${vIdx}`}
                              className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                            >
                              {val}
                              <button
                                type="button"
                                onClick={() =>
                                  removeAttrValue(index, gIdx, vIdx)
                                }
                                className="text-brand-600 hover:text-error-600"
                                aria-label={`Xóa ${val}`}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          <input
                            value={draft}
                            onChange={(e) =>
                              setValueDrafts((prev) => ({
                                ...prev,
                                [draftKey]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === ",") {
                                e.preventDefault();
                                commitAttrValues(index, gIdx, draft);
                              }
                              if (
                                e.key === "Backspace" &&
                                !draft &&
                                group.values.length > 0
                              ) {
                                removeAttrValue(
                                  index,
                                  gIdx,
                                  group.values.length - 1,
                                );
                              }
                            }}
                            onBlur={() => {
                              if (draft.trim()) {
                                commitAttrValues(index, gIdx, draft);
                              }
                            }}
                            placeholder={
                              group.values.length
                                ? "Thêm giá trị…"
                                : "Nhập giá trị, Enter"
                            }
                            className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-sm text-gray-800 outline-none placeholder:text-gray-400 dark:text-white/90"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </section>

      {/* Liên hệ Zalo — chỉ khi bán qua liên hệ Zalo */}
      {sellOption === 1 ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
            Liên hệ Zalo & mã QR
          </h3>
          <p className="mb-3 text-xs text-gray-500">
            Dán link Zalo cá nhân/OA hoặc tải ảnh QR để hệ thống đọc link.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Đường dẫn Zalo liên hệ *
              </label>
              <Input
                value={linkZalo}
                onChange={(e) => setLinkZalo(e.target.value)}
                placeholder="https://zalo.me/… hoặc link OA"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={parsingQr}
              onClick={() => qrRef.current?.click()}
              className="w-full shrink-0 sm:w-auto"
            >
              {parsingQr ? "Đang đọc QR…" : "Tải lên QR Code"}
            </Button>
            <input
              ref={qrRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleParseQr(file);
              }}
            />
          </div>

          <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50/40 p-4 dark:border-brand-500/20 dark:bg-brand-500/5">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Hướng dẫn lấy mã QR code cá nhân
            </h4>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-gray-600 dark:text-gray-400">
              <li>Mở app Zalo trên điện thoại → tab Cá nhân (góc phải).</li>
              <li>
                Chạm avatar hoặc mục mã QR để mở QR của bạn / Official Account.
              </li>
              <li>Chụp màn hình hoặc lưu ảnh QR.</li>
              <li>
                Bấm <strong>Tải lên QR Code</strong> ở trên — hệ thống tự điền
                link Zalo.
              </li>
            </ol>
            <div className="relative mt-4 aspect-[16/10] w-full max-w-xl overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700">
              <Image
                src="/images/shop/get-qr-guide.jpg"
                alt="Hướng dẫn lấy mã QR Zalo cá nhân"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        </section>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={`/shop/categories/${categoryId}`}
          className="w-full sm:w-auto"
        >
          <Button variant="outline" type="button" className="w-full sm:w-auto">
            Hủy
          </Button>
        </Link>
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {productId ? "Cập nhật" : "Tạo sản phẩm"}
        </Button>
      </div>
    </form>
  );
}
