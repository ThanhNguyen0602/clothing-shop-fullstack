import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import { validProductId } from "../utils/catalogDisplay";

const customerPaths = ["/cart", "/checkout", "/orders", "/profile"];

const destination = (role, returnTo) => {
  if (role === "ADMIN") return "/admin";
  if (role === "MANAGER") return "/manager";
  if (role === "CUSTOMER") {
    const match = typeof returnTo === "string"
      ? /^\/products\/([1-9]\d*)$/.exec(returnTo) : null;
    if (customerPaths.includes(returnTo) || /^\/orders\/[1-9]\d*$/.test(returnTo ?? "") ||
        (match && validProductId(match[1]))) return returnTo;
  }

  return "/";
};

const RequireAuth = ({ roles }) => {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (!user) {
    const returnTo = pathname.replace(/\/+$/, "");

    return <Navigate to="/login" replace state={{ returnTo }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="tv-page">
        <PageHeader title="Không có quyền truy cập" />
        <EmptyState title="Khu vực giới hạn"
          description="Tài khoản hiện tại chưa có quyền vào khu vực này."
          to="/" linkLabel="Về trang chủ" />
      </div>
    );
  }

  return <Outlet />;
};

const GuestOnly = () => {
  const { user } = useAuth();
  const { state } = useLocation();

  return user
    ? <Navigate to={destination(user.role, state?.returnTo)} replace />
    : <Outlet />;
};

export { RequireAuth, GuestOnly };
