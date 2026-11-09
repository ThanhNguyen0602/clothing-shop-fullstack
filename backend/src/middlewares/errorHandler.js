const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const send = (status, message) => res.status(status).json({
    success: false, message
  });

  if (err.type === "entity.parse.failed") {
    return send(400, "JSON không hợp lệ");
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

  console.error(err);

  return send(500, "Lỗi hệ thống");
};

module.exports = errorHandler;
