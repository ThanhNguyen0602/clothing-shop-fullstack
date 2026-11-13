const { SORTS } = require("../utils/productQuery");

const escapeLike = (value) => value.replace(/[!%_]/g, (char) => `!${char}`);

const buildWhere = (query) => {
  const conditions = ["p.status = 'ACTIVE'", "c.status = 'ACTIVE'"];
  const params = [];

  if (query.search) {
    const pattern = `%${escapeLike(query.search)}%`;
    conditions.push("(p.name LIKE ? ESCAPE '!' OR p.sku LIKE ? ESCAPE '!')");
    params.push(pattern, pattern);
  }

  if (query.category !== undefined) {
    conditions.push("p.category_id = ?");
    params.push(query.category);
  }

  if (query.brand !== undefined) {
    conditions.push("p.brand_id = ?");
    params.push(query.brand);
  }

  if (query.minPrice !== undefined) {
    conditions.push("p.sale_price >= ?");
    params.push(query.minPrice);
  }

  if (query.maxPrice !== undefined) {
    conditions.push("p.sale_price <= ?");
    params.push(query.maxPrice);
  }

  if (query.inStock !== undefined) {
    conditions.push(query.inStock ? "p.stock_quantity > 0" : "p.stock_quantity = 0");
  }

  if (query.onSale !== undefined) {
    conditions.push(query.onSale
      ? "p.sale_price < p.original_price" : "p.sale_price >= p.original_price");
  }

  return { where: conditions.join(" AND "), params };
};

const search = async (db, query) => {
  const { where, params } = buildWhere(query);
  const from = `FROM products p
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN brands b ON b.id = p.brand_id`;

  const orderBy = SORTS[query.sort];

  const [counts] = await db.execute(
    `SELECT COUNT(*) AS total ${from} WHERE ${where}`, params
  );

  const [rows] = await db.execute(
    `SELECT p.id, p.category_id, c.name AS category_name,
       p.brand_id, b.name AS brand_name, p.sku, p.name, p.slug,
       p.original_price, p.sale_price, p.stock_quantity,
       p.thumbnail, p.status, p.created_at
     ${from} WHERE ${where}
     ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...params, String(query.limit), String(query.offset)]
  );

  return { rows, total: Number(counts[0].total) };
};

module.exports = { search, buildWhere };
