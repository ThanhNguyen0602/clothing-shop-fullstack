import api from "./api";

const data = (response) => response.data.data;

// ---- Tong quan
const getDashboard = async (signal) =>
  data(await api.get("/management/dashboard", { signal }));

// ---- San pham
const listManagedProducts = async (signal) =>
  data(await api.get("/management/products", { signal }));
const getManagedProduct = async (id, signal) =>
  data(await api.get(`/management/products/${id}`, { signal }));
const createProduct = async (body) => data(await api.post("/products", body));
const updateProduct = async (id, body) => data(await api.put(`/products/${id}`, body));
const changeProductStatus = async (id, status) =>
  data(await api.patch(`/products/${id}/status`, { status }));

// ---- Bien the (mau / size)
const addVariant = async (productId, body) =>
  data(await api.post(`/products/${productId}/variants`, body));
const updateVariant = async (productId, variantId, body) =>
  data(await api.put(`/products/${productId}/variants/${variantId}`, body));
const removeVariant = async (productId, variantId) =>
  data(await api.delete(`/products/${productId}/variants/${variantId}`));

// ---- Anh san pham (multipart/form-data, truong "image")
const uploadImage = async (productId, file) => {
  const form = new FormData();
  form.append("image", file);

  return data(await api.post(`/products/${productId}/images`, form, { timeout: 30000 }));
};
const setPrimaryImage = async (productId, imageId) =>
  data(await api.patch(`/products/${productId}/images/${imageId}/primary`, {}));
const removeImage = async (productId, imageId) =>
  data(await api.delete(`/products/${productId}/images/${imageId}`));

// ---- Danh muc
const listManagedCategories = async (signal) =>
  data(await api.get("/management/categories", { signal }));
const createCategory = async (body) => data(await api.post("/categories", body));
const updateCategory = async (id, body) => data(await api.put(`/categories/${id}`, body));
const removeCategory = async (id) => (await api.delete(`/categories/${id}`)).data;

// ---- Don hang
const listManagedOrders = async (params, signal) =>
  data(await api.get("/management/orders", { params, signal }));
const getManagedOrder = async (id, signal) =>
  data(await api.get(`/management/orders/${id}`, { signal }));
const changeOrderStatus = async (id, status) =>
  data(await api.patch(`/management/orders/${id}/status`, { order_status: status }));
const cancelManagedOrder = async (id, reason) =>
  data(await api.patch(`/management/orders/${id}/cancel`, { reason }));
const collectCod = async (id) =>
  data(await api.post(`/management/orders/${id}/collect-cod`, {}));
const simulatePayment = async (id, transactionCode, status) =>
  data(await api.post(`/management/orders/${id}/simulate-payment`,
    { transaction_code: transactionCode, status }));

// ---- Danh gia
const listManagedReviews = async (page, signal) =>
  data(await api.get("/management/reviews", { params: { page, limit: 20 }, signal }));
const moderateReview = async (id, status, reason) =>
  data(await api.patch(`/management/reviews/${id}/status`,
    status === "HIDDEN" ? { status, reason } : { status }));

export { getDashboard, listManagedProducts, getManagedProduct, createProduct,
  updateProduct, changeProductStatus, addVariant, updateVariant, removeVariant,
  uploadImage, setPrimaryImage, removeImage, listManagedCategories, createCategory,
  updateCategory, removeCategory, listManagedOrders, getManagedOrder,
  changeOrderStatus, cancelManagedOrder, collectCod, simulatePayment,
  listManagedReviews, moderateReview };
