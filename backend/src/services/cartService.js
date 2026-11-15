const withTransaction = require("../utils/withTransaction");
const model = require("../models/commerceModel");
const { fail } = require("../utils/catalogHelpers");
const { cents, money } = require("../utils/orderMoney");

// variant: bien the da khoa (hoac null); needsVariant: san pham co bien the ACTIVE ma dong chua chon.
const unavailable = (product, quantity, variant = null, needsVariant = false) => {
  if (!product || product.status !== "ACTIVE" ||
      product.category_status !== "ACTIVE") return "Sản phẩm không còn bán";

  if (needsVariant) return "Vui lòng chọn màu và kích thước";

  if (variant && (variant.status !== "ACTIVE" || variant.product_id !== product.id)) {
    return "Phân loại này không còn bán";
  }

  const stock = variant ? variant.stock_quantity : product.stock_quantity;

  if (stock < quantity) return "Không đủ tồn kho";

  return null;
};

const unitCents = (product, variant) => cents(product.sale_price) +
  (variant ? cents(variant.price_adjustment) : 0n);

// Khoa san pham, bien the cua mot dong va xac dinh co bat buoc chon bien the khong.
const lockLine = async (db, productId, variantId) => {
  const product = await model.lockProduct(db, productId);
  const variant = variantId ? await model.lockVariant(db, variantId) : null;
  const needsVariant = !variantId && product
    ? await model.countActiveVariants(db, productId) > 0 : false;

  return { product, variant, needsVariant };
};

const view = async (db, cartId) => {
  const rows = await model.items(db, cartId);
  let subtotal = 0n;
  const data = [];

  // rows da sap theo product_id, giu thu tu khoa nhat quan.
  for (const row of rows) {
    const { product, variant, needsVariant } = await lockLine(db, row.product_id, row.variant_id);

    if (!product) fail(409, "Dữ liệu sản phẩm không còn hợp lệ");

    const unit = unitCents(product, variant);
    const line = unit * BigInt(row.quantity);
    subtotal += line;

    const reason = unavailable(product, row.quantity, variant, needsVariant);
    data.push({ id: row.id, product_id: row.product_id, variant_id: row.variant_id,
      sku: product.sku, name: product.name, thumbnail: product.thumbnail,
      color: variant?.color ?? null, size: variant?.size ?? null,
      quantity: row.quantity,
      stock_quantity: variant ? variant.stock_quantity : product.stock_quantity,
      unit_price: money(unit), total_price: money(line),
      available: reason === null, reason });
  }

  return { items: data, subtotal: money(subtotal),
    can_checkout: data.length > 0 && data.every((item) => item.available) };
};

const run = (userId, work) => withTransaction(async (db) => {
  const cartId = await model.lockCart(db, userId);

  return work(db, cartId);
});

const get = (userId) => run(userId, view);

const sameLine = (row, productId, variantId) =>
  row.product_id === productId && (row.variant_id ?? null) === (variantId ?? null);

const save = (userId, input, itemId = null) => run(userId, async (db, cartId) => {
  const rows = await model.items(db, cartId);
  const old = itemId === null
    ? rows.find((row) => sameLine(row, input.product_id, input.variant_id))
    : rows.find((row) => row.id === itemId);

  if (itemId !== null && !old) fail(404, "Không tìm thấy dòng trong giỏ của bạn");

  if (!old && rows.length >= 100) fail(409, "Giỏ hàng tối đa 100 sản phẩm");

  const productId = old ? old.product_id : input.product_id;
  const variantId = old ? old.variant_id ?? null : input.variant_id ?? null;

  // Khoa toan bo san pham theo id truoc khi kiem tra/sua va goi view.
  const ids = [...new Set([...rows.map((row) => row.product_id), productId])];

  for (const id of ids.sort((a, b) => a - b)) {
    await model.lockProduct(db, id);
  }

  const { product, variant, needsVariant } = await lockLine(db, productId, variantId);

  if (variantId && !variant) fail(409, "Phân loại này không còn bán");

  const nextQuantity = itemId === null
    ? (old?.quantity || 0) + input.quantity : input.quantity;

  if (nextQuantity > 2147483647) fail(409, "Số lượng vượt giới hạn");

  const reason = unavailable(product, nextQuantity, variant, needsVariant);

  if (reason) fail(409, reason);

  await model.putItem(db, cartId, productId, variantId, nextQuantity);
  await model.touch(db, cartId);

  return view(db, cartId);
});

const remove = (userId, itemId = null) => run(userId, async (db, cartId) => {
  const rows = await model.items(db, cartId);

  if (itemId !== null && !rows.some((row) => row.id === itemId)) {
    fail(404, "Không tìm thấy dòng trong giỏ của bạn");
  }

  await model.removeItems(db, cartId,
    itemId === null ? rows.map((row) => row.id) : [itemId]);
  await model.touch(db, cartId);

  return view(db, cartId);
});

module.exports = { get, save, remove, unavailable, unitCents, lockLine };
