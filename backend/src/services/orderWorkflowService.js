const model = require("../models/orderWorkflowModel");
const withTransaction = require("../utils/withTransaction");
const { fail } = require("../utils/catalogHelpers");

const nextStatus = {
  PENDING_CONFIRMATION: "CONFIRMED", CONFIRMED: "PROCESSING",
  PROCESSING: "SHIPPING", SHIPPING: "DELIVERED", DELIVERED: "COMPLETED"
};

const list = (page, limit, filters = {}) => withTransaction((db) =>
  model.list(db, page, limit, filters));

const detail = (id) => withTransaction(async (db) => {
  const order = await model.detail(db, id);

  if (!order) fail(404, "Không tìm thấy đơn hàng");

  return order;
});

const change = (id, status, actorId) => withTransaction(async (db) => {
  const order = await model.lock(db, id);

  if (!order) fail(404, "Không tìm thấy đơn hàng");

  if (order.order_status === status) return { id, order_status: status };

  if (nextStatus[order.order_status] !== status) {
    fail(409, "Không được bỏ bước hoặc lùi trạng thái đơn");
  }

  if ((order.payment_method !== "COD" || status === "COMPLETED") &&
      order.payment_status !== "PAID") fail(409, "Đơn chưa thanh toán");

  await model.change(db, id, status);
  await model.history(db, order, status, actorId, "Manager cập nhật đơn");

  return { id, order_status: status };
});

const cancel = (id, actor, reason) => withTransaction(async (db) => {
  const order = await model.lock(db, id);

  if (!order || (actor.role === "CUSTOMER" && order.user_id !== actor.id)) {
    fail(404, "Không tìm thấy đơn hàng");
  }

  if (order.order_status === "CANCELLED") {
    return { id, order_status: "CANCELLED" };
  }

  const allowed = ["PENDING_PAYMENT", "PENDING_CONFIRMATION", "CONFIRMED"];

  if (!allowed.includes(order.order_status) ||
      !["UNPAID", "FAILED"].includes(order.payment_status)) {
    fail(409, "Chỉ hủy đơn chưa xử lý và chưa thanh toán thành công");
  }

  await model.cancelAttempts(db, id);

  for (const item of await model.items(db, id)) {
    await model.restore(db, item.product_id, item.quantity, item.variant_id);
  }

  await model.change(db, id, "CANCELLED", reason);
  await model.history(db, order, "CANCELLED", actor.id, reason);

  return { id, order_status: "CANCELLED" };
});

module.exports = { list, detail, change, cancel };
