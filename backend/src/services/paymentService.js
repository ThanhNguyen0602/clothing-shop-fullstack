const { randomUUID } = require("crypto");
const orders = require("../models/orderWorkflowModel");
const payments = require("../models/paymentModel");
const withTransaction = require("../utils/withTransaction");
const { fail } = require("../utils/catalogHelpers");

const mockEnabled = () => {
  if (process.env.NODE_ENV === "production" ||
      process.env.ENABLE_MOCK_PAYMENT !== "true") {
    fail(403, "Thanh toán mô phỏng đang tắt");
  }
};

const ownOrder = async (db, id, userId) => {
  const order = await orders.lock(db, id);

  if (!order || order.user_id !== userId) fail(404, "Không tìm thấy đơn của bạn");

  return order;
};

const list = (id, userId) => withTransaction(async (db) => {
  const order = await ownOrder(db, id, userId);

  return { order_id: id, payment_status: order.payment_status,
    attempts: await payments.attempts(db, id) };
});

const create = (id, userId) => withTransaction(async (db) => {
  mockEnabled();

  const order = await ownOrder(db, id, userId);

  if (order.payment_method !== "SIMULATED" ||
      order.order_status !== "PENDING_PAYMENT" ||
      !["UNPAID", "FAILED"].includes(order.payment_status)) {
    fail(409, "Đơn không thể tạo phiên thanh toán mô phỏng");
  }

  const existing = await payments.pending(db, id);

  if (existing) return existing;

  return payments.insert(db, order, `SIM-${randomUUID()}`, "PENDING");
});

const simulate = (id, code, status, actorId) => withTransaction(async (db) => {
  mockEnabled();

  const order = await orders.lock(db, id);

  if (!order) fail(404, "Không tìm thấy đơn hàng");

  const attempt = await payments.lock(db, id, code);

  if (!attempt) fail(404, "Không tìm thấy giao dịch của đơn");

  if (order.payment_method !== "SIMULATED" ||
      attempt.amount !== order.total_amount ||
      attempt.payment_method_id !== order.payment_method_id) {
    fail(409, "Thông tin giao dịch không khớp đơn");
  }

  if (attempt.status === status) return { id: attempt.id, status };

  if (attempt.status !== "PENDING" || order.order_status !== "PENDING_PAYMENT") {
    fail(409, "Giao dịch đã kết thúc hoặc đơn không còn chờ thanh toán");
  }

  await payments.result(db, attempt.id, status);
  await payments.orderPayment(db, id, status === "SUCCESS" ? "PAID" : "FAILED");

  if (status === "SUCCESS") {
    await orders.change(db, id, "PENDING_CONFIRMATION");
    await orders.history(db, order, "PENDING_CONFIRMATION", actorId,
      "Thanh toán mô phỏng thành công");
  }

  return { id: attempt.id, status };
});

const collectCod = (id) => withTransaction(async (db) => {
  const order = await orders.lock(db, id);

  if (!order) fail(404, "Không tìm thấy đơn hàng");

  if (order.payment_method !== "COD") fail(409, "Đây không phải đơn COD");

  if (order.payment_status === "PAID") return { id, payment_status: "PAID" };

  if (order.order_status !== "DELIVERED" || order.payment_status !== "UNPAID") {
    fail(409, "Chỉ ghi nhận COD khi đã giao hàng và chưa thu tiền");
  }

  await payments.insert(db, order, `COD-${id}`, "SUCCESS");
  await payments.orderPayment(db, id, "PAID");

  return { id, payment_status: "PAID" };
});

module.exports = { list, create, simulate, collectCod };
