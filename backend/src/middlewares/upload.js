const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const multer = require("multer");

const uploadDir = path.join(__dirname, "../../uploads/products");
const types = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${randomUUID()}${types[file.mimetype]}`)
});

const fileFilter = (req, file, cb) => {
  if (!types[file.mimetype]) {
    return cb(Object.assign(new Error("Chỉ nhận ảnh JPG, PNG hoặc WEBP"), { statusCode: 400 }));
  }

  return cb(null, true);
};

// Mot anh moi lan, toi da 5 MB; ten file do server sinh, khong dung ten tu client.
const uploadProductImage = multer({ storage, fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 } }).single("image");

module.exports = { uploadProductImage, uploadDir };
