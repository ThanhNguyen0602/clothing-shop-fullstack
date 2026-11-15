const { randomUUID } = require("crypto");
const withTransaction = require("../utils/withTransaction");
const cart = require("../models/commerceModel");
const orders = require("../models/orderModel");
const checkout = require("../models/checkoutModel");
const { unavailable, unitCents, lockLine } = require("./cartService");
const { fail } = require("../utils/catalogHelpers");
const { cents, money } = require("../utils/orderMoney");

const create = (userId, body) => withTransaction(async (db) => {
  const cartId = await cart.lockCart(db, userId);
  const rows = await cart.items(db, cartId);
  const selected = rows.filter((row) => body.cart_item_ids.includes(row.id));

  if (selected.length !== body.cart_item_ids.length) {
    fail(409, "Giỏ đã thay đổi hoặc có dòng không thuộc giỏ của bạn");
  }

  const lines = [];
  let subtotal = 0n;

  for (const row of selected) {
    const { product, variant, needsVariant } = await lockLine(db, row.product_id, row.variant_id);

    if (row.variant_id && !variant) fail(409, "Phân loại này không còn bán");

    const reason = unavailable(product, row.quantity, variant, needsVariant);

    if (reason) fail(409, reason);

    const unit = unitCents(product, variant);
    const lineTotal = money(unit * BigInt(row.quantity));
    subtotal += cents(lineTotal);
    lines.push({ product, variant, quantity: row.quantity, unitPrice: money(unit), lineTotal });
  }

  const shipping = await checkout.lockShipping(db, body.shipping_method_id);
  const payment = await checkout.lockPayment(db, body.payment_method);

  if (!shipping || !payment) fail(409, "Vận chuyển hoặc thanh toán không khả dụng");

  const totals = { subtotal: money(subtotal), shipping_fee: shipping.base_fee,
    total_amount: money(subtotal + cents(shipping.base_fee)) };
  const code = `ORD-${randomUUID()}`;
  const status = body.payment_method === "COD"
    ? "PENDING_CONFIRMATION" : "PENDING_PAYMENT";
  const id = await orders.insert(db, userId, body, totals, payment.id, code, status);

  for (const line of lines) {
    await orders.addItem(db, id, line);
  }

  await orders.beginHistory(db, id, userId, status);
  await cart.removeItems(db, cartId, body.cart_item_ids);
  await cart.touch(db, cartId);

  return { id, order_code: code, ...totals, discount_amount: "0.00",
    order_status: status, payment_status: "UNPAID" };
});

const list = (userId, page, limit) => orders.list(userId, page, limit);

const detail = (userId, id) => withTransaction(async (db) => {
  // Chi doc: transaction giu snapshot khi buoi 07 bo sung cap nhat don.
  const order = await orders.detail(db, userId, id);

  if (!order) fail(404, "Không tìm thấy đơn hàng của bạn");

  return order;
});

module.exports = { create, list, detail };
