import { useState } from "react";
import { getReviews } from "../../services/catalogService";
import useRequest from "../../hooks/useRequest";
import ReviewRatingOverview from "./ReviewRatingOverview";
import { RequestError, Loading } from "./CatalogUI";
import Pager from "../common/Pager";
import { dateText } from "../../utils/catalogDisplay";

const stars = (rating) => "★".repeat(rating) + "☆".repeat(5 - rating);

const ProductReviews = ({ id }) => {
  const [page, setPage] = useState(1);
  const { data, error, loading, retry } = useRequest(getReviews, id, page);

  return (
    <section className="product-description-section" aria-labelledby="review-heading">
      <h2 id="review-heading">Đánh giá sản phẩm</h2>
      {loading && <Loading text="Đang tải đánh giá…" />}
      {error && <RequestError retry={retry} />}
      {data && (
        <>
        <ReviewRatingOverview summary={data.summary} />
          <p className="review-summary">{Number(data.summary.count) === 0
            ? "Chưa có đánh giá. Khách đã nhận hàng có thể đánh giá trong trang đơn hàng."
            : `${Number(data.summary.average).toFixed(1)}/5 sao, ${data.summary.count} đánh giá`}</p>
          {data.items.map((review) => (
            <article key={review.id} className="review-card">
              <p className="review-stars" aria-label={`${review.rating} trên 5 sao`}>
                {stars(review.rating)}
              </p>
              <h3>{review.title || "Đánh giá sản phẩm"}</h3>
              <p>{review.content}</p>
              <small>{dateText(review.created_at)}</small>
            </article>
          ))}
          <Pager page={page} hasNext={data.pagination.has_next} onChange={setPage}
            label="Phân trang đánh giá" />
        </>
      )}
    </section>
  );
};

export default ProductReviews;
