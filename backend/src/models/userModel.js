const pool = require("../config/database");

const publicColumns = `u.id, u.full_name, u.email, u.phone,
  u.avatar, u.status, r.name AS role`;

const findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT ${publicColumns} FROM users u
     JOIN roles r ON r.id = u.role_id WHERE u.id = ?`, [id]);

  return rows[0];
};

const findForLogin = async (email) => {
  const [rows] = await pool.execute(
    `SELECT ${publicColumns}, u.password_hash FROM users u
     JOIN roles r ON r.id = u.role_id WHERE u.email = ?`, [email]);

  return rows[0];
};

const createCustomer = async (data, hash) => {
  const [roles] = await pool.execute(
    "SELECT id FROM roles WHERE name = ?", ["CUSTOMER"]);

  if (!roles[0]) throw new Error("Missing CUSTOMER role");

  const [result] = await pool.execute(
    `INSERT INTO users
     (role_id, full_name, email, phone, password_hash, status)
     VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
    [roles[0].id, data.full_name, data.email, data.phone, hash]);

  return findById(result.insertId);
};

const updateProfile = async (id, data) => {
  await pool.execute(
    `UPDATE users SET full_name = ?, phone = ?,
     updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [data.full_name, data.phone, id]);

  return findById(id);
};

module.exports = { findById, findForLogin,
  createCustomer, updateProfile };
