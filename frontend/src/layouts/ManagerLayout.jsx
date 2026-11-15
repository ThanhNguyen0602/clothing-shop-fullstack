import WorkspaceLayout from "./WorkspaceLayout";
import { useAuth } from "../contexts/AuthContext";

const ManagerLayout = () => {
  const { user } = useAuth();
  const links = [
    { to: "/manager", label: "Tổng quan", end: true },
    { to: "/manager/products", label: "Sản phẩm" },
    { to: "/manager/categories", label: "Danh mục" },
    { to: "/manager/orders", label: "Đơn hàng" },
    { to: "/manager/reviews", label: "Đánh giá" },
    ...(user?.role === "ADMIN" ? [{ to: "/admin", label: "Khu quản trị" }] : []),
    { to: "/profile", label: "Hồ sơ" },
    { to: "/", label: "Về cửa hàng", end: true }
  ];

  return <WorkspaceLayout title="Quản lý cửa hàng" links={links} />;
};

export default ManagerLayout;
