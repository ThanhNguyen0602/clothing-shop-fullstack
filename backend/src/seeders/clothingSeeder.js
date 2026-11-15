const pool = require("../config/database");
const categories = require("../models/categoryModel");
const products = require("../models/productModel");
const withTransaction = require("../utils/withTransaction");
const { categoryBody, productBody } = require("../utils/catalogValidation");
const { sampleImages, categoryImage } = require("./sampleImages");

// Du lieu demo cua hang quan ao: 6 danh muc, 4 thuong hieu tu dat ten, 20 san pham.
// Tim danh muc theo slug, thuong hieu theo name, san pham theo SKU; ban ghi da co
// duoc giu nguyen (gia, ton kho, trang thai, anh) nen chay lai khong tao trung.

const categorySeeds = [
  ["Áo thun", "ao-thun", "Áo thun cotton, polo và áo thun form rộng"],
  ["Áo sơ mi", "ao-so-mi", "Sơ mi công sở, sơ mi linen và sơ mi họa tiết"],
  ["Áo khoác", "ao-khoac", "Áo khoác gió, hoodie, blazer và cardigan"],
  ["Quần jeans", "quan-jeans", "Quần jeans slim, straight và ống rộng"],
  ["Quần kaki & short", "quan-kaki-short", "Quần kaki, quần tây và quần short"],
  ["Váy đầm", "vay-dam", "Đầm suông, chân váy và đầm dự tiệc"]
];

const brandSeeds = [
  ["GreenWear", "Thời trang cơ bản hằng ngày"],
  ["Saigon Denim", "Chuyên dòng denim và kaki"],
  ["Lotus Basic", "Đồ mặc nhà và đồ tối giản"],
  ["Mây Studio", "Thiết kế nữ tính, chất liệu nhẹ"]
];

// sku, ten, danh muc, thuong hieu, gia goc, gia ban, ton kho, mo ta
const samples = [
  ["CL-TEE-001", "Áo thun cotton cổ tròn trắng", "ao-thun", "GreenWear",
    "199000.00", "159000.00", 42, "Cotton 100%, size S–XXL. Form regular, thấm hút tốt."],
  ["CL-TEE-002", "Áo thun oversize đen in chữ", "ao-thun", "Lotus Basic",
    "249000.00", "249000.00", 30, "Cotton pha 5% spandex, size M–XL. Form rộng unisex."],
  ["CL-TEE-003", "Áo polo pique xanh navy", "ao-thun", "GreenWear",
    "329000.00", "279000.00", 18, "Vải cá sấu pique, cổ bẻ, size S–XXL."],
  ["CL-TEE-004", "Áo thun gân nữ ôm body", "ao-thun", "Mây Studio",
    "179000.00", "179000.00", 0, "Thun gân co giãn 4 chiều, màu be, size S–L."],
  ["CL-SHI-001", "Sơ mi trắng công sở tay dài", "ao-so-mi", "GreenWear",
    "389000.00", "349000.00", 25, "Kate lụa chống nhăn, size 38–43."],
  ["CL-SHI-002", "Sơ mi linen cổ tàu màu kem", "ao-so-mi", "Lotus Basic",
    "459000.00", "399000.00", 12, "Linen tự nhiên thoáng mát, size M–XL."],
  ["CL-SHI-003", "Sơ mi caro flannel đỏ", "ao-so-mi", "Saigon Denim",
    "419000.00", "419000.00", 9, "Flannel dày dặn, phù hợp mặc khoác ngoài, size M–XXL."],
  ["CL-JAC-001", "Áo khoác gió chống nước", "ao-khoac", "GreenWear",
    "599000.00", "499000.00", 15, "Vải dù 2 lớp, có mũ, chống nước nhẹ, size M–XXL."],
  ["CL-JAC-002", "Hoodie nỉ bông xám tro", "ao-khoac", "Lotus Basic",
    "449000.00", "389000.00", 22, "Nỉ bông 320gsm, túi kangaroo, size S–XL."],
  ["CL-JAC-003", "Blazer nữ dáng suông", "ao-khoac", "Mây Studio",
    "890000.00", "790000.00", 6, "Tuytsi cao cấp, lót trong, màu đen, size S–L."],
  ["CL-JAC-004", "Áo khoác jeans wash nhạt", "ao-khoac", "Saigon Denim",
    "650000.00", "650000.00", 0, "Denim 12oz, wash xanh nhạt, size M–XL."],
  ["CL-JEA-001", "Quần jeans slim fit xanh đậm", "quan-jeans", "Saigon Denim",
    "549000.00", "469000.00", 28, "Denim co giãn nhẹ, size 28–34."],
  ["CL-JEA-002", "Quần jeans ống rộng nữ", "quan-jeans", "Mây Studio",
    "520000.00", "520000.00", 14, "Lưng cao, ống suông rộng, size 25–30."],
  ["CL-JEA-003", "Quần jeans straight đen", "quan-jeans", "Saigon Denim",
    "579000.00", "499000.00", 11, "Denim không phai màu, form đứng, size 29–36."],
  ["CL-KAK-001", "Quần kaki chinos be", "quan-kaki-short", "Saigon Denim",
    "429000.00", "379000.00", 20, "Kaki cotton co giãn, form slim, size 29–34."],
  ["CL-KAK-002", "Quần short kaki nam", "quan-kaki-short", "GreenWear",
    "259000.00", "219000.00", 35, "Dài trên gối, 4 túi, size 29–34."],
  ["CL-KAK-003", "Quần tây ống đứng xám", "quan-kaki-short", "Lotus Basic",
    "489000.00", "489000.00", 8, "Vải tuyết mưa ít nhăn, size 28–34."],
  ["CL-DRS-001", "Đầm suông hoa nhí", "vay-dam", "Mây Studio",
    "459000.00", "369000.00", 16, "Voan lụa 2 lớp, dáng suông qua gối, size S–L."],
  ["CL-DRS-002", "Chân váy chữ A công sở", "vay-dam", "Mây Studio",
    "299000.00", "299000.00", 24, "Tuytsi đứng form, có lót, size S–L."],
  ["CL-DRS-003", "Đầm dự tiệc satin xanh rêu", "vay-dam", "Mây Studio",
    "990000.00", "850000.00", 4, "Satin cao cấp, cổ vuông, dài midi, size S–M."]
];


const seedClothing = async () => {
  try {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Không chạy seeder demo trên production");
    }

    const counts = await withTransaction(async (db) => {
      const created = { categories: 0, brands: 0, products: 0 };
      const categoryIds = new Map();
      const brandIds = new Map();

      for (const [index, [name, slug, description]] of categorySeeds.entries()) {
        const [rows] = await db.execute(
          "SELECT id FROM categories WHERE slug = ?", [slug]);

        let id = rows[0]?.id;

        if (!id) {
          id = await categories.insert(categoryBody({
            name, slug, description, image_url: categoryImage(slug),
            status: "ACTIVE", display_order: 10 + index
          }), db);
          created.categories += 1;
        }

        categoryIds.set(slug, id);
      }

      for (const [name, description] of brandSeeds) {
        const [rows] = await db.execute(
          "SELECT id FROM brands WHERE name = ?", [name]);

        let id = rows[0]?.id;

        if (!id) {
          const [result] = await db.execute(
            "INSERT INTO brands (name, description, status) VALUES (?, ?, 'ACTIVE')",
            [name, description]);
          id = result.insertId;
          created.brands += 1;
        }

        brandIds.set(name, id);
      }

      for (const sample of samples) {
        const [sku, name, category, brand, original, sale, stock, description] = sample;
        const [rows] = await db.execute(
          "SELECT id FROM products WHERE sku = ?", [sku]);

        if (rows.length) continue;

        const data = productBody({
          category_id: categoryIds.get(category), brand_id: brandIds.get(brand),
          sku, name, slug: sku.toLowerCase(), short_description: description.split(".")[0],
          description, original_price: original, sale_price: sale,
          stock_quantity: stock, status: "ACTIVE", images: sampleImages(category, sku)
        });

        const id = await products.insert(data, db);

        await products.replaceImages(id, data.images, db);
        created.products += 1;
      }

      return created;
    });

    console.log("Seed quần áo thành công:", counts);
  } catch (error) {
    console.error("Seed thất bại:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

seedClothing();
