const pool = require("../config/database");
const withTransaction = require("../utils/withTransaction");

const seed = async () => {
  try {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Không chạy seed demo trên production");
    }

    const created = await withTransaction(async (db) => {
      const [rows] = await db.execute(
        "SELECT id FROM payment_methods WHERE code = 'SIMULATED'");

      if (rows.length) return false;

      await db.execute(`INSERT INTO payment_methods (code, name, status)
        VALUES ('SIMULATED', 'Thanh toán online mô phỏng', 'ACTIVE')`);

      return true;
    });

    console.log(created ? "Đã thêm SIMULATED" : "SIMULATED đã có; giữ nguyên");
  } catch (error) {
    console.error("Seed thất bại:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

seed();
