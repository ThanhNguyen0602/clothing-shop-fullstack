const pool = require("../config/database");

const list = async (management = false) => {
  const where = management ? "" : "WHERE status = 'ACTIVE'";
  const [rows] = await pool.execute(
    `SELECT id, parent_id, name, slug, description, image_url,
     status, display_order, created_at FROM categories
     ${where} ORDER BY display_order, id`
  );

  return rows;
};

const find = async (id, db = pool) => {
  const [rows] = await db.execute(
    "SELECT * FROM categories WHERE id = ?", [id]
  );

  return rows[0];
};

const insert = async (data, db = pool) => {
  const [result] = await db.execute(
    `INSERT INTO categories
     (name, slug, description, image_url, status, display_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.name, data.slug, data.description, data.image_url,
      data.status, data.display_order]
  );

  return result.insertId;
};

const update = async (id, data) => {
  await pool.execute(
    `UPDATE categories SET name = ?, slug = ?, description = ?,
     image_url = ?, status = ?, display_order = ? WHERE id = ?`,
    [data.name, data.slug, data.description, data.image_url,
      data.status, data.display_order, id]
  );
};

const remove = async (id) => {
  const [result] = await pool.execute(
    "DELETE FROM categories WHERE id = ?", [id]
  );

  return result.affectedRows;
};

module.exports = { list, find, insert, update, remove };
