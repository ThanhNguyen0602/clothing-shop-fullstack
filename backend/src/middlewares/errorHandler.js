const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const send = (status, message) => res.status(status).json({
    success: false, message
  });

  if (err.type === "entity.parse.failed") {
    return send(400, "JSON không hợp lệ");
  }

  if (err.name === "MulterError") {
    return send(400, err.code === "LIMIT_FILE_SIZE"
      ? "Ảnh tối đa 5 MB" : "Chỉ gửi một ảnh trong trường image");
  }

  if (err.code === "ER_DUP_ENTRY") {
    return send(409, "Giá trị duy nhất đã tồn tại: kiểm tra email, phone, SKU, slug");
  }

  if (err.code === "ER_ROW_IS_REFERENCED_2") {
    return send(409, "Dữ liệu đang được tham chiếu, không thể xóa");
  }

  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    return send(400, "Dữ liệu tham chiếu không tồn tại");
  }

  if (Number.isInteger(err.statusCode) &&
    err.statusCode >= 400 && err.statusCode < 500) {
    return send(err.statusCode, err.message);
  }

  if (["ER_LOCK_DEADLOCK", "ER_LOCK_WAIT_TIMEOUT"].includes(err.code)) {
    return res.status(503).json({ success: false,
      message: "Dữ liệu đang được xử lý, hãy kiểm tra lại trước khi thử lại" });
  }

  console.error(err);

  return send(500, "Lỗi hệ thống");
};

module.exports = errorHandler;
