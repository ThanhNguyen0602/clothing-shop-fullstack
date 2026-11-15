const bcrypt = require("bcrypt");
const users = require("../models/userModel");
const { validProfile, validPasswordChange } = require("../utils/authValidation");

const getMe = (req, res) => res.json({
  success: true, data: req.user
});

const updateMe = async (req, res, next) => {
  try {
    if (!validProfile(req.body)) {
      return res.status(400).json({ success: false,
        message: "Chỉ nhận full_name và phone hợp lệ" });
    }

    const user = await users.updateProfile(req.user.id, {
      full_name: req.body.full_name.trim(),
      phone: req.body.phone === null ? null : req.body.phone.trim()
    });

    if (!user) {
      return res.status(401).json({ success: false,
        message: "Tài khoản không còn tồn tại" });
    }

    return res.json({ success: true, data: user });
  } catch (error) { next(error); }
};

// Token dang dung van hop le den khi het han (JWT khong luu trang thai); giao dien dang xuat lai.
const changePassword = async (req, res, next) => {
  try {
    if (!validPasswordChange(req.body)) {
      return res.status(400).json({ success: false,
        message: "Mật khẩu 8–72 byte, mật khẩu mới phải khác mật khẩu hiện tại" });
    }

    const hash = await users.findHash(req.user.id);

    if (!hash || !await bcrypt.compare(req.body.current_password, hash)) {
      return res.status(400).json({ success: false,
        message: "Mật khẩu hiện tại không đúng" });
    }

    await users.updatePassword(req.user.id, await bcrypt.hash(req.body.new_password, 12));

    return res.json({ success: true, message: "Đã đổi mật khẩu" });
  } catch (error) { next(error); }
};

module.exports = { getMe, updateMe, changePassword };
