import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AddToCart from "../components/products/AddToCart";
import ProductCard from "../components/products/ProductCard";
import ProductGallery from "../components/products/ProductGallery";
import ProductReviews from "../components/products/ProductReviews";
import VariantPicker from "../components/products/VariantPicker";
import { Price, Stock, RequestError, Loading } from "../components/products/CatalogUI";
import { getProduct, listProducts } from "../services/catalogService";
import { validProductId, variantPrice } from "../utils/catalogDisplay";
import useRequest from "../hooks/useRequest";
import NotFoundPage from "./NotFoundPage";
import "../styles/product-details.css";

const loadProduct = (id, _page, signal) => getProduct(id, signal);

const RelatedProducts = ({ product }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    listProducts({ category: product.category_id, limit: 5 }, controller.signal)
      .then((result) => setItems(result.data
        .filter((item) => item.id !== product.id).slice(0, 4)))
      .catch(() => {});

    return () => controller.abort();
  }, [product.id, product.category_id]);

  if (items.length === 0) return null;

  return (
    <section className="related-products">
      <div className="section-heading"><h2>Có thể bạn cũng thích</h2></div>
      <div className="product-grid">
        {items.map((item) => <ProductCard key={item.id} product={item} />)}
      </div>
    </section>
  );
};

const ProductDetails = ({ id }) => {
  const { data, error, loading, retry } = useRequest(loadProduct, id);
  const [choice, setChoice] = useState({ productId: null, color: null, size: null });

  if (loading) return <Loading text="Đang tải sản phẩm…" />;
  if (error?.response?.status === 404) return <NotFoundPage />;
  if (error) return <RequestError retry={retry} />;

  const variants = data.variants ?? [];
  // Lua chon cu chi dung cho dung san pham dang xem.
  const picked = choice.productId === data.id ? choice : { color: null, size: null };
  const variant = variants.find((item) =>
    item.color === picked.color && item.size === picked.size) ?? null;
  const needsVariant = variants.length > 0;
  const pick = (color, size) => setChoice({ productId: data.id, color, size });

  return (
    <div className="product-details-page">
      <nav className="product-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Trang chủ</Link> / <Link to="/products">Sản phẩm</Link> /{" "}
        <Link to={`/products?category=${data.category_id}`}>{data.category_name}</Link>
      </nav>
      <div className="product-detail-grid">
        <ProductGallery product={data} />
        <div className="product-info">
          <span className="product-category">{data.category_name}</span>
          <h1 className="product-title">{data.name}</h1>
          <p className="product-sku">SKU: {variant?.sku || data.sku}</p>
          <Price product={data} amount={variantPrice(data, variant)} />
          {data.short_description && (
            <p className="product-short-description">{data.short_description}</p>
          )}
          {needsVariant && (
            <VariantPicker variants={variants} color={picked.color}
              size={picked.size} onChange={pick} />
          )}
          <Stock quantity={variant ? variant.stock_quantity : data.stock_quantity} />
          <AddToCart key={variant?.id ?? "base"} id={id} stock={data.stock_quantity}
            variant={variant} needsVariant={needsVariant} />
          <ul className="product-extra-info">
            <li>Giao hàng toàn quốc, phí hiện ở bước đặt hàng.</li>
            <li>Đổi size theo <Link to="/info/returns">chính sách đổi trả</Link>.</li>
            <li>Thanh toán khi nhận hàng hoặc thanh toán trực tuyến (mô phỏng).</li>
          </ul>
        </div>
      </div>
      <section className="product-description-section">
        <h2>Mô tả sản phẩm</h2>
        <p className="product-description">{data.description || "Chưa có mô tả."}</p>
      </section>
      <ProductReviews id={id} />
      <RelatedProducts product={data} />
    </div>
  );
};

const ProductDetailsPage = () => {
  const { id } = useParams();

  return validProductId(id) ? <ProductDetails id={id} /> : <NotFoundPage />;
};

export default ProductDetailsPage;
