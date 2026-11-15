-- Du lieu nen vai tro. Tai khoan mau tao bang: cd backend && npm run seed
-- INSERT IGNORE bo qua vai tro da ton tai (roles.name UNIQUE), chay lai khong bi trung.
USE clothing_shop_db;

INSERT IGNORE INTO roles (name, description) VALUES
('CUSTOMER', 'Khách hàng'),
('MANAGER', 'Nhân viên quản lý'),
('ADMIN', 'Quản trị viên');
