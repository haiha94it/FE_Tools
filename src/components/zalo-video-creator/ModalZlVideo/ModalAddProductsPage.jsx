import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { InputText } from 'primereact/inputtext';
import { useParams } from 'next/navigation';
import { createNewProductsPage, getLinkThumbnalsProducts } from '../router_request';
import { InputSwitch } from 'primereact/inputswitch';
import { toast } from 'react-toastify';

// Component để mô phỏng vùng tải ảnh lên
// Nhận vào props để xử lý click và hiển thị ảnh preview
const ImageUploadArea = ({ onFileSelect, previewUrl }) => {
    const fileInputRef = useRef(null);

    const handleAreaClick = () => {
        // Kích hoạt input file ẩn khi click vào vùng này
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            onFileSelect(file);
        }
    };
    return (
        <div
            onClick={handleAreaClick}
            style={{
                width: '100%',
                height: '180px',
                border: '2px dashed #ccc',
                borderRadius: '5px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                backgroundColor: '#f9f9f9',
                overflow: 'hidden', // Để đảm bảo ảnh preview không tràn ra ngoài
                position: 'relative'
            }}
        >
            {/* Input file ẩn */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*" // Chỉ cho phép chọn file ảnh
                style={{ display: 'none' }}
            />

            {/* Hiển thị ảnh Preview hoặc biểu tượng Tải ảnh lên */}
            {previewUrl ? (
                <img
                    src={previewUrl}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            ) : (
                <>
                    <i className="pi pi-plus" style={{ fontSize: '1.5rem', marginBottom: '8px' }}></i>
                    <span>Tải ảnh lên</span>
                </>
            )}
        </div>
    );
};

export const ModalAddProductsPage = ({ setRfProducts, show, handleClose, inforChannel, dataEdit }) => {
    const [linkType, setLinkType] = useState('url');
    const [displaySetting, setDisplaySetting] = useState(true);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [linkImage, setLinkImage] = useState("")
    const [link, setLink] = useState("")
    const [name, setName] = useState("")
    const params = useParams()
    const handleFileSelect = (file) => {
        getLinkThumbnalsProducts(file, params, inforChannel?.channel_id, setLinkImage)
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const httpsRegex = /^https:\/\/[^\s$.?#].[^\s]*$/i;
        if (!httpsRegex.test(link)) {
            return toast.error("Vui lòng nhập đúng định dạng link (https://...)!");
        }
        createNewProductsPage(name, params, displaySetting ? 2 : 1, linkType === "url" ? 2 : 1, link, linkImage?.id, dataEdit?.id ? "update-store-item" : "store-item", dataEdit?.id ? dataEdit.id : "", setRfProducts)
        setLink("")
        setName("")
        setLinkImage("")
        setPreviewUrl(null);
        handleClose();
    };
    useEffect(() => {
        if (!dataEdit?.id) return
        setName(dataEdit.name)
        setLink(dataEdit.link)
        setDisplaySetting(dataEdit.privacy === 2 ? true : false)
        setLinkType(dataEdit.ctaType === 2 ? "url" : "button")
        setPreviewUrl(Array.isArray(dataEdit.thumbnails) && dataEdit.thumbnails[0] || null)
        // setLinkImage({ id: dataEdit.thumbnails[0] })
    }, [dataEdit])

    const handleModalClose = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        handleClose();
    };

    return (
        <Modal show={show} onHide={handleModalClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>{dataEdit?.id ? "Chỉnh sửa" : "Thêm mới"}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Row>
                        <Col xs={12} md={4} className="mb-3">
                            <ImageUploadArea
                                onFileSelect={handleFileSelect}
                                previewUrl={previewUrl}
                            />
                        </Col>
                        <Col xs={12} md={8}>
                            {/* Tên */}
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Tên</Form.Label>
                                <InputText
                                    onChange={(e) => setName(e.target.value)}
                                    value={name}
                                    placeholder="Nhập tên"
                                    className="w-100 p-inputtext-sm"
                                    required
                                />
                            </Form.Group>

                            {/* Liên kết */}
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Liên kết</Form.Label>
                                <div className="d-flex flex-column">
                                    {/* Radio Nút nhấn */}
                                    <Form.Check
                                        type="radio"
                                        label={
                                            <>
                                                Nút nhắn tin{' '}
                                                <i
                                                    className="pi pi-info-circle text-muted ms-1"
                                                    title="Thông tin về nút nhấn"
                                                />
                                            </>
                                        }
                                        id="radio-button"
                                        name="linkType"
                                        checked={linkType === 'button'}
                                        onChange={() => setLinkType('button')}
                                        className="mb-2"
                                    />

                                    <Form.Check
                                        type="radio"
                                        label="Đường link"
                                        id="radio-url"
                                        name="linkType"
                                        checked={linkType === 'url'}
                                        onChange={() => setLinkType('url')}
                                        className="mb-3"
                                    />
                                    {linkType === 'url' && (
                                        <InputText
                                            placeholder="Nhập link"
                                            value={link}
                                            onChange={(e) => setLink(e.target.value)}
                                            className="w-100 p-inputtext-sm"
                                            required
                                        />
                                    )}
                                </div>
                            </Form.Group>

                            {/* Cài đặt hiển thị */}
                            <Form.Group className="mt-4">
                                <Form.Label className="fw-bold">Cài đặt hiển thị</Form.Label>
                                <div className="d-flex align-items-center">
                                    <InputSwitch
                                        checked={displaySetting}
                                        onChange={(e) => setDisplaySetting(e.value)}
                                        className="me-2"
                                    />
                                    <span>Công khai</span>
                                </div>
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    {/* Nút Thêm */}
                    <Button variant="primary" type="submit">
                        {dataEdit?.id ? "Chỉnh sửa" : "Thêm mới"}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal >
    );
};