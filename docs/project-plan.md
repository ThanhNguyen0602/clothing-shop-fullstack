# Kế hoạch dự án

Đề tài: website bán quần áo (Full-stack). Một thành viên thực hiện.

## Tiến độ theo buổi
| Buổi | Nội dung | Nhánh | Trạng thái |
|---|---|---|---|
| 01 | Setup môi trường, monorepo | main, develop | Xong |
| 02 | Schema 23 bảng | feature/database-schema | Xong |
| 03 | Xác thực và phân quyền | feature/authentication | Xong |
| 04 | Danh mục và sản phẩm | feature/catalog | Xong |
| 05 | Tìm kiếm, lọc, sắp xếp, phân trang sản phẩm | | Chưa |
| 06 | Giỏ hàng, đặt hàng, trừ tồn kho (transaction) | | Chưa |

## Giai đoạn theo tài liệu CSDL
- Giai đoạn 1: roles, users, addresses, categories, products, product_images, carts, cart_items
- Giai đoạn 2: orders, order_items, order_status_histories, payments, payment_methods, shipping_methods, reviews
- Giai đoạn 3: brands, review_images, comments, coupons, coupon_usages, notifications, audit_logs, system_settings

## Ghi chú mở rộng cho cửa hàng quần áo
Thiết kế gốc để `stock_quantity` trong `products`. Quần áo cần quản lý theo size và màu,
nên dự kiến thêm bảng `product_variants` bằng một file migration riêng trước khi làm giỏ hàng
và đặt hàng (buổi 06), khi đó `cart_items` và `order_items` sẽ trỏ tới biến thể.
