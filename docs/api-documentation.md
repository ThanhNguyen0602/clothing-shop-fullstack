# Tài liệu API

Base URL: `http://localhost:3000`. Body và response dạng JSON.

## Quy ước chung
- Thành công: `{ "success": true, "data": ... }`
- Lỗi: `{ "success": false, "message": "..." }`
- Xác thực: header `Authorization: Bearer <accessToken>`
- Giá (DECIMAL) gửi và nhận dưới dạng chuỗi, ví dụ `"14000000.00"`; ID và số lượng là số.

| Mã | Ý nghĩa |
|---|---|
| 400 | Dữ liệu sai hoặc có trường ngoài hợp đồng |
| 401 | Thiếu/sai/hết hạn token, sai email hoặc mật khẩu |
| 403 | Tài khoản không ACTIVE hoặc thiếu quyền |
| 404 | Không tìm thấy, hoặc bị ẩn trên API công khai |
| 409 | Trùng email/phone/SKU/slug, hoặc xóa dữ liệu đang được dùng |
| 500 | Lỗi hệ thống |

## Tổng hợp endpoint
| Method | Đường dẫn | Quyền |
|---|---|---|
| POST | /api/auth/register | Guest |
| POST | /api/auth/login | Guest |
| GET | /api/users/me | Đã đăng nhập |
| PUT | /api/users/me | Đã đăng nhập |
| GET | /api/categories | Công khai |
| GET | /api/categories/:id | Công khai |
| POST | /api/categories | Manager/Admin |
| PUT | /api/categories/:id | Manager/Admin |
| DELETE | /api/categories/:id | Manager/Admin |
| GET | /api/products | Công khai |
| GET | /api/products/:id | Công khai |
| POST | /api/products | Manager/Admin |
| PUT | /api/products/:id | Manager/Admin |
| PATCH | /api/products/:id/status | Manager/Admin |
| DELETE | /api/products/:id | Manager/Admin |
| GET | /api/management/categories | Manager/Admin |
| GET | /api/management/products | Manager/Admin |
| GET | /api/management/products/:id | Manager/Admin |

## Xác thực (buổi 03)

### POST /api/auth/register
Body (chỉ 4 trường này): `full_name` (1-100 ký tự), `email`, `phone` (10-15 chữ số, có thể bắt đầu bằng +),
`password` (tối thiểu 8 ký tự, tối đa 72 byte UTF-8).
Luôn tạo vai trò CUSTOMER, trạng thái ACTIVE. Response 201:
```json
{ "success": true, "data": { "id": 5, "full_name": "Nguyễn Văn A", "email": "customer03@example.com",
  "phone": "0900000005", "avatar": null, "status": "ACTIVE", "role": "CUSTOMER" } }
```
Lỗi: 400 dữ liệu sai; 409 email hoặc số điện thoại đã tồn tại.

### POST /api/auth/login
Body: `email`, `password`. Response 200:
```json
{ "success": true, "data": { "accessToken": "...", "tokenType": "Bearer",
  "expiresIn": 3600, "user": { "id": 5, "role": "CUSTOMER" } } }
```
Lỗi: 400 sai định dạng; 401 sai email hoặc mật khẩu; 403 tài khoản không ACTIVE.

### GET /api/users/me
Trả hồ sơ của chủ token (không bao giờ trả `password_hash`). Tham số `userId` trong query bị bỏ qua.

### PUT /api/users/me
Body chỉ gồm `full_name` và `phone` (`phone` có thể là `null`). Trường khác (role_id, status,
password, email) trả 400. Lỗi 409 nếu số điện thoại đã thuộc tài khoản khác.

## Danh mục (buổi 04)
Body POST/PUT (đầy đủ, PUT thay thế toàn bộ): bắt buộc `name`, `slug`, `status` (ACTIVE|INACTIVE),
`display_order`; tùy chọn `description`, `image_url` (http/https). `slug`: chữ thường không dấu,
số và dấu gạch nối. `parent_id` chưa được nhận.

- GET /api/categories: chỉ danh mục ACTIVE. GET /api/categories/:id: 200 hoặc 404.
- POST: 201. Trùng slug: 409.
- PUT /:id: 200 (gửi lại dữ liệu cũ vẫn 200).
- DELETE /:id: 200; 409 nếu còn sản phẩm hoặc danh mục con tham chiếu.

## Sản phẩm (buổi 04)
Body POST/PUT (đầy đủ): bắt buộc `category_id` (number), `sku`, `name`, `slug`, `original_price`,
`sale_price` (chuỗi, 0 <= sale_price <= original_price, tối đa 2 số lẻ), `stock_quantity`
(số nguyên >= 0), `status` (ACTIVE|INACTIVE|DISCONTINUED), `images` (mảng 0-10 URL http/https,
không trùng); tùy chọn `short_description`, `description`.
Ảnh đầu tiên là ảnh chính và được đồng bộ vào `thumbnail`; `images: []` đặt `thumbnail = null`.

- GET /api/products: chỉ sản phẩm ACTIVE thuộc danh mục ACTIVE (hết hàng vẫn hiển thị).
- GET /api/products/:id: chi tiết kèm `images`; 404 nếu bị ẩn.
- POST: 201. Trùng SKU hoặc slug: 409. `category_id` không tồn tại: 400.
- PUT /:id: thay thế dữ liệu và toàn bộ bộ ảnh trong cùng một transaction.
- PATCH /:id/status: body chỉ có `status`.
- DELETE /:id: ngừng kinh doanh (chuyển DISCONTINUED), không xóa bản ghi; khôi phục bằng PATCH ACTIVE.

## Đường dẫn quản lý (buổi 04)
Chỉ Manager/Admin, trả mọi trạng thái: `GET /api/management/categories`,
`GET /api/management/products`, `GET /api/management/products/:id`.
Customer nhận 403, không có token nhận 401.

## Tài khoản mẫu
customer01, customer02, manager01, admin01 (`@example.com`), mật khẩu `Demo@123`. Chỉ dùng khi phát triển.
