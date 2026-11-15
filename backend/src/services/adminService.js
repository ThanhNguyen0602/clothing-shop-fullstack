const bcrypt = require("bcrypt");
const model = require("../models/adminModel");
const withTransaction = require("../utils/withTransaction");
const { fail } = require("../utils/catalogHelpers");
const { SETTING_KEYS } = require("../utils/adminValidation");

const DEFAULT_SETTINGS = {
  shop_name: "TV Studio", contact_email: "", contact_phone: "", shop_address: "",
  shipping_note: "Phí giao hàng tính theo phương thức vận chuyển khi đặt hàng.",
  return_policy: "Liên hệ cửa hàng để được xác nhận điều kiện đổi trả."
};

const listUsers = (query) => withTransaction((db) => model.listUsers(db, query));

// Admin khong tu doi vai tro/trang thai cua chinh minh de tranh tu khoa quyen quan tri.
const target = async (db, id, actor) => {
  const user = await model.lockUser(db, id);

  if (!user) fail(404, "Không tìm thấy tài khoản");

  if (user.id === actor.id) fail(409, "Không thể tự thay đổi vai trò hoặc trạng thái của mình");

  return user;
};

const changeRole = (id, role, actor) => withTransaction(async (db) => {
  const user = await target(db, id, actor);

  if (user.role === role) return user;

  await model.setRole(db, id, role);
  await model.audit(db, actor, "CHANGE_ROLE", "USER", id, { role: user.role }, { role });

  return model.lockUser(db, id);
});

// LOCKED/DISABLED co hieu luc ngay o request ke tiep vi requireAuth doc lai trang thai tu CSDL.
const changeStatus = (id, status, actor) => withTransaction(async (db) => {
  const user = await target(db, id, actor);

  if (user.status === status) return user;

  await model.setStatus(db, id, status);
  await model.audit(db, actor, status === "ACTIVE" ? "UNLOCK_USER" : "LOCK_USER", "USER", id,
    { status: user.status }, { status });

  return model.lockUser(db, id);
});

const createStaff = async (data, actor) => {
  const hash = await bcrypt.hash(data.password, 12);

  return withTransaction(async (db) => {
    const id = await model.insertUser(db, data, hash);

    await model.audit(db, actor, "CREATE_USER", "USER", id, null,
      { email: data.email, role: data.role });

    return model.lockUser(db, id);
  });
};

const settings = () => withTransaction(async (db) => {
  const rows = await model.listSettings(db);
  const stored = Object.fromEntries(rows.filter((row) => SETTING_KEYS.includes(row.setting_key))
    .map((row) => [row.setting_key, row.setting_value ?? ""]));

  return { ...DEFAULT_SETTINGS, ...stored };
});

const saveSettings = (values, actor) => withTransaction(async (db) => {
  for (const [key, value] of Object.entries(values)) {
    await model.upsertSetting(db, key, value);
  }

  await model.audit(db, actor, "UPDATE_SETTINGS", "SYSTEM_SETTINGS", null, null, values);

  const rows = await model.listSettings(db);

  return { ...DEFAULT_SETTINGS, ...Object.fromEntries(rows
    .filter((row) => SETTING_KEYS.includes(row.setting_key))
    .map((row) => [row.setting_key, row.setting_value ?? ""])) };
});

module.exports = { listUsers, changeRole, changeStatus, createStaff, settings, saveSettings,
  DEFAULT_SETTINGS };
