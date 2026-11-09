const categories = require("../models/categoryModel");
const products = require("../models/productModel");
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

  const productId = id ?? await products.insert(data, db);

  if (id !== null) await products.update(id, data, db);

  await products.replaceImages(productId, data.images, db);

  return products.find(productId, true, db);
});

const changeStatus = async (id, value) => withTransaction(async (db) => {
  if (!await products.lock(id, db)) fail(404, "Không tìm thấy sản phẩm");

  await products.setStatus(id, value, db);

  return products.find(id, true, db);
});

module.exports = { listPublic, listManagement, detail, save, changeStatus };
