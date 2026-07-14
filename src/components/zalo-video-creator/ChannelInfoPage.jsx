import React, { useEffect, useState } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { InputSwitch } from "primereact/inputswitch";
import { createPageInfor, getInforPage } from "./router_request";
import { useParams } from "next/navigation";
import { InforListProductsPage } from "./InforListProductsPage"
export const ChannelInfoPage = ({ inforChannel }) => {
    const [pageName, setPageName] = useState("");
    const [description, setDescription] = useState("");
    const [visible, setVisible] = useState(true);
    const [avatar, setAvatar] = useState(null);
    const [isViewPage, setIsViewPage] = useState({})
    const params = useParams()
    const handleAvatarChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatar(URL.createObjectURL(file));
        }
    };

    const handleCreate = () => {
        createPageInfor(pageName, params, description, visible ? 1 : 0)
        getInforPage(params, setIsViewPage)

    };

    useEffect(() => {
        getInforPage(params, setIsViewPage)
    }, [])
    return (
        isViewPage?.error === "-105" ?
            <div className="container d-flex justify-content-center">
                <div className="card shadow-sm p-4 mt-4" style={{ maxWidth: "500px", width: "100%" }}>
                    {/* Title */}
                    <div className="text-center mb-3">
                        <i className="bi bi-info-circle text-secondary" style={{ fontSize: "1.2rem" }}></i>
                        <h4 className="fw-bold mt-2">Tạo trang thông tin</h4>
                        <p className="text-muted small">
                            Trang thông tin giúp bạn thu hút người xem và giới thiệu những gì bạn đang cung cấp.
                        </p>
                    </div>

                    {/* Avatar */}
                    <div className="text-center mb-4">
                        <label htmlFor="avatarUpload" className="d-inline-block" style={{ cursor: "pointer" }}>
                            <img
                                src={
                                    avatar ||
                                    "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                                }
                                alt="avatar"
                                className="rounded"
                                style={{
                                    width: "120px",
                                    height: "120px",
                                    objectFit: "cover",
                                    border: "2px solid #ddd",
                                    padding: "4px",
                                }}
                            />
                        </label>
                        <input
                            type="file"
                            id="avatarUpload"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleAvatarChange}
                        />
                    </div>

                    {/* Form fields */}
                    <div className="mb-3">
                        <label className="form-label fw-semibold">Tên trang thông tin</label>
                        <InputText
                            value={pageName}
                            onChange={(e) => setPageName(e.target.value)}
                            placeholder="Nhập tên"
                            className="w-100"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-semibold">Mô tả trang</label>
                        <InputTextarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Nhập mô tả trang"
                            rows={4}
                            className="w-100"
                        />
                    </div>

                    <div className="d-flex align-items-center mb-3">
                        <InputSwitch
                            checked={visible}
                            onChange={(e) => setVisible(e.value)}
                            className="me-2"
                        />
                        <span>Hiển thị trang trên Kênh của tôi</span>
                    </div>


                    {/* Button */}
                    <Button
                        label="Tạo"
                        className="w-100"
                        style={{ backgroundColor: "#006CFF", border: "none" }}
                        onClick={handleCreate}
                    />
                </div>
            </div> :
            <InforListProductsPage inforChannel={inforChannel} isViewPage={isViewPage} />
    );
};
