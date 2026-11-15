import api from "./api";

const register = async (body, signal) => {
  const response = await api.post("/auth/register", body, { signal });

  return response.data.data;
};

const login = async (body, signal) => {
  const response = await api.post("/auth/login", body, { signal });

  return response.data.data;
};

const getMe = async (token, signal) => {
  const response = await api.get("/users/me", {
    headers: { Authorization: `Bearer ${token}` },
    signal
  });

  return response.data.data;
};

const updateMe = async (token, body) => {
  const response = await api.put("/users/me", body, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data.data;
};

const authError = (error) => {
  const status = error.response?.status;

  if (status >= 400 && status < 500) {
    return error.response.data?.message || "Yêu cầu chưa thực hiện được.";
  }
  if (!error.response) return "Không kết nối được máy chủ. Hãy thử lại.";

  return "Máy chủ gặp lỗi. Hãy thử lại sau.";
};

export { register, login, getMe, updateMe, authError };
