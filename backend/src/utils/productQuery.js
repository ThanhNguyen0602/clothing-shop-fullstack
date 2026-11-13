const { fail, parseId } = require("./catalogHelpers");

const SORTS = Object.freeze({
  newest: "p.created_at DESC, p.id DESC",
  price_asc: "p.sale_price ASC, p.id ASC",
  price_desc: "p.sale_price DESC, p.id ASC",
  name_asc: "p.name ASC, p.id ASC",
  name_desc: "p.name DESC, p.id ASC"
});

const read = (query, key) => {
  const value = query[key];

  if (value === undefined) return undefined;

  if (typeof value !== "string") {
    fail(400, `${key} chỉ được xuất hiện một lần và phải là chuỗi`);
  }

  return value;
};

const positive = (value, fallback, max, key) => {
  if (value === undefined) return fallback;

  if (!/^[1-9]\d*$/.test(value) || Number(value) > max) {
    fail(400, `${key} phải là số nguyên từ 1 đến ${max}`);
  }

  return Number(value);
};

const price = (value, key) => {
  if (value === undefined) return undefined;

  if (!/^(0|[1-9]\d{0,12})(\.\d{1,2})?$/.test(value)) {
    fail(400, `${key} phải là số không âm, tối đa 13 số nguyên và 2 số lẻ`);
  }

  return value;
};

const cents = (value) => {
  const [whole, decimal = ""] = value.split(".");

  return BigInt(whole) * 100n + BigInt(decimal.padEnd(2, "0"));
};

const flag = (value, key) => {
  if (value === undefined) return undefined;

  if (!["0", "1"].includes(value)) fail(400, `${key} chỉ nhận 0 hoặc 1`);

  return value === "1";
};

const parseProductQuery = (query) => {
  const allowed = ["search", "category", "brand", "minPrice", "maxPrice",
    "inStock", "onSale", "sort", "page", "limit"];

  if (Object.keys(query).some((key) => !allowed.includes(key))) {
    fail(400, "Query có tham số không được hỗ trợ");
  }

  const values = Object.fromEntries(allowed.map((key) => [key, read(query, key)]));
  const search = (values.search ?? "").trim();

  if ([...search].length > 100) fail(400, "search tối đa 100 ký tự");

  const sort = values.sort ?? "newest";

  if (!Object.hasOwn(SORTS, sort)) fail(400, "Kiểu sắp xếp không hợp lệ");

  const minPrice = price(values.minPrice, "minPrice");
  const maxPrice = price(values.maxPrice, "maxPrice");

  if (minPrice !== undefined && maxPrice !== undefined &&
    cents(minPrice) > cents(maxPrice)) {
    fail(400, "minPrice không được lớn hơn maxPrice");
  }

  const page = positive(values.page, 1, 1000000, "page");
  const limit = positive(values.limit, 12, 100, "limit");

  return {
    search, sort, minPrice, maxPrice, page, limit,
    offset: (page - 1) * limit,
    category: values.category === undefined ? undefined : parseId(values.category),
    brand: values.brand === undefined ? undefined : parseId(values.brand),
    inStock: flag(values.inStock, "inStock"),
    onSale: flag(values.onSale, "onSale")
  };
};

module.exports = { SORTS, parseProductQuery };
