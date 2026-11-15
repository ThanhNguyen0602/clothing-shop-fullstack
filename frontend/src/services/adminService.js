import api from "./api";

const data = (response) => response.data.data;

const listUsers = async (params, signal) =>
  data(await api.get("/admin/users", { params, signal }));
const createStaff = async (body) => data(await api.post("/admin/users", body));
const changeRole = async (id, role) =>
  data(await api.patch(`/admin/users/${id}/role`, { role }));
const changeUserStatus = async (id, status) =>
  data(await api.patch(`/admin/users/${id}/status`, { status }));
const getAdminSettings = async (signal) =>
  data(await api.get("/admin/settings", { signal }));
const saveSettings = async (body) => data(await api.put("/admin/settings", body));

export { listUsers, createStaff, changeRole, changeUserStatus,
  getAdminSettings, saveSettings };
