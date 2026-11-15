const variants = require("./variantModel");

const lock = async (db, id) => {
  const [rows] = await db.execute(`SELECT o.*, pm.code AS payment_method
    FROM orders o JOIN payment_methods pm ON pm.id = o.payment_method_id
    WHERE o.id = ? FOR UPDATE`, [id]);

  return rows[0];
};

const escapeLike = (value) => value.replace(/[!%_]/g, (char) => `!${char}`);

const list = async (db, page, limit, filters = {}) => {
  const conditions = ["1 = 1"];
  const params = [];

  if (filters.status) {
    conditions.push("o.order_status = ?");
    params.push(filters.status);
  }

  if (filters.search) {
    const pattern = `%${escapeLike(filters.search)}%`;
    conditions.push("(o.order_code LIKE ? ESCAPE '!' OR o.recipient_name LIKE ? ESCAPE '!')");
    params.push(pattern, pattern);
  }

  const [rows] = await db.execute(`SELECT o.id, o.order_code, o.user_id,
    o.recipient_name, o.total_amount, o.order_status, o.payment_status,
    pm.code AS payment_method, o.created_at
    FROM orders o JOIN payment_methods pm ON pm.id = o.payment_method_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY o.id DESC LIMIT ? OFFSET ?`,
    [...params, String(limit + 1), String((page - 1) * limit)]);

  return { items: rows.slice(0, limit),
    pagination: { page, limit, has_next: rows.length > limit } };
};

const detail = async (db, id) => {
  const [rows] = await db.execute(`SELECT o.*, pm.code AS payment_method
    FROM orders o JOIN payment_methods pm ON pm.id = o.payment_method_id
    WHERE o.id = ?`, [id]);

  if (!rows[0]) return null;

  const [items] = await db.execute(`SELECT * FROM order_items
    WHERE order_id = ? ORDER BY id`, [id]);
  const [history] = await db.execute(`SELECT * FROM order_status_histories
    WHERE order_id = ? ORDER BY id`, [id]);
  const [payments] = await db.execute(`SELECT id, transaction_code, amount, status,
    paid_at, created_at FROM payments WHERE order_id = ? ORDER BY id DESC`, [id]);

  return { ...rows[0], items, history, payments };
};

const change = async (db, id, status, reason = null) => {
  await db.execute(`UPDATE orders SET order_status = ?,
    cancel_reason = COALESCE(?, cancel_reason) WHERE id = ?`,
    [status, reason, id]);
};

const history = async (db, order, next, userId, note) => {
  await db.execute(`INSERT INTO order_status_histories
    (order_id, old_status, new_status, changed_by, note)
    VALUES (?, ?, ?, ?, ?)`, [order.id, order.order_status, next, userId, note]);
};

const items = async (db, id) => {
  const [rows] = await db.execute(`SELECT product_id, variant_id, quantity
    FROM order_items WHERE order_id = ? ORDER BY product_id, id`, [id]);

  return rows;
};

const restore = async (db, productId, quantity, variantId = null) => {
  const [rows] = await db.execute(`SELECT stock_quantity FROM products
    WHERE id = ? FOR UPDATE`, [productId]);

  if (!rows[0] || rows[0].stock_quantity > 2147483647 - quantity) {
    const error = new Error("Kho không thể nhận số lượng hoàn");
    error.statusCode = 409;
    throw error;
  }

  await db.execute(`UPDATE products SET stock_quantity = stock_quantity + ?
    WHERE id = ?`, [quantity, productId]);

  if (variantId) await variants.restore(db, variantId, quantity);
};

const cancelAttempts = async (db, id) => {
  await db.execute(`UPDATE payments SET status = 'CANCELLED'
    WHERE order_id = ? AND status = 'PENDING'`, [id]);
};

module.exports = { lock, list, detail, change, history,
  items, restore, cancelAttempts };
