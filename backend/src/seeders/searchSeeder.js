const pool = require("../config/database");
const categories = require("../models/categoryModel");
const products = require("../models/productModel");
const withTransaction = require("../utils/withTransaction");
const { categoryBody, productBody } = require("../utils/catalogValidation");
const { sampleImages, categoryImage } = require("./sampleImages");

// Du lieu kiem tra tim kiem/loc buoi 05 (chi thoi trang).
// 15 san pham SKU B5-*: 12 cong khai, 1 INACTIVE, 1 DISCONTINUED, 1 thuoc danh muc an.
// Nam chung danh muc that cua cua hang; Postman loc bang search=B5 (khop SKU).
const categorySeeds = [
  ["Áo khoác", "ao-khoac", "ACTIVE"],
  ["Quần jeans", "quan-jeans", "ACTIVE"],
  ["Phụ kiện", "phu-kien-thoi-trang", "ACTIVE"],
  ["Danh mục tạm ẩn", "b5-danh-muc-an", "INACTIVE"]
];

// sku, name, category slug, brand name, original, sale, stock, status
const samples = [
  ["B5-AO-01", "Áo khoác bomber đen", "ao-khoac", "B5 Aurora",
    "500000.00", "450000.00", 5, "ACTIVE"],
  ["B5-AO-02", "Áo khoác dù xanh rêu", "ao-khoac", "B5 Nova",
    "700000.00", "700000.00", 0, "ACTIVE"],
  ["B5-AO-03", "Áo khoác da lộn nâu", "ao-khoac", "B5 Aurora",
    "1000000.00", "900000.00", 8, "ACTIVE"],
  ["B5-AO-04", "Áo măng tô dạ xám", "ao-khoac", "B5 Nova",
    "1200000.00", "1100000.00", 2, "ACTIVE"],
  ["B5-QUAN-01", "Quần jeans wash bạc", "quan-jeans", "B5 Aurora",
    "1500000.00", "1400000.00", 3, "ACTIVE"],
  ["B5-QUAN-02", "Quần jeans selvedge", "quan-jeans", "B5 Nova",
    "2000000.00", "1800000.00", 0, "ACTIVE"],
  ["B5-QUAN-03", "Quần jeans rách gối", "quan-jeans", "B5 Aurora",
    "1800000.00", "1800000.00", 7, "ACTIVE"],
  ["B5-QUAN-04", "Quần jeans raw denim", "quan-jeans", "B5 Nova",
    "2500000.00", "2400000.00", 4, "ACTIVE"],
  ["B5-ACC-01", "Tất cổ ngắn cotton", "phu-kien-thoi-trang", "B5 Aurora",
    "30000.00", "25000.00", 20, "ACTIVE"],
  ["B5-ACC-02", "Khăn tay họa tiết", "phu-kien-thoi-trang", "B5 Nova",
    "50000.00", "50000.00", 0, "ACTIVE"],
  ["B5-ACC-03", "Mũ lưỡi trai trơn", "phu-kien-thoi-trang", "B5 Aurora",
    "100000.00", "80000.00", 10, "ACTIVE"],
  ["B5-ACC-04", "Thắt lưng vải dù", "phu-kien-thoi-trang", null,
    "80000.00", "80000.00", 6, "ACTIVE"],
  ["B5-HIDDEN-01", "Túi tote (tạm ẩn)", "phu-kien-thoi-trang", "B5 Aurora",
    "10000.00", "9000.00", 1, "INACTIVE"],
  ["B5-STOP-01", "Ví vải (ngừng bán)", "phu-kien-thoi-trang", "B5 Nova",
    "10000.00", "9000.00", 1, "DISCONTINUED"],
  ["B5-HIDDENCAT-01", "Khẩu trang vải (danh mục ẩn)", "b5-danh-muc-an", "B5 Aurora",
    "10000.00", "9000.00", 1, "ACTIVE"]
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
            name, slug, status, display_order: index,
            image_url: categoryImage(slug)
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
          images: sampleImages(category, sku)
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
