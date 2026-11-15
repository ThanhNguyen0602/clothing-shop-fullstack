-- Migration 001: bien the size/mau cho cua hang quan ao.
-- Chay bang lenh (tu kiem tra, chay lai an toan): cd backend && npm run migrate
-- File nay ghi lai cau truc dich de doc/nop bai; khong can chay tay trong Workbench.
-- schema.sql giu nguyen 23 bang theo buoi 02; bang thu 24 nam o migration nay.

CREATE TABLE IF NOT EXISTS product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  sku VARCHAR(60) NULL UNIQUE,
  color VARCHAR(50) NOT NULL,
  size VARCHAR(20) NOT NULL,
  price_adjustment DECIMAL(15,2) NOT NULL DEFAULT 0,
  stock_quantity INT NOT NULL DEFAULT 0,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_variant (product_id, color, size),
  FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT chk_variants_1 CHECK (price_adjustment >= 0),
  CONSTRAINT chk_variants_2 CHECK (stock_quantity >= 0)
) ENGINE=InnoDB;

-- Gio hang: moi cap (san pham, bien the) chi mot dong.
ALTER TABLE cart_items
  ADD COLUMN variant_id INT NULL AFTER product_id,
  ADD COLUMN variant_key INT AS (IFNULL(variant_id, 0)) STORED,
  ADD CONSTRAINT fk_cart_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id);
ALTER TABLE cart_items ADD UNIQUE KEY uq_cart_item_variant (cart_id, product_id, variant_key);
ALTER TABLE cart_items DROP INDEX uq_cart_item;

-- Don hang: snapshot bien the luc mua.
ALTER TABLE order_items
  ADD COLUMN variant_id INT NULL AFTER product_id,
  ADD COLUMN variant_label VARCHAR(100) NULL AFTER product_name,
  ADD CONSTRAINT fk_order_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id);

-- Quy tac: san pham co bien the ACTIVE thi products.stock_quantity = tong ton kho cac bien the ACTIVE
-- (Service dong bo trong cung transaction khi sua bien the, dat hang va hoan kho).
