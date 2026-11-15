import { Link } from "react-router-dom";
import useSettings from "../../hooks/useSettings";
import "../../styles/auth.css";

// Trang dang nhap / dang ky: anh ben trai, form ben phai, nen sang.
const AuthLayout = ({ children }) => {
  const { shop_name: shopName } = useSettings();

  return (
    <main className="auth-page">
      <div className="auth-page__image" aria-hidden="true">
        <img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80" alt="" />
      </div>
      <div className="auth-page__form">
        <Link to="/" className="shop-logo">
          <img src="/images/tv-logo.png" alt="" width="36" height="36" />
          <span>{shopName}</span>
        </Link>
        {children}
      </div>
    </main>
  );
};

export default AuthLayout;
