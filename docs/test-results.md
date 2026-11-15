# Kết quả kiểm thử

Ghi kết quả **thực tế** sau khi chạy trên máy (MySQL InnoDB). Không sửa CSDL để kết quả khớp kỳ vọng.
Dán order_code, số liệu hoặc ảnh chụp Postman/Workbench vào cột "Thực tế".

## Buổi 06 – Giỏ hàng và đặt hàng

Môi trường: MySQL `SELECT @@transaction_isolation;` = ☐ (cần `REPEATABLE-READ`) · Ngày chạy: ☐ · Người chạy: ☐

### 1. Collection Runner `Buoi06 Cart Order` (thư mục 0–3)
| Hạng mục | Kỳ vọng | Thực tế |
|---|---|---|
| Số test pass/tổng | Tất cả pass | ☐ |
| POST cộng dồn | Một dòng, quantity = 3 | ☐ |
| PUT đặt số lượng | quantity = 2, total_price = 500000.00 | ☐ |
| subtotal 2 sản phẩm | 1300000.00 | ☐ |
| Giỏ còn sau đăng nhập lại | 2 dòng | ☐ |

### 2. Tính tổng và snapshot
| Hạng mục | Kỳ vọng | Thực tế |
|---|---|---|
| order_code | ORD-… | ☐ |
| subtotal / shipping_fee / discount / total | 500000.00 / 30000.00 / 0.00 / 530000.00 | ☐ |
| order_status / payment_status | PENDING_CONFIRMATION / UNPAID | ☐ |
| Kho B5-ACC-01 trước → sau | giảm đúng 2 | ☐ |
| Giỏ sau khi mua một phần | còn dòng B5-ACC-03, không còn dòng đã mua | ☐ |
| Gửi lại cùng request | 409, số đơn và kho không đổi | ☐ |
| Đổi tên/giá sản phẩm rồi đọc đơn cũ | unit_price 250000.00, tên cũ giữ nguyên | ☐ |
| Lịch sử ban đầu | old_status NULL → PENDING_CONFIRMATION, changed_by = id Customer A | ☐ |

```sql
SELECT id, order_code, user_id, subtotal, shipping_fee, total_amount, order_status, payment_status
FROM orders WHERE order_code = 'ORD-thay-bang-ma-thuc';
SELECT * FROM order_items WHERE order_id = 123;            -- thay 123 bằng id thật
SELECT * FROM order_status_histories WHERE order_id = 123 ORDER BY id;
SELECT cart_id, product_id, COUNT(*) AS occurrences
FROM cart_items GROUP BY cart_id, product_id HAVING COUNT(*) > 1;   -- phải 0 dòng
```

### 3. Quyền sở hữu
| Hạng mục | Kỳ vọng | Thực tế |
|---|---|---|
| Guest / token lỗi | 401 | ☐ |
| Manager/Admin gọi route mua hàng | 403 | ☐ |
| Token B PUT/DELETE dòng giỏ của A | 404, giỏ A giữ nguyên | ☐ |
| Token B GET đơn của A | 404 | ☐ |
| Token B đặt bằng dòng giỏ của A | 409, không tạo đơn | ☐ |

### 4. Thiếu kho và rollback (thư mục 4)
| Hạng mục | Kỳ vọng | Thực tế |
|---|---|---|
| Checkout 2 dòng khi 1 dòng thiếu kho | 409; không đơn/chi tiết/lịch sử mới; kho không đổi; giỏ còn 2 dòng | ☐ |
| Có dòng `THU_ROLLBACK_BUOI_06` | 500; số đơn, kho, giỏ như trước | ☐ |
| Xóa dòng thử, gửi lại | 201 | ☐ |

### 5. Hai Customer cùng mua hàng cuối
Sản phẩm thử: SKU ☐, stock_quantity ban đầu = 1.

| Request | Thời điểm gửi | Mã trả về | order_code |
|---|---|---|---|
| Customer A | ☐ | ☐ | ☐ |
| Customer B | ☐ | ☐ | ☐ |

Kỳ vọng: một 201, một 409 (hoặc 503 rồi đọc lại); tồn kho cuối = 0; chỉ một đơn; giỏ bên thất bại còn dòng.
Thực tế: ☐

### 6. Kiểm thử hồi quy
| Collection | Kết quả |
|---|---|
| Buoi03 Auth | ☐ |
| Buoi04 Catalog | ☐ |
| Buoi05 Product Discovery | ☐ |

### Ghi chú kiểm thử logic không cần MySQL
Trước khi bàn giao, service giỏ hàng/đặt hàng đã được chạy với DB giả lập trong bộ nhớ (15/15 kịch bản: cộng dồn,
đặt số lượng, tính tiền BigInt, mua một phần, gửi lại 409, snapshot, quyền sở hữu, thiếu kho, vận chuyển/COD tắt,
rollback khi lỗi giữa chừng, hàng cuối). Phép thử này **không thay thế** bài thử đồng thời trên MySQL InnoDB ở mục 5.

## Buổi 07 – Quản lý đơn, thanh toán và đánh giá

Chuẩn bị: `npm run seed:payment` (lần 2 báo "đã có"), `npm run seed:clothing`, `ENABLE_MOCK_PAYMENT=true`, khởi động lại backend.

| Hạng mục | Kỳ vọng | Thực tế |
|---|---|---|
| Collection Runner `Buoi07` (thư mục 0–5) | Tất cả pass | ☐ |
| COD: CONFIRMED gửi lại | 200, lịch sử không tăng | ☐ |
| COD: bỏ bước sang SHIPPING | 409 | ☐ |
| COD: COMPLETED trước collect-cod | 409 | ☐ |
| collect-cod 2 lần | 1 giao dịch SUCCESS, amount = total_amount, có paid_at | ☐ |
| Hủy đơn: kho trước → sau, gửi lại 2 lần | Tăng đúng quantity một lần; 1 lịch sử CANCELLED | ☐ |
| Hủy đơn PROCESSING / đơn online PAID | 409, kho không đổi | ☐ |
| Online: tạo phiên 2 lần | Cùng transaction_code | ☐ |
| Online: FAILED rồi SUCCESS | tx1 FAILED, tx2 SUCCESS; đơn PAID + PENDING_CONFIRMATION | ☐ |
| Online: hủy trước kết quả, SUCCESS muộn | Phiên CANCELLED; 409; đơn vẫn CANCELLED, UNPAID | ☐ |
| Đánh giá: đơn chưa COMPLETED / dòng của người khác / sai sản phẩm | 409 / 404 / 404 | ☐ |
| Ẩn đánh giá | Không còn trong GET công khai; count/average không tính | ☐ |
| Sửa khi đang ẩn | Vẫn HIDDEN | ☐ |
| Thủ công: rollback `THU_ROLLBACK_BUOI_07` | 500; kho và đơn không đổi | ☐ |
| Thủ công: ENABLE_MOCK_PAYMENT=false | 403 khi tạo phiên và simulate | ☐ |
| Thủ công: hủy và SUCCESS cùng lúc | Một 200, một 409; không vừa PAID vừa CANCELLED | ☐ |

```sql
SELECT id, order_status, payment_status, total_amount, cancel_reason FROM orders WHERE id = 123;
SELECT old_status, new_status, changed_by, note FROM order_status_histories WHERE order_id = 123 ORDER BY id;
SELECT transaction_code, amount, status, paid_at FROM payments WHERE order_id = 123 ORDER BY id;
SELECT order_item_id, COUNT(*) AS occurrences FROM reviews GROUP BY order_item_id HAVING COUNT(*) > 1;  -- 0 dòng
```

## Buổi 08 – Bố cục và điều hướng React

| Thao tác | Kỳ vọng | Thực tế |
|---|---|---|
| `/` → Sản phẩm → logo | Header/Footer không nhân đôi; chỉ mục đang xem active | ☐ |
| `/products/12`, `/products/abc`, `/products/0` | Trang chi tiết (buổi 10 gọi API) / không tìm thấy | ☐ |
| `/khong-co`, `/manager/khong-co` (đã đăng nhập Manager) | NotFound trong đúng layout | ☐ |
| Back/Forward, F5 tại `/products/12` | Nội dung khớp URL | ☐ |
| 375px / 768px / 960px / 1440px, zoom 200% | Không cuộn ngang; menu mobile mở/đóng, Escape đóng | ☐ |
| `npm run build` và `npm run preview -- --port 4173` | Build thành công, điều hướng được | ☐ |

## Buổi 09 – Xác thực và hồ sơ

| Thao tác | Kỳ vọng | Thực tế |
|---|---|---|
| Đăng ký email/điện thoại mới | 201, sang đăng nhập với email điền sẵn | ☐ |
| Mật khẩu xác nhận khác | Báo lỗi, không gửi request | ☐ |
| Email/điện thoại trùng | 409, thông báo tại form | ☐ |
| Sai mật khẩu | 401, vẫn thử lại được | ☐ |
| Mở `/checkout` khi chưa đăng nhập rồi đăng nhập Customer | Quay về `/checkout` | ☐ |
| Manager mở `/admin` | Đích mặc định `/manager`; `/admin` báo thiếu quyền | ☐ |
| Admin mở `/manager` | Đích mặc định `/admin`; vào được `/manager` | ☐ |
| F5 tại `/profile` | GET `/users/me` rồi mới hiện nội dung | ☐ |
| Đổi tên, bỏ trống điện thoại | PUT gửi `phone: null`; tải lại vẫn đúng | ☐ |
| Dừng backend rồi F5 khi đang đăng nhập | Màn hình lỗi kết nối; Thử lại thành công khi backend chạy | ☐ |
| Đăng xuất trong khu vực quản lý | Token bị xóa, về trang đăng nhập | ☐ |

## Buổi 10 – Danh sách và chi tiết sản phẩm

| Thao tác | Kỳ vọng | Thực tế |
|---|---|---|
| `/products` → Trang sau, Back, F5 trang 2 | URL `?page=2`, dữ liệu và số trang khớp (6 sản phẩm/trang) | ☐ |
| `?page=abc`, `?page=1000000` | Đọc trang 1 / có nút về trang đầu | ☐ |
| Sản phẩm giảm giá (ví dụ CL-TEE-001) và giá bằng giá gốc | Chỉ sản phẩm giảm giá có giá gốc gạch ngang | ☐ |
| Chi tiết có 2 ảnh, thử URL ảnh lỗi | Nút Ảnh 1/Ảnh 2 đổi ảnh; ảnh lỗi hiện "Chưa có ảnh" | ☐ |
| ID không tồn tại, ngắt backend | Không tìm thấy / nút Thử lại | ☐ |
| Sản phẩm có và chưa có đánh giá | Điểm trung bình khớp API / "Chưa có đánh giá." | ☐ |
| Khách bấm "Đăng nhập để thêm vào giỏ" | Đăng nhập Customer quay lại đúng sản phẩm | ☐ |
| Thêm vào giỏ khi còn hàng | POST `/cart` 200; GET `/api/cart` xác nhận số lượng | ☐ |
| Sản phẩm hết hàng (CL-TEE-004, CL-JAC-004) | Ẩn nút thêm giỏ | ☐ |
| Manager đặt kho về 0 rồi Customer bấm thêm | Giao diện báo lỗi 409 từ máy chủ | ☐ |

## Mở rộng – Giao diện TV Studio và backend bổ sung

Kiểm thử tự động (giả lập MySQL, chạy trong môi trường phát triển của nhóm): **35/35 kịch bản đạt**, gồm biến thể
(đồng bộ tồn kho, bắt buộc chọn biến thể, giá + chênh lệch, trừ/hoàn kho khi đặt/hủy, rollback khi hết hàng),
sổ địa chỉ, quản trị người dùng + audit log, cấu hình, dashboard, lọc đơn, upload ảnh (chặn file giả mạo, tối đa 10 ảnh).
Front-end được biên dịch thử bằng esbuild (không lỗi cú pháp/import). **Chưa chạy với MySQL thật** — cần điền bảng dưới.

| Thao tác | Kỳ vọng | Thực tế |
|---|---|---|
| `npm run migrate` chạy 2 lần | Lần 2 báo đã có, không lỗi; DB có 24 bảng | ☐ |
| `npm run seed:variants` | Sản phẩm CL-* có màu/size; tồn kho sản phẩm = tổng biến thể | ☐ |
| Chi tiết CL-TEE-001, chưa chọn size bấm Thêm | Báo "Vui lòng chọn màu và kích thước" | ☐ |
| Chọn màu → size hết hàng | Nút size bị gạch, không chọn được | ☐ |
| Thêm 2 size khác nhau | Giỏ có 2 dòng; giá size lớn có cộng thêm | ☐ |
| Đặt hàng COD từ địa chỉ mặc định | Chuyển tới chi tiết đơn, "Đặt hàng thành công" | ☐ |
| Đặt hàng SIMULATED → Thanh toán ngay | Có mã SIM-...; Manager bấm "Cổng trả: Thành công" → PAID | ☐ |
| Manager chuyển trạng thái tới DELIVERED → Đã thu COD → COMPLETED | Mỗi bước 1 lần, không bỏ bước | ☐ |
| Customer đánh giá dòng hàng đơn COMPLETED | Đánh giá hiện ở trang sản phẩm | ☐ |
| Manager tải ảnh .jpg 1 MB, đặt làm chính, xóa | Thumbnail đổi theo; file trong `backend/uploads/products` bị xóa | ☐ |
| Đổi đuôi file .txt thành .jpg rồi tải | 400 "Nội dung file không phải ảnh hợp lệ" | ☐ |
| Admin khóa customer02 | customer02 không đăng nhập được | ☐ |
| Admin tự đổi vai trò của mình | Ô chọn bị khóa (API trả 409 nếu gọi thẳng) | ☐ |
| Admin đổi tên cửa hàng | Header/footer đổi sau khi tải lại | ☐ |
| Đổi mật khẩu với mật khẩu hiện tại sai | Báo lỗi 400 | ☐ |
