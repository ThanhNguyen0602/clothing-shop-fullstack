const fs = require("fs");
const path = require("path");
const products = require("../models/productModel");
const images = require("../models/productImageModel");
const withTransaction = require("../utils/withTransaction");
const { fail } = require("../utils/catalogHelpers");
const { uploadDir } = require("../middlewares/upload");

const signatures = [
  (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP"
];

const unlinkQuietly = (file) => fs.promises.unlink(file).catch(() => {});

// Chi xoa file nam trong thu muc upload cua du an; URL ngoai (placehold.co) giu nguyen.
const localFile = (url) => {
  const marker = "/uploads/products/";
  const index = url.indexOf(marker);

  return index === -1 ? null : path.join(uploadDir, path.basename(url.slice(index + marker.length)));
};

const realImage = async (file) => {
  const handle = await fs.promises.open(file, "r");

  try {
    const buffer = Buffer.alloc(12);
    await handle.read(buffer, 0, 12, 0);

    return signatures.some((check) => check(buffer));
  } finally {
    await handle.close();
  }
};

const add = async (productId, file, origin) => {
  if (!file) fail(400, "Chưa chọn ảnh (trường image)");

  try {
    if (!await realImage(file.path)) fail(400, "Nội dung file không phải ảnh hợp lệ");

    return await withTransaction(async (db) => {
      if (!await products.lock(productId, db)) fail(404, "Không tìm thấy sản phẩm");

      const current = await images.list(db, productId);

      if (current.length >= 10) fail(409, "Mỗi sản phẩm tối đa 10 ảnh");

      const url = `${origin}/uploads/products/${file.filename}`;

      await images.insert(db, productId, url, current.length === 0, current.length);

      if (current.length === 0) await images.setThumbnail(db, productId, url);

      return products.find(productId, true, db);
    });
  } catch (error) {
    await unlinkQuietly(file.path);
    throw error;
  }
};

const remove = async (productId, imageId) => {
  let removedUrl = null;

  const data = await withTransaction(async (db) => {
    if (!await products.lock(productId, db)) fail(404, "Không tìm thấy sản phẩm");

    const current = await images.list(db, productId);
    const target = current.find((item) => item.id === imageId);

    if (!target) fail(404, "Không tìm thấy ảnh của sản phẩm");

    await images.remove(db, imageId);

    const rest = current.filter((item) => item.id !== imageId);

    await images.reorder(db, productId, rest.map((item) => item.id));
    await images.setThumbnail(db, productId, rest[0]?.image_url ?? null);
    removedUrl = target.image_url;

    return products.find(productId, true, db);
  });

  const file = localFile(removedUrl);

  if (file) await unlinkQuietly(file);

  return data;
};

const setPrimary = (productId, imageId) => withTransaction(async (db) => {
  if (!await products.lock(productId, db)) fail(404, "Không tìm thấy sản phẩm");

  const current = await images.list(db, productId);
  const target = current.find((item) => item.id === imageId);

  if (!target) fail(404, "Không tìm thấy ảnh của sản phẩm");

  await images.reorder(db, productId,
    [imageId, ...current.filter((item) => item.id !== imageId).map((item) => item.id)]);
  await images.setThumbnail(db, productId, target.image_url);

  return products.find(productId, true, db);
});

module.exports = { add, remove, setPrimary, localFile };
