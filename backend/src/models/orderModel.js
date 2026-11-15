const pool = require("../config/database");
const variants = require("./variantModel");

const insert = async (db, userId, body, totals, paymentId, code, status) => {
  const [result] = await db.execute(`INSERT INTO orders
    (order_code, user_id, recipient_name, recipient_phone, shipping_address,
     shipping_method_id, subtotal, shipping_fee, discount_amount, total_amount,
     payment_method_id, payment_status, order_status, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'UNPAID',
      ?, ?)`,
    [code, userId, body.recipient_name, body.recipient_phone,
      body.shipping_address, body.shipping_method_id, totals.subtotal,
      totals.shipping_fee, totals.total_amount, paymentId, status, body.note]);

  return result.insertId;
};

// line: { product, variant, quantity, unitPrice, lineTotal } do orderService tinh.
const addItem = async (db, orderId, line) => {
  const { product, variant, quantity } = line;

  await db.execute(`INSERT INTO order_items
    (order_id, product_id, variant_id, product_name, variant_label,
     unit_price, quantity, total_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [orderId, product.id, variant?.id ?? null, product.name, variants.label(variant),
      line.unitPrice, quantity, line.lineTotal]);

  const [result] = await db.execute(`UPDATE products
    SET stock_quantity = stock_quantity - ?
    WHERE id = ? AND stock_quantity >= ?`, [quantity, product.id, quantity]);

  if (result.affectedRows !== 1) throw new Error("Trừ kho không thành công");

  if (variant) await variants.deduct(db, variant.id, quantity);
};

const beginHistory = async (db, orderId, userId, status) => {
  await db.execute(`INSERT INTO order_status_histories
    (order_id, old_status, new_status, changed_by, note)
    VALUES (?, NULL, ?, ?, 'Customer tạo đơn')`,
    [orderId, status, userId]);
};

const list = async (userId, page, limit) => {
  const [rows] = await pool.execute(`SELECT id, order_code, subtotal,
    shipping_fee, discount_amount, total_amount, payment_status,
    order_status, created_at FROM orders WHERE user_id = ?
    ORDER BY id DESC LIMIT ? OFFSET ?`,
    [userId, String(limit + 1), String((page - 1) * limit)]);

  return { items: rows.slice(0, limit),
    pagination: { page, limit, has_next: rows.length > limit } };
};

const detail = async (db, userId, id) => {
  const [rows] = await db.execute(`SELECT o.id, o.order_code, o.recipient_name,
    o.recipient_phone, o.shipping_address, o.shipping_method_id, o.payment_method_id,
    pm.code AS payment_method, o.subtotal, o.shipping_fee, o.discount_amount,
    o.total_amount, o.order_status, o.payment_status, o.note, o.cancel_reason, o.created_at
    FROM orders o JOIN payment_methods pm ON pm.id = o.payment_method_id
    WHERE o.id = ? AND o.user_id = ?`, [id, userId]);

  if (!rows[0]) return null;

  const [items] = await db.execute(`SELECT id, product_id, variant_id, product_name,
    variant_label, unit_price, quantity, total_price FROM order_items
    WHERE order_id = ? ORDER BY id`, [id]);

  const [history] = await db.execute(`SELECT old_status, new_status, note,
    created_at FROM order_status_histories WHERE order_id = ? ORDER BY id`, [id]);

  return { ...rows[0], items, history };
};

module.exports = { insert, addItem, beginHistory, list, detail };
