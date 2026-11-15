import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";

const PlaceholderPage = ({ title, description }) => (
  <>
    <PageHeader title={title} />
    <EmptyState title="Nội dung đang được cập nhật"
      description={description} to="/" linkLabel="Về trang chủ" />
  </>
);

export default PlaceholderPage;
