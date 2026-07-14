
import { useState } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";

export const ChannelInfoFields = ({ pageName, setPageName, description, setDescription }) => {
    const [isEditing, setIsEditing] = useState(false);

    const handleSave = () => {
        // TODO: gọi API lưu (createPageInfor, getInforPage nếu cần)
        setIsEditing(false);
    };

    return (
        <div>
            {/* Tên trang */}
            <div className="mb-3">
                <label className="form-label fw-semibold">Tên trang thông tin</label>
                {isEditing ? (
                    <InputText
                        value={pageName}
                        onChange={(e) => setPageName(e.target.value)}
                        placeholder="Nhập tên"
                        className="w-100"
                    />
                ) : (
                    <p className="border p-2 rounded bg-light">{pageName || "Chưa có tên"}</p>
                )}
            </div>

            {/* Mô tả */}
            <div className="mb-3">
                <label className="form-label fw-semibold">Mô tả trang</label>
                {isEditing ? (
                    <InputTextarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Nhập mô tả trang"
                        rows={4}
                        className="w-100"
                    />
                ) : (
                    <p className="border p-2 rounded bg-light">
                        {description || "Chưa có mô tả"}
                    </p>
                )}
            </div>

            {/* Nút hành động */}
            <div className="d-flex gap-2">
                {isEditing ? (
                    <>
                        <Button label="Lưu" className="p-button-success" onClick={handleSave} />
                        <Button
                            label="Hủy"
                            className="p-button-secondary"
                            onClick={() => setIsEditing(false)}
                        />
                    </>
                ) : (
                    <Button
                        label="Sửa"
                        className="p-button-info"
                        onClick={() => setIsEditing(true)}
                    />
                )}
            </div>
        </div>
    );
};
