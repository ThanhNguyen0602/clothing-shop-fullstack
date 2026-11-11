CREATE DATABASE IF NOT EXISTS ecommerce_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ecommerce_db;

-- =====================================================
-- 2.1 Nguoi dung va dia chi
-- =====================================================

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar VARCHAR(500) NULL,
  status ENUM('ACTIVE', 'LOCKED', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  recipient_name VARCHAR(100) NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  province VARCHAR(100) NOT NULL,
  district VARCHAR(100) NULL,
  ward VARCHAR(100) NOT NULL,
  street_address VARCHAR(255) NOT NULL,
  note TEXT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- =====================================================
-- 2.2 Danh muc va san pham
-- =====================================================

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_id INT NULL,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(150) NULL UNIQUE,
  description TEXT NULL,
  image_url VARCHAR(500) NULL,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  display_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  logo_url VARCHAR(500) NULL,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  brand_id INT NULL,
  sku VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NULL UNIQUE,
  short_description VARCHAR(500) NULL,
  description TEXT NULL,
  original_price DECIMAL(15,2) NOT NULL,
  sale_price DECIMAL(15,2) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  thumbnail VARCHAR(500) NULL,
  status ENUM('ACTIVE', 'INACTIVE', 'DISCONTINUED') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  CONSTRAINT chk_products_1 CHECK (original_price >= 0),
  CONSTRAINT chk_products_2 CHECK (sale_price >= 0),
  CONSTRAINT chk_products_3 CHECK (stock_quantity >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- =====================================================
-- 2.3 Gio hang
-- =====================================================

CREATE TABLE IF NOT EXISTS carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cart_item (cart_id, product_id),
  FOREIGN KEY (cart_id) REFERENCES carts(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT chk_cart_items_1 CHECK (quantity > 0)
) ENGINE=InnoDB;

-- =====================================================
-- 2.4 Du lieu nen cho dat hang
-- =====================================================

CREATE TABLE IF NOT EXISTS shipping_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  base_fee DECIMAL(15,2) NOT NULL,
  estimated_days INT NULL,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT chk_shipping_methods_1 CHECK (base_fee >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT NULL,
  discount_type ENUM('PERCENT', 'FIXED') NOT NULL DEFAULT 'PERCENT',
  discount_value DECIMAL(15,2) NOT NULL,
  max_discount DECIMAL(15,2) NULL,
  min_order_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  usage_limit INT NULL,
  usage_per_user INT NOT NULL DEFAULT 1,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT chk_coupons_1 CHECK (discount_value >= 0),
  CONSTRAINT chk_coupons_2 CHECK (min_order_amount >= 0),
  CONSTRAINT chk_coupons_3 CHECK (max_discount IS NULL OR max_discount >= 0),
  CONSTRAINT chk_coupons_4 CHECK (end_date >= start_date)
) ENGINE=InnoDB;

-- =====================================================
-- 2.5 Don hang va thanh toan
-- =====================================================

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_code VARCHAR(50) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  recipient_name VARCHAR(100) NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_method_id INT NULL,
  coupon_id INT NULL,
  subtotal DECIMAL(15,2) NOT NULL,
  shipping_fee DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  payment_method_id INT NOT NULL,
  payment_status ENUM('UNPAID', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'UNPAID',
  order_status VARCHAR(30) NOT NULL,
  note TEXT NULL,
  internal_note TEXT NULL,
  cancel_reason TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (shipping_method_id) REFERENCES shipping_methods(id),
  FOREIGN KEY (coupon_id) REFERENCES coupons(id),
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
  CONSTRAINT chk_orders_1 CHECK (subtotal >= 0),
  CONSTRAINT chk_orders_2 CHECK (shipping_fee >= 0),
  CONSTRAINT chk_orders_3 CHECK (discount_amount >= 0),
  CONSTRAINT chk_orders_4 CHECK (total_amount >= 0),
  CONSTRAINT chk_orders_5 CHECK (order_status IN ('PENDING_PAYMENT', 'PENDING_CONFIRMATION', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'DELIVERY_FAILED', 'REFUND_REQUESTED', 'REFUNDED'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  quantity INT NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT chk_order_items_1 CHECK (unit_price >= 0),
  CONSTRAINT chk_order_items_2 CHECK (quantity > 0),
  CONSTRAINT chk_order_items_3 CHECK (total_price >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_status_histories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  old_status VARCHAR(30) NULL,
  new_status VARCHAR(30) NOT NULL,
  changed_by INT NULL,
  note TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (changed_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  payment_method_id INT NOT NULL,
  transaction_code VARCHAR(255) NULL UNIQUE,
  amount DECIMAL(15,2) NOT NULL,
  status ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
  gateway_response JSON NULL,
  paid_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
  CONSTRAINT chk_payments_1 CHECK (amount >= 0)
) ENGINE=InnoDB;

-- =====================================================
-- 2.6 Danh gia va binh luan
-- =====================================================

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  order_item_id INT NOT NULL UNIQUE,
  rating TINYINT NOT NULL,
  title VARCHAR(255) NULL,
  content TEXT NULL,
  status ENUM('VISIBLE', 'HIDDEN') NOT NULL DEFAULT 'VISIBLE',
  moderation_reason TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (order_item_id) REFERENCES order_items(id),
  CONSTRAINT chk_reviews_1 CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS review_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  review_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES reviews(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  review_id INT NOT NULL,
  user_id INT NOT NULL,
  parent_id INT NULL,
  content TEXT NOT NULL,
  status ENUM('VISIBLE', 'HIDDEN') NOT NULL DEFAULT 'VISIBLE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES reviews(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (parent_id) REFERENCES comments(id)
) ENGINE=InnoDB;

-- =====================================================
-- 2.7 Khuyen mai va he thong
-- =====================================================

CREATE TABLE IF NOT EXISTS coupon_usages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coupon_id INT NOT NULL,
  user_id INT NOT NULL,
  order_id INT NOT NULL UNIQUE,
  discount_amount DECIMAL(15,2) NOT NULL,
  used_at DATETIME NOT NULL,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT chk_coupon_usages_1 CHECK (discount_amount >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  reference_id INT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INT NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  ip_address VARCHAR(45) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NULL,
  description VARCHAR(255) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
