const isObject = (v) => v !== null &&
  typeof v === "object" && !Array.isArray(v);

const onlyKeys = (v, keys) => isObject(v) &&
  Object.keys(v).every((key) => keys.includes(key));

const validName = (v) => typeof v === "string" &&
  v.trim().length > 0 && v.trim().length <= 100;

const validEmail = (v) => typeof v === "string" &&
  v.trim().length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const validPhone = (v) => typeof v === "string" &&
  /^\+?[0-9]{10,15}$/.test(v.trim());

const validPassword = (v) => typeof v === "string" &&
  v.length >= 8 && Buffer.byteLength(v, "utf8") <= 72;

const validRegister = (b) =>
  onlyKeys(b, ["full_name", "email", "phone", "password"]) &&
  validName(b.full_name) && validEmail(b.email) &&
  validPhone(b.phone) && validPassword(b.password);

const validLogin = (b) => onlyKeys(b, ["email", "password"]) &&
  validEmail(b.email) && validPassword(b.password);

const validProfile = (b) => onlyKeys(b, ["full_name", "phone"]) &&
  validName(b.full_name) &&
  (b.phone === null || validPhone(b.phone));

module.exports = { validRegister, validLogin, validProfile };
