const { fail } = require("./catalogHelpers");

const fields = ["recipient_name", "recipient_phone", "province", "district",
  "ward", "street_address", "note", "is_default"];
const required = ["recipient_name", "recipient_phone", "province", "ward", "street_address"];

const text = (value, max, field, optional = false) => {
  if (optional && (value === undefined || value === null || value === "")) return null;

  if (typeof value !== "string" || !value.trim() || [...value.trim()].length > max) {
    fail(400, `${field} không hợp lệ`);
  }

  return value.trim();
};

const addressBody = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).some((key) => !fields.includes(key)) ||
      required.some((key) => !Object.hasOwn(body, key))) {
    fail(400, "Body thiếu trường hoặc có trường không được phép");
  }

  const phone = text(body.recipient_phone, 20, "recipient_phone");

  if (!/^0\d{9}$/.test(phone)) fail(400, "Số điện thoại gồm 10 số, bắt đầu bằng 0");

  if (body.is_default !== undefined && typeof body.is_default !== "boolean") {
    fail(400, "is_default phải là true hoặc false");
  }

  return {
    recipient_name: text(body.recipient_name, 100, "recipient_name"),
    recipient_phone: phone,
    province: text(body.province, 100, "province"),
    district: text(body.district, 100, "district", true),
    ward: text(body.ward, 100, "ward"),
    street_address: text(body.street_address, 255, "street_address"),
    note: text(body.note, 1000, "note", true),
    is_default: body.is_default === true
  };
};

module.exports = { addressBody };
