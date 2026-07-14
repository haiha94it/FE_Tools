import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { RadioButton } from 'primereact/radiobutton';
import { customText } from "../constanst/customText";

const ContactSelectionDialog = ({ visible, onHide, onSubmit }) => {
    const [selectedOption, setSelectedOption] = useState(customText[0]?.id || null);

    const handleSelect = () => {
        const selectedItem = customText.find(item => item.id === selectedOption);
        if (selectedItem) {
            onSubmit(selectedItem);
            onHide();
        }
    };

    const dialogContent = (
        <div className="flex flex-column gap-3">
            {customText.map((item) => (
                <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition 
                        ${selectedOption === item.id ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}
                    onClick={() => setSelectedOption(item.id)}
                >
                    <RadioButton
                        inputId={item.id.toString()}
                        name="contactOption"
                        value={item.id}
                        onChange={(e) => setSelectedOption(e.value)}
                        checked={selectedOption === item.id}
                    />
                    <label htmlFor={item.id.toString()} className="cursor-pointer text-gray-800 font-medium">
                        {item.label}
                    </label>
                </div>
            ))}
        </div>
    );

    const dialogFooter = (
        <div className="flex justify-content-end">
            <Button
                label="Chọn"
                onClick={handleSelect}
                className="px-4 py-2 text-white rounded-lg shadow-md"
                style={{ backgroundColor: '#42a5f5', border: 'none' }}
            />
        </div>
    );

    return (
        <Dialog
            header="Chọn thông tin liên hệ"
            visible={visible}
            onHide={onHide}
            modal
            footer={dialogFooter}
            style={{ width: '420px', borderRadius: '12px' }}
            closable
        >
            {dialogContent}
        </Dialog>
    );
};

export default ContactSelectionDialog;
