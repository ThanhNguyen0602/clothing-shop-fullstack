import WorkspaceLayout from "./WorkspaceLayout";

const links = [
  { to: "/admin", label: "Tổng quan", end: true },
  { to: "/admin/users", label: "Người dùng" },
  { to: "/admin/settings", label: "Cấu hình cửa hàng" },
  { to: "/manager", label: "Khu quản lý" },
  { to: "/profile", label: "Hồ sơ" },
  { to: "/", label: "Về cửa hàng", end: true }
];

const AdminLayout = () => (
  <WorkspaceLayout title="Quản trị hệ thống" links={links} />
);

export default AdminLayout;
