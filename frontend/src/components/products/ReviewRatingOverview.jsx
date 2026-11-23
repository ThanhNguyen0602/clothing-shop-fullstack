import { getReviewOverview } from "../../utils/reviewRating";
import "../../styles/review-rating-overview.css";

// Bo sung Buoi 11 - Hieu: khung hien thi diem trung binh cua san pham.
const ReviewRatingOverview = ({ summary }) => {
  const { count, average, percentage } = getReviewOverview(summary);
  const hasReviews = count > 0;

  return (
    <div className="hieu-rating-overview" role="group"
      aria-label="Tổng quan điểm đánh giá sản phẩm">
      <div className="hieu-rating-overview__score">
        <strong>{hasReviews ? average.toFixed(1) : "—"}</strong>
        <span>/ 5</span>
      </div>
      <div className="hieu-rating-overview__detail">
        <span className="hieu-rating-overview__stars" aria-hidden="true">
          <span className="hieu-rating-overview__stars-base">★★★★★</span>
          <span className="hieu-rating-overview__stars-fill"
            style={{ width: `${percentage}%` }}>★★★★★</span>
        </span>
        <span className="hieu-rating-overview__count">
          {hasReviews
            ? `${count} lượt đánh giá được hiển thị công khai`
            : "Sản phẩm chưa có đánh giá công khai"}
        </span>
      </div>
    </div>
  );
};

export default ReviewRatingOverview;
