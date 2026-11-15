import api from "./api";

// Bo cac tham so rong de khong gui query thua len backend.
const cleanParams = (params) => Object.fromEntries(
  Object.entries(params).filter(([, value]) =>
    value !== undefined && value !== null && value !== "")
);

const listProducts = async (params = {}, signal) => {
  const response = await api.get("/products", {
    params: cleanParams({ limit: 12, ...params }), signal
  });

  return response.data;
};

const getProduct = async (id, signal) => {
  const response = await api.get(`/products/${id}`, { signal });

  return response.data.data;
};

const getReviews = async (id, page, signal) => {
  const response = await api.get(`/products/${id}/reviews`, {
    params: { page, limit: 5 }, signal
  });

  return response.data.data;
};

const listCategories = async (signal) => {
  const response = await api.get("/categories", { signal });

  return response.data.data;
};

const listBrands = async (signal) => {
  const response = await api.get("/brands", { signal });

  return response.data.data;
};

const addToCart = async ({ productId, variantId = null, quantity = 1 }) => {
  const response = await api.post("/cart", {
    product_id: Number(productId),
    variant_id: variantId === null ? null : Number(variantId),
    quantity
  });

  return response.data.data;
};

// Giu ten ham cu cua buoi 10 de cac phan da lam van chay.
const addOneToCart = (id) => addToCart({ productId: id });

export { listProducts, getProduct, getReviews, listCategories, listBrands,
  addToCart, addOneToCart, cleanParams };
