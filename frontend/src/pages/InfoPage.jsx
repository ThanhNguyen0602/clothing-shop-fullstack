import { useParams } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import useSettings from "../hooks/useSettings";
import NotFoundPage from "./NotFoundPage";

// Noi dung tinh lay tu Cau hinh cua Admin (GET /api/settings) neu co.
const PAGES = {
  about: { title: "Giới thiệu", text: (s) => `${s.shop_name} là đồ án web bán quần áo
    full-stack: React, Node.js/Express và MySQL. Chúng tôi mang đến những thiết kế
    tối giản, dễ phối và phù hợp phong cách đường phố.` },
  contact: { title: "Liên hệ", text: (s) => [
    s.shop_address && `Địa chỉ: ${s.shop_address}`,
    s.contact_phone && `Điện thoại: ${s.contact_phone}`,
    s.contact_email && `Email: ${s.contact_email}`
  ].filter(Boolean).join("\n") || "Thông tin liên hệ đang được cập nhật." },
  shipping: { title: "Chính sách giao hàng", text: (s) => s.shipping_note ||
    "Phí giao hàng hiển thị theo phương thức bạn chọn ở bước đặt hàng." },
  returns: { title: "Đổi trả sản phẩm", text: (s) => s.return_policy ||
    "Hỗ trợ đổi size trong thời gian quy định khi sản phẩm còn nguyên tem mác." },
  privacy: { title: "Bảo mật thông tin", text: () => "Thông tin tài khoản chỉ dùng để xử lý đơn hàng. Mật khẩu được mã hóa bằng bcrypt và không bao giờ hiển thị." }
};

const InfoPage = () => {
  const { slug } = useParams();
  const settings = useSettings();
  const page = Object.hasOwn(PAGES, slug) ? PAGES[slug] : null;

  if (!page) return <NotFoundPage />;

  return (
    <div className="tv-page tv-page--narrow">
      <PageHeader title={page.title} />
      <div className="tv-panel info-text">{page.text(settings)}</div>
    </div>
  );
};

export default InfoPage;
