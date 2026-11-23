import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Modal } from "react-bootstrap";
import PageHeader from "../../components/common/PageHeader";
import Notice from "../../components/common/Notice";
import StatusBadge from "../../components/common/StatusBadge";
import { Loading, ProductImage } from "../../components/products/CatalogUI";
import { changeProductStatus, createProduct, getManagedProduct, listManagedCategories,
  listManagedProducts, updateProduct } from "../../services/managementService";
import { listBrands } from "../../services/catalogService";
import { apiError, isCanceled } from "../../services/api";
import { moneyInput, priceText } from "../../utils/catalogDisplay";
import slugify from "../../utils/slugify";

const STATUS = { ACTIVE: "Đang bán", INACTIVE: "Tạm ẩn", DISCONTINUED: "Ngừng bán" };

const blank = { category_id: "", brand_id: "", sku: "", name: "", slug: "",
  short_description: "", description: "", original_price: "", sale_price: "",
  stock_quantity: "0", status: "ACTIVE", images: "" };

const webUrl = (value) => {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

// Chuyen du lieu form -> body dung chuan productBody o backend.
const toBody = (form) => {
  const original = moneyInput(form.original_price);
  const sale = moneyInput(form.sale_price || form.original_price);

  if (!original || !sale) throw new Error("Giá phải là số không âm, tối đa 2 số lẻ.");
  if (!/^\d+$/.test(form.stock_quantity)) throw new Error("Tồn kho phải là số nguyên ≥ 0.");
  if (Number(sale) > Number(original)) throw new Error("Giá bán không được lớn hơn giá gốc.");

  const images = form.images.split("\n").map((line) => line.trim()).filter(Boolean);

  if (images.length > 10) throw new Error("Mỗi sản phẩm tối đa 10 ảnh.");
  if (!images.every(webUrl)) throw new Error("URL ảnh phải bắt đầu bằng http:// hoặc https://.");

  return {
    category_id: Number(form.category_id),
    brand_id: form.brand_id ? Number(form.brand_id) : null,
    sku: form.sku.trim(), name: form.name.trim(),
    slug: form.slug.trim() || slugify(form.name),
    short_description: form.short_description.trim() || null,
    description: form.description.trim() || null,
    original_price: original, sale_price: sale,
    stock_quantity: Number(form.stock_quantity), status: form.status,
    images
  };
};

const ProductsManagePage = () => {
  const [items, setItems] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [hasVariants, setHasVariants] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({});
  const [formError, setFormError] = useState("");

  const refresh = (signal) => listManagedProducts(signal).then(setItems)
    .catch((failure) => { if (!isCanceled(failure)) setNotice({ error: apiError(failure) }); });

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    listManagedCategories(controller.signal).then(setCategories).catch(() => {});
    listBrands(controller.signal).then(setBrands).catch(() => {});

    return () => controller.abort();
  }, []);

  const open = async (product) => {
    setFormError("");
    if (!product) {
      setEditing(null);
      setHasVariants(false);
      setForm({ ...blank, category_id: String(categories[0]?.id ?? "") });
      return;
    }

    try {
      const detail = await getManagedProduct(product.id);
      setEditing(detail.id);
      setHasVariants(detail.variants.length > 0);
      setForm({
        category_id: String(detail.category_id), brand_id: String(detail.brand_id ?? ""),
        sku: detail.sku, name: detail.name, slug: detail.slug,
        short_description: detail.short_description ?? "", description: detail.description ?? "",
        original_price: detail.original_price, sale_price: detail.sale_price,
        stock_quantity: String(detail.stock_quantity), status: detail.status,
        images: detail.images.map((image) => image.image_url).join("\n")
      });
    } catch (failure) {
      setNotice({ error: apiError(failure) });
    }
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setFormError("");

    try {
      const body = toBody(form);
      if (editing) await updateProduct(editing, body);
      else await createProduct(body);
      setForm(null);
      setNotice({ message: "Đã lưu sản phẩm." });
      await refresh();
    } catch (failure) {
      setFormError(failure.response ? apiError(failure) : failure.message);
    } finally {
      setBusy(false);
    }
  };

  const flip = async (product) => {
    const next = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      await changeProductStatus(product.id, next);
      setNotice({ message: `Đã chuyển "${product.name}" sang ${STATUS[next]}.` });
      await refresh();
    } catch (failure) {
      setNotice({ error: apiError(failure) });
    }
  };

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  const text = keyword.trim().toLowerCase();
  const shown = (items ?? []).filter((item) =>
    (!statusFilter || item.status === statusFilter) &&
    (!text || `${item.name} ${item.sku}`.toLowerCase().includes(text)));

  return (
    <div>
      <PageHeader title="Quản lý sản phẩm"
        description="Thêm, sửa, ẩn sản phẩm; quản lý ảnh và biến thể màu/size.">
        <button type="button" className="btn btn-dark" onClick={() => open(null)}>
          + Thêm sản phẩm
        </button>
      </PageHeader>
      <Notice error={notice.error} message={notice.message} />
      <div className="workspace-filters">
        <input className="form-control" placeholder="Tìm theo tên hoặc SKU" value={keyword}
          onChange={(event) => setKeyword(event.target.value)} />
        <select className="form-select" value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">Mọi trạng thái</option>
          {Object.entries(STATUS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </div>
      {!items && <Loading />}
      {items && (
        <div className="table-responsive">
          <table className="table tv-table align-middle">
            <thead>
              <tr><th>Ảnh</th><th>Sản phẩm</th><th>Danh mục</th><th>Giá bán</th>
                <th>Tồn kho</th><th>Trạng thái</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {shown.map((item) => (
                <tr key={item.id}>
                  <td><ProductImage src={item.thumbnail} alt="" className="cart-thumb" /></td>
                  <td><strong>{item.name}</strong><small className="d-block text-muted">{item.sku}</small></td>
                  <td>{item.category_name}</td>
                  <td>{priceText(item.sale_price)}</td>
                  <td>{item.stock_quantity}</td>
                  <td><StatusBadge status={item.status} labels={STATUS} /></td>
                  <td className="text-nowrap">
                    <button type="button" className="btn btn-sm btn-outline-dark"
                      onClick={() => open(item)}>Sửa</button>{" "}
                    <Link className="btn btn-sm btn-outline-primary"
                      to={`/manager/products/${item.id}/assets`}>Ảnh / Size</Link>{" "}
                    {item.status !== "DISCONTINUED" && (
                      <button type="button" className="btn btn-sm btn-outline-secondary"
                        onClick={() => flip(item)}>{item.status === "ACTIVE" ? "Ẩn" : "Hiện"}</button>
                    )}
                  </td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan={7}>Không có sản phẩm phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Modal show={Boolean(form)} onHide={() => setForm(null)} size="lg">
        {form && (
          <form onSubmit={save}>
            <Modal.Header closeButton>
              <Modal.Title>{editing ? "Sửa sản phẩm" : "Thêm sản phẩm"}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="row g-2">
              <label className="form-label col-md-8">Tên sản phẩm
                <input className="form-control" value={form.name} maxLength={255} required
                  onChange={(event) => setForm({ ...form, name: event.target.value,
                    slug: editing ? form.slug : slugify(event.target.value) })} />
              </label>
              <label className="form-label col-md-4">SKU
                <input className="form-control" value={form.sku} maxLength={50} required
                  onChange={set("sku")} />
              </label>
              <label className="form-label col-md-6">Slug
                <input className="form-control" value={form.slug} maxLength={255} required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*" onChange={set("slug")} />
              </label>
              <label className="form-label col-md-3">Danh mục
                <select className="form-select" value={form.category_id} required
                  onChange={set("category_id")}>
                  <option value="">Chọn</option>
                  {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label className="form-label col-md-3">Thương hiệu
                <select className="form-select" value={form.brand_id} onChange={set("brand_id")}>
                  <option value="">Không có</option>
                  {brands.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label className="form-label col-md-4">Giá gốc (đ)
                <input className="form-control" inputMode="decimal" value={form.original_price}
                  required onChange={set("original_price")} />
              </label>
              <label className="form-label col-md-4">Giá bán (đ, ≤ giá gốc)
                <input className="form-control" inputMode="decimal" value={form.sale_price}
                  placeholder="Bỏ trống = giá gốc" onChange={set("sale_price")} />
              </label>
              <label className="form-label col-md-4">Tồn kho
                <input className="form-control" inputMode="numeric" value={form.stock_quantity}
                  disabled={hasVariants} onChange={set("stock_quantity")} />
                {hasVariants && <small className="text-muted">Tự tính = tổng tồn kho biến thể</small>}
              </label>
              <label className="form-label col-md-4">Trạng thái
                <select className="form-select" value={form.status} onChange={set("status")}>
                  {Object.entries(STATUS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </label>
              <label className="form-label col-md-8">Mô tả ngắn
                <input className="form-control" value={form.short_description} maxLength={500}
                  onChange={set("short_description")} />
              </label>
              <label className="form-label col-12">Mô tả chi tiết
                <textarea className="form-control" rows={3} value={form.description}
                  onChange={set("description")} />
              </label>
              <label className="form-label col-12">URL ảnh (mỗi dòng một URL, tối đa 10)
                <textarea className="form-control" rows={2} value={form.images}
                  onChange={set("images")} placeholder="https://..." />
                <small className="text-muted">Có thể tải ảnh từ máy ở mục “Ảnh / Size” sau khi lưu.</small>
              </label>
              <Notice error={formError} />
            </Modal.Body>
            <Modal.Footer>
              <button type="button" className="btn btn-secondary" onClick={() => setForm(null)}>Hủy</button>
              <button type="submit" className="btn btn-dark" disabled={busy}>
                {busy ? "Đang lưu…" : "Lưu sản phẩm"}
              </button>
            </Modal.Footer>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ProductsManagePage;
