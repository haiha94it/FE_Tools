"use client"
import { handleApiError } from "@/lib/errors"
export const getLinkFile = async (
  files,
  setListFile,
  listFile,
  apiGetLink,
) => {
  const updatedListFile = [...listFile];
  for (let i = 0; i < files.length; i++) {
    const formData = new FormData();
    formData.append("file", files[i]);
    try {
      const res = await axiosConfig.post(apiGetLink, formData);
      updatedListFile.push(res.data.file);
    } catch (err) {
      handleApiError(err)
    }
  }
  setListFile(updatedListFile);
};

export const getLinkOneFile = async (
  files,
  setListFile,
  apiGetLink,
) => {
  const formData = new FormData();
  formData.append("file", files);
  try {
    const res = await axiosConfig.post(apiGetLink, formData);
    setListFile(res.data.file);
  } catch (err) {
    console.log(err)
    handleApiError(err)
  }
};


export function getDayMonth(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}
export function getPreviousDate(dateString, period) {
  const date = new Date(dateString); // Tạo đối tượng Date từ chuỗi nhập
  if (period === 'seven_day') {
    date.setDate(date.getDate() - 7); // Trừ đi 7 ngày
  } else if (period === 'fourteen_day') {
    date.setDate(date.getDate() - 14); // Trừ đi 14 ngày
  } else if (period === 'thirty_day') {
    date.setMonth(date.getMonth() - 1); // Trừ đi 1 tháng
  }
  const day = String(date.getDate()).padStart(2, '0'); // Lấy ngày và đảm bảo là 2 chữ số
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Lấy tháng, thêm 1 vì tháng bắt đầu từ 0

  return `${day}/${month}`; // Trả về ngày/tháng
}


export const validatePhoneVN = (value) => {
  const phoneStr = String(value);
  const regex = /^(0|\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-5]|9[0-9])[0-9]{7}$/;
  return regex.test(phoneStr);
};
export function formatDateString(inputDate) {
  const date = new Date(inputDate);
  const pad = (n) => (n < 10 ? '0' + n : n);

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const min = pad(date.getMinutes());
  const sec = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hour}:${min}:${sec}`;
}
export const dataURLtoBlob = (dataurl) => {
  if (!dataurl) return
  const arr = dataurl?.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);

  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(',', ''); // Xóa dấu phẩy giữa ngày và giờ
}
export function convertTimestampToDateTime(timestamp) {
  const date = new Date(timestamp * 1000); // Chuyển từ giây sang mili-giây

  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function formatUnixTimestamp(seconds) {
  const date = new Date(seconds * 1000); // chuyển sang milliseconds
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // tháng bắt đầu từ 0
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}


export const downloadVideo = async (url) => {
  try {
    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = "video.mp4";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Lỗi tải video:", error);
  }
};

import SparkMD5 from 'spark-md5';
import axiosConfig from "@/lib/axios";

export async function calculateChecksumBrowser(file) {
  return new Promise((resolve, reject) => {
    const chunkSize = 2097152; // 2MB
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();

    let cursor = 0;

    fileReader.onload = (e) => {
      spark.append(e.target.result);
      cursor += chunkSize;

      if (cursor < file.size) {
        readNextChunk();
      } else {
        const checksum = spark.end();
        resolve(checksum);
      }
    };

    fileReader.onerror = () => {
      reject('File read error');
    };

    function readNextChunk() {
      const chunk = file.slice(cursor, cursor + chunkSize);
      fileReader.readAsArrayBuffer(chunk);
    }

    readNextChunk();
  });
}

export function toUnixTimestamp(dateString) {
  return Math.floor(new Date(dateString).getTime() / 1000);
}