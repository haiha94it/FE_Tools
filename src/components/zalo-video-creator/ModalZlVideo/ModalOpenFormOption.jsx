import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Chip } from 'primereact/chip';
import { Dialog } from 'primereact/dialog';
import { useEffect, useState } from 'react';
import { LuMessageCircleMore } from 'react-icons/lu';
import { API_CHANNEL_VIDEO, API_URL } from '@/lib/zalo-video/legacy-api';
import { toast } from 'react-toastify';
import axiosConfig from "@/lib/axios"
function ModalOpenFormOption({
  isCustom,
  setIsCustom,
  params,
  fetchPhoneChannel,
  inforChannel,
}) {
  const apiUpdateSettingPhone =
    API_URL + API_CHANNEL_VIDEO.API_UPDATE_SETTING_PHONE_CHANNEL;
  const apiUpdateSettingPhoneRs =
    API_URL + API_CHANNEL_VIDEO.API_UPDATE_SETTING_PHONE_CHANNEL_RS;
  const [loadingSetting, setLoadingSetting] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [optionViewsButton, setOptionViewsButton] = useState('1');
  const onIngredientsChange = (e) => {
    let _ingredients = [...ingredients];

    if (e.checked) _ingredients.push(e.value);
    else _ingredients.splice(_ingredients.indexOf(e.value), 1);

    setIngredients(_ingredients);
  };
  const footerContent = loadingSetting ? (
    <p>Đang lưu...</p>
  ) : (
    <div className="flex gap-2 justify-content-end w-100">
      <Button
        label="Đóng"
        className="bg-light text-dark rounded p-2 lh-base "
        onClick={() => setIsCustom(false)}
        autoFocus
      />
      <Button
        onClick={() => fetchConfirmChannel()}
        label="Lưu lại"
        className="bg-primary rounded p-2 lh-base"
        autoFocus
      />
    </div>
  );

  const fetchConfirmChannel = async () => {
    setLoadingSetting(true);
    const body = {
      id_account: Number(params.account),
      targets: ingredients.join(','),
      cta_text: Number(optionViewsButton),
    };
    try {
      const res = await axiosConfig.post(apiUpdateSettingPhone, body);
      const idTask = res.data;
      fetchConfirmChannelRs(idTask);
    } catch (err) {
      toast.error(
        err?.response?.data?.error ||
        err?.response?.data?.messenger ||
        err?.response?.error ||
        'Đã có lỗi xảy ra !',
      );
      setLoadingSetting(false);
    }
  };
  const fetchConfirmChannelRs = (id_task) => {
    const intervalId = setInterval(async () => {
      try {
        const body = id_task;
        const res = await axiosConfig.post(apiUpdateSettingPhoneRs, body);
        if (res?.data?.status === 'SUCCESS') {
          fetchPhoneChannel();
          setLoadingSetting(false);
          clearInterval(intervalId);
          setIsCustom(false);
        }
      } catch (err) {
        toast.error(
          err?.response?.data?.error ||
          err?.response?.data?.messenger ||
          err?.response?.error ||
          'Đã có lỗi xảy ra !',
        );
        setLoadingSetting(false);
      }
    }, 2000);
  };
  useEffect(() => {
    if (inforChannel) {
      setIngredients(inforChannel?.targets.split(','));
      setOptionViewsButton(inforChannel?.cta_text || '1');
    }
  }, [inforChannel]);

  return (
    <Dialog
      header="Tùy chỉnh"
      className="dialog-shop"
      visible={isCustom}
      style={{ width: '40%' }}
      onHide={() => {
        if (!isCustom) return;
        setIsCustom(false);
      }}
      closable={false}
      footer={footerContent}
    >
      <div
        className="flex flex-column align-items-center justify-content-center gap-4 mt-4 p-2 rounded"
        style={{ background: '#e9e9e9' }}
      >
        <div>
          <p className="mb-2">Nội dung nút hiển thị </p>
          <nav className="d-flex flex-wrap gap-2 mb-2">
            <Chip
              onClick={() => setOptionViewsButton('1')}
              style={{
                background: optionViewsButton === '1' ? '#0068ff' : '#bbb',
                color: '#fff',
                cursor: 'pointer',
              }}
              label="Nhắn tin liên hệ"
              icon={
                <LuMessageCircleMore
                  size={18}
                  style={{ marginRight: '0.5rem', color: '#fff' }}
                />
              }
            />
            <Chip
              onClick={() => setOptionViewsButton('3')}
              style={{
                background: optionViewsButton === '3' ? '#0068ff' : '#bbb',
                color: '#fff',
                cursor: 'pointer',
              }}
              label="Liên hệ đặt tour"
              icon={
                <LuMessageCircleMore
                  size={18}
                  style={{ marginRight: '0.5rem', color: '#fff' }}
                />
              }
            />
            <Chip
              onClick={() => setOptionViewsButton('7')}
              style={{
                background: optionViewsButton === '7' ? '#0068ff' : '#bbb',
                color: '#fff',
                cursor: 'pointer',
              }}
              label="Liên hệ tư vấn"
              icon={
                <LuMessageCircleMore
                  size={18}
                  style={{ marginRight: '0.5rem', color: '#fff' }}
                />
              }
            />
            <Chip
              onClick={() => setOptionViewsButton('9')}
              style={{
                background: optionViewsButton === '9' ? '#0068ff' : '#bbb',
                color: '#fff',
                cursor: 'pointer',
              }}
              label="Liên hệ đặt chỗ"
              icon={
                <LuMessageCircleMore
                  size={18}
                  style={{ marginRight: '0.5rem', color: '#fff' }}
                />
              }
            />
            <Chip
              onClick={() => setOptionViewsButton('10')}
              style={{
                background: optionViewsButton === '10' ? '#0068ff' : '#bbb',
                color: '#fff',
                cursor: 'pointer',
              }}
              label="Liên hệ đặt hàng"
              icon={
                <LuMessageCircleMore
                  size={18}
                  style={{ marginRight: '0.5rem', color: '#fff' }}
                />
              }
            />
            <Chip
              onClick={() => setOptionViewsButton('11')}
              style={{
                background: optionViewsButton === '11' ? '#0068ff' : '#bbb',
                color: '#fff',
                cursor: 'pointer',
              }}
              label="Liên hệ công việc"
              icon={
                <LuMessageCircleMore
                  size={18}
                  style={{ marginRight: '0.5rem', color: '#fff' }}
                />
              }
            />
            <Chip
              onClick={() => setOptionViewsButton('8')}
              style={{
                background: optionViewsButton === '8' ? '#0068ff' : '#bbb',
                color: '#fff',
                cursor: 'pointer',
              }}
              label="Liên hệ"
              icon={
                <LuMessageCircleMore
                  size={18}
                  style={{ marginRight: '0.5rem', color: '#fff' }}
                />
              }
            />
          </nav>
          <p className="mb-2">Thiết lập riêng tư</p>
          <p>Chỉ hiển thị với người dùng thuộc các nhóm được chọn</p>
          <nav>
            <p>Nam trong độ tuổi</p>
            <div className="flex flex-wrap justify-content-center gap-3">
              <div className="flex align-items-center">
                <Checkbox
                  inputId="ingredient1"
                  name="pizza"
                  value="1"
                  onChange={onIngredientsChange}
                  checked={ingredients.includes('1')}
                />
                <label htmlFor="ingredient1" className="ml-2">
                  Dưới 25
                </label>
              </div>
              <div className="flex align-items-center">
                <Checkbox
                  inputId="ingredient2"
                  name="pizza"
                  value="2"
                  onChange={onIngredientsChange}
                  checked={ingredients.includes('2')}
                />
                <label htmlFor="ingredient2" className="ml-2">
                  25-34
                </label>
              </div>
              <div className="flex align-items-center">
                <Checkbox
                  inputId="ingredient3"
                  name="pizza"
                  value="3"
                  onChange={onIngredientsChange}
                  checked={ingredients.includes('3')}
                />
                <label htmlFor="ingredient3" className="ml-2">
                  35-44
                </label>
              </div>
              <div className="flex align-items-center">
                <Checkbox
                  inputId="ingredient4"
                  name="pizza"
                  value="4"
                  onChange={onIngredientsChange}
                  checked={ingredients.includes('4')}
                />
                <label htmlFor="ingredient4" className="ml-2">
                  Trên 45
                </label>
              </div>
            </div>
          </nav>
          <nav>
            <p>Nữ trong độ tuổi</p>
            <div className="flex flex-wrap justify-content-center gap-3">
              <div className="flex align-items-center">
                <Checkbox
                  inputId="ingredient2"
                  name="pizza"
                  value="6"
                  onChange={onIngredientsChange}
                  checked={ingredients.includes('6')}
                />
                <label htmlFor="ingredient2" className="ml-2">
                  Dưới 25
                </label>
              </div>
              <div className="flex align-items-center">
                <Checkbox
                  inputId="ingredient3"
                  name="pizza"
                  value="7"
                  onChange={onIngredientsChange}
                  checked={ingredients.includes('7')}
                />
                <label htmlFor="ingredient3" className="ml-2">
                  25-34
                </label>
              </div>
              <div className="flex align-items-center">
                <Checkbox
                  inputId="ingredient4"
                  name="pizza"
                  value="8"
                  onChange={onIngredientsChange}
                  checked={ingredients.includes('8')}
                />
                <label htmlFor="ingredient4" className="ml-2">
                  35-44
                </label>
              </div>
              <div className="flex align-items-center">
                <Checkbox
                  inputId="ingredient4"
                  name="pizza"
                  value="9"
                  onChange={onIngredientsChange}
                  checked={ingredients.includes('9')}
                />
                <label htmlFor="ingredient4" className="ml-2">
                  Trên 45
                </label>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </Dialog>
  );
}

export default ModalOpenFormOption;
