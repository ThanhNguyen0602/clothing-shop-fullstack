# Kế hoạch dự án

Đề tài: website bán quần áo (Full-stack). Một thành viên thực hiện.

## Tiến độ theo buổi
| Buổi | Nội dung | Nhánh | Trạng thái |
|---|---|---|---|
| 01 | Setup môi trường, monorepo | main, develop | Xong |
| 02 | Schema 23 bảng, kiểm tra cấu trúc (`docs/database-design.md`) | feature/database-setup, feature/database-schema | Xong |
| 03 | Xác thực và phân quyền, Postman `Buoi03` | feature/authentication | Xong |
| 04 | Danh mục và sản phẩm, Postman `Buoi04` | feature/authentication (gộp chung PR #3) | Xong |
| 05 | Tìm kiếm, lọc, sắp xếp, phân trang sản phẩm, Postman `Buoi05` | feature/product-search | Xong |
| 06 | Giỏ hàng, đặt hàng COD, trừ tồn kho (transaction), Postman `Buoi06` | feature/cart-order | Xong |
| 07 | Quản lý đơn, hủy/hoàn kho, COD, thanh toán mô phỏng, đánh giá, Postman `Buoi07` | feature/order-workflow | Đang kiểm thử |
| 08 | Bố cục, điều hướng React, responsive | feature/frontend-layout | Đang kiểm thử |
| 09 | Xác thực, khôi phục phiên, route guard, hồ sơ | feature/frontend-auth | Đang kiểm thử |
| 10 | Danh sách, chi tiết sản phẩm, đánh giá, thêm giỏ | feature/frontend-catalog | Đang kiểm thử |
| 11 | Tìm kiếm/lọc trên giao diện, trang giỏ hàng | | Chưa |

## Giai đoạn theo tài liệu CSDL
- Giai đoạn 1: roles, users, addresses, categories, products, product_images, carts, cart_items
- Giai đoạn 2: orders, order_items, order_status_histories, payments, payment_methods, shipping_methods, reviews
- Giai đoạn 3: brands, review_images, comments, coupons, coupon_usages, notifications, audit_logs, system_settings

## Ghi chú mở rộng cho cửa hàng quần áo
Thiết kế gốc để `stock_quantity` trong `products`. Quần áo cần quản lý theo size và màu,
nên dự kiến thêm bảng `product_variants` bằng một file migration riêng trước khi làm giỏ hàng
và đặt hàng (buổi 06), khi đó `cart_items` và `order_items` sẽ trỏ tới biến thể.

## Ghi chú quy trình Git
- Code buổi 04 đã được commit chung trong PR `feature/authentication`.
- PR `feature/product-search` đã merge vào `main`; cần đồng bộ `develop` với `main`.
- Bản bổ sung schema đầy đủ, `database-design.md`, Postman buổi 03–04 và việc xóa route `role-check`
  đi qua nhánh `feature/database-schema` (PR vào `develop`).

## Sơ đồ route giao diện (buổi 08–10)
| URL | Layout → Page | Quyền |
|---|---|---|
| `/` | MainLayout → HomePage | Công khai |
| `/products`, `/products/:id` | MainLayout → ProductsPage, ProductDetailsPage | Công khai |
| `/login`, `/register` | MainLayout → LoginPage, RegisterPage | Chỉ khách (GuestOnly) |
| `/profile` | MainLayout → ProfilePage | Đã đăng nhập |
| `/cart`, `/checkout`, `/orders` | MainLayout → trang tạm | CUSTOMER |
| `/manager/*` | ManagerLayout → tổng quan tạm | MANAGER, ADMIN |
| `/admin/*` | AdminLayout → tổng quan tạm | ADMIN |
| URL không khớp | NotFoundPage trong layout tương ứng | — |

## Cập nhật giao diện TV Studio (sau buổi 10)
- Áp dụng giao diện TV Studio của nhóm (header gradient, menu đen, footer, trang chủ hero, nền DotGrid cho đăng nhập)
  vào cấu trúc file của môn; bỏ Tailwind (không dùng), giữ Bootstrap 5 + React-Bootstrap.
- Làm trước phần giao diện của các buổi sau: giỏ hàng, đặt hàng, đơn hàng, khu Manager/Admin.
- Backend bổ sung để giao diện chạy đủ: biến thể màu/size (migration riêng, schema gốc giữ 23 bảng), upload ảnh (multer),
  sổ địa chỉ, đổi mật khẩu, dashboard, quản lý người dùng, cấu hình cửa hàng, lọc đơn quản lý.
- Việc còn lại: chạy kiểm thử trên MySQL thật theo `docs/test-results.md`, chụp ảnh minh chứng, chia nhánh
  `feature/tv-studio-ui`, `feature/variants`, `feature/admin` để tạo Pull Request.

## Làm gọn giao diện (sau khi ghép TV Studio)
- Đổi sang giao diện sáng, một màu nhấn xanh denim, font Be Vietnam Pro; một header duy nhất (logo, menu, tìm kiếm,
  tài khoản, giỏ có số lượng); bỏ nền DotGrid và thanh menu đen thứ hai.
- Trang sản phẩm: bộ lọc cột trái (danh mục, giá, thương hiệu, còn hàng, giảm giá), lưới sản phẩm bên phải.
- Dữ liệu mẫu buổi 04–05 dùng chung danh mục thật (không còn danh mục "B5 …" hiện cho khách), tên sản phẩm tự nhiên;
  Postman lọc bằng SKU `B5-*`. Ảnh minh họa SVG cục bộ thay cho ảnh placeholder xám.
