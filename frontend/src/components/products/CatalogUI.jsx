import { useState } from "react";
import { priceText } from "../../utils/catalogDisplay";

const ProductImage = ({ src, alt, className = "catalog-image" }) => {
  const [broken, setBroken] = useState("");

  return src && broken !== src
    ? <img className={className} src={src} alt={alt} loading="lazy"
        onError={() => setBroken(src)} />
    : (
      <div className={`${className} fashion-product-placeholder`}>Chưa có ảnh</div>
    );
};

const Price = ({ product, amount }) => {
  const current = amount ?? product.sale_price;

  return (
    <p className="product-price">
      <span className="current-price">{priceText(current)}</span>
      {Number(product.original_price) > Number(current) && (
        <span className="old-price">{priceText(product.original_price)}</span>
      )}
    </p>
  );
};

const Stock = ({ quantity }) => (
  <p className={`product-stock-status${Number(quantity) > 0 ? "" : " is-out"}`}>
    {Number(quantity) > 0 ? `Còn ${quantity} sản phẩm` : "Hết hàng"}
  </p>
);

const RequestError = ({ retry }) => (
  <div className="empty-state">
    <p role="alert">Chưa tải được dữ liệu.</p>
    <button type="button" className="button" onClick={retry}>Thử lại</button>
  </div>
);

const Loading = ({ text = "Đang tải…" }) => (
  <p className="tv-loading" role="status"><span className="spinner-border spinner-border-sm" /> {text}</p>
);

export { ProductImage, Price, Stock, RequestError, Loading };
