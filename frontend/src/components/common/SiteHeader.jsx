import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import useSettings from "../../hooks/useSettings";
import { getCart } from "../../services/shopService";

// Su kien de cac trang bao header cap nhat so luong gio hang.
const CART_EVENT = "cart:changed";
const notifyCartChanged = () => window.dispatchEvent(new Event(CART_EVENT));

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
  </svg>
);

const BagIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);

const SiteHeader = () => {
  const { user, signOut } = useAuth();
  const { shop_name: shopName } = useSettings();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const current = new URLSearchParams(search).get("search") ?? "";
  const [keyword, setKeyword] = useState(current);
  const [lastSearch, setLastSearch] = useState(current);
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const isCustomer = user?.role === "CUSTOMER";
  const onSalePage = pathname === "/products" && search.includes("onSale=1");

  // Dong bo o tim kiem khi URL thay doi (vd: bam link danh muc).
  if (current !== lastSearch) {
    setLastSearch(current);
    setKeyword(current);
  }

  useEffect(() => {
    if (!isCustomer) return undefined;

    const controller = new AbortController();
    const load = () => getCart(controller.signal)
      .then((cart) => setCartCount(cart.items.reduce((sum, item) => sum + item.quantity, 0)))
      .catch(() => {});

    load();
    window.addEventListener(CART_EVENT, load);

    return () => {
      controller.abort();
      window.removeEventListener(CART_EVENT, load);
    };
  }, [isCustomer, pathname]);

  const submit = (event) => {
    event.preventDefault();
    const text = keyword.trim().slice(0, 100);
    setOpen(false);
    navigate(text ? `/products?search=${encodeURIComponent(text)}` : "/products");
  };

  const handleSignOut = () => {
    setOpen(false);
    setCartCount(0);
    signOut();
    navigate("/");
  };

  const close = () => setOpen(false);
  const navClass = ({ isActive }) => (isActive && !onSalePage ? "is-active" : "");
  const lastName = user?.full_name?.trim().split(/\s+/).at(-1);

  return (
    <header className={`site-header${open ? " is-open" : ""}`}>
      <div className="site-header__inner page-width">
        <Link to="/" className="shop-logo" onClick={close}>
          <img src="/images/tv-logo.png" alt="" width="36" height="36" />
          <span>{shopName}</span>
        </Link>

        <button type="button" className="menu-toggle" aria-expanded={open}
          aria-controls="site-nav" onClick={() => setOpen((value) => !value)}>
          {open ? "Đóng" : "Menu"}
        </button>

        <nav id="site-nav" className="site-nav" aria-label="Điều hướng chính">
          <NavLink to="/" end className={navClass} onClick={close}>Trang chủ</NavLink>
          <NavLink to="/products" className={navClass} onClick={close}>Sản phẩm</NavLink>
          <Link to="/products?onSale=1" className={onSalePage ? "is-active" : ""}
            onClick={close}>Khuyến mãi</Link>
        </nav>

        <form onSubmit={submit} className="search-box" role="search">
          <input aria-label="Tìm sản phẩm" value={keyword} maxLength={100}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm áo, quần, phụ kiện" />
          <button type="submit" aria-label="Tìm kiếm"><SearchIcon /></button>
        </form>

        <div className="header-actions">
          {!user && (
            <>
              <Link to="/login" onClick={close}>Đăng nhập</Link>
              <Link to="/register" className="header-register" onClick={close}>Đăng ký</Link>
            </>
          )}
          {user && (
            <>
              <Link to="/profile" onClick={close}>Chào {lastName}</Link>
              {isCustomer && <Link to="/orders" onClick={close}>Đơn hàng</Link>}
              {["MANAGER", "ADMIN"].includes(user.role) && (
                <Link to="/manager" onClick={close}>Quản lý</Link>
              )}
              <button type="button" onClick={handleSignOut}>Đăng xuất</button>
            </>
          )}
          {(!user || isCustomer) && (
            <Link to="/cart" className="cart-link" onClick={close}
              aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}>
              <BagIcon />
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export { notifyCartChanged };
export default SiteHeader;
