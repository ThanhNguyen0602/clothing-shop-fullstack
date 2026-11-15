import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import Notice from "../components/common/Notice";
import StatusBadge from "../components/common/StatusBadge";
import { Loading, RequestError } from "../components/products/CatalogUI";
import useRequest from "../hooks/useRequest";
import { cancelMyOrder, createPayment, createReview, getMyOrder, listPayments }
  from "../services/shopService";
import { apiError } from "../services/api";
import { dateText, priceText, validProductId } from "../utils/catalogDisplay";
import { ATTEMPT_STATUS, ORDER_STATUS, PAYMENT_STATUS, canCancel } from "../utils/orderStatus";
import NotFoundPage from "./NotFoundPage";

const loadOrder = async (id, _page, signal) => {
  const order = await getMyOrder(id, signal);
  const payments = order.payment_method === "SIMULATED"
    ? await listPayments(id, signal).catch(() => null) : null;

  return { ...order, attempts: payments?.attempts ?? [] };
};

// Form danh gia cho tung dong san pham cua don COMPLETED.
const ReviewForm = ({ item, onDone }) => {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      await createReview(item.product_id, { order_item_id: item.id, rating,
        title: title.trim() || null, content: content.trim() });
      onDone("Cảm ơn bạn đã đánh giá sản phẩm!");
    } catch (failure) {
      setError(apiError(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="review-form" onSubmit={submit}>
      <div className="review-form__stars" role="radiogroup" aria-label="Số sao">
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} type="button" role="radio" aria-checked={rating === value}
            aria-label={`${value} sao`} className={value <= rating ? "on" : ""}
            onClick={() => setRating(value)}>★</button>
        ))}
      </div>
      <input className="form-control" placeholder="Tiêu đề (không bắt buộc)" maxLength={255}
        value={title} onChange={(event) => setTitle(event.target.value)} />
      <textarea className="form-control" rows={2} placeholder="Cảm nhận của bạn" required
        maxLength={2000} value={content} onChange={(event) => setContent(event.target.value)} />
      <Notice error={error} />
      <button type="submit" className="btn btn-dark btn-sm" disabled={busy}>
        {busy ? "Đang gửi…" : "Gửi đánh giá"}
      </button>
    </form>
  );
};

const OrderDetails = ({ id }) => {
  const { state } = useLocation();
  const { data, error, loading, retry } = useRequest(loadOrder, id);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ message: state?.created ? "Đặt hàng thành công!" : "" });
  const [reviewing, setReviewing] = useState(null);
  const [reviewed, setReviewed] = useState([]);

  if (loading) return <Loading text="Đang tải đơn hàng…" />;
  if (error?.response?.status === 404) return <NotFoundPage />;
  if (error) return <RequestError retry={retry} />;

  const act = async (action, message) => {
    setBusy(true);
    setNotice({});

    try {
      await action();
      setNotice({ message });
      retry();
    } catch (failure) {
      setNotice({ error: apiError(failure) });
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    const reason = window.prompt("Lý do hủy đơn:", "Tôi muốn đổi sản phẩm khác");
    if (reason && reason.trim()) act(() => cancelMyOrder(id, reason.trim()), "Đã hủy đơn hàng.");
  };

  const pending = data.attempts.find((item) => item.status === "PENDING");
  const canPay = data.payment_method === "SIMULATED" && data.order_status === "PENDING_PAYMENT" &&
    data.payment_status !== "PAID";

  return (
    <div className="tv-page">
      <Link to="/orders" className="back-link">← Đơn hàng của bạn</Link>
      <PageHeader title={`Đơn ${data.order_code}`}
        description={`Đặt lúc ${dateText(data.created_at)}`}>
        <StatusBadge status={data.order_status} labels={ORDER_STATUS} />
        <StatusBadge status={data.payment_status} labels={PAYMENT_STATUS} />
      </PageHeader>
      <Notice error={notice.error} message={notice.message} />

      <div className="checkout-layout">
        <section className="tv-panel">
          <h2>Sản phẩm</h2>
          <ul className="order-items">
            {data.items.map((item) => (
              <li key={item.id}>
                <div className="order-items__row">
                  <span>
                    <Link to={`/products/${item.product_id}`}>{item.product_name}</Link>
                    {item.variant_label && <small> ({item.variant_label})</small>}
                    <small> × {item.quantity}</small>
                  </span>
                  <strong>{priceText(item.total_price)}</strong>
                </div>
                {data.order_status === "COMPLETED" && !reviewed.includes(item.id) && (
                  reviewing === item.id
                    ? <ReviewForm item={item} onDone={(message) => {
                        setReviewed([...reviewed, item.id]);
                        setReviewing(null);
                        setNotice({ message });
                      }} />
                    : <button type="button" className="btn btn-sm btn-outline-dark"
                        onClick={() => setReviewing(item.id)}>Viết đánh giá</button>
                )}
              </li>
            ))}
          </ul>
          <h2 className="mt-4">Lịch sử trạng thái</h2>
          <ol className="order-timeline">
            {data.history.map((item, index) => (
              <li key={index}>
                <strong>{ORDER_STATUS[item.new_status] ?? item.new_status}</strong>
                <span>{dateText(item.created_at)}{item.note ? `, ${item.note}` : ""}</span>
              </li>
            ))}
          </ol>
        </section>

        <aside className="cart-summary">
          <h2>Giao đến</h2>
          <p><strong>{data.recipient_name}</strong>, {data.recipient_phone}</p>
          <p>{data.shipping_address}</p>
          {data.note && <p>Ghi chú: {data.note}</p>}
          <hr />
          <p>Tạm tính <strong>{priceText(data.subtotal)}</strong></p>
          <p>Phí vận chuyển <strong>{priceText(data.shipping_fee)}</strong></p>
          <p className="cart-summary__total">Tổng cộng <strong>{priceText(data.total_amount)}</strong></p>
          <p>Thanh toán: <strong>{data.payment_method === "COD" ? "Khi nhận hàng (COD)" : "Mô phỏng"}</strong></p>
          {data.cancel_reason && <p>Lý do hủy: {data.cancel_reason}</p>}

          {canPay && (
            <div className="tv-panel tv-panel--soft">
              <p>{pending
                ? `Phiên thanh toán ${pending.transaction_code} đang chờ cổng mô phỏng xác nhận.`
                : "Tạo phiên thanh toán mô phỏng để tiếp tục."}</p>
              <button type="button" className="add-to-cart-btn" disabled={busy}
                onClick={() => act(() => createPayment(id), "Đã tạo phiên thanh toán.")}>
                {pending ? "Lấy lại phiên thanh toán" : "Thanh toán ngay"}
              </button>
            </div>
          )}
          {data.attempts.length > 0 && (
            <ul className="payment-attempts">
              {data.attempts.map((item) => (
                <li key={item.id}>{item.transaction_code}: {ATTEMPT_STATUS[item.status] ?? item.status}</li>
              ))}
            </ul>
          )}
          {canCancel(data) && (
            <button type="button" className="btn btn-outline-danger w-100 mt-2" disabled={busy}
              onClick={cancel}>Hủy đơn hàng</button>
          )}
        </aside>
      </div>
    </div>
  );
};

const OrderDetailsPage = () => {
  const { id } = useParams();

  return validProductId(id) ? <OrderDetails id={id} /> : <NotFoundPage />;
};

export default OrderDetailsPage;
