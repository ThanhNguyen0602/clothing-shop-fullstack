import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";

const NotFoundPage = () => (
  <div className="tv-page">
    <PageHeader title="Không tìm thấy trang" />
    <EmptyState title="Đường dẫn không tồn tại"
      description="Bạn có thể trở về trang chủ để tiếp tục khám phá."
      to="/" linkLabel="Về trang chủ" />
  </div>
);

export default NotFoundPage;
