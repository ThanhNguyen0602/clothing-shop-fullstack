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
| GET | /api/products | Công khai (tìm kiếm, lọc, sắp xếp, phân trang) |
| GET | /api/brands | Công khai |
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
không trùng); tùy chọn `short_description`, `description`, `brand_id` (số dương hoặc `null`; bỏ qua = `null`;
PUT là thay thế đầy đủ nên muốn giữ thương hiệu phải gửi lại `brand_id`).
Ảnh đầu tiên là ảnh chính và được đồng bộ vào `thumbnail`; `images: []` đặt `thumbnail = null`.

- GET /api/products: xem mục "Tìm kiếm, lọc và phân trang" bên dưới.
- GET /api/products/:id: chi tiết kèm `images`; 404 nếu bị ẩn.
- POST: 201. Trùng SKU hoặc slug: 409. `category_id` không tồn tại: 400.
  `brand_id` không tồn tại, không phải số, hoặc thương hiệu INACTIVE: 400.
- PUT /:id: thay thế dữ liệu và toàn bộ bộ ảnh trong cùng một transaction.
- PATCH /:id/status: body chỉ có `status`.
- DELETE /:id: ngừng kinh doanh (chuyển DISCONTINUED), không xóa bản ghi; khôi phục bằng PATCH ACTIVE.

## Đường dẫn quản lý (buổi 04)
Chỉ Manager/Admin, trả mọi trạng thái: `GET /api/management/categories`,
`GET /api/management/products`, `GET /api/management/products/:id`.
Customer nhận 403, không có token nhận 401.

## Tài khoản mẫu
customer01, customer02, manager01, admin01 (`@example.com`), mật khẩu `Demo@123`. Chỉ dùng khi phát triển.

## Tìm kiếm, lọc và phân trang (buổi 05)

`GET /api/products` công khai, không cần token. Các điều kiện kết hợp bằng AND; `search` tìm trong tên
hoặc SKU (OR đặt trong ngoặc). Luôn chỉ trả sản phẩm ACTIVE thuộc danh mục ACTIVE.

| Tham số | Giá trị hợp lệ | Mặc định / ý nghĩa |
|---|---|---|
| search | chuỗi tối đa 100 ký tự sau trim | rỗng = bỏ qua |
| category | ID số nguyên dương | lọc đúng một danh mục (không mở rộng danh mục con) |
| brand | ID số nguyên dương | lọc đúng một thương hiệu |
| minPrice, maxPrice | 0 đến 9999999999999.99, tối đa 2 số lẻ | theo `sale_price`, gồm cả biên; minPrice <= maxPrice |
| inStock | 1 hoặc 0 | 1 còn hàng, 0 hết hàng |
| onSale | 1 hoặc 0 | 1 giá bán < giá gốc, 0 không giảm |
| sort | newest, price_asc, price_desc, name_asc, name_desc | newest |
| page | 1 đến 1000000 | 1 |
| limit | 1 đến 100 | 12 |

Tham số lạ, giá trị rỗng, tham số lặp lại hoặc dạng mảng/object trả 400. ID đúng cú pháp nhưng không
tồn tại trả 200 với danh sách rỗng. Response:
```json
{ "success": true,
  "data": [ { "id": 21, "sku": "B5-PHONE-01", "name": "B5 Điện thoại A1", "brand_name": "B5 Aurora",
              "sale_price": "4500000.00", "stock_quantity": 5, "thumbnail": "https://..." } ],
  "pagination": { "page": 1, "limit": 5, "total": 1, "totalPages": 1,
                  "hasNextPage": false, "hasPreviousPage": false } }
```
`total = 0` thì `data = []`, `totalPages = 0`. `page` lớn hơn `totalPages` vẫn trả 200, `data` rỗng,
giữ nguyên `total` và `page` đã yêu cầu, hai cờ điều hướng là `false`. Giao diện phải đọc
`pagination.total`, không dùng `data.length` làm tổng.

Ví dụ kết hợp đầy đủ:
`GET /api/products?search=laptop&category=2&brand=1&minPrice=10000000&maxPrice=20000000&inStock=1&onSale=1&sort=price_asc&page=1&limit=5`

### GET /api/brands
Công khai, chỉ trả thương hiệu ACTIVE (`id`, `name`, `description`, `logo_url`) sắp theo tên, dùng làm dữ liệu cho bộ lọc.

### Phân chia trách nhiệm (tìm kiếm sản phẩm)
- **Controller** (`productController.listPublic`): gọi `parseProductQuery` kiểm tra và chuẩn hóa query, gọi Service, trả HTTP response.
- **Service** (`productSearchService`): mở transaction `REPEATABLE READ`, gọi Model, dựng `pagination`, commit/rollback và release connection.
- **Model** (`productSearchModel`): giữ toàn bộ SQL. `buildWhere` tạo điều kiện và tham số **dùng chung** cho `COUNT(*)` và `SELECT`,
  nên `total` luôn khớp với tập dòng đang được phân trang. Giá trị lọc truyền bằng tham số `?`; kiểu sắp xếp chọn từ danh sách cố định `SORTS`;
  ký tự `%`, `_`, `!` trong `search` được escape. Không JOIN `product_images` để không làm lặp dòng và sai `COUNT`.
- API quản lý `/api/management/products` giữ hợp đồng cũ (không phân trang).
