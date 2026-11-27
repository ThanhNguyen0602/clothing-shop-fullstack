import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { addToCart } from "../../services/catalogService";
import { apiError } from "../../services/api";

// Them vao gio: neu san pham co bien the thi bat buoc da chon variant.
const AddToCart = ({ id, stock, variant, needsVariant = false, onStockChanged }) => {
  const { user, signOut } = useAuth();
  const sending = useRef(false);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const available = Number(variant ? variant.stock_quantity : stock);
  const amount = Math.min(quantity, Math.max(available, 1));

  const add = async () => {
    if (sending.current) return;
    if (needsVariant && !variant) {
      setMessage({ text: "Vui lòng chọn màu và kích thước.", error: true });
      return;
    }

    sending.current = true;
    setBusy(true);
    setMessage(null);

    try {
      await addToCart({ productId: id, variantId: variant?.id ?? null, quantity: amount });
      setMessage({ text: `Đã thêm ${amount} sản phẩm vào giỏ.` });
    } catch (error) {
      if (error.response?.status === 401) {
        signOut();
        return;
      }

      const text = !error.response
        ? "Chưa xác nhận được kết quả. Hãy kiểm tra giỏ trước khi thêm lại."
        : apiError(error);
      setMessage({ text, error: true });
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };

  if (Number(stock) <= 0) {
    return <p className="product-stock-status is-out">Sản phẩm tạm hết hàng.</p>;
  }
  if (!user) {
    return (
      <Link className="add-to-cart-btn" to="/login"
        state={{ returnTo: `/products/${id}` }}>Đăng nhập để mua hàng</Link>
    );
  }
  if (user.role !== "CUSTOMER") {
    return <p className="variant-stock">Tài khoản quản lý không mua hàng.</p>;
  }

  return (
    <div className="product-buy">
      <div className="product-option">
        <span>Số lượng</span>
        <div className="quantity-control">
          <button type="button" aria-label="Giảm" disabled={amount <= 1}
            onClick={() => setQuantity(amount - 1)}>−</button>
          <span aria-live="polite">{amount}</span>
          <button type="button" aria-label="Tăng" disabled={amount >= available}
            onClick={() => setQuantity(amount + 1)}>+</button>
        </div>
      </div>
      <button className="add-to-cart-btn" type="button"
        disabled={busy || available <= 0} onClick={add}>
        {busy ? "Đang thêm…" : "Thêm vào giỏ"}
      </button>
      {message && (
        <p className={`tv-alert tv-alert--${message.error ? "danger" : "success"}`}
          role={message.error ? "alert" : "status"}>
          {message.text} {!message.error && <Link to="/cart">Xem giỏ hàng</Link>}
        </p>
      )}
    </div>
  );
};

export default AddToCart;
