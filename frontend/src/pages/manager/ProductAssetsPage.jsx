import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Notice from "../../components/common/Notice";
import StatusBadge from "../../components/common/StatusBadge";
import { Loading } from "../../components/products/CatalogUI";
import { addVariant, getManagedProduct, removeImage, removeVariant, setPrimaryImage,
  updateVariant, uploadImage } from "../../services/managementService";
import { apiError, isCanceled } from "../../services/api";
import { moneyInput, priceText, validProductId, variantPrice } from "../../utils/catalogDisplay";
import NotFoundPage from "../NotFoundPage";

const blankVariant = { sku: "", color: "", size: "", price_adjustment: "0",
  stock_quantity: "0", status: "ACTIVE" };
const MAX_SIZE = 5 * 1024 * 1024;

const toVariantBody = (form) => {
  const adjustment = moneyInput(form.price_adjustment || "0");

  if (!adjustment) throw new Error("Chênh lệch giá là số không âm, tối đa 2 số lẻ.");
  if (!/^\d+$/.test(form.stock_quantity)) throw new Error("Tồn kho phải là số nguyên ≥ 0.");

  return { sku: form.sku.trim() || null, color: form.color.trim(), size: form.size.trim(),
    price_adjustment: adjustment, stock_quantity: Number(form.stock_quantity),
    status: form.status };
};

const Assets = ({ id }) => {
  const [product, setProduct] = useState(null);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({});
  const [variantForm, setVariantForm] = useState(blankVariant);
  const [editing, setEditing] = useState(null);
  const [fileKey, setFileKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getManagedProduct(id, controller.signal).then(setProduct).catch((failure) => {
      if (isCanceled(failure)) return;
      if (failure.response?.status === 404) setMissing(true);
      else setNotice({ error: apiError(failure) });
    });

    return () => controller.abort();
  }, [id]);

  const run = async (action, message) => {
    setBusy(true);
    setNotice({});

    try {
      const data = await action();
      setProduct(data);
      setNotice({ message });
      return true;
    } catch (failure) {
      setNotice({ error: failure.response ? apiError(failure) : failure.message });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setNotice({ error: "Chỉ nhận ảnh JPG, PNG hoặc WEBP." });
    } else if (file.size > MAX_SIZE) {
      setNotice({ error: "Ảnh tối đa 5 MB." });
    } else {
      await run(() => uploadImage(id, file), "Đã tải ảnh lên.");
    }
    setFileKey((value) => value + 1);
  };

  const saveVariant = async (event) => {
    event.preventDefault();
    const ok = await run(() => {
      const body = toVariantBody(variantForm);

      return editing ? updateVariant(id, editing, body) : addVariant(id, body);
    }, editing ? "Đã cập nhật biến thể." : "Đã thêm biến thể.");

    if (ok) {
      setVariantForm(blankVariant);
      setEditing(null);
    }
  };

  const editVariant = (variant) => {
    setEditing(variant.id);
    setVariantForm({ sku: variant.sku ?? "", color: variant.color, size: variant.size,
      price_adjustment: variant.price_adjustment, stock_quantity: String(variant.stock_quantity),
      status: variant.status });
  };

  if (missing) return <NotFoundPage />;
  if (!product) return notice.error ? <Notice error={notice.error} /> : <Loading />;

  const set = (key) => (event) => setVariantForm({ ...variantForm, [key]: event.target.value });

  return (
    <div>
      <Link to="/manager/products" className="back-link">← Danh sách sản phẩm</Link>
      <PageHeader title={product.name}
        description={`Giá bán ${priceText(product.sale_price)} · Tồn kho ${product.stock_quantity}`} />
      <Notice error={notice.error} message={notice.message} />

      <section className="tv-panel">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h2>Ảnh sản phẩm ({product.images.length}/10)</h2>
          <label className={`btn btn-dark${busy || product.images.length >= 10 ? " disabled" : ""}`}>
            + Tải ảnh từ máy
            <input key={fileKey} type="file" hidden accept="image/jpeg,image/png,image/webp"
              disabled={busy || product.images.length >= 10} onChange={upload} />
          </label>
        </div>
        <p className="variant-stock">JPG/PNG/WEBP, tối đa 5 MB. Ảnh chính dùng làm thumbnail.</p>
        <div className="asset-grid">
          {product.images.map((image) => (
            <figure key={image.id} className={Number(image.is_primary) ? "is-primary" : ""}>
              <img src={image.image_url} alt="" loading="lazy" />
              <figcaption>
                {Number(image.is_primary) ? <strong>Ảnh chính</strong> : (
                  <button type="button" className="btn btn-sm btn-outline-dark" disabled={busy}
                    onClick={() => run(() => setPrimaryImage(id, image.id), "Đã đặt ảnh chính.")}>
                    Đặt làm chính
                  </button>
                )}
                <button type="button" className="btn btn-sm btn-outline-danger" disabled={busy}
                  onClick={() => window.confirm("Xóa ảnh này?") &&
                    run(() => removeImage(id, image.id), "Đã xóa ảnh.")}>Xóa</button>
              </figcaption>
            </figure>
          ))}
          {product.images.length === 0 && <p>Chưa có ảnh.</p>}
        </div>
      </section>

      <section className="tv-panel">
        <h2>Biến thể màu / size ({product.variants.length})</h2>
        <p className="variant-stock">Khi có biến thể, tồn kho sản phẩm = tổng tồn kho các biến thể
          đang bán; khách bắt buộc chọn màu và size.</p>
        <div className="table-responsive">
          <table className="table tv-table align-middle">
            <thead>
              <tr><th>Màu</th><th>Size</th><th>SKU</th><th>Giá</th><th>Tồn kho</th>
                <th>Trạng thái</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {product.variants.map((variant) => (
                <tr key={variant.id}>
                  <td>{variant.color}</td>
                  <td>{variant.size}</td>
                  <td>{variant.sku || "—"}</td>
                  <td>{priceText(variantPrice(product, variant))}
                    {Number(variant.price_adjustment) > 0 &&
                      <small className="d-block text-muted">+{priceText(variant.price_adjustment)}</small>}
                  </td>
                  <td>{variant.stock_quantity}</td>
                  <td><StatusBadge status={variant.status}
                    labels={{ ACTIVE: "Đang bán", INACTIVE: "Tạm ẩn" }} /></td>
                  <td className="text-nowrap">
                    <button type="button" className="btn btn-sm btn-outline-dark"
                      onClick={() => editVariant(variant)}>Sửa</button>{" "}
                    <button type="button" className="btn btn-sm btn-outline-danger" disabled={busy}
                      onClick={() => window.confirm("Xóa biến thể này?") &&
                        run(() => removeVariant(id, variant.id), "Đã xóa biến thể.")}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form className="row g-2 align-items-end" onSubmit={saveVariant}>
          <h3 className="col-12">{editing ? "Sửa biến thể" : "Thêm biến thể"}</h3>
          <label className="form-label col-md-2">Màu
            <input className="form-control" value={variantForm.color} maxLength={50} required
              onChange={set("color")} placeholder="Trắng" />
          </label>
          <label className="form-label col-md-1">Size
            <input className="form-control" value={variantForm.size} maxLength={20} required
              onChange={set("size")} placeholder="M" />
          </label>
          <label className="form-label col-md-2">SKU riêng
            <input className="form-control" value={variantForm.sku} maxLength={60}
              onChange={set("sku")} placeholder="Không bắt buộc" />
          </label>
          <label className="form-label col-md-2">Cộng thêm (đ)
            <input className="form-control" inputMode="decimal" value={variantForm.price_adjustment}
              onChange={set("price_adjustment")} />
          </label>
          <label className="form-label col-md-2">Tồn kho
            <input className="form-control" inputMode="numeric" value={variantForm.stock_quantity}
              onChange={set("stock_quantity")} />
          </label>
          <label className="form-label col-md-1">Trạng thái
            <select className="form-select" value={variantForm.status} onChange={set("status")}>
              <option value="ACTIVE">Bán</option>
              <option value="INACTIVE">Ẩn</option>
            </select>
          </label>
          <div className="col-md-2 d-flex gap-1">
            <button type="submit" className="btn btn-dark" disabled={busy}>Lưu</button>
            {editing && (
              <button type="button" className="btn btn-outline-secondary"
                onClick={() => { setEditing(null); setVariantForm(blankVariant); }}>Hủy</button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
};

const ProductAssetsPage = () => {
  const { id } = useParams();

  return validProductId(id) ? <Assets id={id} /> : <NotFoundPage />;
};

export default ProductAssetsPage;
