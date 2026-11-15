import { Link } from "react-router-dom";
import useSettings from "../../hooks/useSettings";

const SiteFooter = () => {
  const settings = useSettings();

  return (
    <footer className="site-footer">
      <div className="footer-grid page-width">
        <div>
          <h2>{settings.shop_name}</h2>
          <p>Quần áo cơ bản cho mỗi ngày: dễ mặc, dễ phối, giá rõ ràng.</p>
          {settings.shop_address && <p>{settings.shop_address}</p>}
          {settings.contact_phone && <p>Điện thoại: {settings.contact_phone}</p>}
          {settings.contact_email && <p>Email: {settings.contact_email}</p>}
        </div>
        <div>
          <h2>Mua sắm</h2>
          <nav aria-label="Mua sắm">
            <Link to="/products">Tất cả sản phẩm</Link>
            <Link to="/products?onSale=1">Khuyến mãi</Link>
            <Link to="/cart">Giỏ hàng</Link>
          </nav>
        </div>
        <div>
          <h2>Hỗ trợ</h2>
          <nav aria-label="Hỗ trợ">
            <Link to="/info/shipping">Giao hàng</Link>
            <Link to="/info/returns">Đổi trả</Link>
            <Link to="/info/contact">Liên hệ</Link>
            <Link to="/info/privacy">Bảo mật</Link>
          </nav>
        </div>
      </div>
      <div className="footer-bottom page-width">
        © {new Date().getFullYear()} {settings.shop_name}
      </div>
    </footer>
  );
};

export default SiteFooter;
