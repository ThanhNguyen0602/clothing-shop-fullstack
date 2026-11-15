const service = require("../services/orderService");
const { orderBody } = require("../utils/checkoutValidation");
const { fail, parseId } = require("../utils/catalogHelpers");

const create = async (req, res) => {
  const data = await service.create(req.user.id, orderBody(req.body));

  res.status(201).json({ success: true, data });
};

const mine = async (req, res) => {
  const query = req.query;

  if (Object.keys(query).some((key) => !["page", "limit"].includes(key))) {
    fail(400, "Query không được hỗ trợ");
  }

  const positive = (value, fallback, max) => {
    if (value === undefined) return fallback;

    if (typeof value !== "string" || !/^[1-9]\d*$/.test(value) ||
        Number(value) > max) fail(400, "page hoặc limit không hợp lệ");

    return Number(value);
  };

  const page = positive(query.page, 1, 1000000);
  const limit = positive(query.limit, 10, 50);

  res.json({ success: true, data: await service.list(req.user.id, page, limit) });
};

const detail = async (req, res) => {
  const data = await service.detail(req.user.id, parseId(req.params.id));

  res.json({ success: true, data });
};

module.exports = { create, mine, detail };
