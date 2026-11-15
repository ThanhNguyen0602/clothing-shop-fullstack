import { useEffect, useState } from "react";
import Notice from "../common/Notice";
import { createAddress, listAddresses, removeAddress, setDefaultAddress, updateAddress }
  from "../../services/shopService";
import { apiError, isCanceled } from "../../services/api";

const blank = { recipient_name: "", recipient_phone: "", province: "", district: "",
  ward: "", street_address: "", note: "", is_default: false };

const FIELDS = [
  ["recipient_name", "Người nhận", 100, true],
  ["recipient_phone", "Điện thoại", 20, true],
  ["street_address", "Số nhà, đường", 255, true],
  ["ward", "Phường / xã", 100, true],
  ["district", "Quận / huyện (không bắt buộc)", 100, false],
  ["province", "Tỉnh / thành phố", 100, true],
  ["note", "Ghi chú (không bắt buộc)", 255, false]
];

// Gui null cho truong tuy chon de trung khop addressBody o backend.
const toBody = (form, editing) => {
  const body = {
    recipient_name: form.recipient_name.trim(),
    recipient_phone: form.recipient_phone.trim(),
    province: form.province.trim(), ward: form.ward.trim(),
    street_address: form.street_address.trim(),
    district: form.district.trim() || null, note: form.note.trim() || null
  };

  return editing ? body : { ...body, is_default: form.is_default };
};

const AddressBook = () => {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    listAddresses(controller.signal).then(setItems).catch((failure) => {
      if (!isCanceled(failure)) setNotice({ error: apiError(failure) });
    });

    return () => controller.abort();
  }, []);

  const run = async (action, message) => {
    setBusy(true);
    setNotice({});

    try {
      setItems(await action());
      setNotice({ message });
      return true;
    } catch (failure) {
      setNotice({ error: apiError(failure) });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const open = (address) => {
    setEditing(address?.id ?? null);
    setForm(address ? Object.fromEntries(Object.keys(blank).map((key) =>
      [key, key === "is_default" ? Boolean(address.is_default) : address[key] ?? ""])) : blank);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!/^0\d{9}$/.test(form.recipient_phone.trim())) {
      setNotice({ error: "Số điện thoại gồm 10 số, bắt đầu bằng 0." });
      return;
    }

    const ok = await run(() => editing
      ? updateAddress(editing, toBody(form, true))
      : createAddress(toBody(form, false)), "Đã lưu địa chỉ.");
    if (ok) setForm(null);
  };

  return (
    <section className="tv-panel">
      <div className="d-flex justify-content-between align-items-center">
        <h2>Sổ địa chỉ</h2>
        {!form && <button type="button" className="btn btn-sm btn-dark"
          onClick={() => open(null)}>+ Thêm địa chỉ</button>}
      </div>
      <Notice error={notice.error} message={notice.message} />
      {form && (
        <form className="row g-2 mb-3" onSubmit={submit}>
          {FIELDS.map(([key, label, max, required]) => (
            <label key={key} className="form-label col-md-6">{label}
              <input className="form-control" value={form[key]} maxLength={max}
                required={required}
                onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
            </label>
          ))}
          {!editing && (
            <label className="form-check col-12">
              <input type="checkbox" className="form-check-input" checked={form.is_default}
                onChange={(event) => setForm({ ...form, is_default: event.target.checked })} />
              Đặt làm địa chỉ mặc định
            </label>
          )}
          <div className="col-12 d-flex gap-2">
            <button type="submit" className="btn btn-dark" disabled={busy}>Lưu địa chỉ</button>
            <button type="button" className="btn btn-outline-secondary"
              onClick={() => setForm(null)}>Hủy</button>
          </div>
        </form>
      )}
      {items?.length === 0 && <p className="variant-stock">Chưa có địa chỉ nào.</p>}
      <ul className="address-list">
        {items?.map((item) => (
          <li key={item.id} className={item.is_default ? "is-default" : ""}>
            <div>
              <strong>{item.recipient_name}</strong>, {item.recipient_phone}
              {item.is_default ? <span className="status-badge status-badge--success">Mặc định</span> : null}
              <p>{[item.street_address, item.ward, item.district, item.province]
                .filter(Boolean).join(", ")}</p>
            </div>
            <div className="address-list__actions">
              {!item.is_default && (
                <button type="button" className="btn btn-sm btn-outline-dark" disabled={busy}
                  onClick={() => run(() => setDefaultAddress(item.id), "Đã đổi địa chỉ mặc định.")}>
                  Đặt mặc định
                </button>
              )}
              <button type="button" className="btn btn-sm btn-outline-secondary"
                onClick={() => open(item)}>Sửa</button>
              <button type="button" className="btn btn-sm btn-outline-danger" disabled={busy}
                onClick={() => window.confirm("Xóa địa chỉ này?") &&
                  run(() => removeAddress(item.id), "Đã xóa địa chỉ.")}>Xóa</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default AddressBook;
