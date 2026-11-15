const publicProduct = async (db, id) => {
  const [rows] = await db.execute(`SELECT p.id FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.id = ? AND p.status = 'ACTIVE' AND c.status = 'ACTIVE'`, [id]);

  return rows[0];
};

const list = async (db, productId, page, limit) => {
  const [stats] = await db.execute(`SELECT COUNT(*) AS count,
    COALESCE(AVG(rating), 0) AS average FROM reviews
    WHERE product_id = ? AND status = 'VISIBLE'`, [productId]);
  const [rows] = await db.execute(`SELECT id, rating, title, content, created_at,
    updated_at FROM reviews WHERE product_id = ? AND status = 'VISIBLE'
    ORDER BY id DESC LIMIT ? OFFSET ?`,
    [productId, String(limit + 1), String((page - 1) * limit)]);

  return { items: rows.slice(0, limit), summary: stats[0],
    pagination: { page, limit, has_next: rows.length > limit } };
};

const purchase = async (db, itemId, userId, productId) => {
  const [rows] = await db.execute(`SELECT oi.id, o.order_status
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE oi.id = ? AND o.user_id = ? AND oi.product_id = ? FOR UPDATE`,
    [itemId, userId, productId]);

  return rows[0];
};

const existing = async (db, itemId) => {
  const [rows] = await db.execute(`SELECT id FROM reviews
    WHERE order_item_id = ? FOR UPDATE`, [itemId]);

  return rows[0];
};

const insert = async (db, userId, productId, body) => {
  const [result] = await db.execute(`INSERT INTO reviews
    (user_id, product_id, order_item_id, rating, title, content)
    VALUES (?, ?, ?, ?, ?, ?)`, [userId, productId, body.order_item_id,
    body.rating, body.title, body.content]);

  return { id: result.insertId, status: "VISIBLE", ...body };
};

const lock = async (db, id) => {
  const [rows] = await db.execute("SELECT * FROM reviews WHERE id = ? FOR UPDATE",
    [id]);

  return rows[0];
};

const update = async (db, id, body) => {
  await db.execute(`UPDATE reviews SET rating = ?, title = ?, content = ?
    WHERE id = ?`, [body.rating, body.title, body.content, id]);
};

const dependencies = async (db, id) => {
  const [rows] = await db.execute(`SELECT
    (SELECT COUNT(*) FROM comments WHERE review_id = ?) +
    (SELECT COUNT(*) FROM review_images WHERE review_id = ?) AS count`, [id, id]);

  return Number(rows[0].count);
};

const remove = async (db, id) => {
  await db.execute("DELETE FROM reviews WHERE id = ?", [id]);
};

const moderate = async (db, id, status, reason) => {
  await db.execute(`UPDATE reviews SET status = ?, moderation_reason = ?
    WHERE id = ?`, [status, reason, id]);
};

const management = async (db, page, limit) => {
  const [rows] = await db.execute(`SELECT id, user_id, product_id, order_item_id,
    rating, title, content, status, moderation_reason, created_at
    FROM reviews ORDER BY id DESC LIMIT ? OFFSET ?`,
    [String(limit + 1), String((page - 1) * limit)]);

  return { items: rows.slice(0, limit),
    pagination: { page, limit, has_next: rows.length > limit } };
};

module.exports = { publicProduct, list, purchase, existing, insert,
  lock, update, dependencies, remove, moderate, management };
