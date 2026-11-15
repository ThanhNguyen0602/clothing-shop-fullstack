const columns = `id, product_id, sku, color, size, price_adjustment,
  stock_quantity, status`;

const listByProduct = async (db, productId, activeOnly = false) => {
  const extra = activeOnly ? "AND status = 'ACTIVE'" : "";
  const [rows] = await db.execute(
    `SELECT ${columns} FROM product_variants
     WHERE product_id = ? ${extra} ORDER BY color, id`, [productId]);

  return rows;
};

const lock = async (db, id) => {
  const [rows] = await db.execute(
    `SELECT ${columns} FROM product_variants WHERE id = ? FOR UPDATE`, [id]);

  return rows[0];
};

const countActive = async (db, productId) => {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS n FROM product_variants
     WHERE product_id = ? AND status = 'ACTIVE'`, [productId]);

  return Number(rows[0].n);
};

const values = (data) => [data.sku, data.color, data.size, data.price_adjustment,
  data.stock_quantity, data.status];

const insert = async (db, productId, data) => {
  const [result] = await db.execute(
    `INSERT INTO product_variants
     (product_id, sku, color, size, price_adjustment, stock_quantity, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`, [productId, ...values(data)]);

  return result.insertId;
};

const update = async (db, id, data) => {
  await db.execute(
    `UPDATE product_variants SET sku = ?, color = ?, size = ?, price_adjustment = ?,
     stock_quantity = ?, status = ? WHERE id = ?`, [...values(data), id]);
};

const remove = async (db, id) => {
  await db.execute("DELETE FROM product_variants WHERE id = ?", [id]);
};

// San pham da co bien the: ton kho san pham = tong ton kho bien the ACTIVE.
const syncProductStock = async (db, productId) => {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS n,
       COALESCE(SUM(CASE WHEN status = 'ACTIVE' THEN stock_quantity ELSE 0 END), 0) AS total
     FROM product_variants WHERE product_id = ?`, [productId]);

  if (Number(rows[0].n) === 0) return;

  await db.execute("UPDATE products SET stock_quantity = ? WHERE id = ?",
    [Number(rows[0].total), productId]);
};

const deduct = async (db, id, quantity) => {
  const [result] = await db.execute(
    `UPDATE product_variants SET stock_quantity = stock_quantity - ?
     WHERE id = ? AND stock_quantity >= ?`, [quantity, id, quantity]);

  if (result.affectedRows !== 1) throw new Error("Trừ kho biến thể không thành công");
};

const restore = async (db, id, quantity) => {
  const [rows] = await db.execute(
    "SELECT stock_quantity FROM product_variants WHERE id = ? FOR UPDATE", [id]);

  if (!rows[0] || rows[0].stock_quantity > 2147483647 - quantity) {
    throw Object.assign(new Error("Kho biến thể không thể nhận số lượng hoàn"),
      { statusCode: 409 });
  }

  await db.execute(
    "UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?",
    [quantity, id]);
};

const label = (variant) => (variant ? `${variant.color} / ${variant.size}` : null);

module.exports = { listByProduct, lock, countActive, insert, update, remove,
  syncProductStock, deduct, restore, label };
