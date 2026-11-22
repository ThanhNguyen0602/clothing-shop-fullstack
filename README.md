# Web bán quần áo (Full-stack)

Đồ án cuối khóa Full-stack: website thương mại điện tử bán quần áo.

## Công nghệ
- Front-end: React + Vite, Axios, React Router, Bootstrap 5 + React-Bootstrap, font Be Vietnam Pro
- Back-end: Node.js + Express (CommonJS, Arrow Function)
- Database: MySQL 8.0 (`mysql2/promise`)
- Xác thực: JWT (HS256, hạn 1 giờ) + bcrypt

## Trạng thái các buổi
| Buổi | Nội dung | Trạng thái |
|---|---|---|
| 01 | Setup monorepo, Express, React + Vite | Hoàn thành |
| 02 | Schema 23 bảng (`backend/database/schema.sql`) | Hoàn thành |
| 03 | Đăng ký, đăng nhập JWT, hồ sơ, phân quyền | Hoàn thành |
| 04 | API danh mục, sản phẩm, bộ ảnh, seeder | Hoàn thành |
| 05 | Tìm kiếm, lọc, sắp xếp, phân trang sản phẩm; `GET /api/brands` | Hoàn thành |
| 06 | Giỏ hàng, đặt hàng COD, trừ kho trong transaction | Hoàn thành |
| 07 | Quản lý đơn, hủy/hoàn kho, COD, thanh toán mô phỏng, đánh giá | Hoàn thành code, chờ kiểm thử trên máy |
| 08 | Bố cục và điều hướng React | Hoàn thành code, chờ kiểm thử trên máy |
| 09 | Đăng ký, đăng nhập, khôi phục phiên, bảo vệ route, hồ sơ | Hoàn thành code, chờ kiểm thử trên máy |
| 10 | Danh sách, chi tiết sản phẩm, ảnh, đánh giá, thêm giỏ | Hoàn thành code, chờ kiểm thử trên máy |
| 11 | Tìm kiếm, lọc (khoảng giá tự nhập), sắp xếp, phân trang đồng bộ URL; giỏ hàng; `GET /api/health` | API đã kiểm thử, chờ kiểm thử giao diện |
| Mở rộng | Giao diện TV Studio; giỏ hàng, đặt hàng, đơn hàng, khu Manager/Admin trên React; biến thể màu/size, upload ảnh, sổ địa chỉ, đổi mật khẩu, dashboard, quản lý người dùng, cấu hình | Hoàn thành code, chờ kiểm thử trên máy |

## Cách chạy
1. Clone repo và cài thư viện:
   ```bash
   npm install
   npm install --prefix backend
   npm install --prefix frontend
   ```
2. Tạo `backend/.env` và `frontend/.env` từ các file `.env.example`.
   Điền thông tin MySQL; đặt `JWT_SECRET` là chuỗi ngẫu nhiên tối thiểu 32 byte:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. Tạo database: mở `backend/database/schema.sql` trong MySQL Workbench rồi Execute toàn bộ file.
   Sau đó chạy migration bổ sung bảng biến thể (tại thư mục `backend`, chạy lại nhiều lần vẫn an toàn):
   ```bash
   npm run migrate
   ```
4. Nạp dữ liệu mẫu (chạy tại thư mục `backend`):
   ```bash
   npm run seed
   npm run verify:seed
   npm run seed:catalog
   npm run seed:search
   npm run seed:checkout
   npm run seed:payment
   npm run seed:clothing   # 20 sản phẩm quần áo mẫu
   npm run seed:variants   # màu/size cho 20 sản phẩm CL-* (cần chạy migrate trước)
   ```
   Database đã nạp dữ liệu mẫu cũ (điện thoại, laptop, danh mục "B5 …" trùng lặp)? Dọn rồi seed lại:
   ```bash
   npm run cleanup:non-fashion          # xem trước, chưa xóa
   npm run cleanup:non-fashion -- --yes # xóa thật
   npm run seed:catalog && npm run seed:search && npm run seed:variants
   npm run images:samples               # thay ảnh xám bằng ảnh minh họa quần áo
   ```
   Ảnh minh họa nằm ở `backend/public/samples`, phục vụ qua `http://localhost:3000/samples/...`.
5. Chạy cả hai phần từ thư mục gốc:
   ```bash
   npm run dev
   ```
   Back-end: http://localhost:3000 | Front-end: http://localhost:5173

   Lần đầu sau khi cập nhật giao diện TV Studio phải chạy lại `npm install --prefix backend`
   (thêm `multer`) và `npm install --prefix frontend` (thêm `bootstrap`, `react-bootstrap`).
   Ảnh tải lên lưu ở `backend/uploads/products` (đã có trong `.gitignore`).

## Tài khoản mẫu (chỉ dùng trên máy phát triển)
| Email | Vai trò | Mật khẩu |
|---|---|---|
| customer01@example.com | CUSTOMER | Demo@123 |
| customer02@example.com | CUSTOMER | Demo@123 |
| manager01@example.com | MANAGER | Demo@123 |
| admin01@example.com | ADMIN | Demo@123 |

Seeder bị chặn khi `NODE_ENV=production`.

## Cấu trúc
```
backend/
  database/        schema.sql, kiểm tra cấu trúc và ràng buộc
  src/
    config/        kết nối MySQL (pool)
    routes/        khai báo endpoint + middleware
    controllers/   nhận request, trả response
    services/      nghiệp vụ, điều phối transaction (từ buổi 04)
    models/        SQL có tham số
    middlewares/   requireAuth, authorize, errorHandler
    utils/         validation, helper, withTransaction
    seeders/       dữ liệu mẫu
frontend/src/
  components/      common (header, menu, footer, phân trang…), auth (AuthLayout + nền DotGrid),
                   products (thẻ sản phẩm, chọn màu/size), account (đổi mật khẩu, sổ địa chỉ)
  pages/           trang khách hàng; manager/ (dashboard, sản phẩm, ảnh/biến thể, danh mục,
                   đơn, đánh giá); admin/ (người dùng, cấu hình)
  layouts/ routes/ services/ hooks/ contexts/ utils/ styles/
docs/              thiết kế CSDL, tài liệu API, kế hoạch, collection Postman
```

## Quy ước
- Chỉ dùng Arrow Function; CommonJS ở back-end (`require`, `module.exports`).
- Luồng module mới: Router -> Controller -> Service -> Model -> MySQL.
- Response: `{ success: true, data }` hoặc `{ success: false, message }`.
- Commit: `feat`, `fix`, `docs`, `refactor`, `style`, `test`, `chore`.
- Mỗi chức năng làm trên nhánh `feature/*` từ `develop`, merge bằng Pull Request.
- Không commit `.env`.

Chi tiết API: [docs/api-documentation.md](docs/api-documentation.md).
