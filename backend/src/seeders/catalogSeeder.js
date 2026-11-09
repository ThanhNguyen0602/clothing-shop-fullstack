const pool = require("../config/database");
const categories = require("../models/categoryModel");
const products = require("../models/productModel");
const withTransaction = require("../utils/withTransaction");
const { categoryBody, productBody } = require("../utils/catalogValidation");

const categorySeeds = [
  { name: "Điện thoại", slug: "dien-thoai" },
  { name: "Laptop", slug: "laptop" },
  { name: "Phụ kiện", slug: "phu-kien" }
];

const productSeeds = [
  { sku: "DEMO-PHONE-01", name: "Điện thoại mẫu 01", slug: "dien-thoai-mau-01",
    category: "dien-thoai", original: "15000000.00", sale: "14000000.00",
    stock: 12, status: "ACTIVE" },
  { sku: "DEMO-PHONE-02", name: "Điện thoại mẫu 02", slug: "dien-thoai-mau-02",
    category: "dien-thoai", original: "9000000.00", sale: "9000000.00",
    stock: 0, status: "ACTIVE" },
  { sku: "DEMO-LAPTOP-01", name: "Laptop mẫu 01", slug: "laptop-mau-01",
    category: "laptop", original: "20000000.00", sale: "18500000.00",
    stock: 5, status: "ACTIVE" },
  { sku: "DEMO-ACC-01", name: "Tai nghe mẫu", slug: "tai-nghe-mau",
    category: "phu-kien", original: "500000.00", sale: "450000.00",
    stock: 20, status: "INACTIVE" },
  { sku: "DEMO-ACC-02", name: "Sạc mẫu", slug: "sac-mau",
    category: "phu-kien", original: "300000.00", sale: "300000.00",
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
            ...item, status: "ACTIVE", display_order: index
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
          images: ["https://placehold.co/800x600/png"]
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
