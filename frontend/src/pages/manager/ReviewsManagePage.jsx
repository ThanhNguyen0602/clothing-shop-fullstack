import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Notice from "../../components/common/Notice";
import Pager from "../../components/common/Pager";
import StatusBadge from "../../components/common/StatusBadge";
import { Loading, RequestError } from "../../components/products/CatalogUI";
import useRequest from "../../hooks/useRequest";
import { listManagedReviews, moderateReview } from "../../services/managementService";
import { apiError } from "../../services/api";
import { dateText } from "../../utils/catalogDisplay";

const STATUS = { VISIBLE: "Đang hiện", HIDDEN: "Đã ẩn" };
const loadReviews = (_id, page, signal) => listManagedReviews(page, signal);

const ReviewsManagePage = () => {
  const [page, setPage] = useState(1);
  const { data, error, loading, retry } = useRequest(loadReviews, "reviews", page);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({});

  const moderate = async (review, status) => {
    let reason = null;
    if (status === "HIDDEN") {
      reason = window.prompt("Lý do ẩn đánh giá (bắt buộc):", "Nội dung không phù hợp");
      if (!reason || !reason.trim()) return;
    }

    setBusy(true);
    setNotice({});

    try {
      await moderateReview(review.id, status, reason?.trim());
      setNotice({ message: status === "HIDDEN" ? "Đã ẩn đánh giá." : "Đã hiện lại đánh giá." });
      retry();
    } catch (failure) {
      setNotice({ error: apiError(failure) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Kiểm duyệt đánh giá"
        description="Ẩn đánh giá vi phạm (cần lý do) hoặc hiện lại." />
      <Notice error={notice.error} message={notice.message} />
      {loading && <Loading />}
      {error && <RequestError retry={retry} />}
      {data && (
        <div className="table-responsive">
          <table className="table tv-table align-middle">
            <thead><tr><th>Sản phẩm</th><th>Sao</th><th>Nội dung</th><th>Trạng thái</th>
              <th>Ngày</th><th>Thao tác</th></tr></thead>
            <tbody>
              {data.items.map((review) => (
                <tr key={review.id}>
                  <td><Link to={`/products/${review.product_id}`}>#{review.product_id}</Link></td>
                  <td>{"★".repeat(review.rating)}</td>
                  <td><strong>{review.title}</strong><span className="d-block">{review.content}</span>
                    {review.moderation_reason && <small className="text-danger">Lý do ẩn: {review.moderation_reason}</small>}</td>
                  <td><StatusBadge status={review.status} labels={STATUS} /></td>
                  <td>{dateText(review.created_at)}</td>
                  <td>
                    {review.status === "VISIBLE"
                      ? <button type="button" className="btn btn-sm btn-outline-danger" disabled={busy}
                          onClick={() => moderate(review, "HIDDEN")}>Ẩn</button>
                      : <button type="button" className="btn btn-sm btn-outline-dark" disabled={busy}
                          onClick={() => moderate(review, "VISIBLE")}>Hiện lại</button>}
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && <tr><td colSpan={6}>Chưa có đánh giá.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pager page={page} hasNext={data.pagination.has_next} onChange={setPage} />}
    </div>
  );
};

export default ReviewsManagePage;
