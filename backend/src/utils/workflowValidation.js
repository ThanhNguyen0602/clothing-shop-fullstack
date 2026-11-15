const { fail, parseId } = require("./catalogHelpers");

const object = (body, fields, required = fields) => {
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).some((key) => !fields.includes(key)) ||
      required.some((key) => !Object.hasOwn(body, key))) {
    fail(400, "Body thiếu trường hoặc có trường không được phép");
  }
};

const text = (value, max) => {
  if (typeof value !== "string" || !value.trim() ||
      [...value.trim()].length > max) fail(400, "Nội dung không hợp lệ");

  return value.trim();
};

const choice = (value, values) => {
  if (!values.includes(value)) fail(400, "Giá trị không được hỗ trợ");

  return value;
};

const page = (query, extra = []) => {
  if (Object.keys(query).some((key) =>
    !["page", "limit", ...extra].includes(key))) fail(400, "Query không hợp lệ");

  const number = (value, fallback, max) => {
    if (value === undefined) return fallback;

    if (typeof value !== "string" || !/^[1-9]\d*$/.test(value) ||
        Number(value) > max) fail(400, "Phân trang không hợp lệ");

    return Number(value);
  };

  return { page: number(query.page, 1, 1000000),
    limit: number(query.limit, 10, 50) };
};

const review = (body, creating = false) => {
  const fields = ["rating", "title", "content"];

  if (creating) fields.push("order_item_id");
  object(body, fields, fields.filter((key) => key !== "title"));

  if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
    fail(400, "rating là số nguyên từ 1 đến 5");
  }

  if (creating && typeof body.order_item_id !== "number") {
    fail(400, "order_item_id trong JSON phải là number");
  }

  return { rating: body.rating, content: text(body.content, 2000),
    title: body.title == null ? null : text(body.title, 255),
    ...(creating ? { order_item_id: parseId(body.order_item_id) } : {}) };
};

module.exports = { object, text, choice, page, review };
