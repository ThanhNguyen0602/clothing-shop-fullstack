# Thiết kế cơ sở dữ liệu

- Database: `ecommerce_db` (MySQL 8.0.46, InnoDB, utf8mb4)
- Schema: `backend/database/schema.sql`

## Cách chạy
Mở file trong MySQL Workbench và Execute toàn bộ file.

## Kết quả kiểm tra cấu trúc
- table_count: 23
- (dán kết quả SHOW TABLES)
- (dán SHOW CREATE TABLE users / cart_items / orders)

## Kiểm tra ràng buộc
| Câu thử | Lỗi nhận được | Kết quả |
|---|---|---|
| INSERT roles name NULL | 1048 | Bị từ chối |
| INSERT addresses user_id = -1 | 1452 | Bị từ chối |
| INSERT shipping_methods base_fee = -1 | 3819 | Bị từ chối |