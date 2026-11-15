const pool = require("../config/database");

const listShipping = async () => {
  const [rows] = await pool.execute(`SELECT id, name, base_fee, estimated_days
    FROM shipping_methods WHERE status = 'ACTIVE' ORDER BY id`);

  return rows;
};

const listPayments = async () => {
  const [rows] = await pool.execute(`SELECT code, name FROM payment_methods
    WHERE code IN ('COD', 'SIMULATED') AND status = 'ACTIVE'`);

  return rows;
};

const lockShipping = async (db, id) => {
  const [rows] = await db.execute(`SELECT base_fee FROM shipping_methods
    WHERE id = ? AND status = 'ACTIVE' FOR UPDATE`, [id]);

  return rows[0];
};

const lockPayment = async (db, code) => {
  const [rows] = await db.execute(`SELECT id FROM payment_methods
    WHERE code = ? AND status = 'ACTIVE' FOR UPDATE`, [code]);

  return rows[0];
};

module.exports = { listShipping, listPayments, lockShipping, lockPayment };
