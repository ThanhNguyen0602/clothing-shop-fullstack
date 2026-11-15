const { fail } = require("./catalogHelpers");

// DECIMAL(15,2): toi da 15 chu so tinh ca 2 chu so le.
const MAX = 999999999999999n;

const cents = (value) => {
  if (typeof value !== "string" ||
      !/^(0|[1-9]\d{0,12})(\.\d{1,2})?$/.test(value)) {
    throw new Error("Cần DECIMAL dạng chuỗi từ mysql2");
  }

  const [whole, fraction = ""] = value.split(".");

  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
};

const money = (value) => {
  if (value < 0n || value > MAX) fail(409, "Số tiền vượt giới hạn lưu trữ");

  return `${value / 100n}.${String(value % 100n).padStart(2, "0")}`;
};

module.exports = { cents, money };
