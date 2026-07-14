import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { getListProductsPage } from '../router_request';
import { useParams } from 'next/navigation';
const DisplayContentSelectionDialog = ({ visible, onHide, onSubmit }) => {
    const params = useParams()
    const [listProductsPage, setListProductsPage] = useState([])
    useEffect(() => {
        getListProductsPage(params, setListProductsPage, 1)
    }, [])
    const [selectedContentIds, setSelectedContentIds] = useState(['product_1', 'image_2']);
    const onSelectionChange = (id) => {
        let _selectedIds = [...selectedContentIds];

        if (_selectedIds.includes(id)) {
            _selectedIds = _selectedIds.filter(selectedId => selectedId !== id);
        } else {
            _selectedIds.push(id);
        }

        setSelectedContentIds(_selectedIds);
    };

    // Hàm xóa mục đã chọn ở thanh footer
    const removeSelectedItem = (id) => {
        setSelectedContentIds(prev => prev.filter(selectedId => selectedId !== id));
    };

    // Lọc các đối tượng đã chọn để hiển thị ở footer
    const selectedItems = listProductsPage.filter(item => selectedContentIds.includes(item.id));

    // Xử lý khi nhấn nút "Chọn"
    const handleSelect = () => {
        onSubmit(selectedItems); // Trả về MẢNG các đối tượng đã chọn
        onHide();
    };
    const dialogFooter = (
        <div className="d-flex justify-content-between align-items-center w-100">
            {/* Vùng hiển thị các ảnh nhỏ đã chọn */}
            <div className="d-flex align-items-center" style={{ gap: '5px' }}>
                <span className="p-mr-2">Đang chọn:</span>
                {selectedItems.map((item) => (
                    <div key={item.id} className="position-relative" style={{ width: '40px', height: '40px' }}>
                        <img
                            src={item?.thumbnails[0]}
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                        />
                        <span
                            className="p-badge p-component p-badge-danger p-badge-dot"
                            onClick={() => removeSelectedItem(item.id)}
                            style={{ position: 'absolute', top: '-5px', right: '-5px', cursor: 'pointer', padding: '0px 3px 0px 3px' }}
                        >
                            &times;
                        </span>
                    </div>
                ))}
            </div>

            {/* Nút Chọn */}
            <Button
                label="Chọn"
                onClick={handleSelect}
                className="p-button-sm"
                disabled={selectedItems.length === 0}
                style={{ backgroundColor: '#42a5f5', border: 'none' }}
            />
        </div>
    );

    // --- CONTENT CỦA DIALOG ---
    const dialogContent = (
        <div className="container-fluid" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <div className="row">
                {listProductsPage?.map((item) => (
                    <div key={item.id} className="col-6 col-md-4 p-2">
                        <div
                            className="content-item position-relative p-2"
                            onClick={() => onSelectionChange(item.id)}
                            style={{ cursor: 'pointer', border: selectedContentIds.includes(item.id) ? '2px solid #42a5f5' : '2px solid transparent', borderRadius: '6px' }}
                        >
                            {/* Checkbox tùy chỉnh ở góc trên bên trái */}
                            <div style={{ position: 'absolute', top: '5px', left: '5px', zIndex: 10 }}>
                                <Checkbox
                                    inputId={item.id}
                                    checked={selectedContentIds.includes(item.id)}
                                    // Bắt buộc phải có onChange, nhưng chúng ta dùng onClick trên div cha
                                    onChange={() => { }}
                                    className="custom-checkbox"
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        backgroundColor: selectedContentIds.includes(item.id) ? '#42a5f5' : 'white',
                                        border: selectedContentIds.includes(item.id) ? '2px solid #42a5f5' : '2px solid #ccc',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>
                            <img
                                src={item?.thumbnails[0]}
                                alt={item?.name}
                                className="img-fluid"
                                style={{
                                    width: '100%',
                                    height: '150px',
                                    objectFit: 'cover',
                                    borderRadius: '4px'
                                }}
                            />
                            {/* Tên sản phẩm */}
                            <p className="text-center mt-2 mb-0" style={{ fontSize: '14px' }}>
                                {item?.name}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <Dialog
            header="Chọn nội dung trưng bày"
            visible={visible}
            onHide={onHide}
            modal
            footer={dialogFooter}
            style={{ width: '50vw' }} 
            closable={true}
            draggable={false}
        >
            {dialogContent}
        </Dialog>
    );
};

export default DisplayContentSelectionDialog;