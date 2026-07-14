import { useEffect, useState } from 'react';
import { API_CHANNEL_VIDEO, API_URL } from '@/lib/zalo-video/legacy-api';
import { getAxios } from '@/const/getAxios';
import { Editor } from 'primereact/editor';
import { Button } from 'primereact/button';
import axiosConfig from "@/lib/axios"
export const ViewInstructionsChannel = ({ userInfor }) => {
  const apiGetInstructions =
    API_URL + API_CHANNEL_VIDEO.API_GET_INSTRUCTIONS_CHANNEL;
  const apiEditInstruction =
    API_URL + API_CHANNEL_VIDEO.API_INSTRUCTIONS_VIDEO_CHANNEL;
  const [intructContent, setIntructContent] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [value, setValue] = useState('');
  const handleEditInstruc = async () => {
    const body = {
      content: value,
      images: [],
    };
    try {
      await axiosConfig.post(apiEditInstruction, body);
      getAxios(`${apiGetInstructions}`, setIntructContent);
      setIsEdit(false);
    } catch (err) {
    }
  };
  useEffect(() => {
    getAxios(`${apiGetInstructions}`, setIntructContent);
  }, []);
  useEffect(() => { setValue(intructContent?.content) }, [intructContent])
  return !isEdit ? (
    <div className="d-flex w-100 m-4 overflow-x-hidden flex-column" style={{ height: "70vh" }}>
      {userInfor?.is_admin && (
        <nav>
          <Button
            style={{
              width: 'max-content',
              background: '#fbd540',
              border: '#fbd540',
              borderRadius: '5px',
            }}
            label="Chỉnh sửa"
            className="mb-2"
            onClick={() => setIsEdit(true)}
          />
        </nav>
      )}
      <div
        className="dialog-quill"
        dangerouslySetInnerHTML={{
          __html: intructContent?.content?.replace(/&nbsp;/g, ' '),
        }}
      />
    </div>
  ) : (
    <div className=" m-4 ">
      <Editor
        value={value}
        onTextChange={(e) => setValue(e.htmlValue || '')}
        style={{ height: '70vh' }}
      />
      <div className="d-flex mt-2 w-100 gap-2 justify-content-end">
        <Button
          style={{
            width: 'max-content',
            background: '#ff3201',
            border: '#ff3201',
            borderRadius: '5px',
          }}
          label="Hủy"
          className="mb-2"
          onClick={() => setIsEdit(false)}
        />
        <Button
          style={{
            width: 'max-content',
            background: '#054ddb',
            border: '#054ddb',
            borderRadius: '5px',
          }}
          label="Lưu"
          className="mb-2"
          onClick={handleEditInstruc}
        />
      </div>
    </div>
  );
};
