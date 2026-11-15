import { Link, Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import { useAuth } from "../contexts/AuthContext";
import useSettings from "../hooks/useSettings";

// Khung chung cho khu Manager / Admin: thanh tren + sidebar + noi dung.
const WorkspaceLayout = ({ title, links }) => {
  const { user, signOut } = useAuth();
  const { shop_name: shopName } = useSettings();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  return (
    <div className="workspace-shell">
      <a className="skip-link" href="#main-content">Đến nội dung chính</a>
      <header className="workspace-header">
        <Link className="shop-logo" to="/">
          <img src="/images/tv-logo.png" alt="" width="32" height="32" />
          <span>{shopName}</span>
        </Link>
        <p className="workspace-title">{title}</p>
        <div className="workspace-user">
          <span>{user?.full_name} ({user?.role})</span>
          <button type="button" onClick={handleSignOut}>
            Đăng xuất
          </button>
        </div>
      </header>
      <div className="workspace-grid">
        <Sidebar title={title} items={links} />
        <main id="main-content" className="workspace-main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default WorkspaceLayout;
