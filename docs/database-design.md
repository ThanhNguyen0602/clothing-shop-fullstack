# Thiết kế cơ sở dữ liệu

Đề tài: website bán quần áo. MySQL 8.0.16+ (để `CHECK` được thực thi), InnoDB, `utf8mb4_unicode_ci`.
Database: `clothing_shop_db` (đặt trong `DB_NAME` của `backend/.env`).
Lược đồ đầy đủ: [`backend/database/schema.sql`](../backend/database/schema.sql).

## 1. Tổng quan 23 bảng

| Nhóm | Bảng |
|---|---|
| Người dùng và phân quyền | roles, users, addresses |
| Sản phẩm | categories, brands, products, product_images |
| Giỏ hàng | carts, cart_items |
| Đơn hàng và thanh toán | orders, order_items, order_status_histories, payments, shipping_methods, payment_methods |
| Đánh giá và bình luận | reviews, review_images, comments |
| Khuyến mãi | coupons, coupon_usages |
| Hệ thống | notifications, audit_logs, system_settings |

Mỗi user có đúng một vai trò qua `users.role_id → roles.id` (quan hệ 1:N, không có bảng `user_roles`).
Guest là người chưa đăng nhập, không phải một bản ghi trong `roles`.

## 2. Quan hệ chính

| Bảng cha | Bảng con | Quan hệ |
|---|---|---|
| roles | users | 1:N |
| users | addresses, orders, reviews, comments, notifications, audit_logs, coupon_usages | 1:N |
| users | carts | 1:0..1 (`UNIQUE carts.user_id`) |
| categories | categories (parent_id), products | 1:N |
| brands | products | 1:N (`brand_id` có thể NULL) |
| products | product_images, cart_items, order_items, reviews | 1:N |
| carts | cart_items | 1:N |
| orders | order_items, payments, order_status_histories | 1:N |
| orders | coupon_usages | 1:0..1 |
| shipping_methods, payment_methods | orders | 1:N |
| payment_methods | payments | 1:N |
| reviews | review_images, comments | 1:N |
| comments | comments (parent_id) | 1:N |
| coupons | coupon_usages | 1:N |

## 3. Ràng buộc toàn vẹn

| Ràng buộc | Cách thực hiện |
|---|---|
| Mỗi user một vai trò | `users.role_id NOT NULL` + FK |
| Email, số điện thoại không trùng | `UNIQUE(users.email)`, `UNIQUE(users.phone)` |
| Mỗi customer tối đa một giỏ | `UNIQUE(carts.user_id)` |
| Mỗi sản phẩm một dòng trong giỏ | `UNIQUE KEY uq_cart_item (cart_id, product_id)` |
| SKU, slug, mã đơn, mã giảm giá duy nhất | `UNIQUE` trên `products.sku`, `products.slug`, `categories.slug`, `orders.order_code`, `coupons.code` |
| Giá, phí, tồn kho không âm | `CHECK (... >= 0)` |
| Số lượng mua dương | `CHECK (quantity > 0)` trên `cart_items`, `order_items` |
| Rating 1–5 | `CHECK (rating BETWEEN 1 AND 5)` |
| Mỗi order item đánh giá tối đa một lần | `UNIQUE(reviews.order_item_id)` |
| Trạng thái đơn hợp lệ | `CHECK (order_status IN (...))` 11 giá trị |
| Không thanh toán trùng | `UNIQUE(payments.transaction_code)` |
| Giữ giá lúc mua | `order_items.product_name`, `unit_price` (snapshot) |
| Không xóa sản phẩm đã bán | Xóa mềm bằng `status = 'DISCONTINUED'` (API buổi 04) |

Các quy tắc như địa chỉ mặc định duy nhất, ảnh chính duy nhất, quyền đánh giá, tồn kho khi đặt hàng và
chuyển trạng thái đơn vẫn được kiểm tra ở back-end; schema không thay thế các bước đó.

Ghi chú: `coupon_usages.used_at` có `DEFAULT CURRENT_TIMESTAMP` theo bảng phân tích ở phần II của tài liệu thiết kế.

## 4. Cách chạy schema

1. MySQL Workbench → File → Open SQL Script → `backend/database/schema.sql` → Execute toàn bộ.
2. File tự `CREATE DATABASE IF NOT EXISTS clothing_shop_db`. Không chạy `DROP DATABASE`.
3. Dữ liệu mẫu chạy tại thư mục `backend`: `npm run seed`, `npm run verify:seed`, `npm run seed:catalog`, `npm run seed:search`.

### Database đã tạo từ schema rút gọn ở buổi 01
`CREATE TABLE IF NOT EXISTS` không sửa bảng cũ. Kiểm tra `SHOW CREATE TABLE users;`. Nếu thiếu cột thì sao lưu
dữ liệu rồi bổ sung:

```sql
ALTER TABLE users
  ADD COLUMN avatar VARCHAR(500) NULL AFTER password_hash,
  ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE users MODIFY status ENUM('ACTIVE', 'LOCKED', 'DISABLED') NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE roles MODIFY created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
```

Sau đó chạy lại `schema.sql` để tạo 21 bảng còn thiếu.

## 5. Kiểm tra cấu trúc

```sql
USE clothing_shop_db;
SHOW TABLES;
SELECT COUNT(*) AS table_count
FROM information_schema.tables
WHERE table_schema = 'clothing_shop_db' AND table_type = 'BASE TABLE';

SELECT table_name, engine, table_collation
FROM information_schema.tables
WHERE table_schema = 'clothing_shop_db'
  AND (engine <> 'InnoDB' OR table_collation NOT LIKE 'utf8mb4%');

SHOW CREATE TABLE users;
SHOW CREATE TABLE cart_items;
SHOW CREATE TABLE orders;
```

| Kiểm tra | Kết quả mong đợi | Kết quả thực tế |
|---|---|---|
| `table_count` | 23 | ☐ |
| Bảng không phải InnoDB/utf8mb4 | 0 dòng | ☐ |
| `users` | `UNIQUE` email, phone; FK `role_id → roles(id)`; có `avatar`, `updated_at` | ☐ |
| `cart_items` | có `uq_cart_item (cart_id, product_id)`, `chk_cart_items_1` | ☐ |
| `orders` | FK tới users, shipping_methods, coupons, payment_methods; `chk_orders_1..5` | ☐ |

## 6. Kiểm tra ràng buộc bằng dữ liệu sai

Chạy từng câu riêng lẻ; tất cả phải bị từ chối và không thêm dòng nào.

```sql
-- NOT NULL: lỗi 1048
INSERT INTO roles (name) VALUES (NULL);
-- Khóa ngoại không tồn tại: lỗi 1452
INSERT INTO addresses (user_id, recipient_name, recipient_phone, province, ward, street_address)
VALUES (-1, 'Test', '0900000099', 'Test', 'Test', 'Test');
-- CHECK phí vận chuyển âm: lỗi 3819
INSERT INTO shipping_methods (name, base_fee) VALUES ('Test negative fee', -1);
-- Xác nhận không có dòng sai
SELECT COUNT(*) FROM shipping_methods WHERE name = 'Test negative fee';
```

| Phép thử | Mã lỗi mong đợi | Kết quả thực tế |
|---|---|---|
| NOT NULL `roles.name` | 1048 Column cannot be null | ☐ |
| FK `addresses.user_id = -1` | 1452 Cannot add or update a child row | ☐ |
| CHECK `base_fee = -1` | 3819 Check constraint is violated | ☐ |
| Đếm dòng sai | 0 | ☐ |

Điền cột "Kết quả thực tế" (hoặc dán ảnh chụp Action Output) sau khi chạy trên máy để nộp bài.

## 7. Mở rộng dự kiến cho cửa hàng quần áo

Tồn kho hiện nằm ở `products.stock_quantity`. Trước buổi 06 sẽ cân nhắc thêm bảng `product_variants`
(size, màu) bằng một file migration riêng; xem `docs/project-plan.md`.
