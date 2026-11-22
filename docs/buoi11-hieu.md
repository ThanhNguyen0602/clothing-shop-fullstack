# Buổi 11 – Hiếu: Đánh giá sản phẩm và điều hướng theo vai trò

## 1. Phạm vi phụ trách

Theo phân công Buổi 11, Hiếu phụ trách:

- Trang chi tiết `/products/:id`: hiển thị danh sách đánh giá và điểm sao trung bình.
- Điều hướng sau đăng nhập: Customer → `/`, Manager → `/manager`, Admin → `/admin` (Customer có thể trở về một số trang hợp lệ đã yêu cầu trước khi đăng nhập).

Tìm kiếm, lọc, phân trang sản phẩm và giỏ hàng là phần của Thanh/Vinh; **không sửa các phần đó**.

## 2. Ghi chú phần code bổ sung (add-only)

Tất cả code có sẵn được giữ nguyên; chỉ **chèn 2 dòng** vào file cũ dưới đây:

| Thư mục/file | Dòng trong bản bàn giao | Code mới | Tác dụng |
|---|---:|---|---|
| `frontend/src/components/products/ProductReviews.jsx` | 6 | `import ReviewRatingOverview from "./ReviewRatingOverview";` | Import khung hiển thị điểm sao |
| `frontend/src/components/products/ProductReviews.jsx` | 22 | `<ReviewRatingOverview summary={data.summary} />` | Hiển thị điểm sao từ dữ liệu đánh giá của API |

**Các file mới (không thay code cũ):**

| Thư mục/file | Chức năng |
|---|---|
| `frontend/src/components/products/ReviewRatingOverview.jsx` | Giao diện khung điểm trung bình, số lượt đánh giá và sao trực quan |
| `frontend/src/styles/review-rating-overview.css` | CSS khung đánh giá, hỗ trợ màn hình nhỏ |
| `frontend/src/utils/reviewRating.js` | Chuẩn hóa điểm sao/số đánh giá, giới hạn giá trị không hợp lệ |
| `frontend/tests/buoi11-hieu.test.mjs` | Kiểm tra logic điểm sao và điều hướng 3 vai trò |
| `docs/buoi11-hieu.md` | Tài liệu thay đổi, cách kiểm thử, kết quả và giới hạn kiểm thử |

**Những file không sửa:** `frontend/src/routes/AuthGuards.jsx`, các route đăng nhập, trang sản phẩm, các API, backend, database, `README.md`, `docs/test-results.md`, `docs/project-plan.md` và những tài liệu nhóm khác.

## 3. Kiểm tra trên máy tính

### A. Kiểm tra tự động

Từ thư mục gốc của project (cần Node.js):

```powershell
cd frontend
node --test tests/buoi11-hieu.test.mjs
```

Kỳ vọng: `tests 9`, `pass 9`, `fail 0`.

### B. Kiểm tra thực tế trên website

Nếu nhóm đã có môi trường MySQL và file `.env` hoạt động, dùng cấu hình đó. Nếu chưa cài, xem hướng dẫn gốc của nhóm; không đưa file `.env` lên GitHub.

Từ thư mục gốc project:

```powershell
npm install
npm install --prefix backend
npm install --prefix frontend
npm run dev
```

Mở `http://localhost:5173` rồi kiểm tra:

1. Vào `/products`, chọn một sản phẩm → đến phần **Đánh giá sản phẩm**.
2. Nếu sản phẩm có đánh giá công khai: kiểm tra điểm trung bình 0–5, sao tương ứng, tổng lượt đánh giá và danh sách nhận xét.
3. Nếu chưa có đánh giá: khung phải báo chưa có đánh giá; không hiển thị điểm trung bình giả.
4. Đăng nhập tài khoản Customer → trang chủ `/`; Manager → `/manager`; Admin → `/admin`.
5. Với Customer đã mở `/cart` khi chưa đăng nhập, đăng nhập xong có thể quay lại `/cart` (theo logic route guard có sẵn).
6. Mở DevTools (F12) → chế độ màn hình di động để xem khung đánh giá có vỡ bố cục hay không.

Để thử đăng nhập và xem đánh giá thực, cần backend và MySQL hoạt động cùng dữ liệu mẫu. Kết quả kiểm thử tự động **không thay thế** kiểm thử trên giao diện.

## 4. Kết quả kiểm thử đã thực hiện

- Ngày: 20/11/2026.
- Unit test Node.js: **9/9 đạt** trong môi trường tạo file.
- So sánh ZIP với code nhóm: mọi file có sẵn giữ nguyên byte, ngoại trừ 2 dòng chèn thêm trong `ProductReviews.jsx`.
- Chưa xác nhận build Vite hoặc kiểm thử MySQL end-to-end trong môi trường tạo file (không tải được thư viện npm tại đây).
- Cần kiểm tra lại trên máy nhóm trước khi tạo Pull Request.

## 5. Quy trình Git để tránh ảnh hưởng code nhóm

1. Chuyển sang nhánh `feat/hieu-buoi11-reviews-redirect` trên bản clone mới nhất.
2. Copy 5 file mới được liệt kê tại mục 2 (gồm tài liệu này); không chép đè bất kỳ file nào đang tồn tại.
3. Trong `ProductReviews.jsx`, tự thêm đúng 2 dòng vào vị trí trong bảng trên nếu chưa có.
4. Xem **Changes** trong GitHub Desktop: chỉ có các dòng thêm, **không có dòng đỏ bị xóa/thay thế**.
5. Chạy test và kiểm tra trên website, sau đó Commit → Push → mở Pull Request để Thanh duyệt.
