const pool = require("../config/database");

// Chay migration tu kiem tra: buoc nao da co thi bo qua, nen chay lai an toan.
// DDL cua MySQL tu commit nen moi buoc doc lap; loi giua chung thi sua roi chay lai.

const exists = async (sql, params) => {
  const [rows] = await pool.query(sql, params);

  return Number(rows[0].n) > 0;
};

const hasTable = (table) => exists(`SELECT COUNT(*) n FROM information_schema.tables
  WHERE table_schema = DATABASE() AND table_name = ?`, [table]);

const hasColumn = (table, column) => exists(`SELECT COUNT(*) n FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`, [table, column]);

const hasIndex = (table, index) => exists(`SELECT COUNT(*) n FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`, [table, index]);

const steps = [
  ["Tạo bảng product_variants", async () => !await hasTable("product_variants"), `
    CREATE TABLE product_variants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      sku VARCHAR(60) NULL UNIQUE,
      color VARCHAR(50) NOT NULL,
      size VARCHAR(20) NOT NULL,
      price_adjustment DECIMAL(15,2) NOT NULL DEFAULT 0,
      stock_quantity INT NOT NULL DEFAULT 0,
      status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_variant (product_id, color, size),
      FOREIGN KEY (product_id) REFERENCES products(id),
      CONSTRAINT chk_variants_1 CHECK (price_adjustment >= 0),
      CONSTRAINT chk_variants_2 CHECK (stock_quantity >= 0)
    ) ENGINE=InnoDB`],
  ["Thêm cart_items.variant_id", async () => !await hasColumn("cart_items", "variant_id"), `
    ALTER TABLE cart_items
      ADD COLUMN variant_id INT NULL AFTER product_id,
      ADD COLUMN variant_key INT AS (IFNULL(variant_id, 0)) STORED,
      ADD CONSTRAINT fk_cart_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id)`],
  ["Thêm khóa duy nhất (cart_id, product_id, variant_key)",
    async () => !await hasIndex("cart_items", "uq_cart_item_variant"),
    "ALTER TABLE cart_items ADD UNIQUE KEY uq_cart_item_variant (cart_id, product_id, variant_key)"],
  ["Bỏ khóa cũ uq_cart_item", async () => hasIndex("cart_items", "uq_cart_item"),
    "ALTER TABLE cart_items DROP INDEX uq_cart_item"],
  ["Thêm order_items.variant_id, variant_label", async () => !await hasColumn("order_items", "variant_id"), `
    ALTER TABLE order_items
      ADD COLUMN variant_id INT NULL AFTER product_id,
      ADD COLUMN variant_label VARCHAR(100) NULL AFTER product_name,
      ADD CONSTRAINT fk_order_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id)`]
];

const migrate = async () => {
  try {
    for (const [label, needed, sql] of steps) {
      if (await needed()) {
        await pool.query(sql);
        console.log(`OK    ${label}`);
      } else {
        console.log(`BỎ QUA ${label} (đã có)`);
      }
    }

    console.log("Migration hoàn tất.");
  } catch (error) {
    console.error("Migration thất bại:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

migrate();
