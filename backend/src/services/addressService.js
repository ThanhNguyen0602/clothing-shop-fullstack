const model = require("../models/addressModel");
const withTransaction = require("../utils/withTransaction");
const { fail } = require("../utils/catalogHelpers");

const MAX = 10;

const list = (userId) => withTransaction((db) => model.list(db, userId));

const create = (userId, data) => withTransaction(async (db) => {
  await model.lockOwner(db, userId);

  const current = await model.list(db, userId);

  if (current.length >= MAX) fail(409, `Tối đa ${MAX} địa chỉ`);

  // Dia chi dau tien luon la mac dinh.
  const id = await model.insert(db, userId, data, false);

  if (data.is_default || current.length === 0) await model.makeDefault(db, userId, id);

  return model.list(db, userId);
});

// is_default = true chuyen mac dinh sang dia chi nay; false/bo qua giu nguyen trang thai.
const update = (userId, id, data) => withTransaction(async (db) => {
  await model.lockOwner(db, userId);

  if (!await model.find(db, id, userId)) fail(404, "Không tìm thấy địa chỉ của bạn");

  await model.update(db, id, data);

  if (data.is_default) await model.makeDefault(db, userId, id);

  return model.list(db, userId);
});

const setDefault = (userId, id) => withTransaction(async (db) => {
  await model.lockOwner(db, userId);

  if (!await model.find(db, id, userId)) fail(404, "Không tìm thấy địa chỉ của bạn");

  await model.makeDefault(db, userId, id);

  return model.list(db, userId);
});

const remove = (userId, id) => withTransaction(async (db) => {
  await model.lockOwner(db, userId);

  const target = await model.find(db, id, userId);

  if (!target) fail(404, "Không tìm thấy địa chỉ của bạn");

  await model.remove(db, id);

  const rest = await model.list(db, userId);

  // Xoa dia chi mac dinh thi dia chi moi nhat con lai thanh mac dinh.
  if (target.is_default && rest.length) {
    const newest = rest.reduce((a, b) => (a.id > b.id ? a : b));
    await model.makeDefault(db, userId, newest.id);

    return model.list(db, userId);
  }

  return rest;
});

module.exports = { list, create, update, setDefault, remove };
