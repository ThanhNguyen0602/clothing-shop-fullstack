const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false,
      message: "Cần đăng nhập" });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false,
      message: "Không đủ quyền truy cập" });
  }

  return next();
};

module.exports = authorize;
