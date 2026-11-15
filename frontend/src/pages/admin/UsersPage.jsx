import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Notice from "../../components/common/Notice";
import Pager from "../../components/common/Pager";
import StatusBadge from "../../components/common/StatusBadge";
import { Loading } from "../../components/products/CatalogUI";
import { useAuth } from "../../contexts/AuthContext";
import { changeRole, changeUserStatus, createStaff, listUsers } from "../../services/adminService";
import { apiError, isCanceled } from "../../services/api";
import { validEmail, validPassword } from "../../utils/accountValidation";

const ROLES = ["CUSTOMER", "MANAGER", "ADMIN"];
const STATUS = { ACTIVE: "Hoạt động", LOCKED: "Đã khóa", DISABLED: "Vô hiệu" };
const blankStaff = { full_name: "", email: "", phone: "", password: "", role: "MANAGER" };

const UsersPage = () => {
  const { user: me } = useAuth();
  const [filters, setFilters] = useState({ search: "", role: "", status: "", page: 1 });
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState(null);
  const [version, setVersion] = useState(0);
  const [staff, setStaff] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    const params = Object.fromEntries(Object.entries({ ...filters, limit: 20 })
      .filter(([, value]) => value !== ""));
    listUsers(params, controller.signal).then(setResult).catch((failure) => {
      if (!isCanceled(failure)) setNotice({ error: apiError(failure) });
    });

    return () => controller.abort();
  }, [filters, version]);

  const act = async (action, message) => {
    setBusy(true);
    setNotice({});

    try {
      await action();
      setNotice({ message });
      setVersion((value) => value + 1);
      return true;
    } catch (failure) {
      setNotice({ error: failure.response ? apiError(failure) : failure.message });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const saveStaff = async (event) => {
    event.preventDefault();
    const ok = await act(() => {
      const body = { ...staff, full_name: staff.full_name.trim(),
        email: staff.email.trim().toLowerCase(), phone: staff.phone.trim() };
      if (!validEmail(body.email)) throw new Error("Email không đúng định dạng.");
      if (!validPassword(body.password)) throw new Error("Mật khẩu cần 8–72 byte.");

      return createStaff(body);
    }, "Đã tạo tài khoản nội bộ.");
    if (ok) setStaff(null);
  };

  const setFilter = (key, value) => setFilters({ ...filters, [key]: value, page: 1 });
  const setField = (key) => (event) => setStaff({ ...staff, [key]: event.target.value });

  return (
    <div>
      <PageHeader title="Quản lý người dùng"
        description="Đổi vai trò, khóa/mở khóa tài khoản. Mọi thay đổi được ghi audit log.">
        {!staff && <button type="button" className="btn btn-dark"
          onClick={() => setStaff(blankStaff)}>+ Tạo Manager / Admin</button>}
      </PageHeader>
      <Notice error={notice.error} message={notice.message} />
      {staff && (
        <form className="tv-panel row g-2 align-items-end" onSubmit={saveStaff}>
          <label className="form-label col-md-3">Họ tên
            <input className="form-control" value={staff.full_name} maxLength={100} required
              onChange={setField("full_name")} /></label>
          <label className="form-label col-md-3">Email
            <input className="form-control" type="email" value={staff.email} required
              onChange={setField("email")} /></label>
          <label className="form-label col-md-2">Điện thoại
            <input className="form-control" value={staff.phone} required
              onChange={setField("phone")} /></label>
          <label className="form-label col-md-2">Mật khẩu
            <input className="form-control" type="password" value={staff.password}
              autoComplete="new-password" required onChange={setField("password")} /></label>
          <label className="form-label col-md-2">Vai trò
            <select className="form-select" value={staff.role} onChange={setField("role")}>
              <option value="MANAGER">MANAGER</option>
              <option value="ADMIN">ADMIN</option>
            </select></label>
          <div className="col-12 d-flex gap-2">
            <button type="submit" className="btn btn-dark" disabled={busy}>Tạo tài khoản</button>
            <button type="button" className="btn btn-outline-secondary"
              onClick={() => setStaff(null)}>Hủy</button>
          </div>
        </form>
      )}
      <form className="workspace-filters" onSubmit={(event) => {
        event.preventDefault();
        setFilter("search", keyword.trim().slice(0, 100));
      }}>
        <input className="form-control" placeholder="Tìm tên hoặc email" value={keyword}
          onChange={(event) => setKeyword(event.target.value)} />
        <select className="form-select" value={filters.role}
          onChange={(event) => setFilter("role", event.target.value)}>
          <option value="">Mọi vai trò</option>
          {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
        <select className="form-select" value={filters.status}
          onChange={(event) => setFilter("status", event.target.value)}>
          <option value="">Mọi trạng thái</option>
          {Object.entries(STATUS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <button type="submit" className="btn btn-dark">Lọc</button>
      </form>
      {!result && <Loading />}
      {result && (
        <div className="table-responsive">
          <table className="table tv-table align-middle">
            <thead><tr><th>ID</th><th>Người dùng</th><th>Điện thoại</th><th>Vai trò</th>
              <th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              {result.items.map((item) => {
                const self = item.id === me.id;

                return (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td><strong>{item.full_name}</strong><small className="d-block text-muted">{item.email}</small></td>
                    <td>{item.phone}</td>
                    <td>
                      <select className="form-select form-select-sm" value={item.role}
                        disabled={busy || self} aria-label={`Vai trò của ${item.full_name}`}
                        onChange={(event) => act(() => changeRole(item.id, event.target.value),
                          `Đã đổi vai trò ${item.email}.`)}>
                        {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                      </select>
                    </td>
                    <td><StatusBadge status={item.status} labels={STATUS} /></td>
                    <td>
                      {self ? <small className="text-muted">Tài khoản của bạn</small>
                        : item.status === "ACTIVE"
                          ? <button type="button" className="btn btn-sm btn-outline-danger" disabled={busy}
                              onClick={() => window.confirm(`Khóa ${item.email}?`) &&
                                act(() => changeUserStatus(item.id, "LOCKED"), "Đã khóa tài khoản.")}>Khóa</button>
                          : <button type="button" className="btn btn-sm btn-outline-dark" disabled={busy}
                              onClick={() => act(() => changeUserStatus(item.id, "ACTIVE"),
                                "Đã mở khóa tài khoản.")}>Mở khóa</button>}
                    </td>
                  </tr>
                );
              })}
              {result.items.length === 0 && <tr><td colSpan={6}>Không có người dùng phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {result && <Pager page={filters.page} hasNext={result.pagination.has_next}
        onChange={(value) => setFilters({ ...filters, page: value })} />}
    </div>
  );
};

export default UsersPage;
