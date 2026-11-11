const fail = (statusCode, message) => {
  throw Object.assign(new Error(message), { statusCode });
};

const asyncRoute = (handler) => (req, res, next) => {
  Promise.resolve().then(() => handler(req, res)).catch(next);
};

const parseId = (value) => {
  const text = String(value);

  if (!/^[1-9]\d*$/.test(text) || Number(text) > 2147483647) {
    fail(400, "ID phải là số nguyên dương hợp lệ");
  }

  return Number(text);
};

module.exports = { fail, asyncRoute, parseId };
