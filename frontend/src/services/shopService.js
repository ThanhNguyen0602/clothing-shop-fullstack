import api from "./api";

const data = (response) => response.data.data;

// ---- Gio hang
const getCart = async (signal) => data(await api.get("/cart", { signal }));
const updateCartItem = async (id, quantity) =>
  data(await api.put(`/cart/${id}`, { quantity }));
const removeCartItem = async (id) => data(await api.delete(`/cart/${id}`));
const clearCart = async () => data(await api.delete("/cart"));

// ---- Dat hang
const getCheckoutOptions = async (signal) =>
  data(await api.get("/checkout/options", { signal }));
const createOrder = async (body) => data(await api.post("/orders", body));
const listMyOrders = async (page, signal) =>
  data(await api.get("/orders/my-orders", { params: { page, limit: 10 }, signal }));
const getMyOrder = async (id, signal) =>
  data(await api.get(`/orders/${id}`, { signal }));
const cancelMyOrder = async (id, reason) =>
  data(await api.patch(`/orders/${id}/cancel`, { reason }));

// ---- Thanh toan mo phong
const listPayments = async (id, signal) =>
  data(await api.get(`/orders/${id}/payments`, { signal }));
const createPayment = async (id) => data(await api.post(`/orders/${id}/payments`, {}));

// ---- Danh gia
const createReview = async (productId, body) =>
  data(await api.post(`/products/${productId}/reviews`, body));

// ---- So dia chi
const listAddresses = async (signal) => data(await api.get("/addresses", { signal }));
const createAddress = async (body) => data(await api.post("/addresses", body));
const updateAddress = async (id, body) => data(await api.put(`/addresses/${id}`, body));
const setDefaultAddress = async (id) =>
  data(await api.patch(`/addresses/${id}/default`, {}));
const removeAddress = async (id) => data(await api.delete(`/addresses/${id}`));

// ---- Tai khoan
const changePassword = async (body) => (await api.put("/users/me/password", body)).data;

// ---- Cau hinh cong khai (ten shop, lien he, chinh sach)
const getSettings = async (signal) => data(await api.get("/settings", { signal }));

export { getCart, updateCartItem, removeCartItem, clearCart, getCheckoutOptions,
  createOrder, listMyOrders, getMyOrder, cancelMyOrder, listPayments, createPayment,
  createReview, listAddresses, createAddress, updateAddress, setDefaultAddress,
  removeAddress, changePassword, getSettings };
