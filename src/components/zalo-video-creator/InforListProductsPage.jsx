"use client";

import React, { useEffect, useState } from 'react';
import { confirm } from '@/lib/confirm';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { TabView, TabPanel } from 'primereact/tabview';
import { Container } from 'react-bootstrap';
import { InputSwitch } from 'primereact/inputswitch';
import { useParams } from 'next/navigation';
import { deleteProductsPage, getListProductsPage, updateInforPageCreator, updateStatusPageCreator } from './router_request';
import { Image } from 'primereact/image';
import { IoMdAddCircle } from 'react-icons/io';
import { ModalAddProductsPage } from "./ModalZlVideo/ModalAddProductsPage";
import { RiEdit2Fill } from 'react-icons/ri';
import { MdDelete } from 'react-icons/md';
import { InputTextarea } from 'primereact/inputtextarea';
const productBodyTemplate = (rowData) => {
    return (
        <div className="d-flex align-items-center">
            <div style={{ width: '40px', height: '40px', backgroundColor: '#ccc', marginRight: '10px', borderRadius: '4px' }}>
                <Image src={rowData.thumbnails[0] || ""} rounded style={{ width: '40px', height: '40px' }} imageStyle={{ width: '40px', height: '40px' }} />
            </div>
            <span>{rowData.name}</span>
        </div>
    );
};

const linkBodyTemplate = (rowData) => {
    return (
        <a href={rowData.link} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
            {rowData.link}
        </a>
    );
};

const displayBodyTemplate = (rowData) => {
    return (
        <div className="d-flex align-items-center">
            <i className="pi pi-globe me-2" style={{ color: '#4CAF50' }} />
            <span>{rowData.openedOutApp}</span>
        </div>
    );
};

const actionsBodyTemplate = (params, rowData, setDataEdit, setShowModal, setRfProducts) => {
    return (
        <div className="d-flex gap-2">
            <RiEdit2Fill
                cursor="pointer"
                onClick={() => {
                    setShowModal(true);
                    setDataEdit(rowData);
                }}
                size={24}
                color="#007ad9"
            />
            <MdDelete
                cursor="pointer"
                onClick={async () => {
                    if (
                        !(await confirm({
                            title: 'Xóa sản phẩm',
                            message: 'Bạn chắc chắn muốn xoá sản phẩm này?',
                            confirmText: 'Xóa',
                            variant: 'danger',
                        }))
                    ) {
                        return;
                    }
                    deleteProductsPage(params, rowData.id, setRfProducts);
                }}
                size={24}
                color="#dc3545"
            />
        </div>
    );
};

export const InforListProductsPage = ({ isViewPage, inforChannel }) => {
    const [displayToggle, setDisplayToggle] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [listProductsPage, setListProductsPage] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [rfProducts, setRfProducts] = useState(false);
    const [dataEdit, setDataEdit] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [pageName, setPageName] = useState("");
    const [description, setDescription] = useState("");

    const params = useParams();
    const handleSave = () => {
        updateInforPageCreator(params, pageName, "name", () => {
            setPageName(pageName || "");
            setIsEditing(false);
        });
        updateInforPageCreator(params, description, "description", () => {
            setDescription(description || "");
            setIsEditing(false);
        });

    };
    useEffect(() => {
        setPageName(isViewPage?.data?.name || "")
        setDescription(isViewPage?.data?.description || "")
        setDisplayToggle(isViewPage?.data?.showed || false)
    }, [isViewPage])
    const handleClose = () => setShowModal(false);

    const header = (
        <div className="d-flex justify-content-between align-items-center">
            <div className="p-input-icon-right">
                <i className="pi pi-search" />
                <InputText
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Tìm theo..."
                    className="p-inputtext-sm"
                />
            </div>
            <div className="d-flex align-items-center">
                <Button
                    onClick={() => {
                        setShowModal(true);
                        setDataEdit({});
                    }}
                    label="Thêm mới"
                    icon={<IoMdAddCircle />}
                    className="p-button-sm"
                />
            </div>
        </div>
    );

    useEffect(() => {
        getListProductsPage(params, setListProductsPage, activeIndex);
    }, [rfProducts, activeIndex]);

    const statusBodyTemplate = (rowData) => {
        if (rowData.processing) {
            return <span className="text-warning"><i className="pi pi-spin pi-spinner me-1" /> Đang xử lý</span>;
        }
        if (rowData.hasRejected) {
            return <span className="text-danger"><i className="pi pi-times-circle me-1" /> Bị từ chối</span>;
        }
        if (rowData.privacy === 2) {
            return <span className="text-success"><i className="pi pi-check-circle me-1" /> Thành công</span>;
        }
        return <span className="text-secondary"><i className="pi pi-eye-slash me-1" /> Riêng tư</span>;
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp * 1000);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };
    return (
        <Container fluid className="p-3">
            <div className="mb-4 w-full bg-white p-3 rounded shadow-sm">
                <div className="d-flex justify-content-between align-items-start">
                    <div className="d-flex align-items-center">
                        <Image
                            src={isViewPage?.data?.thumbnail}
                            roundedCircle
                            imageStyle={{ width: '60px', height: '60px', objectFit: 'cover', marginRight: '15px' }}
                            style={{ width: '60px', height: '60px', objectFit: 'cover', marginRight: '15px' }}
                        />
                        <div>
                            <p className="mb-0 fw-bold">Tên trang thông tin</p>
                            {isEditing ? (
                                <InputText
                                    value={pageName}
                                    onChange={(e) => setPageName(e.target.value)}
                                    className="mb-2 w-100"
                                />
                            ) : (
                                <h4 className="mb-1">{pageName}</h4>
                            )}

                            <p className="mb-0 text-muted d-flex align-items-center">
                                Mô tả trang
                                {!isEditing && (
                                    <i
                                        className="pi pi-pencil text-primary ms-2"
                                        style={{ cursor: "pointer" }}
                                        onClick={() => setIsEditing(true)}
                                    />
                                )}
                            </p>
                            {isEditing ? (
                                <InputTextarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="mb-2 w-100"
                                />
                            ) : (
                                <p className="mb-0 fw-bold text-uppercase">{description}</p>
                            )}

                            {isEditing && (
                                <div className="d-flex gap-2 mt-2">
                                    <Button label="Lưu" className="p-button-success p-button-sm" onClick={handleSave} />
                                    <Button label="Hủy" className="p-button-secondary p-button-sm" onClick={() => setIsEditing(false)} />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="d-flex align-items-center">
                        <span className="me-2">Hiển thị</span>
                        <InputSwitch
                            checked={displayToggle}
                            onChange={(e) => {
                                updateStatusPageCreator(params, displayToggle ? 1 : 0, "status");
                                setDisplayToggle(e.value)
                            }
                            }
                        />
                    </div>
                </div>
            </div>

            <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                <TabPanel header="Nội dung đang hiển thị">
                    <DataTable
                        key={`${listProductsPage}`}
                        value={listProductsPage || []}
                        paginator
                        rows={5}
                        rowsPerPageOptions={[5, 10, 25]}
                        header={header}
                        globalFilter={globalFilter}
                        emptyMessage="Không tìm thấy sản phẩm."
                        className="p-datatable-sm"
                    >
                        <Column field="name" header="Tên" body={productBodyTemplate} style={{ width: '25%' }} />
                        <Column field="link" header="Liên kết" body={linkBodyTemplate} style={{ width: '25%' }} />
                        <Column
                            field="createdTime"
                            header="Ngày tạo"
                            body={(rowData) => formatDate(rowData.createdTime)}
                            style={{ width: '15%' }}
                        />
                        <Column field="display" header="Hiển thị" body={displayBodyTemplate} style={{ width: '10%' }} />
                        <Column field="status" header="Trạng thái đăng" body={statusBodyTemplate} style={{ width: '15%' }} />
                        <Column header="Chức năng" body={(rowData) => actionsBodyTemplate(params, rowData, setDataEdit, setShowModal, setRfProducts)} style={{ width: '10%' }} />
                    </DataTable>
                </TabPanel>
                <TabPanel header="Nội dung bị từ chối">
                    <p>Không có nội dung bị từ chối.</p>
                </TabPanel>
            </TabView>
            <ModalAddProductsPage
                setRfProducts={setRfProducts}
                inforChannel={inforChannel}
                show={showModal}
                handleClose={handleClose}
                dataEdit={dataEdit}
            />
        </Container>
    );
};
