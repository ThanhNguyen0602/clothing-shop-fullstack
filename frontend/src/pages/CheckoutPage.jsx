import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Notice from "../components/common/Notice";
import { Loading, RequestError } from "../components/products/CatalogUI";
import { createOrder, getCart, getCheckoutOptions, listAddresses } from "../services/shopService";
import { apiError, isCanceled } from "../services/api";
import { priceText } from "../utils/catalogDisplay";

const fullAddress = (address) => [address.street_address, address.ward,
  address.district, address.province].filter(Boolean).join(", ");

const CheckoutPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const sending = useRef(false);
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([getCart(controller.signal), getCheckoutOptions(controller.signal),
      listAddresses(controller.signal)])
      .then(([cart, options, addresses]) => {
        const ids = state?.cartItemIds ?? cart.items.map((item) => item.id);
        const items = cart.items.filter((item) => ids.includes(item.id) && item.available);
        const address = addresses.find((item) => item.is_default) ?? addresses[0];
        setData({ items, options, addresses });
        setForm({
          address_id: address ? String(address.id) : "",
          recipient_name: address?.recipient_name ?? "",
          recipient_phone: address?.recipient_phone ?? "",
          shipping_address: address ? fullAddress(address) : "",
          shipping_method_id: String(options.shipping_methods[0]?.id ?? ""),
          payment_method: options.payment_methods[0]?.code ?? "COD",
          note: ""
        });
        setFailed(false);
      })
      .catch((failure) => { if (!isCanceled(failure)) setFailed(true); });

    return () => controller.abort();
  }, [attempt, state]);

  if (failed) return <RequestError retry={() => setAttempt((value) => value + 1)} />;
  if (!data || !form) return <Loading text="Đang chuẩn bị đơn hàng…" />;
  if (data.items.length === 0) {
    return <EmptyState title="Chưa có sản phẩm để đặt"
      description="Hãy chọn sản phẩm còn hàng trong giỏ trước khi đặt." to="/cart"
      linkLabel="Về giỏ hàng" />;
  }

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const chooseAddress = (event) => {
    const address = data.addresses.find((item) => String(item.id) === event.target.value);
    setForm({ ...form, address_id: event.target.value,
      ...(address ? { recipient_name: address.recipient_name,
        recipient_phone: address.recipient_phone,
        shipping_address: fullAddress(address) } : {}) });
  };

  const shipping = data.options.shipping_methods
    .find((item) => String(item.id) === form.shipping_method_id);
  const subtotal = data.items.reduce((sum, item) => sum + Number(item.total_price), 0);
  const fee = Number(shipping?.base_fee ?? 0);

  const submit = async (event) => {
    event.preventDefault();
    if (sending.current) return;
    if (!/^0\d{9}$/.test(form.recipient_phone.trim())) {
      setError("Số điện thoại gồm 10 số, bắt đầu bằng 0.");
      return;
    }

    sending.current = true;
    setBusy(true);
    setError("");

    try {
      const order = await createOrder({
        cart_item_ids: data.items.map((item) => item.id),
        recipient_name: form.recipient_name.trim(),
        recipient_phone: form.recipient_phone.trim(),
        shipping_address: form.shipping_address.trim(),
        shipping_method_id: Number(form.shipping_method_id),
        payment_method: form.payment_method,
        note: form.note.trim() || null
      });
      navigate(`/orders/${order.id}`, { replace: true, state: { created: true } });
    } catch (failure) {
      setError(failure.response ? apiError(failure)
        : "Chưa xác nhận được kết quả. Hãy kiểm tra trang Đơn hàng trước khi đặt lại.");
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="tv-page">
      <PageHeader title="Đặt hàng" />
      <form className="checkout-layout" onSubmit={submit}>
        <section className="tv-panel">
          <h2>Thông tin giao hàng</h2>
          {data.addresses.length > 0 ? (
            <label className="form-label w-100">Chọn từ sổ địa chỉ
              <select className="form-select" value={form.address_id} onChange={chooseAddress}>
                <option value="">— Nhập địa chỉ khác —</option>
                {data.addresses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.recipient_name}, {fullAddress(item)}{item.is_default ? " (mặc định)" : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="variant-stock">Bạn có thể lưu địa chỉ trong <Link to="/profile">Hồ sơ</Link>.</p>
          )}
          <div className="row g-3 mt-1">
            <label className="form-label col-md-6">Người nhận
              <input className="form-control" value={form.recipient_name}
                onChange={set("recipient_name")} maxLength={100} required />
            </label>
            <label className="form-label col-md-6">Điện thoại
              <input className="form-control" type="tel" value={form.recipient_phone}
                onChange={set("recipient_phone")} placeholder="0901234567" required />
            </label>
            <label className="form-label col-12">Địa chỉ giao hàng
              <textarea className="form-control" rows={2} value={form.shipping_address}
                onChange={set("shipping_address")} maxLength={2000} required />
            </label>
            <label className="form-label col-12">Ghi chú (không bắt buộc)
              <input className="form-control" value={form.note} onChange={set("note")}
                maxLength={1000} />
            </label>
          </div>

          <h2 className="mt-4">Vận chuyển</h2>
          {data.options.shipping_methods.map((item) => (
            <label key={item.id} className="choice-card">
              <input type="radio" name="shipping" value={item.id}
                checked={form.shipping_method_id === String(item.id)}
                onChange={set("shipping_method_id")} />
              <span><strong>{item.name}</strong>: {priceText(item.base_fee)}
                {item.estimated_days ? `, khoảng ${item.estimated_days} ngày` : ""}</span>
            </label>
          ))}

          <h2 className="mt-4">Thanh toán</h2>
          {data.options.payment_methods.map((item) => (
            <label key={item.code} className="choice-card">
              <input type="radio" name="payment" value={item.code}
                checked={form.payment_method === item.code} onChange={set("payment_method")} />
              <span><strong>{item.name}</strong>
                {item.code === "SIMULATED" && " (thanh toán ở trang chi tiết đơn sau khi đặt)"}</span>
            </label>
          ))}
        </section>

        <aside className="cart-summary">
          <h2>Đơn hàng ({data.items.length})</h2>
          <ul className="checkout-items">
            {data.items.map((item) => (
              <li key={item.id}>
                <span>{item.name}{item.color ? ` (${item.color} / ${item.size})` : ""} × {item.quantity}</span>
                <strong>{priceText(item.total_price)}</strong>
              </li>
            ))}
          </ul>
          <p>Tạm tính <strong>{priceText(subtotal)}</strong></p>
          <p>Phí vận chuyển <strong>{priceText(fee)}</strong></p>
          <p className="cart-summary__total">Tổng cộng <strong>{priceText(subtotal + fee)}</strong></p>
          <Notice error={error} />
          <button className="add-to-cart-btn" type="submit" disabled={busy}>
            {busy ? "Đang đặt hàng…" : "Xác nhận đặt hàng"}
          </button>
          <Link to="/cart" className="btn btn-link">← Quay lại giỏ</Link>
        </aside>
      </form>
    </div>
  );
};

export default CheckoutPage;
