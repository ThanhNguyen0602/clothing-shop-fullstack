const categories = require("../models/categoryModel");
const brands = require("../models/brandModel");
const products = require("../models/productModel");
const variants = require("../models/variantModel");
const withTransaction = require("../utils/withTransaction");
const { fail } = require("../utils/catalogHelpers");

const listPublic = () => products.list();

const listManagement = () => products.list(true);

const detail = async (id, management = false) => {
  const item = await products.find(id, management);

  if (!item) fail(404, "Không tìm thấy sản phẩm");

  return item;
};

const save = async (data, id = null) => withTransaction(async (db) => {
  if (id !== null && !await products.lock(id, db)) {
    fail(404, "Không tìm thấy sản phẩm");
  }

  if (!await categories.find(data.category_id, db)) {
    fail(400, "Danh mục không tồn tại");
  }

  if (data.brand_id !== null && data.brand_id !== undefined) {
    const brand = await brands.find(data.brand_id, db);

    if (!brand || brand.status !== "ACTIVE") {
      fail(400, "Thương hiệu không tồn tại hoặc không hoạt động");
    }
  }

  const productId = id ?? await products.insert(data, db);

  if (id !== null) await products.update(id, data, db);

  await products.replaceImages(productId, data.images, db);
  // San pham co bien the: stock_quantity trong body bi thay bang tong ton kho bien the.
  await variants.syncProductStock(db, productId);

  return products.find(productId, true, db);
});

const ownVariant = async (db, productId, variantId) => {
  if (!await products.lock(productId, db)) fail(404, "Không tìm thấy sản phẩm");

  if (variantId === null) return null;

  const variant = await variants.lock(db, variantId);

  if (!variant || variant.product_id !== productId) fail(404, "Không tìm thấy biến thể");

  return variant;
};

const addVariant = (productId, data) => withTransaction(async (db) => {
  await ownVariant(db, productId, null);
  await variants.insert(db, productId, data);
  await variants.syncProductStock(db, productId);

  return products.find(productId, true, db);
});

const updateVariant = (productId, variantId, data) => withTransaction(async (db) => {
  await ownVariant(db, productId, variantId);
  await variants.update(db, variantId, data);
  await variants.syncProductStock(db, productId);

  return products.find(productId, true, db);
});

// Bien the da nam trong gio/don bi khoa ngoai chan xoa (409); chuyen INACTIVE thay the.
const removeVariant = (productId, variantId) => withTransaction(async (db) => {
  await ownVariant(db, productId, variantId);
  await variants.remove(db, variantId);
  await variants.syncProductStock(db, productId);

  return products.find(productId, true, db);
});

const changeStatus = async (id, value) => withTransaction(async (db) => {
  if (!await products.lock(id, db)) fail(404, "Không tìm thấy sản phẩm");

  await products.setStatus(id, value, db);

  return products.find(id, true, db);
});

module.exports = { listPublic, listManagement, detail, save, changeStatus,
  addVariant, updateVariant, removeVariant };
