import { Route, Routes } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import ManagerLayout from "../layouts/ManagerLayout";
import AdminLayout from "../layouts/AdminLayout";
import HomePage from "../pages/HomePage";
import ProductsPage from "../pages/ProductsPage";
import ProductDetailsPage from "../pages/ProductDetailsPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ProfilePage from "../pages/ProfilePage";
import CartPage from "../pages/CartPage";
import CheckoutPage from "../pages/CheckoutPage";
import OrdersPage from "../pages/OrdersPage";
import OrderDetailsPage from "../pages/OrderDetailsPage";
import InfoPage from "../pages/InfoPage";
import NotFoundPage from "../pages/NotFoundPage";
import DashboardPage from "../pages/manager/DashboardPage";
import ProductsManagePage from "../pages/manager/ProductsManagePage";
import ProductAssetsPage from "../pages/manager/ProductAssetsPage";
import CategoriesManagePage from "../pages/manager/CategoriesManagePage";
import OrdersManagePage from "../pages/manager/OrdersManagePage";
import ReviewsManagePage from "../pages/manager/ReviewsManagePage";
import UsersPage from "../pages/admin/UsersPage";
import SettingsPage from "../pages/admin/SettingsPage";
import { GuestOnly, RequireAuth } from "./AuthGuards";

const AppRoutes = () => (
  <Routes>
    {/* Trang dang nhap / dang ky dung AuthLayout rieng (nen DotGrid), khong co header. */}
    <Route element={<GuestOnly />}>
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
    </Route>

    <Route element={<MainLayout />}>
      <Route index element={<HomePage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="products/:id" element={<ProductDetailsPage />} />
      <Route path="info/:slug" element={<InfoPage />} />
      <Route element={<RequireAuth />}>
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route element={<RequireAuth roles={["CUSTOMER"]} />}>
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Route>

    <Route element={<RequireAuth roles={["MANAGER", "ADMIN"]} />}>
      <Route path="manager" element={<ManagerLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsManagePage />} />
        <Route path="products/:id/assets" element={<ProductAssetsPage />} />
        <Route path="categories" element={<CategoriesManagePage />} />
        <Route path="orders" element={<OrdersManagePage />} />
        <Route path="reviews" element={<ReviewsManagePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>

    <Route element={<RequireAuth roles={["ADMIN"]} />}>
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>
  </Routes>
);

export default AppRoutes;
