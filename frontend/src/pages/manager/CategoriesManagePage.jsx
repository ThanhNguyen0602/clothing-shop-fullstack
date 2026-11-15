import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Notice from "../../components/common/Notice";
import StatusBadge from "../../components/common/StatusBadge";
import { Loading } from "../../components/products/CatalogUI";
import { createCategory, listManagedCategories, removeCategory, updateCategory }
  from "../../services/managementService";
import { apiError, isCanceled } from "../../services/api";
import slugify from "../../utils/slugify";

const blank = { name: "", slug: "", description: "", image_url: "", status: "ACTIVE",
  display_order: "0" };
const STATUS = { ACTIVE: "Hiển thị", INACTIVE: "Ẩn" };

const CategoriesManagePage = () => {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({});

  const refresh = (signal) => listManagedCategories(signal).then(setItems)
    .catch((failure) => { if (!isCanceled(failure)) setNotice({ error: apiError(failure) }); });

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);

    return () => controller.abort();
  }, []);

  const run = async (action, message) => {
    setBusy(true);
    setNotice({});

    try {
      await action();
      setNotice({ message });
      await refresh();
      return true;
    } catch (failure) {
      setNotice({ error: failure.response ? apiError(failure) : failure.message });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    const ok = await run(() => {
      if (!/^\d+$/.test(form.display_order)) throw new Error("Thứ tự phải là số nguyên ≥ 0.");
      const body = { name: form.name.trim(), slug: form.slug.trim() || slugify(form.name),
        description: form.description.trim() || null, image_url: form.image_url.trim() || null,
        status: form.status, display_order: Number(form.display_order) };

      return editing ? updateCategory(editing, body) : createCategory(body);
    }, "Đã lưu danh mục.");

    if (ok) {
      setForm(blank);
      setEditing(null);
    }
  };

  const edit = (item) => {
    setEditing(item.id);
    setForm({ name: item.name, slug: item.slug, description: item.description ?? "",
      image_url: item.image_url ?? "", status: item.status,
      display_order: String(item.display_order) });
  };

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  return (
    <div>
      <PageHeader title="Quản lý danh mục" />
      <Notice error={notice.error} message={notice.message} />
      <form className="tv-panel row g-2 align-items-end" onSubmit={save}>
        <h2 className="col-12">{editing ? "Sửa danh mục" : "Thêm danh mục"}</h2>
        <label className="form-label col-md-4">Tên
          <input className="form-control" value={form.name} maxLength={100} required
            onChange={(event) => setForm({ ...form, name: event.target.value,
              slug: editing ? form.slug : slugify(event.target.value) })} />
        </label>
        <label className="form-label col-md-4">Slug
          <input className="form-control" value={form.slug} maxLength={150} required
            onChange={set("slug")} />
        </label>
        <label className="form-label col-md-2">Thứ tự
          <input className="form-control" inputMode="numeric" value={form.display_order}
            onChange={set("display_order")} />
        </label>
        <label className="form-label col-md-2">Trạng thái
          <select className="form-select" value={form.status} onChange={set("status")}>
            <option value="ACTIVE">Hiển thị</option>
            <option value="INACTIVE">Ẩn</option>
          </select>
        </label>
        <label className="form-label col-md-6">Mô tả
          <input className="form-control" value={form.description} onChange={set("description")} />
        </label>
        <label className="form-label col-md-4">URL ảnh (không bắt buộc)
          <input className="form-control" value={form.image_url} onChange={set("image_url")} />
        </label>
        <div className="col-md-2 d-flex gap-1">
          <button type="submit" className="btn btn-dark" disabled={busy}>Lưu</button>
          {editing && <button type="button" className="btn btn-outline-secondary"
            onClick={() => { setEditing(null); setForm(blank); }}>Hủy</button>}
        </div>
      </form>
      {!items && <Loading />}
      {items && (
        <table className="table tv-table align-middle">
          <thead><tr><th>#</th><th>Tên</th><th>Slug</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.display_order}</td>
                <td><strong>{item.name}</strong><small className="d-block text-muted">{item.description}</small></td>
                <td>{item.slug}</td>
                <td><StatusBadge status={item.status} labels={STATUS} /></td>
                <td className="text-nowrap">
                  <button type="button" className="btn btn-sm btn-outline-dark"
                    onClick={() => edit(item)}>Sửa</button>{" "}
                  <button type="button" className="btn btn-sm btn-outline-danger" disabled={busy}
                    onClick={() => window.confirm(`Xóa danh mục "${item.name}"?`) &&
                      run(() => removeCategory(item.id), "Đã xóa danh mục.")}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CategoriesManagePage;
