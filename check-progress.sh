#!/bin/bash
# Chay tai thu muc goc du an (app-project): bash check-progress.sh
# Script chi DOC, khong sua gi, khong in mat khau/token.

ok=0; bad=0
pass() { echo "  OK    $1"; ok=$((ok+1)); }
fail() { echo "  THIEU $1"; bad=$((bad+1)); }
has()  { if [ -e "$1" ]; then pass "$1"; else fail "$1"; fi; }
grepok() { # $1 file, $2 pattern, $3 mo ta
  if [ -f "$1" ] && grep -q -- "$2" "$1"; then pass "$3"; else fail "$3"; fi
}
grepnot() { # $1 file, $2 pattern, $3 mo ta (khong duoc co)
  if [ -f "$1" ] && ! grep -q -- "$2" "$1"; then pass "$3"; else fail "$3"; fi
}

echo "=== BUOI 1: cau truc ==="
for f in backend/package.json backend/.env.example backend/src/app.js backend/src/server.js \
  backend/src/config/database.js frontend/package.json frontend/.env.example frontend/src/App.jsx \
  frontend/src/services/api.js package.json .gitignore README.md .vscode/settings.json \
  .vscode/extensions.json docs/database-design.md docs/api-documentation.md docs/project-plan.md; do has "$f"; done

echo "=== BUOI 2: schema ==="
has backend/database/schema.sql
n=$(grep -c 'CREATE TABLE IF NOT EXISTS' backend/database/schema.sql 2>/dev/null)
if [ "$n" = "23" ]; then pass "schema.sql co 23 bang"; else fail "schema.sql co $n bang (can 23)"; fi
grepok backend/.env.example "DB_NAME=ecommerce_db" ".env.example dung DB_NAME=ecommerce_db"
lines=$(wc -l < docs/database-design.md 2>/dev/null)
if [ "${lines:-0}" -ge 10 ]; then pass "docs/database-design.md da co noi dung ($lines dong)"; else fail "docs/database-design.md con trong/it ($lines dong)"; fi

echo "=== BUOI 3: xac thuc ==="
for f in seeders/seed.js seeders/verifySeed.js models/userModel.js utils/authValidation.js \
  controllers/authController.js controllers/userController.js middlewares/requireAuth.js \
  middlewares/authorize.js middlewares/errorHandler.js routes/authRoutes.js routes/userRoutes.js; do has "backend/src/$f"; done
grepok backend/package.json '"seed"' "package.json co script seed"
grepok backend/package.json '"verify:seed"' "package.json co script verify:seed"
grepok backend/src/app.js '/api/auth' "app.js gan /api/auth"
grepok backend/src/app.js '/api/users' "app.js gan /api/users"
grepnot backend/src/routes/userRoutes.js 'role-check' "da xoa route tam role-check"
grepok backend/src/controllers/authController.js 'expiresIn: "1h"' "expiresIn la 1h"
if [ -f backend/.env ]; then
  len=$(grep '^JWT_SECRET=' backend/.env | cut -d= -f2- | tr -d '\r' | awk '{print length($0)}')
  if [ "${len:-0}" -ge 32 ]; then pass "JWT_SECRET trong .env co $len ky tu (>=32)"; else fail "JWT_SECRET trong .env qua ngan hoac thieu"; fi
else fail "backend/.env khong ton tai"; fi

echo "=== BUOI 4: danh muc va san pham ==="
for f in utils/catalogHelpers.js utils/catalogValidation.js utils/withTransaction.js \
  models/categoryModel.js models/productModel.js services/categoryService.js services/productService.js \
  controllers/categoryController.js controllers/productController.js routes/categoryRoutes.js \
  routes/productRoutes.js routes/managementRoutes.js seeders/catalogSeeder.js; do has "backend/src/$f"; done
grepok backend/package.json '"seed:catalog"' "package.json co script seed:catalog"
grepok backend/src/app.js '/api/categories' "app.js gan /api/categories"
grepok backend/src/app.js '/api/products' "app.js gan /api/products"
grepok backend/src/app.js '/api/management' "app.js gan /api/management"
grepok backend/src/middlewares/errorHandler.js 'ER_ROW_IS_REFERENCED_2' "errorHandler la ban moi (buoi 4)"
grepnot backend/src/models/productModel.js 'TEST_ROLLBACK' "khong con dong TEST_ROLLBACK"
# thu tu: route phai nam truoc middleware 404
if [ -f backend/src/app.js ]; then
  r=$(grep -n 'app.use("/api/management"' backend/src/app.js | head -1 | cut -d: -f1)
  e=$(grep -n 'Không tìm thấy API' backend/src/app.js | head -1 | cut -d: -f1)
  if [ -n "$r" ] && [ -n "$e" ] && [ "$r" -lt "$e" ]; then pass "route nam truoc middleware 404"; else fail "route phai nam truoc middleware 404"; fi
fi

echo "=== BUOI 5: tim kiem, loc, phan trang ==="
for f in utils/productQuery.js models/productSearchModel.js services/productSearchService.js \
  models/brandModel.js services/brandService.js controllers/brandController.js routes/brandRoutes.js \
  seeders/searchSeeder.js; do has "backend/src/$f"; done
grepok backend/package.json '"seed:search"' "package.json co script seed:search"
grepok backend/src/app.js '/api/brands' "app.js gan /api/brands"
grepok backend/src/controllers/productController.js 'parseProductQuery' "listPublic dung parseProductQuery"
grepok backend/src/controllers/productController.js 'productSearch.search' "listPublic goi productSearchService"
grepok backend/src/utils/catalogValidation.js 'brand_id' "productBody nhan brand_id"
grepok backend/src/models/productModel.js 'brand_id = ?' "productModel.update ghi brand_id"
grepok backend/src/services/productService.js 'brands.find' "productService kiem tra thuong hieu"
grepok docs/api-documentation.md 'pagination' "api-documentation.md co mo ta pagination"

echo "=== AN TOAN ==="
if git ls-files 2>/dev/null | grep -E '(^|/)\.env$|node_modules' | head -3 | grep -q .; then
  fail "GIT DANG THEO DOI .env HOAC node_modules (nguy hiem)"
else pass "Git khong theo doi .env / node_modules"; fi

echo "=== GIT ==="
git branch -a 2>/dev/null
git remote -v 2>/dev/null | head -2
echo "-- thay doi chua commit:"; git status --short 2>/dev/null | head -20
echo "-- nhanh feature da merge vao origin/develop:"
git branch -r --merged origin/develop 2>/dev/null | grep feature || echo "  (chua co nhanh feature nao)"
for b in feature/database-setup feature/database-schema feature/authentication feature/catalog; do
  git rev-parse --verify -q "origin/$b" >/dev/null 2>&1 && echo "  origin/$b: co tren GitHub" || echo "  origin/$b: CHUA co tren GitHub"
done

echo "=== DATABASE (chi dem, khong in du lieu nhay cam) ==="
if [ -f backend/package.json ]; then
  (cd backend && node -e '
    const pool = require("./src/config/database");
    (async () => {
      try {
        const q = async (sql) => (await pool.query(sql))[0][0].n;
        const t = await q("SELECT COUNT(*) n FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = \"BASE TABLE\"");
        console.log("  So bang:", t, t === 23 ? "(OK)" : "(can 23)");
        console.log("  roles:", await q("SELECT COUNT(*) n FROM roles"), "(can 3)");
        console.log("  users mau:", await q("SELECT COUNT(*) n FROM users WHERE email IN (\"customer01@example.com\",\"customer02@example.com\",\"manager01@example.com\",\"admin01@example.com\")"), "(can 4)");
        console.log("  categories:", await q("SELECT COUNT(*) n FROM categories"), "(>=3)");
        console.log("  products DEMO-*:", await q("SELECT COUNT(*) n FROM products WHERE sku LIKE \"DEMO-%\""), "(can 5)");
        console.log("  product_images:", await q("SELECT COUNT(*) n FROM product_images"), "(>=5)");
        console.log("  brands:", await q("SELECT COUNT(*) n FROM brands"), "(>=2)");
        console.log("  products B5-*:", await q("SELECT COUNT(*) n FROM products WHERE sku LIKE \\"B5-%\\""), "(can 15)");
        console.log("  san pham B5 cong khai:", await q("SELECT COUNT(*) n FROM products p JOIN categories c ON c.id = p.category_id WHERE p.sku LIKE \\"B5-%\\" AND p.status = \\"ACTIVE\\" AND c.status = \\"ACTIVE\\""), "(can 12)");
      } catch (e) { console.log("  Khong doc duoc DB:", e.message); }
      finally { await pool.end(); }
    })();' 2>&1 | grep -v "injected env")
fi

echo
echo "TONG KET: $ok muc OK, $bad muc THIEU/SAI"
