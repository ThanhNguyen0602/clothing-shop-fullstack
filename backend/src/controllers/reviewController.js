const service = require("../services/reviewService");
const v = require("../utils/workflowValidation");
const { parseId } = require("../utils/catalogHelpers");

const list = async (req, res) => {
  const { page, limit } = v.page(req.query);
  const data = await service.list(parseId(req.params.productId), page, limit);

  res.json({ success: true, data });
};

const create = async (req, res) => {
  const data = await service.create(req.user.id,
    parseId(req.params.productId), v.review(req.body, true));

  res.status(201).json({ success: true, data });
};

const edit = async (req, res) => {
  const data = await service.edit(parseId(req.params.id), req.user.id,
    v.review(req.body));

  res.json({ success: true, data });
};

const remove = async (req, res) => {
  const data = await service.remove(parseId(req.params.id), req.user.id);

  res.json({ success: true, data });
};

const moderate = async (req, res) => {
  v.object(req.body, ["status", "reason"], ["status"]);

  const status = v.choice(req.body.status, ["VISIBLE", "HIDDEN"]);
  const reason = status === "HIDDEN" ? v.text(req.body.reason, 1000) : null;
  const data = await service.moderate(parseId(req.params.id), status, reason);

  res.json({ success: true, data });
};

const management = async (req, res) => {
  const { page, limit } = v.page(req.query);

  res.json({ success: true, data: await service.management(page, limit) });
};

module.exports = { list, create, edit, remove, moderate, management };
