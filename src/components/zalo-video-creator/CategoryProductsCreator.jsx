import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Image } from "primereact/image";
import { useParams } from "next/navigation";
import { addLabelContactCta, deleteLabelContactCta, getListCategoryProducts, getListVideoProducts } from "./router_request";
import { ModalAddCategoryCreator } from "./ModalZlVideo/ModalAddCategoryCreator"
import { customText } from "./constanst/customText";
import { TiDelete } from "react-icons/ti";
import { Menu } from "primereact/menu";
import ContactSelectionDialog from "./ModalZlVideo/ModalAddLabelCreator";
import DisplayContentSelectionDialog from "./ModalZlVideo/DisplayContentSelectionDialog";
import { MdContactPhone, MdOutlineMedicalInformation } from "react-icons/md";
import { FcShop } from "react-icons/fc";
import { IoMdAddCircle } from "react-icons/io";

export const CategoryProductsCreator = () => {
    const params = useParams();
    const [videos, setVideos] = useState([]);
    const [isAddCategory, setIsAddCategory] = useState(false)
    const [selectedVideoId, setSelectedVideoId] = useState(null);
    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [isDisplayDialogVisible, setIsDisplayDialogVisible] = useState(false);
    const [listVideo, setListVideo] = useState([])

    const menuRef = useRef(null);
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
    const getListCate = async () => {
        getListCategoryProducts(params, setVideos);
    }
    useEffect(() => {
        getListCate()
    }, []);
    const handleSelectContact = (item) => {
        addLabelContactCta(params, item.id, selectedVideoId, "contact-label-cta", getListCate)
        getListVideoProducts(params, setListVideo)
    };
    const handleDisplaySelect = (items) => {
        addLabelContactCta(params, items.map((label) => label.id).join(","), selectedVideoId, "store-label-cta", getListCate)
    };
    const handleMenuClick = (event, videoId) => {
        setSelectedVideoId(videoId);
        menuRef.current.toggle(event);
    };
    return (
        <div className="flex flex-column w-100 h-100 overflow-auto">
            <Menu model={menuItems} popup ref={menuRef} />
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold">
                    Quản lý video hiển thị nhãn
                </h4>
                <Button
                    onClick={() => setIsAddCategory(true)}
                    label="Chọn video"
                    icon={<IoMdAddCircle size={20} />}
                    iconPos="left"
                    className=" p-button-outlined"
                    style={{
                        padding: "0.6rem 1.2rem",
                        borderRadius: "5px",
                        fontWeight: "500"
                    }}
                />

            </div>
            {videos.map((video) => {
                return (
                    <div key={video.id}
                        style={{ maxHeight: "150px" }}
                        className="mb-3 w-100 h-100 shadow-sm flex">
                        <div
                            className="w-full d-flex overflow-hidden align-items-center gap-2 justify-content-between align-items-center border rounded bg-white">
                            <Image
                                src={video.thumbnail}
                                alt="thumbnail"
                                width="120"
                                className="rounded me-3"
                            />
                            <div className="flex-grow-1 flex">
                                <nav>
                                    <h6
                                        style={{ width: "400px", whiteSpace: "wrap" }}
                                        className="mb-1">{video.description.split("\n")[0]}</h6>
                                    <small className="text-muted">
                                        {video.description
                                            .split("\n")
                                            .slice(1)
                                            .map((line, idx) => (
                                                <span key={idx} className="d-block">
                                                    {line}
                                                </span>
                                            ))}
                                    </small>
                                </nav>
                                <div className="mt-2 d-flex flex-column gap-2 ">
                                    {video?.labelCtas?.length > 0 &&
                                        video.labelCtas.map((pro, index) => (
                                            <div
                                                style={{ width: "max-content" }}
                                                className="d-flex flex-column border rounded bg-white shadow-sm"
                                                key={index}
                                            >
                                                {pro?.products?.length > 0 ? (
                                                    <div className="ml-2 d-flex justify-content-between align-items-center">
                                                        <div className="d-flex align-items-center gap-2 justify-content-center">
                                                            <p className="fw-bold flex gap-1 justify-content-center align-items-center" style={{ whiteSpace: "nowrap" }}>
                                                                <FcShop />
                                                                Trang thông tin <span className="text-primary">
                                                                    ({pro.products.length})
                                                                </span>
                                                            </p>
                                                            <div className="d-flex flex gap-2">
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
                                                            style={{ padding: 0 }}
                                                            icon={<TiDelete color="red" size={28} />}
                                                            className="p-button-text p-button-danger"
                                                            tooltip="Xóa nhãn"
                                                            onClick={() => {
                                                                deleteLabelContactCta(params, video.labelCtas[0]?.ctaType, video.id, "delete-label-cta", getListCate)
                                                            }}
                                                        />
                                                    </div>
                                                ) : <></>}
                                                {pro?.customText ? (
                                                    <div className="ml-2 flex align-items-center justify-content-end" style={{ width: "max-content" }}>
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
                                                                deleteLabelContactCta(params, video.labelCtas[0]?.ctaType, video.id, "delete-label-cta", getListCate)
                                                            }}
                                                        />
                                                    </div>
                                                ) : <></>}
                                            </div>
                                        ))}
                                    {(Number(video?.labelCtas?.length) < 2 || !video?.labelCtas) && (
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
                            <Button
                                tooltip="Xóa nhãn video"
                                icon={<TiDelete color="red" size={28} />}
                                className="p-button-text p-button-danger"
                                onClick={() =>
                                    deleteLabelContactCta(params, "", video.id, "delete-cta-video", getListCate)

                                }
                            />
                        </div>
                    </div>
                );
            })}
            <ModalAddCategoryCreator
                getListCate={getListCate}
                isDialogVisible={isDialogVisible}
                setIsDialogVisible={setIsDialogVisible}
                setIsDisplayDialogVisible={setIsDisplayDialogVisible}
                menuRef={menuRef}
                setSelectedVideoId={setSelectedVideoId}
                videos={videos}
                isAddCategory={isAddCategory}
                setIsAddCategory={setIsAddCategory}
                listVideo={listVideo}
                setListVideo={setListVideo}
            />
            <ContactSelectionDialog
                visible={isDialogVisible}
                onHide={() => setIsDialogVisible(false)}
                onSubmit={handleSelectContact}
            />
            <DisplayContentSelectionDialog
                visible={isDisplayDialogVisible}
                onHide={() => setIsDisplayDialogVisible(false)}
                onSubmit={handleDisplaySelect}
            />
        </div>
    );
};
