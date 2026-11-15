const pool = require("../config/database");
const withTransaction = require("../utils/withTransaction");

const seed = async () => {
  try {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Không chạy dữ liệu demo trên production");
    }

    const created = await withTransaction(async (db) => {
      const counts = { shipping: 0, payment: 0 };
      const [shipping] = await db.execute(
        "SELECT id FROM shipping_methods WHERE name = ?", ["B6 Tiêu chuẩn"]);

      if (!shipping.length) {
        await db.execute(`INSERT INTO shipping_methods
          (name, base_fee, estimated_days, status)
          VALUES ('B6 Tiêu chuẩn', '30000.00', 3, 'ACTIVE')`);
        counts.shipping += 1;
      }

      const [payments] = await db.execute(
        "SELECT id FROM payment_methods WHERE code = 'COD'");

      if (!payments.length) {
        await db.execute(`INSERT INTO payment_methods (code, name, status)
          VALUES ('COD', 'Thanh toán khi nhận hàng', 'ACTIVE')`);
        counts.payment += 1;
      }

      return counts;
    });

    console.log("Seed checkout thành công:", created);
  } catch (error) {
    console.error("Seed thất bại:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

seed();
