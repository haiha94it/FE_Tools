import { FAST_REPLY_CONTENT_MAX } from "@/types/zalo-messenger";

/** Path tương đối cho BE — vd. media/files/uuid.png (không leading /) */
export function normalizeFastReplyImagePath(image?: string | null): string | null {
  const trimmed = image?.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const { pathname } = new URL(trimmed);
      const relative = pathname.replace(/^\//, "");
      return relative || null;
    } catch {
      return trimmed.replace(/^\//, "");
    }
  }

  return trimmed.replace(/^\//, "");
}

/** Body POST /api/message/fast-reply */
export function buildFastReplyCreateBody(input: {
  id_account: number;
  title: string;
  content: string;
  image?: string | null;
  command?: string;
}) {
  return {
    id_account: input.id_account,
    command: input.title.trim() ?? "",
    title: input.title.trim(),
    content: input.content.trim(),
    image: normalizeFastReplyImagePath(input.image) ?? "",
  };
}

/** Body PATCH /api/message/fast-reply/{pk} */
export function buildFastReplyUpdateBody(input: {
  title: string;
  content: string;
  image?: string | null;
  command?: string;
}) {
  return {
    command: input.command ?? "",
    title: input.title.trim(),
    content: input.content.trim(),
    image: normalizeFastReplyImagePath(input.image) ?? "",
  };
}

export function toFastReplyAttachmentLink(image?: string | null): string | null {
  const path = normalizeFastReplyImagePath(image);
  if (!path) return null;
  return `/${path}`;
}

export function validateFastReplyForm(input: {
  title: string;
  content: string;
  image?: string | null;
}): string | null {
  const title = input.title.trim();
  const content = input.content.trim();
  const image = normalizeFastReplyImagePath(input.image);

  if (!title) {
    return "Vui lòng nhập từ khóa phím tắt.";
  }

  if (!content && !image) {
    return "Phải có hình ảnh hoặc nội dung.";
  }

  if (content.length > FAST_REPLY_CONTENT_MAX) {
    return `Nội dung không được vượt quá ${FAST_REPLY_CONTENT_MAX} ký tự.`;
  }

  return null;
}