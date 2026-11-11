-- BUOI 02: kiem tra rang buoc. CHAY TUNG CAU MOT, moi cau deu PHAI BI TU CHOI.
-- Chay tren CSDL thuc hanh trong ecommerce_db.
USE ecommerce_db;

-- 1) NOT NULL: du kien loi 1048
INSERT INTO roles (name) VALUES (NULL);

-- 2) Khoa ngoai khong ton tai: du kien loi 1452
INSERT INTO addresses
  (user_id, recipient_name, recipient_phone, province, ward, street_address)
VALUES (-1, 'Test', '0900000099', 'Test', 'Test', 'Test');

-- 3) CHECK phi van chuyen am: du kien loi 3819
INSERT INTO shipping_methods (name, base_fee)
VALUES ('Test negative fee', -1);

-- Sau khi thu, xac nhan khong co dong sai nao duoc them:
SELECT COUNT(*) AS shipping_methods_count FROM shipping_methods;
SELECT COUNT(*) AS addresses_count FROM addresses;
