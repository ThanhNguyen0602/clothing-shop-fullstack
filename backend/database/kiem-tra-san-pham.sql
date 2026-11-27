-- =====================================================================
-- KIỂM TRA DỮ LIỆU SẢN PHẨM – clothing_shop_db
-- Mở trong MySQL Workbench: File → Open SQL Script → chọn file này.
-- Đặt con trỏ vào MỘT câu rồi bấm Ctrl + Enter để chạy riêng câu đó.
-- Tất cả đều là câu SELECT: chỉ đọc, không sửa dữ liệu.
-- =====================================================================

USE clothing_shop_db;


-- =====================================================================
-- PHẦN 1. TỔNG QUAN
-- =====================================================================

-- 1.1 Đủ bảng chưa? (23 bảng gốc + product_variants sau migrate = 24)
SELECT COUNT(*) AS so_bang
FROM information_schema.tables
WHERE table_schema = 'clothing_shop_db';

-- 1.2 Số dòng của các bảng liên quan đến sản phẩm
SELECT 'categories' AS bang, COUNT(*) AS so_dong FROM categories
UNION ALL SELECT 'brands', COUNT(*) FROM brands
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'product_images', COUNT(*) FROM product_images
UNION ALL SELECT 'product_variants', COUNT(*) FROM product_variants;

-- 1.3 Sản phẩm theo nhóm dữ liệu mẫu
--     Kỳ vọng: CL-* = 20 (seed:clothing), DEMO-* = 5 (seed:catalog), B5-* = 15 (seed:search)
SELECT
  CASE
    WHEN sku LIKE 'CL-%' THEN 'CL-* (quần áo chính)'
    WHEN sku LIKE 'DEMO-%' THEN 'DEMO-* (buổi 4)'
    WHEN sku LIKE 'B5-%' THEN 'B5-* (buổi 5)'
    ELSE 'Khác (tạo tay / Postman)'
  END AS nhom,
  COUNT(*) AS so_san_pham
FROM products
GROUP BY nhom;

-- 1.4 Sản phẩm theo trạng thái
SELECT status, COUNT(*) AS so_san_pham
FROM products
GROUP BY status;


-- =====================================================================
-- PHẦN 2. DANH MỤC VÀ THƯƠNG HIỆU
-- =====================================================================

-- 2.1 Danh mục và số sản phẩm trong từng danh mục
--     Khách chỉ thấy danh mục ACTIVE. Không nên còn danh mục kiểu
--     "Điện thoại", "Laptop", "B5 Áo khoác", "Áo nam", "Quần nam".
SELECT c.id, c.name, c.slug, c.status, c.display_order,
       COUNT(p.id) AS so_san_pham
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.id, c.name, c.slug, c.status, c.display_order
ORDER BY c.status, c.display_order, c.id;

-- 2.2 Thương hiệu và số sản phẩm
SELECT b.id, b.name, b.status, COUNT(p.id) AS so_san_pham
FROM brands b
LEFT JOIN products p ON p.brand_id = b.id
GROUP BY b.id, b.name, b.status
ORDER BY so_san_pham DESC;


-- =====================================================================
-- PHẦN 3. DANH SÁCH SẢN PHẨM
-- =====================================================================

-- 3.1 Bảng sản phẩm đầy đủ thông tin chính
SELECT p.id, p.sku, p.name, c.name AS danh_muc, b.name AS thuong_hieu,
       p.original_price AS gia_goc, p.sale_price AS gia_ban,
       p.stock_quantity AS ton_kho, p.status,
       (SELECT COUNT(*) FROM product_images i WHERE i.product_id = p.id) AS so_anh,
       (SELECT COUNT(*) FROM product_variants v WHERE v.product_id = p.id) AS so_bien_the
FROM products p
JOIN categories c ON c.id = p.category_id
LEFT JOIN brands b ON b.id = p.brand_id
ORDER BY p.id;

-- 3.2 Sản phẩm KHÁCH NHÌN THẤY trên web
--     (sản phẩm ACTIVE và nằm trong danh mục ACTIVE)
SELECT COUNT(*) AS so_san_pham_cong_khai
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.status = 'ACTIVE' AND c.status = 'ACTIVE';

-- 3.3 Sản phẩm đang giảm giá (giá bán < giá gốc) và % giảm
SELECT sku, name, original_price, sale_price,
       ROUND((1 - sale_price / original_price) * 100) AS phan_tram_giam
FROM products
WHERE sale_price < original_price
ORDER BY phan_tram_giam DESC;

-- 3.4 Sản phẩm hết hàng / sắp hết hàng (≤ 5, ngưỡng của dashboard)
SELECT sku, name, stock_quantity, status
FROM products
WHERE status = 'ACTIVE' AND stock_quantity <= 5
ORDER BY stock_quantity, sku;

-- 3.5 Xem chi tiết MỘT sản phẩm (đổi SKU theo ý)
SELECT * FROM products WHERE sku = 'CL-TEE-001';


-- =====================================================================
-- PHẦN 4. ẢNH SẢN PHẨM
-- =====================================================================

-- 4.1 Ảnh của một sản phẩm (đổi SKU), ảnh chính lên đầu
SELECT i.id, i.image_url, i.is_primary, i.display_order
FROM product_images i
JOIN products p ON p.id = i.product_id
WHERE p.sku = 'CL-TEE-001'
ORDER BY i.display_order, i.id;

-- 4.2 Loại ảnh đang dùng
--     placehold.co = ảnh xám cũ → chạy: npm run images:samples
--     /samples/    = ảnh minh họa của dự án
--     /uploads/    = ảnh Manager tự tải lên
SELECT
  CASE
    WHEN image_url LIKE '%placehold.co%' THEN 'Ảnh xám placehold.co (nên thay)'
    WHEN image_url LIKE '%/samples/%' THEN 'Ảnh minh họa /samples'
    WHEN image_url LIKE '%/uploads/%' THEN 'Ảnh upload'
    ELSE 'URL ngoài'
  END AS loai_anh,
  COUNT(*) AS so_anh
FROM product_images
GROUP BY loai_anh;


-- =====================================================================
-- PHẦN 5. BIẾN THỂ MÀU / SIZE
-- =====================================================================

-- 5.1 Biến thể của một sản phẩm (đổi SKU)
SELECT v.id, v.color AS mau, v.size, v.sku, v.price_adjustment AS cong_them,
       p.sale_price + v.price_adjustment AS gia_bien_the,
       v.stock_quantity AS ton_kho, v.status
FROM product_variants v
JOIN products p ON p.id = v.product_id
WHERE p.sku = 'CL-TEE-001'
ORDER BY v.color, FIELD(v.size, 'XS', 'S', 'M', 'L', 'XL', 'XXL'), v.size;

-- 5.2 Số biến thể theo sản phẩm (sản phẩm CL-* sau seed:variants phải có biến thể)
SELECT p.sku, p.name,
       COUNT(v.id) AS so_bien_the,
       GROUP_CONCAT(DISTINCT v.color ORDER BY v.color SEPARATOR ', ') AS cac_mau,
       GROUP_CONCAT(DISTINCT v.size SEPARATOR ', ') AS cac_size
FROM products p
LEFT JOIN product_variants v ON v.product_id = p.id
WHERE p.sku LIKE 'CL-%'
GROUP BY p.id, p.sku, p.name
ORDER BY p.sku;


-- =====================================================================
-- PHẦN 6. KIỂM TRA LỖI DỮ LIỆU
-- Mỗi câu dưới đây KỲ VỌNG TRẢ VỀ 0 DÒNG.
-- Có dòng nào → đó là dữ liệu cần sửa.
-- =====================================================================

-- 6.1 Giá bán lớn hơn giá gốc
SELECT sku, name, original_price, sale_price
FROM products
WHERE sale_price > original_price;

-- 6.2 Sản phẩm đang bán nhưng không có ảnh nào
SELECT p.sku, p.name
FROM products p
WHERE p.status = 'ACTIVE'
  AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id);

-- 6.3 Sản phẩm có ảnh nhưng không có ảnh chính, hoặc có hơn 1 ảnh chính
SELECT p.sku, SUM(i.is_primary) AS so_anh_chinh, COUNT(*) AS so_anh
FROM products p
JOIN product_images i ON i.product_id = p.id
GROUP BY p.id, p.sku
HAVING so_anh_chinh <> 1;

-- 6.4 Thumbnail không khớp ảnh chính
SELECT p.sku, p.thumbnail, i.image_url AS anh_chinh
FROM products p
JOIN product_images i ON i.product_id = p.id AND i.is_primary = 1
WHERE NOT (p.thumbnail <=> i.image_url);

-- 6.5 Tồn kho sản phẩm KHÔNG BẰNG tổng tồn kho biến thể đang bán
--     (quy tắc: có biến thể thì tồn kho sản phẩm = tổng biến thể ACTIVE)
SELECT p.sku, p.name, p.stock_quantity AS ton_kho_san_pham,
       SUM(CASE WHEN v.status = 'ACTIVE' THEN v.stock_quantity ELSE 0 END) AS tong_bien_the
FROM products p
JOIN product_variants v ON v.product_id = p.id
GROUP BY p.id, p.sku, p.name, p.stock_quantity
HAVING ton_kho_san_pham <> tong_bien_the;

-- 6.6 Còn sót dữ liệu không phải thời trang (cũ)
--     Có dòng → chạy: npm run cleanup:non-fashion  (rồi thêm -- --yes)
SELECT p.sku, p.name, c.name AS danh_muc
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.sku REGEXP 'PHONE|LAPTOP'
   OR c.slug IN ('dien-thoai', 'laptop', 'phu-kien', 'b5-dien-thoai', 'b5-laptop',
                 'b5-phu-kien', 'ao-nam', 'quan-nam', 'b5-ao-khoac', 'b5-quan-jeans',
                 'b5-phu-kien-thoi-trang')
   OR p.name REGEXP 'Điện thoại|Laptop|Tai nghe|Chuột|Bàn phím|Sạc';

-- 6.7 Trùng tên sản phẩm (không sai về kỹ thuật nhưng gây rối cho khách)
SELECT name, COUNT(*) AS so_lan, GROUP_CONCAT(sku) AS cac_sku
FROM products
GROUP BY name
HAVING so_lan > 1;

-- 6.8 Danh mục ACTIVE nhưng trống (khách bấm vào sẽ không thấy gì)
SELECT c.name, c.slug
FROM categories c
WHERE c.status = 'ACTIVE'
  AND NOT EXISTS (SELECT 1 FROM products p
                  WHERE p.category_id = c.id AND p.status = 'ACTIVE');


-- =====================================================================
-- PHẦN 7. SẢN PHẨM TRONG GIỎ VÀ ĐƠN HÀNG
-- =====================================================================

-- 7.1 Sản phẩm bán chạy (chỉ tính đơn Hoàn thành – giống dashboard)
SELECT oi.product_id, oi.product_name, SUM(oi.quantity) AS da_ban,
       SUM(oi.total_price) AS doanh_thu
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.order_status = 'COMPLETED'
GROUP BY oi.product_id, oi.product_name
ORDER BY da_ban DESC
LIMIT 10;

-- 7.2 Các dòng đang nằm trong giỏ hàng của khách
SELECT u.email, p.sku, p.name, CONCAT_WS(' / ', v.color, v.size) AS phan_loai,
       ci.quantity, p.stock_quantity AS ton_kho_sp, v.stock_quantity AS ton_kho_bien_the
FROM cart_items ci
JOIN carts ca ON ca.id = ci.cart_id
JOIN users u ON u.id = ca.user_id
JOIN products p ON p.id = ci.product_id
LEFT JOIN product_variants v ON v.id = ci.variant_id
ORDER BY u.email, ci.id;

-- 7.3 Lịch sử bán của một sản phẩm (đổi SKU) – xem tồn kho có bị trừ đúng không
SELECT o.order_code, o.order_status, oi.variant_label, oi.quantity,
       oi.unit_price, o.created_at
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
WHERE p.sku = 'CL-TEE-001'
ORDER BY o.id DESC;
