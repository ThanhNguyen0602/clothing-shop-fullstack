const list = async (db, productId) => {
  const [rows] = await db.execute(
    `SELECT id, image_url, is_primary, display_order FROM product_images
     WHERE product_id = ? ORDER BY display_order, id`, [productId]);

  return rows;
};

const insert = async (db, productId, url, primary, order) => {
  const [result] = await db.execute(
    `INSERT INTO product_images (product_id, image_url, is_primary, display_order)
     VALUES (?, ?, ?, ?)`, [productId, url, primary, order]);

  return result.insertId;
};

const remove = async (db, id) => {
  await db.execute("DELETE FROM product_images WHERE id = ?", [id]);
};

// Dua anh duoc chon len dau, danh lai thu tu va dong bo thumbnail.
const reorder = async (db, productId, orderedIds) => {
  for (const [index, id] of orderedIds.entries()) {
    await db.execute(
      "UPDATE product_images SET is_primary = ?, display_order = ? WHERE id = ?",
      [index === 0, index, id]);
  }
};

const setThumbnail = async (db, productId, url) => {
  await db.execute("UPDATE products SET thumbnail = ? WHERE id = ?", [url, productId]);
};

module.exports = { list, insert, remove, reorder, setThumbnail };
