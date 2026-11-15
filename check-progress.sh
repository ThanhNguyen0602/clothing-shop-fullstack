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
grepok backend/.env.example "DB_NAME=clothing_shop_db" ".env.example dung DB_NAME=clothing_shop_db"
grepok backend/database/schema.sql "USE clothing_shop_db;" "schema.sql dung cung database clothing_shop_db"
grepok backend/database/schema.sql "ENGINE=InnoDB" "schema.sql khai bao ENGINE=InnoDB"
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

echo "=== BUOI 6: gio hang va dat hang ==="
for f in utils/checkoutValidation.js utils/orderMoney.js models/commerceModel.js models/checkoutModel.js \
  models/orderModel.js services/cartService.js services/checkoutService.js services/orderService.js \
  controllers/cartController.js controllers/orderController.js controllers/checkoutController.js \
  routes/cartRoutes.js routes/orderRoutes.js routes/checkoutRoutes.js seeders/checkoutSeeder.js; do has "backend/src/$f"; done
grepok backend/package.json '"seed:checkout"' "package.json co script seed:checkout"
grepok backend/src/app.js '/api/cart' "app.js gan /api/cart"
grepok backend/src/app.js '/api/orders' "app.js gan /api/orders"
grepok backend/src/app.js '/api/checkout' "app.js gan /api/checkout"
grepok backend/src/middlewares/errorHandler.js 'ER_LOCK_DEADLOCK' "errorHandler xu ly deadlock/timeout (503)"
grepnot backend/src/services/orderService.js 'THU_ROLLBACK' "khong con dong THU_ROLLBACK_BUOI_06"
grepok docs/api-documentation.md '/api/orders/my-orders' "api-documentation.md co API don hang"
has docs/test-results.md

echo "=== BUOI 7: quan ly don, thanh toan, danh gia ==="
for f in utils/workflowValidation.js models/orderWorkflowModel.js services/orderWorkflowService.js \
  models/paymentModel.js services/paymentService.js models/reviewModel.js services/reviewService.js \
  controllers/orderWorkflowController.js controllers/paymentController.js controllers/reviewController.js \
  routes/orderWorkflowRoutes.js routes/purchaseActionRoutes.js seeders/paymentSeeder.js; do has "backend/src/$f"; done
grepok backend/package.json '"seed:payment"' "package.json co script seed:payment"
grepok backend/src/models/checkoutModel.js 'lockPayment' "checkoutModel dung lockPayment"
grepnot backend/src/services/orderService.js 'lockCod' "orderService khong con lockCod"
grepok backend/src/utils/checkoutValidation.js 'SIMULATED' "orderBody nhan SIMULATED"
grepok backend/src/app.js 'orderWorkflowRoutes' "app.js gan orderWorkflowRoutes"
grepok backend/src/app.js 'purchaseActionRoutes' "app.js gan purchaseActionRoutes"
grepnot backend/src/routes/productRoutes.js 'router.use(requireAuth' "productRoutes khong chan /:productId/reviews"
grepnot backend/src/services/orderWorkflowService.js 'THU_ROLLBACK' "khong con dong THU_ROLLBACK_BUOI_07"
grepok backend/.env.example 'ENABLE_MOCK_PAYMENT' ".env.example co ENABLE_MOCK_PAYMENT"
has backend/src/seeders/clothingSeeder.js
grepok backend/package.json '"seed:clothing"' "package.json co script seed:clothing"

echo "=== BUOI 8-10: React ==="
for f in components/common/PageHeader.jsx components/common/EmptyState.jsx components/common/Sidebar.jsx \
  components/common/SiteHeader.jsx components/common/SiteFooter.jsx components/common/AuthForm.jsx \
  layouts/MainLayout.jsx layouts/WorkspaceLayout.jsx layouts/ManagerLayout.jsx layouts/AdminLayout.jsx \
  pages/HomePage.jsx pages/PlaceholderPage.jsx pages/ProductsPage.jsx pages/LoginPage.jsx pages/RegisterPage.jsx \
  pages/ProfilePage.jsx pages/ProductDetailsPage.jsx pages/NotFoundPage.jsx routes/AppRoutes.jsx routes/AuthGuards.jsx \
  services/authService.js services/catalogService.js contexts/AuthContext.js contexts/AuthProvider.jsx \
  hooks/useRequest.js utils/accountValidation.js utils/catalogDisplay.js components/products/CatalogUI.jsx \
  components/products/ProductCard.jsx components/products/ProductGallery.jsx components/products/ProductReviews.jsx \
  components/products/AddToCart.jsx styles/global.css styles/catalog.css; do has "frontend/src/$f"; done
grepok frontend/src/main.jsx 'BrowserRouter' "BrowserRouter dat tai main.jsx"
grepnot frontend/src/App.jsx 'BrowserRouter' "App.jsx khong long BrowserRouter"
grepok frontend/src/main.jsx 'AuthProvider' "main.jsx boc AuthProvider"
grepok frontend/src/main.jsx 'catalog.css' "main.jsx import catalog.css"
grepnot frontend/src/main.jsx 'index.css' "khong import CSS demo index.css"
grepok frontend/index.html 'lang="vi"' "index.html lang=vi"
grepok frontend/.env.example '/api' "VITE_API_URL co hau to /api"

echo "=== MO RONG: GIAO DIEN MOI + BACKEND BO SUNG ==="
for f in backend/database/migrations/001_product_variants.sql backend/src/seeders/migrate.js \
  backend/src/seeders/variantSeeder.js backend/src/models/variantModel.js backend/src/middlewares/upload.js \
  backend/src/services/productImageService.js backend/src/routes/addressRoutes.js backend/src/routes/adminRoutes.js \
  backend/src/routes/settingRoutes.js backend/src/services/dashboardService.js \
  frontend/src/components/auth/AuthLayout.jsx frontend/src/styles/auth.css \
  frontend/src/components/common/SiteHeader.jsx frontend/src/components/products/VariantPicker.jsx \
  frontend/src/pages/CartPage.jsx frontend/src/pages/CheckoutPage.jsx frontend/src/pages/OrdersPage.jsx \
  frontend/src/pages/OrderDetailsPage.jsx frontend/src/pages/manager/DashboardPage.jsx \
  frontend/src/pages/manager/ProductAssetsPage.jsx frontend/src/pages/admin/UsersPage.jsx \
  frontend/public/images/tv-logo.png; do has "$f"; done
grepok backend/package.json '"migrate"' "package.json co script migrate"
grepok backend/package.json '"multer"' "backend co multer (upload anh)"
grepok backend/package.json '"images:samples"' "package.json co script images:samples"
has backend/public/samples/tee-navy.svg
grepok frontend/package.json '"react-bootstrap"' "frontend co react-bootstrap"
grepok frontend/src/services/api.js 'interceptors' "api.js tu gan token (interceptor)"
grepnot frontend/src/styles/global.css 'tailwindcss' "global.css khong import Tailwind"
grepok .gitignore 'backend/uploads' ".gitignore bo qua anh upload"
if grep -rqE '\bfunction\b' frontend/src --include=*.jsx --include=*.js; then
  fail "frontend con dung tu khoa function (quy uoc Arrow Function)"
else pass "frontend chi dung Arrow Function"; fi

echo "=== POSTMAN ==="
for f in Buoi03.postman_collection.json Buoi04.postman_collection.json Buoi05.postman_collection.json Buoi06.postman_collection.json Buoi07.postman_collection.json; do has "docs/postman/$f"; done
if grep -l 'eyJ' docs/postman/*.json >/dev/null 2>&1; then fail "collection Postman con chua token"; else pass "collection Postman khong chua token"; fi

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
        console.log("  So bang:", t, t === 23 ? "(OK - chua migrate)" : t === 24 ? "(OK - 23 + product_variants)" : "(can 23, hoac 24 sau npm run migrate)");
        console.log("  roles:", await q("SELECT COUNT(*) n FROM roles"), "(can 3)");
        console.log("  users mau:", await q("SELECT COUNT(*) n FROM users WHERE email IN (\"customer01@example.com\",\"customer02@example.com\",\"manager01@example.com\",\"admin01@example.com\")"), "(can 4)");
        console.log("  categories:", await q("SELECT COUNT(*) n FROM categories"), "(>=3)");
        console.log("  products DEMO-*:", await q("SELECT COUNT(*) n FROM products WHERE sku LIKE \"DEMO-%\""), "(can 5)");
        console.log("  product_images:", await q("SELECT COUNT(*) n FROM product_images"), "(>=5)");
        console.log("  brands:", await q("SELECT COUNT(*) n FROM brands"), "(>=2)");
        console.log("  products B5-*:", await q("SELECT COUNT(*) n FROM products WHERE sku LIKE \"B5-%\""), "(can 15)");
        console.log("  shipping B6 Tieu chuan:", await q("SELECT COUNT(*) n FROM shipping_methods WHERE name = \"B6 Tiêu chuẩn\""), "(can 1)");
        console.log("  payment COD:", await q("SELECT COUNT(*) n FROM payment_methods WHERE code = \"COD\""), "(can 1)");
        console.log("  cart_items trung (cart, san pham, bien the):", await q("SELECT COUNT(*) n FROM (SELECT 1 FROM cart_items GROUP BY cart_id, product_id, IFNULL(variant_id, 0) HAVING COUNT(*) > 1) t").catch(() => q("SELECT COUNT(*) n FROM (SELECT 1 FROM cart_items GROUP BY cart_id, product_id HAVING COUNT(*) > 1) t")), "(can 0)");
        console.log("  payment SIMULATED:", await q("SELECT COUNT(*) n FROM payment_methods WHERE code = \"SIMULATED\""), "(can 1)");
        console.log("  san pham quan ao CL-*:", await q("SELECT COUNT(*) n FROM products WHERE sku LIKE \"CL-%\""), "(can 20)");
        console.log("  reviews trung order_item:", await q("SELECT COUNT(*) n FROM (SELECT 1 FROM reviews GROUP BY order_item_id HAVING COUNT(*) > 1) t"), "(can 0)");
        console.log("  product_variants (sau migrate + seed:variants):", await q("SELECT COUNT(*) n FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = \"product_variants\"") ? await q("SELECT COUNT(*) n FROM product_variants") : "chua migrate", "(>0)");
        console.log("  san pham B5 cong khai:", await q("SELECT COUNT(*) n FROM products p JOIN categories c ON c.id = p.category_id WHERE p.sku LIKE \"B5-%\" AND p.status = \"ACTIVE\" AND c.status = \"ACTIVE\""), "(can 12)");
      } catch (e) { console.log("  Khong doc duoc DB:", e.message); }
      finally { await pool.end(); }
    })();' 2>&1 | grep -v "injected env")
fi

echo
echo "TONG KET: $ok muc OK, $bad muc THIEU/SAI"
