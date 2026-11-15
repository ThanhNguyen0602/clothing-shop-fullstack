import { Outlet } from "react-router-dom";
import SiteHeader from "../components/common/SiteHeader";
import SiteFooter from "../components/common/SiteFooter";

// Layout cong khai: header (logo, menu, tim kiem, gio) + noi dung + footer.
const MainLayout = () => (
  <div className="public-layout">
    <a className="skip-link" href="#main-content">Đến nội dung chính</a>
    <SiteHeader />
    <main id="main-content" className="site-main" tabIndex={-1}>
      <Outlet />
    </main>
    <SiteFooter />
  </div>
);

export default MainLayout;
