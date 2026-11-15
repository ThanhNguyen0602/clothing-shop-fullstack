const columns = `id, recipient_name, recipient_phone, province, district, ward,
  street_address, note, is_default, created_at`;

// Khoa dong users de cac thao tac so dia chi cua cung mot Customer chay tuan tu.
const lockOwner = async (db, userId) => {
  await db.execute("SELECT id FROM users WHERE id = ? FOR UPDATE", [userId]);
};

const list = async (db, userId) => {
  const [rows] = await db.execute(
    `SELECT ${columns} FROM addresses WHERE user_id = ?
     ORDER BY is_default DESC, id DESC`, [userId]);

  return rows;
};

const find = async (db, id, userId) => {
  const [rows] = await db.execute(
    `SELECT ${columns} FROM addresses WHERE id = ? AND user_id = ? FOR UPDATE`, [id, userId]);

  return rows[0];
};

const values = (data) => [data.recipient_name, data.recipient_phone, data.province,
  data.district, data.ward, data.street_address, data.note];

const insert = async (db, userId, data, isDefault) => {
  const [result] = await db.execute(
    `INSERT INTO addresses (user_id, recipient_name, recipient_phone, province,
       district, ward, street_address, note, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [userId, ...values(data), isDefault]);

  return result.insertId;
};

const update = async (db, id, data) => {
  await db.execute(
    `UPDATE addresses SET recipient_name = ?, recipient_phone = ?, province = ?,
       district = ?, ward = ?, street_address = ?, note = ? WHERE id = ?`, [...values(data), id]);
};

const makeDefault = async (db, userId, id) => {
  await db.execute("UPDATE addresses SET is_default = (id = ?) WHERE user_id = ?", [id, userId]);
};

const remove = async (db, id) => {
  await db.execute("DELETE FROM addresses WHERE id = ?", [id]);
};

module.exports = { lockOwner, list, find, insert, update, makeDefault, remove };
