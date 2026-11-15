const { fail } = require("./catalogHelpers");
const v = require("./workflowValidation");
const { validRegister } = require("./authValidation");

const ROLES = ["CUSTOMER", "MANAGER", "ADMIN"];
const STATUSES = ["ACTIVE", "LOCKED", "DISABLED"];

const userQuery = (query) => {
  const { page, limit } = v.page(query, ["search", "role", "status"]);
  const read = (key) => {
    if (query[key] === undefined) return undefined;
    if (typeof query[key] !== "string") fail(400, `${key} chỉ được xuất hiện một lần`);

    return query[key];
  };
  const search = (read("search") ?? "").trim();

  if ([...search].length > 100) fail(400, "search tối đa 100 ký tự");

  const role = read("role");
  const status = read("status");

  if (role !== undefined) v.choice(role, ROLES);
  if (status !== undefined) v.choice(status, STATUSES);

  return { page, limit, search, role, status };
};

const roleBody = (body) => {
  v.object(body, ["role"]);

  return v.choice(body.role, ROLES);
};

const statusBody = (body) => {
  v.object(body, ["status"]);

  return v.choice(body.status, STATUSES);
};

// Tao tai khoan noi bo: cung quy tac du lieu voi dang ky, role chon MANAGER hoac ADMIN.
const staffBody = (body) => {
  v.object(body, ["full_name", "email", "phone", "password", "role"]);

  const { role, ...account } = body;

  if (!validRegister(account)) fail(400, "Kiểm tra họ tên, email, điện thoại và mật khẩu");

  return { full_name: account.full_name.trim(), email: account.email.trim().toLowerCase(),
    phone: account.phone.trim(), password: account.password,
    role: v.choice(role, ["MANAGER", "ADMIN"]) };
};

const SETTING_KEYS = ["shop_name", "contact_email", "contact_phone", "shop_address",
  "shipping_note", "return_policy"];

const settingsBody = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body) || !Object.keys(body).length ||
      Object.keys(body).some((key) => !SETTING_KEYS.includes(key))) {
    fail(400, "Chỉ nhận các khóa cấu hình đã công bố");
  }

  return Object.fromEntries(Object.entries(body).map(([key, value]) => {
    if (typeof value !== "string" || [...value].length > 2000) {
      fail(400, `${key} phải là chuỗi tối đa 2000 ký tự`);
    }

    return [key, value.trim()];
  }));
};

module.exports = { userQuery, roleBody, statusBody, staffBody, settingsBody, SETTING_KEYS };
