import { Link } from "react-router-dom";
import { ProductImage } from "./CatalogUI";
import { priceText } from "../../utils/catalogDisplay";

const ProductCard = ({ product }) => {
  const original = Number(product.original_price);
  const sale = Number(product.sale_price);
  const onSale = sale < original;
  const soldOut = Number(product.stock_quantity) <= 0;
  const percent = onSale ? Math.round((1 - sale / original) * 100) : 0;

  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <div className="product-card__image">
        <ProductImage src={product.thumbnail} alt={product.name} className="" />
        {soldOut && <span className="product-card__badge product-card__badge--muted">Hết hàng</span>}
        {!soldOut && onSale && <span className="product-card__badge">-{percent}%</span>}
      </div>
      <div className="product-card__body">
        <span className="product-card__category">{product.category_name}</span>
        <h3 className="product-card__name">{product.name}</h3>
        <p className={`product-card__price${onSale ? " is-sale" : ""}`}>
          {priceText(product.sale_price)}
          {onSale && <del>{priceText(product.original_price)}</del>}
        </p>
      </div>
    </Link>
  );
};

export default ProductCard;
