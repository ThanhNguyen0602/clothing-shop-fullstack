const lockCart = async (db, userId) => {
  await db.execute(`INSERT INTO carts (user_id) VALUES (?)
    ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`, [userId]);
  const [rows] = await db.execute(
    "SELECT id FROM carts WHERE user_id = ? FOR UPDATE", [userId]);

  return rows[0].id;
};

const items = async (db, cartId) => {
  const [rows] = await db.execute(
    `SELECT id, product_id, variant_id, quantity FROM cart_items
     WHERE cart_id = ? ORDER BY product_id, id`, [cartId]);

  return rows;
};

const lockProduct = async (db, id) => {
  const [rows] = await db.execute(
    `SELECT p.id, p.sku, p.name, p.sale_price, p.thumbnail,
      p.stock_quantity, p.status, c.status AS category_status
     FROM products p JOIN categories c ON c.id = p.category_id
     WHERE p.id = ? FOR UPDATE`, [id]);

  return rows[0];
};

const putItem = async (db, cartId, productId, variantId, quantity) => {
  await db.execute(`INSERT INTO cart_items (cart_id, product_id, variant_id, quantity)
    VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantity = ?`,
    [cartId, productId, variantId, quantity, quantity]);
};

const removeItems = async (db, cartId, ids) => {
  for (const id of ids) {
    await db.execute("DELETE FROM cart_items WHERE cart_id = ? AND id = ?",
      [cartId, id]);
  }
};

const touch = async (db, cartId) => {
  await db.execute("UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [cartId]);
};

const lockVariant = async (db, id) => {
  const [rows] = await db.execute(
    `SELECT id, product_id, color, size, price_adjustment, stock_quantity, status
     FROM product_variants WHERE id = ? FOR UPDATE`, [id]);

  return rows[0];
};

const countActiveVariants = async (db, productId) => {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS n FROM product_variants
     WHERE product_id = ? AND status = 'ACTIVE'`, [productId]);

  return Number(rows[0].n);
};

module.exports = { lockCart, items, lockProduct, lockVariant, countActiveVariants,
  putItem, removeItems, touch };
