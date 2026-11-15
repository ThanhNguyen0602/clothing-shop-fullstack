import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Notice from "../../components/common/Notice";
import Pager from "../../components/common/Pager";
import StatusBadge from "../../components/common/StatusBadge";
import { Loading } from "../../components/products/CatalogUI";
import { cancelManagedOrder, changeOrderStatus, collectCod, getManagedOrder,
  listManagedOrders, simulatePayment } from "../../services/managementService";
import { apiError, isCanceled } from "../../services/api";
import { dateText, priceText } from "../../utils/catalogDisplay";
import { ATTEMPT_STATUS, NEXT_STATUS, ORDER_STATUS, PAYMENT_STATUS, canCancel }
  from "../../utils/orderStatus";

// Bang dieu khien don: loc, xem chi tiet, chuyen buoc, thu COD, xac nhan thanh toan mo phong.
const OrderPanel = ({ id, onChanged, onClose }) => {
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({});
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getManagedOrder(id, controller.signal).then(setOrder).catch((failure) => {
      if (!isCanceled(failure)) setNotice({ error: apiError(failure) });
    });

    return () => controller.abort();
  }, [id, version]);

  const act = async (action, message) => {
    setBusy(true);
    setNotice({});

    try {
      await action();
      setNotice({ message });
      setVersion((value) => value + 1);
      onChanged();
    } catch (failure) {
      setNotice({ error: apiError(failure) });
    } finally {
      setBusy(false);
    }
  };

  if (!order) return <aside className="tv-panel order-panel"><Notice error={notice.error} /><Loading /></aside>;

  const next = NEXT_STATUS[order.order_status];
  const pending = order.payments.find((item) => item.status === "PENDING");
  const cancel = () => {
    const reason = window.prompt("Lý do hủy đơn:", "Khách yêu cầu hủy");
    if (reason && reason.trim()) act(() => cancelManagedOrder(id, reason.trim()), "Đã hủy đơn.");
  };

  return (
    <aside className="tv-panel order-panel">
      <div className="d-flex justify-content-between">
        <h2>{order.order_code}</h2>
        <button type="button" className="btn-close" aria-label="Đóng" onClick={onClose} />
      </div>
      <p><StatusBadge status={order.order_status} labels={ORDER_STATUS} />{" "}
        <StatusBadge status={order.payment_status} labels={PAYMENT_STATUS} />{" "}
        <span className="status-badge">{order.payment_method}</span></p>
      <Notice error={notice.error} message={notice.message} />
      <p><strong>{order.recipient_name}</strong> · {order.recipient_phone}<br />{order.shipping_address}</p>
      <ul className="checkout-items">
        {order.items.map((item) => (
          <li key={item.id}>
            <span>{item.product_name}{item.variant_label ? ` (${item.variant_label})` : ""} × {item.quantity}</span>
            <strong>{priceText(item.total_price)}</strong>
          </li>
        ))}
      </ul>
      <p className="cart-summary__total">Tổng <strong>{priceText(order.total_amount)}</strong></p>

      <div className="order-actions">
        {next && (
          <button type="button" className="btn btn-dark" disabled={busy}
            onClick={() => act(() => changeOrderStatus(id, next), `Đã chuyển sang ${ORDER_STATUS[next]}.`)}>
            {ORDER_STATUS[next]}
          </button>
        )}
        {order.payment_method === "COD" && order.payment_status !== "PAID" &&
          order.order_status === "DELIVERED" && (
          <button type="button" className="btn btn-success" disabled={busy}
            onClick={() => act(() => collectCod(id), "Đã ghi nhận thu tiền COD.")}>Đã thu COD</button>
        )}
        {pending && (
          <>
            <button type="button" className="btn btn-success" disabled={busy}
              onClick={() => act(() => simulatePayment(id, pending.transaction_code, "SUCCESS"),
                "Đã xác nhận thanh toán thành công.")}>Cổng trả: Thành công</button>
            <button type="button" className="btn btn-outline-danger" disabled={busy}
              onClick={() => act(() => simulatePayment(id, pending.transaction_code, "FAILED"),
                "Đã ghi nhận thanh toán thất bại.")}>Cổng trả: Thất bại</button>
          </>
        )}
        {canCancel(order) && (
          <button type="button" className="btn btn-outline-danger" disabled={busy}
            onClick={cancel}>Hủy đơn</button>
        )}
      </div>
      {order.payments.length > 0 && (
        <>
          <h3>Giao dịch</h3>
          <ul className="payment-attempts">
            {order.payments.map((item) => (
              <li key={item.id}>{item.transaction_code} · {ATTEMPT_STATUS[item.status] ?? item.status}</li>
            ))}
          </ul>
        </>
      )}
      <h3>Lịch sử</h3>
      <ol className="order-timeline">
        {order.history.map((item) => (
          <li key={item.id}>
            <strong>{ORDER_STATUS[item.new_status] ?? item.new_status}</strong>
            <span>{dateText(item.created_at)}{item.note ? ` · ${item.note}` : ""}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
};

const OrdersManagePage = () => {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [version, setVersion] = useState(0);
  const status = params.get("status") ?? "";
  const search = params.get("search") ?? "";
  const page = /^[1-9]\d{0,5}$/.test(params.get("page") ?? "") ? Number(params.get("page")) : 1;
  const [keyword, setKeyword] = useState(search);

  useEffect(() => {
    const controller = new AbortController();
    const query = { page, limit: 15, ...(status ? { status } : {}), ...(search ? { search } : {}) };
    listManagedOrders(query, controller.signal)
      .then((data) => { setResult(data); setError(""); })
      .catch((failure) => { if (!isCanceled(failure)) setError(apiError(failure)); });

    return () => controller.abort();
  }, [page, status, search, version]);

  const change = (values) => {
    const next = new URLSearchParams(params);
    Object.entries(values).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (!("page" in values)) next.delete("page");
    setParams(next);
  };

  return (
    <div>
      <PageHeader title="Quản lý đơn hàng" />
      <form className="workspace-filters" onSubmit={(event) => {
        event.preventDefault();
        change({ search: keyword.trim().slice(0, 60) });
      }}>
        <input className="form-control" placeholder="Mã đơn hoặc tên người nhận" value={keyword}
          onChange={(event) => setKeyword(event.target.value)} />
        <select className="form-select" value={status}
          onChange={(event) => change({ status: event.target.value })}>
          <option value="">Mọi trạng thái</option>
          {Object.entries(ORDER_STATUS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <button type="submit" className="btn btn-dark">Lọc</button>
      </form>
      <Notice error={error} />
      <div className={selected ? "orders-split" : ""}>
        <div>
          {!result && !error && <Loading />}
          {result && (
            <div className="table-responsive">
              <table className="table tv-table align-middle">
                <thead>
                  <tr><th>Mã đơn</th><th>Người nhận</th><th>Tổng</th><th>Trạng thái</th>
                    <th>Thanh toán</th><th>Ngày</th></tr>
                </thead>
                <tbody>
                  {result.items.map((order) => (
                    <tr key={order.id} className={`is-clickable${selected === order.id ? " is-selected" : ""}`}
                      onClick={() => setSelected(order.id)}>
                      <td><button type="button" className="btn btn-link p-0">{order.order_code}</button></td>
                      <td>{order.recipient_name}</td>
                      <td>{priceText(order.total_amount)}</td>
                      <td><StatusBadge status={order.order_status} labels={ORDER_STATUS} /></td>
                      <td>{order.payment_method} · <StatusBadge status={order.payment_status} labels={PAYMENT_STATUS} /></td>
                      <td>{dateText(order.created_at)}</td>
                    </tr>
                  ))}
                  {result.items.length === 0 && <tr><td colSpan={6}>Không có đơn phù hợp.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
          {result && <Pager page={page} hasNext={result.pagination.has_next}
            onChange={(value) => change({ page: String(value) })} />}
        </div>
        {selected && <OrderPanel key={selected} id={selected}
          onChanged={() => setVersion((value) => value + 1)} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );
};

export default OrdersManagePage;
