import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/products/ProductCard";
import { Loading, ProductImage } from "../components/products/CatalogUI";
import { listCategories, listProducts } from "../services/catalogService";

const services = [
  { title: "Giao hàng toàn quốc", text: "Phí ship hiện rõ khi đặt hàng",
    icon: <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /> },
  { title: "Đổi size dễ dàng", text: "Theo chính sách đổi trả của shop",
    icon: <path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5" /> },
  { title: "Thanh toán khi nhận", text: "Kiểm tra hàng rồi mới trả tiền",
    icon: <path d="M3 7h18v10H3zM3 11h18M7 15h3" /> }
];

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      listCategories(controller.signal),
      listProducts({ limit: 8, sort: "newest" }, controller.signal)
    ])
      .then(([categoryItems, productPage]) => {
        setCategories(categoryItems);
        setProducts(productPage.data);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("Chưa tải được sản phẩm. Kiểm tra backend đang chạy rồi tải lại trang.");
          setProducts([]);
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="page-width">
      <section className="home-hero">
        <div className="home-hero__text">
          <h1>Mặc đẹp mỗi ngày, không cần nghĩ nhiều</h1>
          <p>Áo thun, sơ mi, quần jeans và phụ kiện cơ bản. Chất liệu dễ chịu,
            giá ghi rõ, chọn size ngay trên trang sản phẩm.</p>
          <div className="home-hero__actions">
            <Link to="/products" className="button">Xem sản phẩm</Link>
            <Link to="/products?onSale=1" className="button button--ghost">Đang giảm giá</Link>
          </div>
        </div>
        <div className="home-hero__image">
          <img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=80"
            alt="Người mẫu mặc áo khoác dạ xanh" />
        </div>
      </section>

      {categories.length > 0 && (
        <section className="home-section" aria-labelledby="category-heading">
          <div className="section-heading">
            <h2 id="category-heading">Mua theo danh mục</h2>
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <Link key={category.id} to={`/products?category=${category.id}`}
                className="category-tile">
                <div className="category-tile__image">
                  <ProductImage src={category.image_url} alt="" className="" />
                </div>
                <span>{category.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="home-section" aria-labelledby="new-heading">
        <div className="section-heading">
          <h2 id="new-heading">Sản phẩm mới</h2>
          <Link to="/products">Xem tất cả</Link>
        </div>
        {error && <p className="tv-alert tv-alert--danger" role="alert">{error}</p>}
        {products === null && <Loading text="Đang tải sản phẩm…" />}
        {products?.length > 0 && (
          <div className="product-grid">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>

      <section className="service-strip" aria-label="Cam kết của cửa hàng">
        {services.map((item) => (
          <div key={item.title}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{item.icon}</svg>
            <p className="m-0"><strong>{item.title}</strong><span>{item.text}</span></p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default HomePage;
