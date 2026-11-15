import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Notice from "../components/common/Notice";
import { ProductImage, Loading, RequestError } from "../components/products/CatalogUI";
import { getCart, removeCartItem, updateCartItem, clearCart } from "../services/shopService";
import { apiError, isCanceled } from "../services/api";
import { priceText } from "../utils/catalogDisplay";

const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    getCart(controller.signal)
      .then((data) => { setCart(data); setFailed(false); })
      .catch((failure) => { if (!isCanceled(failure)) setFailed(true); });

    return () => controller.abort();
  }, [attempt]);

  // Mac dinh chon tat ca dong con mua duoc.
  const chosen = selected ?? (cart?.items ?? [])
    .filter((item) => item.available).map((item) => item.id);

  const run = async (action) => {
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      const data = await action();
      setCart(data);
      setSelected((current) => current?.filter((id) =>
        data.items.some((item) => item.id === id)) ?? null);
    } catch (failure) {
      setError(apiError(failure));
    } finally {
      setBusy(false);
    }
  };

  const toggle = (id) => setSelected(chosen.includes(id)
    ? chosen.filter((value) => value !== id) : [...chosen, id]);

  if (failed) return <RequestError retry={() => setAttempt((value) => value + 1)} />;
  if (!cart) return <Loading text="Đang tải giỏ hàng…" />;

  const items = cart.items;
  const picked = items.filter((item) => chosen.includes(item.id) && item.available);
  const total = picked.reduce((sum, item) => sum + Number(item.total_price), 0);

  const checkout = () => navigate("/checkout", {
    state: { cartItemIds: picked.map((item) => item.id) }
  });

  return (
    <div className="tv-page">
      <PageHeader title="Giỏ hàng của bạn"
        description="Chọn sản phẩm muốn đặt. Giá và tồn kho được kiểm tra lại khi đặt hàng." />
      <Notice error={error} />
      {items.length === 0 ? (
        <EmptyState title="Giỏ hàng đang trống"
          description="Khám phá bộ sưu tập và thêm sản phẩm bạn thích." />
      ) : (
        <div className="cart-layout">
          <div className="table-responsive">
            <table className="table tv-table align-middle">
              <thead>
                <tr><th aria-label="Chọn" /><th>Sản phẩm</th><th>Đơn giá</th>
                  <th>Số lượng</th><th>Thành tiền</th><th aria-label="Thao tác" /></tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className={item.available ? "" : "is-unavailable"}>
                    <td>
                      <input type="checkbox" className="form-check-input"
                        aria-label={`Chọn ${item.name}`} disabled={!item.available}
                        checked={item.available && chosen.includes(item.id)}
                        onChange={() => toggle(item.id)} />
                    </td>
                    <td>
                      <div className="cart-product">
                        <ProductImage src={item.thumbnail} alt="" className="cart-thumb" />
                        <div>
                          <Link to={`/products/${item.product_id}`}>{item.name}</Link>
                          {item.color && <small>{item.color} / {item.size}</small>}
                          {item.reason && <small className="text-danger">{item.reason}</small>}
                        </div>
                      </div>
                    </td>
                    <td>{priceText(item.unit_price)}</td>
                    <td>
                      <div className="quantity-control quantity-control--sm">
                        <button type="button" aria-label="Giảm" disabled={busy || item.quantity <= 1}
                          onClick={() => run(() => updateCartItem(item.id, item.quantity - 1))}>−</button>
                        <span>{item.quantity}</span>
                        <button type="button" aria-label="Tăng"
                          disabled={busy || item.quantity >= item.stock_quantity}
                          onClick={() => run(() => updateCartItem(item.id, item.quantity + 1))}>+</button>
                      </div>
                    </td>
                    <td>{priceText(item.total_price)}</td>
                    <td>
                      <button type="button" className="btn btn-sm btn-outline-danger" disabled={busy}
                        onClick={() => run(() => removeCartItem(item.id))}>Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <aside className="cart-summary">
            <h2>Tóm tắt</h2>
            <p>Đã chọn <strong>{picked.length}</strong> dòng sản phẩm</p>
            <p className="cart-summary__total">Tạm tính: <strong>{priceText(total)}</strong></p>
            <p className="variant-stock">Phí vận chuyển được tính ở bước đặt hàng.</p>
            <button type="button" className="add-to-cart-btn" disabled={picked.length === 0}
              onClick={checkout}>Tiến hành đặt hàng</button>
            <button type="button" className="btn btn-link text-danger" disabled={busy}
              onClick={() => window.confirm("Xóa toàn bộ giỏ hàng?") && run(clearCart)}>
              Xóa toàn bộ giỏ
            </button>
          </aside>
        </div>
      )}
    </div>
  );
};

export default CartPage;
