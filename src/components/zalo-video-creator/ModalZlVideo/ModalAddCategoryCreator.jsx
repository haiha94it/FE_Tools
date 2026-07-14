import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Image } from "primereact/image";
import { useParams } from "next/navigation";
import { deleteLabelContactCta, getListVideoProducts } from "../router_request";
import { Menu } from "primereact/menu";
import { TiDelete } from "react-icons/ti";
import { customText } from "../constanst/customText";
import { MdContactPhone, MdOutlineMedicalInformation } from "react-icons/md";
import { FcShop } from "react-icons/fc";
export const ModalAddCategoryCreator = ({ getListCate, listVideo, setListVideo, setIsDisplayDialogVisible, setIsDialogVisible, menuRef, setSelectedVideoId, videos, isAddCategory, setIsAddCategory }) => {
    const params = useParams()
    const [search, setSearch] = useState("");
    const handleMenuClick = (event, videoId) => {
        setSelectedVideoId(videoId);
        menuRef.current.toggle(event);
    };
    const menuItems = [
        {
            label: "Liên hệ",
            icon: <MdContactPhone />,
            command: () => setIsDialogVisible(true),
        },
        {
            label: "Trang thông tin",
            icon: <MdOutlineMedicalInformation />,
            command: () =>
                setIsDisplayDialogVisible(true),
        },
    ];
    useEffect(() => {
        if (isAddCategory) {
            getListVideoProducts(params, setListVideo)
        }
    }, [isAddCategory])
    const footer = (
        <div className="d-flex justify-content-end">
            <Button label="Đóng" onClick={
                () => {
                    setIsAddCategory(false)
                }
            } className="p-button-text" />
        </div>
    );
    return (
        <Dialog
            header="Thêm video vào danh sách hiển thị nhãn"
            visible={isAddCategory}
            onHide={
                () => {
                    setIsAddCategory(false)
                }
            }
            style={{ width: "60vw" }}
            footer={footer}
            modal
        >
            <Menu model={menuItems} popup ref={menuRef} />
            <div className="mb-3">
                <span className="p-input-icon-left w-100">
                    <i className="pi pi-search" />
                    <InputText
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Nhập từ khóa"
                        className="w-100"
                    />
                </span>
                <small className="text-muted">
                    *Chỉ có thể chọn video đang được công khai
                </small>
            </div>
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {listVideo?.filter((video) =>
                    video.description.toLowerCase().includes(search.toLowerCase())
                ).map((video) => {
                    const products = videos.find(item => item.id === video.id)
                    return (
                        <div
                            key={video.id}
                            className="d-flex align-items-start mb-3 p-2 border-bottom"
                        >
                            <div className="position-relative me-3">
                                <Image
                                    src={video.thumbnail}
                                    alt="video thumbnail"
                                    width="80"
                                    className="rounded"
                                />
                                <span
                                    className="badge bg-dark position-absolute bottom-0 end-0"
                                    style={{ fontSize: "10px" }}
                                >
                                    00:08
                                </span>
                            </div>
                            <div className="flex-grow-1">
                                <p className="mb-1 fw-bold">{video.description.split("\n")[0]}</p>
                                <small className="text-muted d-block">
                                    {video.description
                                        .split("\n")
                                        .slice(1)
                                        .map((line, idx) => (
                                            <span key={idx} className="d-block">
                                                {line}
                                            </span>
                                        ))}
                                </small>
                            </div>
                            <div className="d-flex flex-column gap-3 mt-3 p-3 border rounded shadow-sm bg-light align-items-end">
                                {products?.labelCtas?.length > 0 &&
                                    products.labelCtas.map((pro, index) => (
                                        <div
                                            className="d-flex flex-column border rounded bg-white shadow-sm"
                                            key={index}
                                        >
                                            {/* Hiển thị danh sách products nếu có */}
                                            {pro?.products?.length > 0 ? (
                                                <div className="ml-2 d-flex justify-content-between align-items-center">
                                                    <div className="d-flex gap-2 align-items-center">
                                                        <p className="fw-bold flex gap-1 justify-content-center align-items-center">
                                                            <FcShop /> Trang thông tin <span className="text-primary">
                                                                ({pro.products.length})
                                                            </span>
                                                        </p>
                                                        <div className="d-flex flex-wrap gap-2">
                                                            {pro.products.map((img, idx) => (
                                                                <img
                                                                    key={idx}
                                                                    src={img.thumbnail}
                                                                    alt={`product-${idx}`}
                                                                    className="rounded border"
                                                                    style={{
                                                                        width: "40px",
                                                                        height: "40px",
                                                                        objectFit: "cover",
                                                                        boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        icon={<TiDelete color="red" size={28} />}
                                                        className="p-button-text p-button-danger"
                                                        style={{ padding: 0 }}
                                                        tooltip="Xóa nhãn"
                                                        onClick={() => {
                                                            const idCta = products.labelCtas.find(i => i?.products?.length > 0)?.ctaType
                                                            deleteLabelContactCta(params, idCta, video.id, "delete-label-cta", getListCate)
                                                        }
                                                        }
                                                    />
                                                </div>
                                            ) : <></>}
                                            {pro?.customText ? (
                                                <div className="ml-2 flex align-items-center justify-content-end">
                                                    <span className="badge bg-info text-dark">
                                                        {customText?.find((text) => text.id === pro.customText)?.label ||
                                                            "Không tìm thấy nhãn"}
                                                    </span>
                                                    <Button
                                                        style={{ padding: 0 }}
                                                        icon={<TiDelete color="red" size={28} />}
                                                        className="p-button-text p-button-danger"
                                                        tooltip="Xóa nhãn"
                                                        onClick={() => {
                                                            deleteLabelContactCta(params, products.labelCtas[0]?.ctaType, video.id, "delete-label-cta", getListCate)
                                                        }
                                                        }
                                                    />
                                                </div>
                                            ) : <></>}
                                        </div>
                                    ))}
                                {(Number(products?.labelCtas?.length) < 2 || !products?.labelCtas) && (
                                    <Button
                                        label="+ Thêm nhãn"
                                        className=" p-button-outlined"
                                        style={{
                                            padding: "0.6rem 1.2rem",
                                            borderRadius: "5px",
                                            fontWeight: "500",
                                            whiteSpace: "nowrap",
                                            width: "max-content"
                                        }}
                                        onClick={(e) => handleMenuClick(e, video.id)}
                                    />
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

        </Dialog>
    );
};