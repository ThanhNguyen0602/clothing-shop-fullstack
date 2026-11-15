const one = async (db, sql, params = []) => {
  const [rows] = await db.execute(sql, params);

  return rows[0];
};

const stats = async (db, lowStock) => {
  const orders = await one(db, `SELECT COUNT(*) AS total,
    COALESCE(SUM(CASE WHEN order_status = 'COMPLETED' THEN total_amount ELSE 0 END), 0) AS revenue
    FROM orders`);
  const products = await one(db, `SELECT COUNT(*) AS total,
    COALESCE(SUM(CASE WHEN status = 'ACTIVE' AND stock_quantity <= ? THEN 1 ELSE 0 END), 0) AS low
    FROM products WHERE status <> 'DISCONTINUED'`, [lowStock]);
  const customers = await one(db, `SELECT COUNT(*) AS total FROM users u
    JOIN roles r ON r.id = u.role_id WHERE r.name = 'CUSTOMER'`);
  const [statuses] = await db.execute(`SELECT order_status, COUNT(*) AS total
    FROM orders GROUP BY order_status ORDER BY total DESC`);
  const [topProducts] = await db.execute(`SELECT oi.product_id, oi.product_name,
    SUM(oi.quantity) AS sold, SUM(oi.total_price) AS revenue
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.order_status = 'COMPLETED'
    GROUP BY oi.product_id, oi.product_name ORDER BY sold DESC, oi.product_id LIMIT 5`);
  const [lowStockItems] = await db.execute(`SELECT id, sku, name, stock_quantity
    FROM products WHERE status = 'ACTIVE' AND stock_quantity <= ?
    ORDER BY stock_quantity, id LIMIT 10`, [lowStock]);

  return {
    total_orders: Number(orders.total), revenue: orders.revenue,
    total_products: Number(products.total), low_stock: Number(products.low),
    total_customers: Number(customers.total), low_stock_threshold: lowStock,
    statuses: statuses.map((row) => ({ order_status: row.order_status, total: Number(row.total) })),
    top_products: topProducts.map((row) => ({ ...row, sold: Number(row.sold) })),
    low_stock_items: lowStockItems
  };
};

module.exports = { stats };
