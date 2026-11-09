const categories = require("../models/categoryModel");
const { fail } = require("../utils/catalogHelpers");

const listPublic = () => categories.list();

const listManagement = () => categories.list(true);

const detail = async (id) => {
  const item = await categories.find(id);

  if (!item || item.status !== "ACTIVE") fail(404, "Không tìm thấy danh mục");

  return item;
};

const create = async (data) => {
  const id = await categories.insert(data);

  return categories.find(id);
};

const update = async (id, data) => {
  if (!await categories.find(id)) fail(404, "Không tìm thấy danh mục");

  await categories.update(id, data);

  const item = await categories.find(id);
  if (!item) fail(404, "Không tìm thấy danh mục");

  return item;
};

const remove = async (id) => {
  if (!await categories.remove(id)) fail(404, "Không tìm thấy danh mục");
};

module.exports = { listPublic, listManagement, detail, create, update, remove };
