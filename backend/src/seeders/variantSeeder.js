const pool = require("../config/database");
const variants = require("../models/variantModel");
const withTransaction = require("../utils/withTransaction");
const { variantBody } = require("../utils/catalogValidation");

// Chay sau npm run migrate va npm run seed:clothing. Chi tao bien the cho san pham CL-*
// chua co bien the nao; ton kho hien co duoc chia deu cho cac bien the (tong khong doi).

const TOPS = ["S", "M", "L", "XL"];
const JEANS = ["29", "30", "31", "32"];
const DRESS = ["S", "M", "L"];

// sku: [mau..., bo size, chenh lech gia cho size lon nhat]
const plan = {
  "CL-TEE-001": [["Trắng", "Đen"], TOPS, "20000.00"],
  "CL-TEE-002": [["Đen"], TOPS, "0.00"],
  "CL-TEE-003": [["Xanh navy", "Trắng"], TOPS, "20000.00"],
  "CL-TEE-004": [["Be"], DRESS, "0.00"],
  "CL-SHI-001": [["Trắng"], TOPS, "30000.00"],
  "CL-SHI-002": [["Kem", "Xanh nhạt"], TOPS, "0.00"],
  "CL-SHI-003": [["Đỏ caro"], TOPS, "0.00"],
  "CL-JAC-001": [["Đen", "Xanh rêu"], TOPS, "50000.00"],
  "CL-JAC-002": [["Xám tro"], TOPS, "30000.00"],
  "CL-JAC-003": [["Đen"], DRESS, "0.00"],
  "CL-JAC-004": [["Xanh nhạt"], TOPS, "0.00"],
  "CL-JEA-001": [["Xanh đậm"], JEANS, "0.00"],
  "CL-JEA-002": [["Xanh nhạt"], ["25", "26", "27", "28"], "0.00"],
  "CL-JEA-003": [["Đen"], JEANS, "20000.00"],
  "CL-KAK-001": [["Be", "Xám"], JEANS, "0.00"],
  "CL-KAK-002": [["Be", "Đen"], JEANS, "0.00"],
  "CL-KAK-003": [["Xám"], JEANS, "0.00"],
  "CL-DRS-001": [["Hoa nhí xanh"], DRESS, "0.00"],
  "CL-DRS-002": [["Đen", "Be"], DRESS, "0.00"],
  "CL-DRS-003": [["Xanh rêu"], ["S", "M"], "0.00"]
};

const seedVariants = async () => {
  try {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Không chạy seeder demo trên production");
    }

    const counts = await withTransaction(async (db) => {
      const created = { products: 0, variants: 0 };

      for (const [sku, [colors, sizes, bigSizeExtra]] of Object.entries(plan)) {
        const [rows] = await db.execute(
          "SELECT id, stock_quantity FROM products WHERE sku = ? FOR UPDATE", [sku]);

        if (!rows.length) continue;

        const product = rows[0];

        if ((await variants.listByProduct(db, product.id)).length) continue;

        const combos = colors.flatMap((color) => sizes.map((size) => [color, size]));
        const base = Math.floor(product.stock_quantity / combos.length);
        let rest = product.stock_quantity - base * combos.length;

        for (const [index, [color, size]] of combos.entries()) {
          const stock = base + (rest > 0 ? 1 : 0);
          rest -= rest > 0 ? 1 : 0;

          await variants.insert(db, product.id, variantBody({
            sku: `${sku}-${index + 1}`, color, size, stock_quantity: stock, status: "ACTIVE",
            price_adjustment: size === sizes.at(-1) ? bigSizeExtra : "0.00"
          }));
          created.variants += 1;
        }

        await variants.syncProductStock(db, product.id);
        created.products += 1;
      }

      return created;
    });

    console.log("Seed biến thể thành công:", counts);
  } catch (error) {
    console.error("Seed thất bại:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

seedVariants();
