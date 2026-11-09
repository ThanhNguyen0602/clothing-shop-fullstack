const bcrypt = require("bcrypt");
const pool = require("../config/database");

// Chi dung cho CSDL phat trien cua do an.
const demoPassword = "Demo@123";

const roles = [
  ["CUSTOMER", "Khách hàng"],
  ["MANAGER", "Nhân viên quản lý"],
  ["ADMIN", "Quản trị viên"]
];

const accounts = [
  { name: "Khách hàng mẫu 01", email: "customer01@example.com",
    phone: "0900000001", role: "CUSTOMER" },
  { name: "Khách hàng mẫu 02", email: "customer02@example.com",
    phone: "0900000002", role: "CUSTOMER" },
  { name: "Quản lý mẫu", email: "manager01@example.com",
    phone: "0900000003", role: "MANAGER" },
  { name: "Quản trị viên mẫu", email: "admin01@example.com",
    phone: "0900000004", role: "ADMIN" }
];

const seed = async () => {
  let connection;

  try {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Không chạy dữ liệu demo trên production");
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    for (const [name, description] of roles) {
      await connection.execute(
        `INSERT INTO roles (name, description)
         SELECT ?, ? FROM DUAL WHERE NOT EXISTS
         (SELECT 1 FROM roles WHERE name = ?)`,
        [name, description, name]
      );
    }

    const [roleRows] = await connection.execute(
      "SELECT id, name FROM roles"
    );
    const roleIds = new Map(roleRows.map((r) => [r.name, r.id]));

    let inserted = 0;

    for (const account of accounts) {
      const [existing] = await connection.execute(
        "SELECT id FROM users WHERE email = ?", [account.email]
      );

      if (existing.length) {
        console.log(`Bỏ qua tài khoản đã có: ${account.email}`);
        continue;
      }

      const roleId = roleIds.get(account.role);
      if (!roleId) throw new Error(`Thiếu vai trò ${account.role}`);

      const passwordHash = await bcrypt.hash(demoPassword, 12);

      await connection.execute(
        `INSERT INTO users
         (role_id, full_name, email, phone, password_hash, status)
         VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
        [roleId, account.name, account.email,
         account.phone, passwordHash]
      );
      inserted += 1;
    }

    await connection.commit();
    console.log(`Seed thành công. Đã tạo ${inserted} tài khoản mới.`);
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Seed thất bại:", error.message);
    process.exitCode = 1;
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
};

seed();
