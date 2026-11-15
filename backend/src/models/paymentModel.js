const attempts = async (db, orderId) => {
  const [rows] = await db.execute(`SELECT id, transaction_code, amount,
    status, paid_at, created_at FROM payments
    WHERE order_id = ? ORDER BY id DESC`, [orderId]);

  return rows;
};

const pending = async (db, orderId) => {
  const [rows] = await db.execute(`SELECT id, transaction_code, amount, status
    FROM payments WHERE order_id = ? AND status = 'PENDING'
    ORDER BY id DESC LIMIT 1 FOR UPDATE`, [orderId]);

  return rows[0];
};

const insert = async (db, order, code, status) => {
  const [result] = await db.execute(`INSERT INTO payments
    (order_id, payment_method_id, transaction_code, amount, status, paid_at)
    VALUES (?, ?, ?, ?, ?, IF(? = 'SUCCESS', NOW(), NULL))`,
    [order.id, order.payment_method_id, code, order.total_amount, status, status]);

  return { id: result.insertId, transaction_code: code,
    amount: order.total_amount, status };
};

const lock = async (db, orderId, code) => {
  const [rows] = await db.execute(`SELECT * FROM payments
    WHERE order_id = ? AND transaction_code = ? FOR UPDATE`, [orderId, code]);

  return rows[0];
};

const result = async (db, id, status) => {
  await db.execute(`UPDATE payments SET status = ?,
    paid_at = IF(? = 'SUCCESS', NOW(), NULL) WHERE id = ?`, [status, status, id]);
};

const orderPayment = async (db, id, status) => {
  await db.execute("UPDATE orders SET payment_status = ? WHERE id = ?",
    [status, id]);
};

module.exports = { attempts, pending, insert, lock, result, orderPayment };
