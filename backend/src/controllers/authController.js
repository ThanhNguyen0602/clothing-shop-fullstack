const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const users = require("../models/userModel");
const v = require("../utils/authValidation");

const register = async (req, res, next) => {
  try {
    if (!v.validRegister(req.body)) {
      return res.status(400).json({ success: false,
        message: "Kiểm tra họ tên, email, điện thoại và mật khẩu" });
    }

    const data = {
      full_name: req.body.full_name.trim(),
      email: req.body.email.trim().toLowerCase(),
      phone: req.body.phone.trim()
    };

    const hash = await bcrypt.hash(req.body.password, 12);
    const user = await users.createCustomer(data, hash);

    return res.status(201).json({ success: true, data: user });
  } catch (error) { next(error); }
};

const login = async (req, res, next) => {
  try {
    if (!v.validLogin(req.body)) {
      return res.status(400).json({ success: false,
        message: "Email hoặc mật khẩu không đúng định dạng" });
    }

    const user = await users.findForLogin(
      req.body.email.trim().toLowerCase());
    const matches = user && await bcrypt.compare(
      req.body.password, user.password_hash);

    if (!matches) {
      return res.status(401).json({ success: false,
        message: "Email hoặc mật khẩu không đúng" });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({ success: false,
        message: "Tài khoản không được phép truy cập" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret || Buffer.byteLength(secret) < 32) {
      throw new Error("JWT_SECRET must contain at least 32 bytes");
    }

    const accessToken = jwt.sign({}, secret, {
      algorithm: "HS256", subject: String(user.id), expiresIn: "1h"
    });

    const { password_hash, ...profile } = user;

    return res.json({ success: true,
      data: { accessToken, tokenType: "Bearer",
        expiresIn: 3600, user: profile } });
  } catch (error) { next(error); }
};

module.exports = { register, login };
