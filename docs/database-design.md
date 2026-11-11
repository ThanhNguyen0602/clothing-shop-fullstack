# Thiết kế cơ sở dữ liệu

- Database: `ecommerce_db` (MySQL 8.0, InnoDB, utf8mb4)
- Schema: `backend/database/schema.sql` (23 bảng, bảng cha tạo trước bảng con)
- Kiểm tra: `backend/database/verify-schema.sql`, `backend/database/constraint-tests.sql`

## Các nhóm bảng
| Nhóm | Bảng |
|---|---|
| Người dùng | roles, users, addresses |
| Sản phẩm | categories, brands, products, product_images |
| Giỏ hàng | carts, cart_items |
| Đơn hàng và thanh toán | orders, order_items, order_status_histories, payments, shipping_methods, payment_methods |
| Đánh giá | reviews, review_images, comments |
| Khuyến mãi | coupons, coupon_usages |
| Hệ thống | notifications, audit_logs, system_settings |

## Quan hệ chính
- roles 1-N users; users 1-N addresses, orders, reviews, comments, notifications, audit_logs
- users 1-0..1 carts; carts 1-N cart_items; products 1-N cart_items
- categories 1-N products (và tự tham chiếu qua parent_id); brands 1-N products
- orders 1-N order_items, payments, order_status_histories; orders 1-0..1 coupon_usages
- order_items 1-0..1 reviews; reviews 1-N review_images, comments

## Ràng buộc quan trọng
UNIQUE: users.email, users.phone, products.sku, products.slug, categories.slug, orders.order_code,
carts.user_id, reviews.order_item_id, coupons.code, cart_items(cart_id, product_id).
CHECK: giá, tồn kho, phí vận chuyển không âm; quantity > 0; rating từ 1 đến 5.
Quy tắc nghiệp vụ khác (địa chỉ mặc định duy nhất, ảnh chính duy nhất, chuyển trạng thái đơn,
tồn kho) được kiểm tra ở server.

## Cách chạy
Mở `schema.sql` trong MySQL Workbench và Execute toàn bộ file. Dữ liệu mẫu: `npm run seed`
và `npm run seed:catalog` (tại thư mục `backend`).

## Kết quả kiểm tra (điền từ máy của bạn)
- table_count: ____ (cần 23)
- SHOW TABLES: (dán kết quả)
- SHOW CREATE TABLE users / cart_items / orders: (dán kết quả, không dán dữ liệu mật khẩu)

| Câu thử | Lỗi dự kiến | Lỗi nhận được | Kết quả |
|---|---|---|---|
| INSERT roles name NULL | 1048 | | |
| INSERT addresses user_id = -1 | 1452 | | |
| INSERT shipping_methods base_fee = -1 | 3819 | | |
