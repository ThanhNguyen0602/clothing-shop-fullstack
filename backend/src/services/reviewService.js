const model = require("../models/reviewModel");
const withTransaction = require("../utils/withTransaction");
const { fail } = require("../utils/catalogHelpers");

const list = (productId, page, limit) => withTransaction(async (db) => {
  if (!await model.publicProduct(db, productId)) fail(404, "Sản phẩm không tồn tại");

  return model.list(db, productId, page, limit);
});

const create = (userId, productId, body) => withTransaction(async (db) => {
  const item = await model.purchase(db, body.order_item_id, userId, productId);

  if (!item) fail(404, "Không tìm thấy dòng mua hàng của bạn");

  if (item.order_status !== "COMPLETED") fail(409, "Đơn chưa hoàn tất");

  if (await model.existing(db, item.id)) fail(409, "Dòng mua hàng đã có đánh giá");

  return model.insert(db, userId, productId, body);
});

const edit = (id, userId, body) => withTransaction(async (db) => {
  const review = await model.lock(db, id);

  if (!review || review.user_id !== userId) fail(404, "Không tìm thấy đánh giá");

  await model.update(db, id, body);

  return { id, ...body, status: review.status };
});

const remove = (id, userId) => withTransaction(async (db) => {
  const review = await model.lock(db, id);

  if (!review || review.user_id !== userId) fail(404, "Không tìm thấy đánh giá");

  if (await model.dependencies(db, id)) {
    fail(409, "Đánh giá có ảnh hoặc bình luận; cần xử lý phụ thuộc trước");
  }

  await model.remove(db, id);

  return { id };
});

const moderate = (id, status, reason) => withTransaction(async (db) => {
  if (!await model.lock(db, id)) fail(404, "Không tìm thấy đánh giá");

  await model.moderate(db, id, status, reason);

  return { id, status };
});

const management = (page, limit) => withTransaction((db) =>
  model.management(db, page, limit));

module.exports = { list, create, edit, remove, moderate, management };
