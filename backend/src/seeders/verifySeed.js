const bcrypt = require("bcrypt");
const pool = require("../config/database");

const expectedRoles = new Map([
  ["customer01@example.com", "CUSTOMER"],
  ["customer02@example.com", "CUSTOMER"],
  ["manager01@example.com", "MANAGER"],
  ["admin01@example.com", "ADMIN"]
]);

const verifySeed = async () => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.email, u.password_hash, u.status, r.name AS role
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.email IN (?, ?, ?, ?)`,
      [...expectedRoles.keys()]
    );

    if (rows.length !== expectedRoles.size) {
      throw new Error("Chưa có đủ 4 tài khoản mẫu");
    }

    for (const user of rows) {
      const matches = await bcrypt.compare(
        "Demo@123", user.password_hash
      );

      if (!matches || user.role !== expectedRoles.get(user.email)
        || user.status !== "ACTIVE") {
        throw new Error(`Tài khoản chưa đúng: ${user.email}`);
      }

      console.log(`OK: ${user.email} - ${user.role}`);
    }

    console.log("Đủ tài khoản, đúng vai trò và mật khẩu băm.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

verifySeed();
