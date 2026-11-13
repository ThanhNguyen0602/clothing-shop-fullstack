const pool = require("../config/database");
const categories = require("../models/categoryModel");
const products = require("../models/productModel");
const withTransaction = require("../utils/withTransaction");
const { categoryBody, productBody } = require("../utils/catalogValidation");

const categorySeeds = [
  ["B5 Điện thoại", "b5-dien-thoai", "ACTIVE"],
  ["B5 Laptop", "b5-laptop", "ACTIVE"],
  ["B5 Phụ kiện", "b5-phu-kien", "ACTIVE"],
  ["B5 Danh mục ẩn", "b5-danh-muc-an", "INACTIVE"]
];

// sku, name, category slug, brand name, original, sale, stock, status
const samples = [
  ["B5-PHONE-01", "B5 Điện thoại A1", "b5-dien-thoai", "B5 Aurora",
    "5000000.00", "4500000.00", 5, "ACTIVE"],
  ["B5-PHONE-02", "B5 Điện thoại N1", "b5-dien-thoai", "B5 Nova",
    "7000000.00", "7000000.00", 0, "ACTIVE"],
  ["B5-PHONE-03", "B5 Điện thoại A2", "b5-dien-thoai", "B5 Aurora",
    "10000000.00", "9000000.00", 8, "ACTIVE"],
  ["B5-PHONE-04", "B5 Điện thoại N2", "b5-dien-thoai", "B5 Nova",
    "12000000.00", "11000000.00", 2, "ACTIVE"],
  ["B5-LAPTOP-01", "B5 Laptop A1", "b5-laptop", "B5 Aurora",
    "15000000.00", "14000000.00", 3, "ACTIVE"],
  ["B5-LAPTOP-02", "B5 Laptop N1", "b5-laptop", "B5 Nova",
    "20000000.00", "18000000.00", 0, "ACTIVE"],
  ["B5-LAPTOP-03", "B5 Laptop A2", "b5-laptop", "B5 Aurora",
    "18000000.00", "18000000.00", 7, "ACTIVE"],
  ["B5-LAPTOP-04", "B5 Laptop N2", "b5-laptop", "B5 Nova",
    "25000000.00", "24000000.00", 4, "ACTIVE"],
  ["B5-ACC-01", "B5 Chuột A1", "b5-phu-kien", "B5 Aurora",
    "300000.00", "250000.00", 20, "ACTIVE"],
  ["B5-ACC-02", "B5 Tai nghe N1", "b5-phu-kien", "B5 Nova",
    "500000.00", "500000.00", 0, "ACTIVE"],
  ["B5-ACC-03", "B5 Bàn phím A1", "b5-phu-kien", "B5 Aurora",
    "1000000.00", "800000.00", 10, "ACTIVE"],
  ["B5-ACC-04", "B5 Đế laptop", "b5-phu-kien", null,
    "800000.00", "800000.00", 6, "ACTIVE"],
  ["B5-HIDDEN-01", "B5 Sản phẩm ẩn", "b5-phu-kien", "B5 Aurora",
    "100000.00", "90000.00", 1, "INACTIVE"],
  ["B5-STOP-01", "B5 Ngừng kinh doanh", "b5-phu-kien", "B5 Nova",
    "100000.00", "90000.00", 1, "DISCONTINUED"],
  ["B5-HIDDENCAT-01", "B5 Thuộc danh mục ẩn", "b5-danh-muc-an", "B5 Aurora",
    "100000.00", "90000.00", 1, "ACTIVE"]
];

const seedSearch = async () => {
  try {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Không chạy seeder demo trên production");
    }

    const counts = await withTransaction(async (db) => {
      const categoryIds = new Map();
      const brandIds = new Map();
      const created = { categories: 0, brands: 0, products: 0 };

      for (const [index, [name, slug, status]] of categorySeeds.entries()) {
        const [rows] = await db.execute(
          "SELECT id FROM categories WHERE slug = ?", [slug]
        );

        let id = rows[0]?.id;

        if (!id) {
          id = await categories.insert(categoryBody({
            name, slug, status, display_order: index
          }), db);
          created.categories += 1;
        }

        categoryIds.set(slug, id);
      }

      for (const name of ["B5 Aurora", "B5 Nova"]) {
        const [rows] = await db.execute(
          "SELECT id FROM brands WHERE name = ?", [name]
        );

        let id = rows[0]?.id;

        if (!id) {
          const [result] = await db.execute(
            "INSERT INTO brands (name, status) VALUES (?, 'ACTIVE')", [name]
          );
          id = result.insertId;
          created.brands += 1;
        }

        brandIds.set(name, id);
      }

      for (const [index, sample] of samples.entries()) {
        const [sku, name, category, brand, original, sale, stock, status] = sample;
        const [rows] = await db.execute(
          "SELECT id FROM products WHERE sku = ?", [sku]
        );

        if (rows.length) continue;

        const data = productBody({
          category_id: categoryIds.get(category),
          brand_id: brand === null ? null : brandIds.get(brand),
          sku, name, slug: sku.toLowerCase(), original_price: original,
          sale_price: sale, stock_quantity: stock, status,
          images: ["https://placehold.co/800x600/png"]
        });

        const id = await products.insert(data, db);
        await products.replaceImages(id, data.images, db);

        // Moc co dinh de kiem tra sap xep newest; chi gan cho ban ghi vua tao.
        const day = String(index + 1).padStart(2, "0");
        await db.execute("UPDATE products SET created_at = ? WHERE id = ?",
          [`2026-01-${day} 10:00:00`, id]);
        created.products += 1;
      }

      return created;
    });

    console.log("Seed bộ lọc thành công:", counts);
  } catch (error) {
    console.error("Seed thất bại:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

seedSearch();
