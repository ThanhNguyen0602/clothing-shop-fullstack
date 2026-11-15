const pool = require("../config/database");
const products = require("../models/productModel");
const withTransaction = require("../utils/withTransaction");
const { sampleImages, categoryImage, isSampleOrPlaceholder } = require("./sampleImages");

// Thay anh placehold.co (anh xam) bang anh minh hoa quan ao trong backend/public/samples.
// Chi doi san pham co TOAN BO anh la anh mau; anh Manager tu upload duoc giu nguyen.
const run = async () => {
  try {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Không chạy script dữ liệu mẫu trên production");
    }

    const result = await withTransaction(async (db) => {
      const done = { categories: 0, products: 0 };
      const [categories] = await db.execute("SELECT id, slug, image_url FROM categories");

      for (const category of categories) {
        if (!isSampleOrPlaceholder(category.image_url)) continue;
        await db.execute("UPDATE categories SET image_url = ? WHERE id = ?",
          [categoryImage(category.slug), category.id]);
        done.categories += 1;
      }

      const [rows] = await db.execute(`SELECT p.id, p.sku, c.slug FROM products p
        JOIN categories c ON c.id = p.category_id ORDER BY p.id`);

      for (const row of rows) {
        const [images] = await db.execute(
          "SELECT image_url FROM product_images WHERE product_id = ?", [row.id]);

        if (!images.every((image) => isSampleOrPlaceholder(image.image_url))) continue;
        const urls = sampleImages(row.slug, row.sku);
        await products.replaceImages(row.id, urls, db);
        await db.execute("UPDATE products SET thumbnail = ? WHERE id = ?", [urls[0], row.id]);
        done.products += 1;
      }

      return done;
    });

    console.log("Đã cập nhật ảnh minh họa:", result);
  } catch (error) {
    console.error("Cập nhật ảnh thất bại:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

run();
