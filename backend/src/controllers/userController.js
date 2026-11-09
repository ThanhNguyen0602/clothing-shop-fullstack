const users = require("../models/userModel");
const { validProfile } = require("../utils/authValidation");

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

module.exports = { getMe, updateMe };
