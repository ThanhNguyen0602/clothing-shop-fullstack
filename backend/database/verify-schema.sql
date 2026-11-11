-- BUOI 02: kiem tra cau truc sau khi chay schema.sql
USE ecommerce_db;

SHOW TABLES;

SELECT COUNT(*) AS table_count
FROM information_schema.tables
WHERE table_schema = 'ecommerce_db'
  AND table_type = 'BASE TABLE';

SHOW CREATE TABLE users;
SHOW CREATE TABLE cart_items;
SHOW CREATE TABLE orders;
