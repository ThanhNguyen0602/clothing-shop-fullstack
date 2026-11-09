const service = require("../services/productService");
const { productBody, statusBody } = require("../utils/catalogValidation");
const { parseId } = require("../utils/catalogHelpers");

const listPublic = async (req, res) => {
  res.json({ success: true, data: await service.listPublic() });
};

const listManagement = async (req, res) => {
  res.json({ success: true, data: await service.listManagement() });
};

const detail = async (req, res) => {
  const item = await service.detail(parseId(req.params.id));

  res.json({ success: true, data: item });
};

const detailManagement = async (req, res) => {
  const item = await service.detail(parseId(req.params.id), true);

  res.json({ success: true, data: item });
};

const create = async (req, res) => {
  const data = await service.save(productBody(req.body));

  res.status(201).json({ success: true, data });
};

const update = async (req, res) => {
  const id = parseId(req.params.id);
  const data = await service.save(productBody(req.body), id);

  res.json({ success: true, data });
};

const changeStatus = async (req, res) => {
  const id = parseId(req.params.id);
  const data = await service.changeStatus(id, statusBody(req.body));

  res.json({ success: true, data });
};

const remove = async (req, res) => {
  await service.changeStatus(parseId(req.params.id), "DISCONTINUED");

  res.json({ success: true, message: "Đã ngừng kinh doanh sản phẩm" });
};

module.exports = { listPublic, listManagement, detail,
  detailManagement, create, update, changeStatus, remove };
