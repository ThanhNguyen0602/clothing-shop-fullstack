import axios from "axios";

// Cung khoa voi AuthProvider: token chi nam trong sessionStorage.
const storageKey = "greenshop.accessToken";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000
});

// Tu dong gan token cho moi request neu nguoi dung da dang nhap.
// Request nao tu truyen Authorization thi giu nguyen.
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(storageKey);

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const apiError = (error, fallback = "Yêu cầu chưa thực hiện được.") => {
  const status = error?.response?.status;

  if (status >= 400 && status < 500) {
    return error.response.data?.message || fallback;
  }
  if (error && !error.response) return "Không kết nối được máy chủ. Hãy thử lại.";

  return "Máy chủ gặp lỗi. Hãy thử lại sau.";
};

const isCanceled = (error) => axios.isCancel(error) ||
  error?.code === "ERR_CANCELED";

export { apiError, isCanceled, storageKey };
export default api;
