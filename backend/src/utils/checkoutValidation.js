const { fail, parseId } = require("./catalogHelpers");

const object = (body, fields, required = fields) => {
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).some((key) => !fields.includes(key)) ||
      required.some((key) => !Object.hasOwn(body, key))) {
    fail(400, "Body thiếu trường hoặc có trường không được phép");
  }
};

const idNumber = (value) => {
  if (typeof value !== "number") fail(400, "ID trong JSON phải là number");

  return parseId(value);
};

const quantity = (value) => {
  if (!Number.isInteger(value) || value < 1 || value > 2147483647) {
    fail(400, "quantity phải là số nguyên dương hợp lệ");
  }

  return value;
};

const text = (value, max, field) => {
  if (typeof value !== "string" || !value.trim() ||
      [...value.trim()].length > max) fail(400, `${field} không hợp lệ`);

  return value.trim();
};

const cartBody = (body, adding = false) => {
  if (adding) object(body, ["product_id", "quantity", "variant_id"], ["product_id", "quantity"]);
  else object(body, ["quantity"]);

  if (!adding) return { quantity: quantity(body.quantity) };

  return { quantity: quantity(body.quantity), product_id: idNumber(body.product_id),
    variant_id: body.variant_id === undefined || body.variant_id === null
      ? null : idNumber(body.variant_id) };
};

const orderBody = (body) => {
  const fields = ["cart_item_ids", "recipient_name", "recipient_phone",
    "shipping_address", "shipping_method_id", "payment_method", "note"];
  object(body, fields, fields.filter((key) => key !== "note"));

  const ids = body.cart_item_ids;

  if (!Array.isArray(ids) || ids.length < 1 || ids.length > 100) {
    fail(400, "Chọn từ 1 đến 100 dòng giỏ hàng");
  }

  ids.forEach(idNumber);

  if (new Set(ids).size !== ids.length) fail(400, "cart_item_ids bị trùng");
  const phone = text(body.recipient_phone, 20, "recipient_phone");

  if (!/^0\d{9}$/.test(phone)) fail(400, "Số điện thoại gồm 10 số, bắt đầu bằng 0");

  if (!["COD", "SIMULATED"].includes(body.payment_method)) {
    fail(400, "payment_method phải là COD hoặc SIMULATED");
  }

  return {
    cart_item_ids: ids, recipient_phone: phone,
    payment_method: body.payment_method,
    recipient_name: text(body.recipient_name, 100, "recipient_name"),
    shipping_address: text(body.shipping_address, 2000, "shipping_address"),
    shipping_method_id: idNumber(body.shipping_method_id),
    note: body.note === undefined || body.note === null ? null
      : text(body.note, 1000, "note")
  };
};

module.exports = { cartBody, orderBody };
