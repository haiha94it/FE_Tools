import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { toast } from 'react-toastify';
import { Dropdown } from 'primereact/dropdown';
import { updatePlaylistVideo } from '../router_request';
import { useParams } from 'next/navigation';
const listStatus = [
    { name: 'Công khai', code: 'public' },
    { name: 'Riêng tư', code: 'private' },
];
function ModalAddPlaylist({
    isAddPlaylist,
    setIsAddPlaylist,
    setIsSelectVideo,
    showOptionsModal,
    setShowOptionsModal,
    name,
    setName,
    idParams,
    getPlayListVideo,
}) {
    const params = useParams()
    const handleChange = (e) => {
        const value = e.target.value;
        if (value.length <= 40) {
            setName(value);
        } else {
            toast.error('Tên danh sách phát không được vượt quá 40 ký tự!');
        }
    };

    const footerContent = (
        <div className="flex gap-2 justify-content-end w-100">
            <Button
                label="Đóng"
                className="bg-light text-dark rounded p-2 lh-base "
                onClick={() => setIsAddPlaylist(false)}
                autoFocus
            />
            <Button
                disabled={name.length < 3 || name.length > 40}
                label="Tiếp tục"
                className="bg-primary rounded p-2 lh-base"
                onClick={() => {
                    if (idParams) {
                        updatePlaylistVideo(
                            name,
                            () => {
                                getPlayListVideo()
                                setIsSelectVideo(false)
                            },
                            params,
                            showOptionsModal?.code === "public" ? "2" : "1",
                            idParams,
                        );
                    } else {
                        setIsSelectVideo(true)
                    }
                    setIsAddPlaylist(false)
                }}
                autoFocus
            />
        </div>

    );
    return (
        <Dialog
            header="Tạo danh sách phát"
            className="dialog-shop"
            visible={isAddPlaylist}
            style={{ width: '50%' }}
            onHide={() => {
                if (!isAddPlaylist) return;
                setIsAddPlaylist(false);
            }}
            footer={footerContent}
        >
            <div className="flex flex-column gap-4 mt-4">
                <div className="flex flex-column w-100 gap-2">
                    <div className="playlist-input-container">
                        <InputText
                            value={name}
                            onChange={(e) => handleChange(e)}
                            placeholder="Nhập tên danh sách phát"
                        />
                        <p className="playlist-char-counter">{name?.length}/40</p>
                    </div><p>Tên có thể chứa từ 3 tới 40 ký tự
                    </p>

                </div>
                <div>
                    <p className='mb-2 fw-bold'>Quyền riêng tư</p>
                    <Dropdown
                        value={showOptionsModal}
                        onChange={(e) => setShowOptionsModal(e.value)}
                        options={listStatus}
                        optionLabel="name"
                        placeholder="Trạng thái"
                        style={{ height: '32px', width: "200px" }}
                    />
                </div>
            </div>
        </Dialog>
    );
}

export default ModalAddPlaylist;
