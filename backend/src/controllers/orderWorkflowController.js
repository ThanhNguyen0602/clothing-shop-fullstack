const service = require("../services/orderWorkflowService");
const v = require("../utils/workflowValidation");
const { parseId } = require("../utils/catalogHelpers");

const ORDER_STATUSES = ["PENDING_PAYMENT", "PENDING_CONFIRMATION", "CONFIRMED", "PROCESSING",
  "SHIPPING", "DELIVERED", "COMPLETED", "CANCELLED", "DELIVERY_FAILED", "REFUND_REQUESTED",
  "REFUNDED"];

// Loc tuy chon: status (mot trang thai), search (ma don hoac ten nguoi nhan, toi da 60 ky tu).
const list = async (req, res) => {
  const { page, limit } = v.page(req.query, ["status", "search"]);
  const one = (key) => {
    if (req.query[key] === undefined) return undefined;

    return v.text(Array.isArray(req.query[key]) ? null : req.query[key], 60);
  };
  const filters = { status: one("status"), search: one("search") };

  if (filters.status !== undefined) v.choice(filters.status, ORDER_STATUSES);

  res.json({ success: true, data: await service.list(page, limit, filters) });
};

const detail = async (req, res) => {
  const data = await service.detail(parseId(req.params.id));

  res.json({ success: true, data });
};

const change = async (req, res) => {
  v.object(req.body, ["order_status"]);

  const status = v.choice(req.body.order_status,
    ["CONFIRMED", "PROCESSING", "SHIPPING", "DELIVERED", "COMPLETED"]);
  const data = await service.change(parseId(req.params.id), status, req.user.id);

  res.json({ success: true, data });
};

const cancel = async (req, res) => {
  v.object(req.body, ["reason"]);

  const data = await service.cancel(parseId(req.params.id), req.user,
    v.text(req.body.reason, 1000));

  res.json({ success: true, data });
};

module.exports = { list, detail, change, cancel };
