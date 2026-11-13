const pool = require("../config/database");

const publicWhere = "p.status = 'ACTIVE' AND c.status = 'ACTIVE'";

const list = async (management = false) => {
  const where = management ? "" : `WHERE ${publicWhere}`;
  const [rows] = await pool.execute(
    `SELECT p.id, p.category_id, c.name AS category_name,
     p.sku, p.name, p.slug, p.original_price, p.sale_price,
     p.stock_quantity, p.thumbnail, p.status, p.created_at
     FROM products p JOIN categories c ON c.id = p.category_id
     ${where} ORDER BY p.id DESC`
  );

  return rows;
};

const find = async (id, management = false, db = pool) => {
  const extra = management ? "" : `AND ${publicWhere}`;
  const [rows] = await db.execute(
    `SELECT p.*, c.name AS category_name FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE p.id = ? ${extra}`, [id]
  );

  if (!rows[0]) return null;

  const [images] = await db.execute(
    `SELECT id, image_url, is_primary, display_order FROM product_images
     WHERE product_id = ? ORDER BY display_order, id`, [id]
  );

  return { ...rows[0], images };
};

const lock = async (id, db) => {
  const [rows] = await db.execute(
    "SELECT id FROM products WHERE id = ? FOR UPDATE", [id]
  );

  return rows[0];
};

const values = (data) => [data.category_id, data.brand_id ?? null,
  data.sku, data.name, data.slug, data.short_description, data.description,
  data.original_price, data.sale_price, data.stock_quantity,
  data.images[0] ?? null, data.status];

const insert = async (data, db) => {
  const [result] = await db.execute(
    `INSERT INTO products (category_id, brand_id, sku, name, slug,
     short_description, description, original_price, sale_price,
     stock_quantity, thumbnail, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, values(data)
  );

  return result.insertId;
};

const update = async (id, data, db) => {
  await db.execute(
    `UPDATE products SET category_id = ?, brand_id = ?, sku = ?,
     name = ?, slug = ?, short_description = ?, description = ?,
     original_price = ?, sale_price = ?, stock_quantity = ?,
     thumbnail = ?, status = ? WHERE id = ?`, [...values(data), id]
  );
};

const replaceImages = async (id, urls, db) => {
  await db.execute("DELETE FROM product_images WHERE product_id = ?", [id]);

  for (const [index, imageUrl] of urls.entries()) {
    await db.execute(
      `INSERT INTO product_images
       (product_id, image_url, is_primary, display_order)
       VALUES (?, ?, ?, ?)`, [id, imageUrl, index === 0, index]
    );
  }
};

const setStatus = async (id, value, db) => {
  await db.execute("UPDATE products SET status = ? WHERE id = ?", [value, id]);
};

module.exports = { list, find, lock, insert, update,
  replaceImages, setStatus };
