const pool = require("../config/database");
const categories = require("../models/categoryModel");
const products = require("../models/productModel");
const withTransaction = require("../utils/withTransaction");
const { categoryBody, productBody } = require("../utils/catalogValidation");
const { sampleImages, categoryImage } = require("./sampleImages");

// Du lieu mau buoi 04 (chi thoi trang). Giu 5 SKU DEMO-* voi du trang thai
// ACTIVE / het hang / INACTIVE / DISCONTINUED de kiem tra API cong khai va quan ly.
// Dung chung danh muc voi seed:clothing (tim theo slug, co roi thi dung lai).
const categorySeeds = [
  { name: "Áo thun", slug: "ao-thun" },
  { name: "Quần jeans", slug: "quan-jeans" },
  { name: "Phụ kiện", slug: "phu-kien-thoi-trang" }
];

const productSeeds = [
  { sku: "DEMO-TEE-01", name: "Áo thun basic xám", slug: "ao-thun-mau-01",
    category: "ao-thun", original: "250000.00", sale: "220000.00",
    stock: 12, status: "ACTIVE" },
  { sku: "DEMO-TEE-02", name: "Áo thun basic đen", slug: "ao-thun-mau-02",
    category: "ao-thun", original: "180000.00", sale: "180000.00",
    stock: 0, status: "ACTIVE" },
  { sku: "DEMO-PANT-01", name: "Quần jeans baggy xanh", slug: "quan-jeans-mau-01",
    category: "quan-jeans", original: "450000.00", sale: "399000.00",
    stock: 5, status: "ACTIVE" },
  { sku: "DEMO-ACC-01", name: "Mũ lưỡi trai kaki", slug: "mu-luoi-trai-mau",
    category: "phu-kien-thoi-trang", original: "150000.00", sale: "120000.00",
    stock: 20, status: "INACTIVE" },
  { sku: "DEMO-ACC-02", name: "Thắt lưng da nâu", slug: "that-lung-da-mau",
    category: "phu-kien-thoi-trang", original: "200000.00", sale: "200000.00",
    stock: 10, status: "DISCONTINUED" }
];

const seedCatalog = async () => {
  try {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Không seed dữ liệu demo trên production");
    }

    const counts = await withTransaction(async (db) => {
      let categoryCount = 0;
      let productCount = 0;
      const categoryIds = new Map();

      for (const [index, item] of categorySeeds.entries()) {
        const [rows] = await db.execute(
          "SELECT id FROM categories WHERE slug = ?", [item.slug]
        );
        let id = rows[0]?.id;

        if (!id) {
          id = await categories.insert(categoryBody({
            ...item, image_url: categoryImage(item.slug), status: "ACTIVE",
            display_order: index
          }), db);
          categoryCount += 1;
        }

        categoryIds.set(item.slug, id);
      }

      for (const item of productSeeds) {
        const [rows] = await db.execute(
          "SELECT id FROM products WHERE sku = ?", [item.sku]
        );

        if (rows.length) continue;

        const data = productBody({
          category_id: categoryIds.get(item.category),
          sku: item.sku, name: item.name, slug: item.slug,
          original_price: item.original, sale_price: item.sale,
          stock_quantity: item.stock, status: item.status,
          images: sampleImages(item.category, item.sku)
        });
        const id = await products.insert(data, db);

        await products.replaceImages(id, data.images, db);
        productCount += 1;
      }

      return { categoryCount, productCount };
    });

    console.log("Seed danh mục và sản phẩm thành công:", counts);
  } catch (error) {
    console.error("Seed thất bại:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

seedCatalog();
