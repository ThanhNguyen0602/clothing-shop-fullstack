const { fail, parseId } = require("./catalogHelpers");

const object = (body, allowed, required) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    fail(400, "Body phải là một JSON object");
  }

  if (Object.keys(body).some((key) => !allowed.includes(key))) {
    fail(400, "Body có trường không được phép cập nhật");
  }

  if (required.some((key) => !Object.hasOwn(body, key))) {
    fail(400, "Thiếu trường bắt buộc");
  }
};

const text = (value, max, field, optional = false) => {
  if (optional && (value === undefined || value === null)) return null;
  if (typeof value !== "string") fail(400, `${field} phải là chuỗi`);

  const result = value.trim();

  if ((!optional && !result) || [...result].length > max) {
    fail(400, `${field} rỗng hoặc vượt quá ${max} ký tự`);
  }

  return result || null;
};

const slug = (value, max) => {
  const result = text(value, max, "slug");

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result)) {
    fail(400, "slug chỉ gồm chữ thường không dấu, số và dấu gạch nối");
  }

  return result;
};

const url = (value, field, optional = false) => {
  const result = text(value, 500, field, optional);

  if (result === null) return null;

  let parsed;
  try { parsed = new URL(result); }
  catch { fail(400, `${field} không phải URL hợp lệ`); }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    fail(400, `${field} chỉ nhận URL http hoặc https`);
  }

  return result;
};

const integer = (value, field) => {
  if (!Number.isInteger(value) || value < 0 || value > 2147483647) {
    fail(400, `${field} phải là số nguyên không âm hợp lệ`);
  }

  return value;
};

const status = (value, allowed) => {
  if (!allowed.includes(value)) fail(400, "Trạng thái không hợp lệ");

  return value;
};

const money = (value, field) => {
  // Truyen chuoi de giu chinh xac gia tri DECIMAL(15,2).
  if (typeof value !== "string" ||
    !/^(0|[1-9]\d{0,12})(\.\d{1,2})?$/.test(value)) {
    fail(400, `${field} phải là chuỗi số không âm, tối đa 2 số lẻ`);
  }

  return value;
};

const categoryBody = (body) => {
  const fields = ["name", "slug", "description", "image_url",
    "status", "display_order"];

  object(body, fields, ["name", "slug", "status", "display_order"]);

  return {
    name: text(body.name, 100, "name"), slug: slug(body.slug, 150),
    description: text(body.description, 10000, "description", true),
    image_url: url(body.image_url, "image_url", true),
    status: status(body.status, ["ACTIVE", "INACTIVE"]),
    display_order: integer(body.display_order, "display_order")
  };
};

const productBody = (body) => {
  const fields = ["category_id", "sku", "name", "slug",
    "short_description", "description", "original_price", "sale_price",
    "stock_quantity", "status", "images"];

  object(body, fields, ["category_id", "sku", "name", "slug",
    "original_price", "sale_price", "stock_quantity", "status", "images"]);

  if (typeof body.category_id !== "number") {
    fail(400, "category_id phải là số nguyên dương");
  }

  if (!Array.isArray(body.images) || body.images.length > 10) {
    fail(400, "images phải là mảng, tối đa 10 URL");
  }

  const images = body.images.map((item) => url(item, "images"));
  if (new Set(images).size !== images.length) fail(400, "URL ảnh bị trùng");

  const original = money(body.original_price, "original_price");
  const sale = money(body.sale_price, "sale_price");

  if (Number(sale) > Number(original)) {
    fail(400, "Giá bán không được lớn hơn giá gốc");
  }

  return {
    category_id: parseId(body.category_id),
    sku: text(body.sku, 50, "sku"), name: text(body.name, 255, "name"),
    slug: slug(body.slug, 255),
    short_description: text(body.short_description, 500,
      "short_description", true),
    description: text(body.description, 10000, "description", true),
    original_price: original, sale_price: sale,
    stock_quantity: integer(body.stock_quantity, "stock_quantity"),
    status: status(body.status, ["ACTIVE", "INACTIVE", "DISCONTINUED"]),
    images
  };
};

const statusBody = (body) => {
  object(body, ["status"], ["status"]);

  return status(body.status, ["ACTIVE", "INACTIVE", "DISCONTINUED"]);
};

module.exports = { categoryBody, productBody, statusBody };
