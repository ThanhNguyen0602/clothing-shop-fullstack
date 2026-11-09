const service = require("../services/categoryService");
const { categoryBody } = require("../utils/catalogValidation");
const { parseId } = require("../utils/catalogHelpers");

const listPublic = async (req, res) => {
  res.json({ success: true, data: await service.listPublic() });
};

const listManagement = async (req, res) => {
  res.json({ success: true, data: await service.listManagement() });
};

const detail = async (req, res) => {
  const data = await service.detail(parseId(req.params.id));

  res.json({ success: true, data });
};

const create = async (req, res) => {
  const data = await service.create(categoryBody(req.body));

  res.status(201).json({ success: true, data });
};

const update = async (req, res) => {
  const id = parseId(req.params.id);
  const data = await service.update(id, categoryBody(req.body));

  res.json({ success: true, data });
};

const remove = async (req, res) => {
  await service.remove(parseId(req.params.id));

  res.json({ success: true, message: "Đã xóa danh mục" });
};

module.exports = { listPublic, listManagement, detail, create, update, remove };
