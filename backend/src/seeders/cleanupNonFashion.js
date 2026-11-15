const fs = require("fs");
const path = require("path");
const pool = require("../config/database");
const withTransaction = require("../utils/withTransaction");

// Danh muc / SKU cong nghe do seeder cu (buoi 04-05) tao ra, cung cac danh muc
// "mau" trung lap (B5 ..., Ao nam / Quan nam) cua phien ban truoc.
const TECH_CATEGORY_SLUGS = ["dien-thoai", "laptop", "phu-kien",
  "b5-dien-thoai", "b5-laptop", "b5-phu-kien",
  "ao-nam", "quan-nam", "b5-ao-khoac", "b5-quan-jeans", "b5-phu-kien-thoi-trang"];
// Du lieu kiem thu buoi 04-05 (DEMO-*, B5-*, B5T-* tao tu Postman) duoc xoa het
// roi nap lai bang seed:catalog / seed:search phien ban thoi trang.
const SAMPLE_SKU_PATTERNS = ["DEMO-%", "B5-%", "B5T-%"];
const TECH_SKUS = ["DEMO-PHONE-01", "DEMO-PHONE-02", "DEMO-LAPTOP-01",
  "B5-PHONE-01", "B5-PHONE-02", "B5-PHONE-03", "B5-PHONE-04",
  "B5-LAPTOP-01", "B5-LAPTOP-02", "B5-LAPTOP-03", "B5-LAPTOP-04"];
// Cac SKU nay duoc giu lai nhung ten cu la do cong nghe (Tai nghe, Sac, Chuot...);
// xoa ban cu de seeder tao lai ban thoi trang.
const OLD_NAMES = ["Tai nghe mẫu", "Sạc mẫu", "B5 Chuột A1", "B5 Tai nghe N1",
  "B5 Bàn phím A1", "B5 Đế laptop"];

const confirmed = process.argv.includes("--yes");
const marks = (list) => list.map(() => "?").join(", ");

const tableExists = async (db, name) => {
  const [rows] = await db.execute(`SELECT COUNT(*) AS n FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = ?`, [name]);

  return Number(rows[0].n) > 0;
};

const ids = (rows) => rows.map((row) => row.id);

const removeIn = async (db, sql, list) => {
  if (!list.length) return 0;
  const [result] = await db.execute(sql.replace("(?)", `(${marks(list)})`), list);

  return result.affectedRows;
};

const findTargets = async (db) => {
  const [categories] = await db.execute(`SELECT id, name, slug FROM categories
    WHERE slug IN (${marks(TECH_CATEGORY_SLUGS)})`, TECH_CATEGORY_SLUGS);
  const categoryIds = ids(categories);
  const conditions = [`sku IN (${marks(TECH_SKUS)})`, `name IN (${marks(OLD_NAMES)})`,
    ...SAMPLE_SKU_PATTERNS.map(() => "sku LIKE ?")];
  const params = [...TECH_SKUS, ...OLD_NAMES, ...SAMPLE_SKU_PATTERNS];

  if (categoryIds.length) {
    conditions.push(`category_id IN (${marks(categoryIds)})`);
    params.push(...categoryIds);
  }

  const [products] = await db.execute(`SELECT id, sku, name, thumbnail FROM products
    WHERE ${conditions.join(" OR ")} ORDER BY id`, params);
  const productIds = ids(products);
  let orders = [];

  if (productIds.length) {
    [orders] = await db.execute(`SELECT DISTINCT o.id, o.order_code FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE oi.product_id IN (${marks(productIds)}) ORDER BY o.id`, productIds);
  }

  return { categories, products, orders };
};

const removeAll = async (db, { categories, products, orders }) => {
  const productIds = ids(products);
  const orderIds = ids(orders);
  const done = {};

  // Danh gia gan voi san pham hoac voi dong don se bi xoa.
  let reviewIds = [];
  if (productIds.length || orderIds.length) {
    const parts = [];
    const params = [];
    if (productIds.length) {
      parts.push(`product_id IN (${marks(productIds)})`);
      params.push(...productIds);
    }
    if (orderIds.length) {
      parts.push(`order_item_id IN (SELECT id FROM order_items WHERE order_id IN (${marks(orderIds)}))`);
      params.push(...orderIds);
    }
    const [rows] = await db.execute(`SELECT id FROM reviews WHERE ${parts.join(" OR ")}`, params);
    reviewIds = ids(rows);
  }

  await removeIn(db, "UPDATE comments SET parent_id = NULL WHERE review_id IN (?)", reviewIds);
  done.comments = await removeIn(db, "DELETE FROM comments WHERE review_id IN (?)", reviewIds);
  done.review_images = await removeIn(db, "DELETE FROM review_images WHERE review_id IN (?)", reviewIds);
  done.reviews = await removeIn(db, "DELETE FROM reviews WHERE id IN (?)", reviewIds);

  // Don hang co chua san pham cong nghe: xoa ca don (chi la du lieu thu nghiem).
  // San pham thoi trang nam chung don chua huy duoc hoan lai ton kho truoc khi xoa.
  done.restored_items = 0;
  if (orderIds.length) {
    const hasVariants = await tableExists(db, "product_variants");
    const variantColumn = hasVariants ? "oi.variant_id" : "NULL AS variant_id";
    const [items] = await db.execute(`SELECT oi.product_id, ${variantColumn}, oi.quantity
      FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE oi.order_id IN (${marks(orderIds)}) AND o.order_status <> 'CANCELLED'`, orderIds);

    for (const item of items) {
      if (productIds.includes(item.product_id)) continue;
      await db.execute("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?",
        [item.quantity, item.product_id]);
      if (item.variant_id) {
        await db.execute(`UPDATE product_variants SET stock_quantity = stock_quantity + ?
          WHERE id = ?`, [item.quantity, item.variant_id]);
      }
      done.restored_items += 1;
    }
  }

  done.coupon_usages = await removeIn(db, "DELETE FROM coupon_usages WHERE order_id IN (?)", orderIds);
  done.payments = await removeIn(db, "DELETE FROM payments WHERE order_id IN (?)", orderIds);
  done.order_status_histories = await removeIn(db,
    "DELETE FROM order_status_histories WHERE order_id IN (?)", orderIds);
  done.order_items = await removeIn(db, "DELETE FROM order_items WHERE order_id IN (?)", orderIds);
  done.orders = await removeIn(db, "DELETE FROM orders WHERE id IN (?)", orderIds);

  done.cart_items = await removeIn(db, "DELETE FROM cart_items WHERE product_id IN (?)", productIds);
  if (await tableExists(db, "product_variants")) {
    done.product_variants = await removeIn(db,
      "DELETE FROM product_variants WHERE product_id IN (?)", productIds);
  }
  done.product_images = await removeIn(db,
    "DELETE FROM product_images WHERE product_id IN (?)", productIds);
  done.products = await removeIn(db, "DELETE FROM products WHERE id IN (?)", productIds);

  // Danh muc cong nghe: chi xoa khi khong con san pham / danh muc con.
  done.categories = 0;
  for (const category of categories) {
    const [[left]] = await db.execute(`SELECT
      (SELECT COUNT(*) FROM products WHERE category_id = ?) +
      (SELECT COUNT(*) FROM categories WHERE parent_id = ?) AS n`, [category.id, category.id]);

    if (Number(left.n) === 0) {
      await db.execute("DELETE FROM categories WHERE id = ?", [category.id]);
      done.categories += 1;
    } else {
      console.log(`  Giữ danh mục "${category.name}" vì còn dữ liệu khác bên trong.`);
    }
  }

  return done;
};

// Xoa file anh da upload (neu co) cua san pham bi xoa.
const removeUploadedFiles = (products) => {
  const dir = path.join(__dirname, "../../uploads/products");
  let count = 0;

  for (const product of products) {
    const name = product.thumbnail?.split("/uploads/products/")[1];
    const file = name ? path.join(dir, path.basename(name)) : null;

    if (file && fs.existsSync(file)) {
      fs.unlinkSync(file);
      count += 1;
    }
  }

  return count;
};

const run = async () => {
  try {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Không chạy script dọn dữ liệu trên production");
    }

    const result = await withTransaction(async (db) => {
      const targets = await findTargets(db);

      console.log(`Danh mục công nghệ / trùng lặp: ${targets.categories.map((c) => c.name).join(", ") || "(không có)"}`);
      console.log(`Sản phẩm sẽ xóa (${targets.products.length}):`);
      targets.products.forEach((p) => console.log(`  - ${p.sku}  ${p.name}`));
      console.log(`Đơn hàng thử nghiệm có chứa các sản phẩm này (${targets.orders.length}):`,
        targets.orders.map((o) => o.order_code).join(", ") || "(không có)");

      if (!confirmed) return { targets, done: null };

      return { targets, done: await removeAll(db, targets) };
    });

    if (!result.done) {
      console.log("\nCHƯA XÓA GÌ. Kiểm tra danh sách trên, nếu đúng thì chạy:");
      console.log("  npm run cleanup:non-fashion -- --yes");
      return;
    }

    const files = removeUploadedFiles(result.targets.products);
    console.log("\nĐã xóa:", { ...result.done, uploaded_files: files });
    console.log("Tiếp theo chạy: npm run seed:catalog, npm run seed:search, npm run seed:variants, npm run images:samples");
  } catch (error) {
    console.error("Dọn dữ liệu thất bại (đã rollback):", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

run();
