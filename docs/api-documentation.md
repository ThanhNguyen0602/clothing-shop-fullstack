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
| 409 | Trùng email/phone/SKU/slug, xóa dữ liệu đang được dùng; giỏ thay đổi, thiếu kho, sản phẩm ngừng bán, vận chuyển/COD không khả dụng |
| 500 | Lỗi hệ thống |
| 503 | Deadlock/hết thời gian chờ khóa: đọc lại giỏ và lịch sử đơn trước khi thử lại |

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
| GET | /api/cart | Customer |
| POST | /api/cart | Customer |
| PUT | /api/cart/:id | Customer |
| DELETE | /api/cart/:id | Customer |
| DELETE | /api/cart | Customer |
| GET | /api/checkout/options | Customer |
| POST | /api/orders | Customer |
| GET | /api/orders/my-orders | Customer |
| GET | /api/orders/:id | Customer |
| PATCH | /api/orders/:id/cancel | Customer sở hữu |
| GET | /api/orders/:id/payments | Customer sở hữu |
| POST | /api/orders/:id/payments | Customer sở hữu |
| GET | /api/products/:productId/reviews | Công khai |
| POST | /api/products/:productId/reviews | Customer |
| PUT | /api/reviews/:id | Customer sở hữu |
| DELETE | /api/reviews/:id | Customer sở hữu |
| GET | /api/management/orders | Manager/Admin |
| GET | /api/management/orders/:id | Manager/Admin |
| PATCH | /api/management/orders/:id/status | Manager/Admin |
| PATCH | /api/management/orders/:id/cancel | Manager/Admin |
| POST | /api/management/orders/:id/collect-cod | Manager/Admin |
| POST | /api/management/orders/:id/simulate-payment | Manager/Admin (chỉ khi bật mô phỏng) |
| GET | /api/management/reviews | Manager/Admin |
| PATCH | /api/management/reviews/:id/status | Manager/Admin |

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
  "data": [ { "id": 21, "sku": "B5-AO-01", "name": "B5 Áo khoác A1", "brand_name": "B5 Aurora",
              "sale_price": "450000.00", "stock_quantity": 5, "thumbnail": "https://..." } ],
  "pagination": { "page": 1, "limit": 5, "total": 1, "totalPages": 1,
                  "hasNextPage": false, "hasPreviousPage": false } }
```
`total = 0` thì `data = []`, `totalPages = 0`. `page` lớn hơn `totalPages` vẫn trả 200, `data` rỗng,
giữ nguyên `total` và `page` đã yêu cầu, hai cờ điều hướng là `false`. Giao diện phải đọc
`pagination.total`, không dùng `data.length` làm tổng.

Ví dụ kết hợp đầy đủ:
`GET /api/products?search=jeans&category=2&brand=1&minPrice=300000&maxPrice=600000&inStock=1&onSale=1&sort=price_asc&page=1&limit=5`

### GET /api/brands
Công khai, chỉ trả thương hiệu ACTIVE (`id`, `name`, `description`, `logo_url`) sắp theo tên, dùng làm dữ liệu cho bộ lọc.

### Phân chia trách nhiệm (tìm kiếm sản phẩm)
- **Controller** (`productController.listPublic`): gọi `parseProductQuery` kiểm tra và chuẩn hóa query, gọi Service, trả HTTP response.
- **Service** (`productSearchService`): mở transaction `REPEATABLE READ`, gọi Model, dựng `pagination`, commit/rollback và release connection.
- **Model** (`productSearchModel`): giữ toàn bộ SQL. `buildWhere` tạo điều kiện và tham số **dùng chung** cho `COUNT(*)` và `SELECT`,
  nên `total` luôn khớp với tập dòng đang được phân trang. Giá trị lọc truyền bằng tham số `?`; kiểu sắp xếp chọn từ danh sách cố định `SORTS`;
  ký tự `%`, `_`, `!` trong `search` được escape. Không JOIN `product_images` để không làm lặp dòng và sai `COUNT`.
- API quản lý `/api/management/products` giữ hợp đồng cũ (không phân trang).

## Kiểm thử bằng Postman
Import các file trong `docs/postman/` (đặt `baseUrl = http://localhost:3000`, không lưu token trong file):

| Collection | Chuẩn bị | Nội dung |
|---|---|---|
| `Buoi03.postman_collection.json` | `npm run seed` | Đăng ký, đăng nhập, hồ sơ, token sai, chống tự nâng quyền, phân quyền; thư mục 5 kiểm thử thủ công tài khoản khóa và token hết hạn |
| `Buoi04.postman_collection.json` | `npm run seed:catalog` | CRUD danh mục/sản phẩm, thay bộ ảnh, ngừng kinh doanh và khôi phục, 401/403/404/409, dữ liệu sai |
| `Buoi05.postman_collection.json` | `npm run seed:search` | Tìm kiếm, lọc, sắp xếp, phân trang, lỗi 400 |
| `Buoi07.postman_collection.json` | `npm run seed:payment`, `npm run seed:clothing`, `ENABLE_MOCK_PAYMENT=true` | Quản lý đơn COD đến COMPLETED, hủy/hoàn kho một lần, online mô phỏng FAILED → SUCCESS, đánh giá và kiểm duyệt; thư mục 6 thủ công |
| `Buoi06.postman_collection.json` | `npm run seed:checkout` | Giỏ cộng dồn/sửa/xóa, đặt một phần giỏ COD, snapshot, quyền sở hữu, dữ liệu sai; thư mục 4 thủ công: thiếu kho, rollback, tranh kho |

Route tạm `GET /api/users/role-check` của buổi 03 đã được xóa sau kiểm thử; phân quyền được kiểm tra trên
`/api/management/*` (Manager/Admin).

## Giỏ hàng và đặt hàng (buổi 06)

Chỉ **CUSTOMER** đã đăng nhập: Guest nhận 401, Manager/Admin nhận 403. `user_id` luôn lấy từ token,
không nhận từ body hoặc query. Giá và tổng tiền luôn do server tính; không nhận `unit_price`, `subtotal`,
`shipping_fee`, `total_amount`, `user_id`, `order_status`, `payment_status` từ client.

### Giỏ hàng
| Method | Đường dẫn | Body | Ý nghĩa |
|---|---|---|---|
| GET | /api/cart | | Giỏ hiện tại (tạo lười nếu chưa có) |
| POST | /api/cart | `product_id`, `quantity` | **Cộng thêm** số lượng; cùng sản phẩm chỉ một dòng |
| PUT | /api/cart/:id | `quantity` | **Đặt** số lượng mới; `:id` là `cart_items.id` |
| DELETE | /api/cart/:id | | Xóa một dòng thuộc giỏ hiện tại |
| DELETE | /api/cart | | Xóa toàn bộ giỏ hiện tại |

`quantity` là JSON number nguyên dương (≤ 2147483647); muốn bỏ sản phẩm dùng DELETE, không gửi 0.
Giỏ tối đa 100 sản phẩm khác nhau. Giỏ không giữ chỗ trong kho. Mọi thao tác trả cùng cấu trúc:

```json
{ "success": true, "data": {
  "items": [ { "id": 15, "product_id": 21, "sku": "B5-ACC-01", "name": "B5 Tất cổ ngắn A1", "thumbnail": "https://...",
               "quantity": 2, "stock_quantity": 20, "unit_price": "25000.00", "total_price": "50000.00",
               "available": true, "reason": null } ],
  "subtotal": "50000.00", "can_checkout": true } }
```
Dòng hết hàng, ngừng bán hoặc thuộc danh mục INACTIVE vẫn được trả với `available: false` và `reason`.
`subtotal` là tổng mọi dòng theo giá hiện tại, chưa gồm phí vận chuyển.
Lỗi: 400 body sai; 404 dòng không thuộc giỏ của bạn; 409 thiếu kho, sản phẩm không còn bán, giỏ đủ 100 dòng.

### GET /api/checkout/options
`{ "shipping_methods": [ { "id", "name", "base_fee", "estimated_days" } ], "payment_methods": [ { "code": "COD", "name" } ] }`
— chỉ các bản ghi ACTIVE.

### POST /api/orders
```json
{ "cart_item_ids": [15], "recipient_name": "Nguyễn Văn A", "recipient_phone": "0900000001",
  "shipping_address": "12 Nguyễn Du, Phường Bến Thành, TP Hồ Chí Minh",
  "shipping_method_id": 3, "payment_method": "COD", "note": "Gọi trước khi giao" }
```
`cart_item_ids`: 1–100 ID dòng giỏ (number, không trùng), có thể chọn một phần giỏ. `recipient_phone`: 10 số,
bắt đầu bằng 0. `payment_method` chỉ nhận `COD`. `note` tùy chọn (bỏ qua hoặc `null`).
Response 201:
```json
{ "success": true, "data": { "id": 9, "order_code": "ORD-<uuid>", "subtotal": "500000.00",
  "shipping_fee": "30000.00", "total_amount": "530000.00", "discount_amount": "0.00",
  "order_status": "PENDING_CONFIRMATION", "payment_status": "UNPAID" } }
```
Trong một transaction: khóa giỏ → kiểm tra dòng thuộc giỏ → khóa sản phẩm theo ID tăng dần → kiểm tra trạng thái và
tồn kho → khóa vận chuyển/COD → ghi `orders`, `order_items` (snapshot tên, giá) → trừ kho → ghi lịch sử ban đầu
(`old_status = NULL`) → xóa các dòng đã mua. Bất kỳ lỗi nào cũng rollback toàn bộ. Gửi lại cùng `cart_item_ids`
sau khi mua nhận 409. Lỗi: 400 body sai; 409 dòng không thuộc giỏ/đã mua, thiếu kho, ngừng bán, vận chuyển hoặc COD
không khả dụng; 503 deadlock/timeout (đọc `my-orders` và giỏ trước khi thử lại, không tự gửi lại).

### GET /api/orders/my-orders
Query chỉ nhận `page` (1–1000000, mặc định 1) và `limit` (1–50, mặc định 10); tham số khác trả 400.
```json
{ "success": true, "data": { "items": [ { "id": 9, "order_code": "ORD-...", "subtotal": "500000.00",
  "shipping_fee": "30000.00", "discount_amount": "0.00", "total_amount": "530000.00",
  "payment_status": "UNPAID", "order_status": "PENDING_CONFIRMATION", "created_at": "..." } ],
  "pagination": { "page": 1, "limit": 10, "has_next": false } } }
```
Khác danh sách sản phẩm: không trả `total`, dùng `has_next` (đọc dư một dòng).

### GET /api/orders/:id
Đơn của chính Customer gồm người nhận, địa chỉ, tiền, trạng thái, `items` (snapshot `product_name`, `unit_price`,
`quantity`, `total_price`) và `history`. Không trả `internal_note`. Đơn của người khác hoặc không tồn tại: 404.

### Phân chia trách nhiệm
Controller kiểm tra body/query và trả HTTP; `cartService`, `orderService`, `checkoutService` xử lý nghiệp vụ,
tính tiền bằng BigInt (`utils/orderMoney.js`) và điều phối transaction; `commerceModel`, `orderModel`,
`checkoutModel` giữ SQL. Seed vận chuyển `B6 Tiêu chuẩn` (30000.00) và COD: `npm run seed:checkout`.

## Quản lý đơn, thanh toán và đánh giá (buổi 07)

Danh sách dùng `page` (mặc định 1) và `limit` (mặc định 10, tối đa 50), trả `pagination.has_next`; query khác trả 400.
Không nhận `user_id`, `amount`, `payment_status` hay giá từ client.

### Trạng thái đơn
```
COD:       PENDING_CONFIRMATION → CONFIRMED → PROCESSING → SHIPPING → DELIVERED → COMPLETED
SIMULATED: PENDING_PAYMENT → (thanh toán SUCCESS) → PENDING_CONFIRMATION → ... → COMPLETED
Hủy:       PENDING_PAYMENT / PENDING_CONFIRMATION / CONFIRMED → CANCELLED khi payment_status là UNPAID hoặc FAILED
```
- `POST /api/orders` nhận `payment_method` là `COD` hoặc `SIMULATED`. COD tạo `PENDING_CONFIRMATION`, SIMULATED tạo `PENDING_PAYMENT`;
  cả hai đều `UNPAID` và đã trừ kho khi đặt.
- `PATCH /api/management/orders/:id/status` body `{ "order_status": "CONFIRMED" | "PROCESSING" | "SHIPPING" | "DELIVERED" | "COMPLETED" }`:
  chỉ đi tiếp đúng một bước (409 nếu bỏ bước/lùi). Gửi lại trạng thái hiện tại trả 200, không thêm lịch sử.
  Đơn online phải PAID trước khi xác nhận; đơn COD chỉ COMPLETED sau khi đã thu tiền.
- `PATCH /api/orders/:id/cancel` (Customer sở hữu) và `PATCH /api/management/orders/:id/cancel` body `{ "reason": "..." }`:
  khóa đơn, hủy phiên PENDING, hoàn đúng `order_items.quantity` theo product_id tăng dần, lưu `cancel_reason`, thêm một lịch sử.
  Gửi lại trả 200, không hoàn kho lần hai. Đơn đã PROCESSING trở đi hoặc đã PAID: 409.

### Thanh toán
- `POST /api/management/orders/:id/collect-cod` body `{}`: chỉ khi đơn COD đã DELIVERED và UNPAID; tạo giao dịch
  `COD-<id>` SUCCESS với `amount = total_amount`, đặt PAID. Gửi lại khi đã PAID trả 200, không tạo giao dịch thứ hai.
- `POST /api/orders/:id/payments` body `{}` (Customer): đơn SIMULATED đang PENDING_PAYMENT; trả phiên PENDING đang có
  hoặc tạo phiên mới `SIM-<uuid>`. `GET /api/orders/:id/payments` trả `payment_status` và mọi phiên (mới nhất trước).
- `POST /api/management/orders/:id/simulate-payment` body `{ "transaction_code", "status": "SUCCESS" | "FAILED" }`:
  Manager/Admin đóng vai cổng thanh toán. SUCCESS → đơn PAID + PENDING_CONFIRMATION + lịch sử; FAILED → đơn FAILED, giữ
  PENDING_PAYMENT (Customer tạo phiên mới để thử lại). Gửi lại cùng kết quả trả 200; kết quả ngược lại hoặc phiên đã
  CANCELLED trả 409.
- Mô phỏng chỉ hoạt động khi `ENABLE_MOCK_PAYMENT=true` và `NODE_ENV` khác `production`; ngược lại 403. Không có callback
  công khai, không thu tiền thật. Seed phương thức: `npm run seed:payment`.

### Đánh giá
- `GET /api/products/:productId/reviews` (công khai): chỉ đánh giá VISIBLE của sản phẩm và danh mục ACTIVE;
  `{ items, summary: { count, average }, pagination }`. `average` có thể là chuỗi DECIMAL; chưa có đánh giá trả 0.
- `POST /api/products/:productId/reviews` body `{ order_item_id, rating (1–5), title?, content }`: dòng mua phải thuộc
  Customer, đúng sản phẩm trên URL và đơn COMPLETED (404 không thuộc, 409 chưa hoàn tất hoặc đã đánh giá).
- `PUT /api/reviews/:id` body `{ rating, title?, content }`: giữ nguyên trạng thái kiểm duyệt. `DELETE /api/reviews/:id`:
  409 nếu đã có ảnh/bình luận.
- `PATCH /api/management/reviews/:id/status` body `{ "status": "VISIBLE" | "HIDDEN", "reason" }` (reason bắt buộc khi HIDDEN).

### Ghi chú định tuyến
`productRoutes` gắn guard Manager/Admin cho **từng** route ghi thay vì `router.use(...)`. Nếu giữ `router.use` như buổi 04,
mọi request còn lại dưới `/api/products` (gồm `GET /api/products/:productId/reviews` và `POST` đánh giá) bị chặn 401/403
trước khi tới `purchaseActionRoutes`. Thứ tự mount: các router buổi 03–06 → `/api/management` (orderWorkflowRoutes) →
`/api` (purchaseActionRoutes) → 404 → errorHandler.

## Dữ liệu mẫu quần áo
`npm run seed:clothing`: 6 danh mục (Áo thun, Áo sơ mi, Áo khoác, Quần jeans, Quần kaki & short, Váy đầm), 4 thương hiệu
tự đặt tên và 20 sản phẩm SKU `CL-*` (13 sản phẩm giảm giá, 2 hết hàng, mỗi sản phẩm 2 ảnh minh họa). Chạy lại không trùng,
không ghi đè bản ghi đã có.

## Front-end (buổi 08–10)
React + Vite gọi API qua `services/api.js` (`VITE_API_URL=http://localhost:3000/api`):
`authService` (`/auth/register`, `/auth/login`, `/users/me`), `catalogService` (`/products?page&limit=6`,
`/products/:id`, `/products/:id/reviews?limit=5`, `POST /cart`). Token lưu trong `sessionStorage` với khóa
`greenshop.accessToken`; khi tải lại, `AuthProvider` gọi `GET /users/me` trước khi render route.

## Mở rộng: biến thể, ảnh upload, địa chỉ, tài khoản, quản trị

### Biến thể màu / size (`product_variants`, tạo bằng `npm run migrate`)
- `GET /api/products/:id` trả thêm `variants` (chỉ ACTIVE); `GET /api/management/products/:id` trả mọi biến thể.
- Manager/Admin: `POST /api/products/:id/variants`, `PUT /api/products/:id/variants/:variantId`,
  `DELETE /api/products/:id/variants/:variantId`. Body
  `{ sku?, color, size, price_adjustment: "0.00", stock_quantity, status: "ACTIVE" | "INACTIVE" }`.
  Trùng (sản phẩm, màu, size) → 409; xóa biến thể đã nằm trong giỏ/đơn → 409. Mọi thao tác trả lại chi tiết sản phẩm.
- Khi sản phẩm có biến thể: `products.stock_quantity` = tổng tồn kho biến thể ACTIVE (đồng bộ trong cùng transaction).
- `POST /api/cart` nhận thêm `variant_id` (number hoặc null). Sản phẩm có biến thể mà thiếu `variant_id` → 409
  "Vui lòng chọn màu và kích thước". Giá dòng = `sale_price + price_adjustment`. Mỗi biến thể là một dòng giỏ riêng.
- Đặt hàng trừ kho cả biến thể và sản phẩm; `order_items` lưu `variant_id`, `variant_label` ("Trắng / M").
  Hủy đơn hoàn kho cả hai.

### Ảnh sản phẩm (upload)
- `POST /api/products/:id/images` (multipart, trường `image`): JPG/PNG/WEBP, ≤ 5 MB, kiểm tra chữ ký file, tối đa
  10 ảnh/sản phẩm. Ảnh đầu tiên thành ảnh chính và thumbnail. File lưu ở `backend/uploads/products`, phục vụ qua
  `GET /uploads/products/<file>`; URL tuyệt đối dựa vào `PUBLIC_API_ORIGIN` hoặc host của request.
- `PATCH /api/products/:id/images/:imageId/primary`, `DELETE /api/products/:id/images/:imageId` (xóa luôn file local).

### Sổ địa chỉ (Customer) – `/api/addresses`
`GET /`, `POST /` (201), `PUT /:id`, `PATCH /:id/default`, `DELETE /:id`. Body
`{ recipient_name, recipient_phone (0xxxxxxxxx), province, district?, ward, street_address, note?, is_default? }`.
Tối đa 10 địa chỉ; địa chỉ đầu tiên là mặc định; xóa địa chỉ mặc định thì địa chỉ mới nhất còn lại thành mặc định.

### Đổi mật khẩu
`PUT /api/users/me/password` body `{ current_password, new_password }` (mới khác cũ, 8–72 byte). Sai mật khẩu hiện tại → 400.

### Dashboard (Manager/Admin)
`GET /api/management/dashboard` → `{ total_orders, revenue, total_products, low_stock, total_customers,
low_stock_threshold, statuses[], top_products[], low_stock_items[] }`. Doanh thu chỉ tính đơn COMPLETED; ngưỡng sắp hết = 5.

### Lọc đơn quản lý
`GET /api/management/orders?status=CONFIRMED&search=ORD...&page&limit`: `search` tìm theo mã đơn hoặc tên người nhận
(≤ 60 ký tự); mỗi dòng có `payment_method`. Chi tiết đơn quản lý trả thêm `payments[]`; chi tiết đơn của Customer
trả thêm `payment_method`, `cancel_reason`.

### Quản trị (Admin) – `/api/admin`
- `GET /users?search&role&status&page&limit`, `POST /users` (tạo MANAGER/ADMIN), `PATCH /users/:id/role` `{ role }`,
  `PATCH /users/:id/status` `{ status: ACTIVE | LOCKED | DISABLED }`. Không tự đổi vai trò/trạng thái của mình (409).
  Mọi thay đổi ghi `audit_logs`.
- `GET /settings`, `PUT /settings` với các khóa `shop_name, contact_email, contact_phone, shop_address,
  shipping_note, return_policy` (chuỗi ≤ 2000 ký tự; khóa lạ → 400).
- Công khai: `GET /api/settings` (header/footer/trang chính sách đọc từ đây).

## Front-end giao diện TV Studio
- Giữ cấu trúc môn: `AuthProvider` (sessionStorage `greenshop.accessToken`), `RequireAuth`/`GuestOnly`, Arrow Function.
- `services/api.js` có interceptor tự gắn `Authorization: Bearer <token>`.
- Route: `/`, `/products`, `/products/:id`, `/info/:slug`, `/login`, `/register` (nền DotGrid, ngoài MainLayout),
  `/profile`, `/cart`, `/checkout`, `/orders`, `/orders/:id`; `/manager` (dashboard, `products`,
  `products/:id/assets`, `categories`, `orders`, `reviews`); `/admin` (dashboard, `users`, `settings`).

## Dọn dữ liệu không phải thời trang
Các seeder buổi 04–05 trước đây tạo danh mục/sản phẩm công nghệ (điện thoại, laptop, tai nghe…). Nay
`seed:catalog` và `seed:search` chỉ tạo đồ thời trang (giữ đủ 5 SKU `DEMO-*`, 15 SKU `B5-*` với cùng cấu trúc
trạng thái để Postman buổi 04–05 vẫn chạy). Với database đã nạp dữ liệu cũ:
```bash
npm run cleanup:non-fashion          # chỉ liệt kê, chưa xóa
npm run cleanup:non-fashion -- --yes # xóa trong một transaction (lỗi thì rollback)
npm run seed:catalog && npm run seed:search
```
Script xóa sản phẩm thuộc danh mục công nghệ cùng ảnh, biến thể, dòng giỏ, đánh giá và **đơn hàng thử nghiệm có chứa
các sản phẩm đó** (hàng thời trang chung đơn được hoàn kho), rồi xóa các danh mục công nghệ đã trống.
