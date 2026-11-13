const pool = require("../config/database");

const listPublic = async () => {
  const [rows] = await pool.execute(
    `SELECT id, name, description, logo_url FROM brands
     WHERE status = 'ACTIVE' ORDER BY name, id`
  );

  return rows;
};

const find = async (id, db = pool) => {
  const [rows] = await db.execute("SELECT id, status FROM brands WHERE id = ?", [id]);

  return rows[0];
};

module.exports = { listPublic, find };
