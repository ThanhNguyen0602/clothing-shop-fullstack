const jwt = require("jsonwebtoken");
const users = require("../models/userModel");

const requireAuth = async (req, res, next) => {
  const header = req.get("Authorization") || "";
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  const unauthorized = () => res.status(401).json({
    success: false, message: "Token thiếu, không hợp lệ hoặc hết hạn"
  });

  if (!match) return unauthorized();

  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    return next(new Error("Invalid JWT_SECRET"));
  }

  let payload;
  try {
    payload = jwt.verify(match[1], secret, { algorithms: ["HS256"] });
  } catch (error) { return unauthorized(); }

  const id = Number(payload.sub);
  if (!Number.isSafeInteger(id) || id <= 0) return unauthorized();

  try {
    const user = await users.findById(id);
    if (!user) return unauthorized();

    if (user.status !== "ACTIVE") {
      return res.status(403).json({ success: false,
        message: "Tài khoản không được phép truy cập" });
    }

    req.user = user;
    return next();
  } catch (error) { return next(error); }
};

module.exports = requireAuth;
