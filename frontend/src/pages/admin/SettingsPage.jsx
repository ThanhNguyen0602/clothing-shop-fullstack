import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Notice from "../../components/common/Notice";
import { Loading } from "../../components/products/CatalogUI";
import { getAdminSettings, saveSettings } from "../../services/adminService";
import { apiError, isCanceled } from "../../services/api";
import { resetSettingsCache } from "../../hooks/useSettings";

const FIELDS = [
  ["shop_name", "Tên cửa hàng", false],
  ["contact_email", "Email liên hệ", false],
  ["contact_phone", "Điện thoại liên hệ", false],
  ["shop_address", "Địa chỉ cửa hàng", false],
  ["shipping_note", "Chính sách giao hàng", true],
  ["return_policy", "Chính sách đổi trả", true]
];

const SettingsPage = () => {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    getAdminSettings(controller.signal)
      .then((data) => setForm(Object.fromEntries(FIELDS.map(([key]) => [key, data[key] ?? ""]))))
      .catch((failure) => { if (!isCanceled(failure)) setNotice({ error: apiError(failure) }); });

    return () => controller.abort();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setNotice({});

    try {
      const saved = await saveSettings(form);
      setForm(Object.fromEntries(FIELDS.map(([key]) => [key, saved[key] ?? ""])));
      resetSettingsCache();
      setNotice({ message: "Đã lưu cấu hình. Tải lại trang để thấy header/footer mới." });
    } catch (failure) {
      setNotice({ error: apiError(failure) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Cấu hình cửa hàng"
        description="Thông tin hiển thị ở header, footer và các trang chính sách." />
      <Notice error={notice.error} message={notice.message} />
      {!form && !notice.error && <Loading />}
      {form && (
        <form className="tv-panel account-form" onSubmit={submit}>
          {FIELDS.map(([key, label, long]) => (
            <label key={key}>{label}
              {long
                ? <textarea className="form-control" rows={3} value={form[key]}
                    onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
                : <input className="form-control" value={form[key]}
                    onChange={(event) => setForm({ ...form, [key]: event.target.value })} />}
            </label>
          ))}
          <button type="submit" className="button" disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu cấu hình"}
          </button>
        </form>
      )}
    </div>
  );
};

export default SettingsPage;
