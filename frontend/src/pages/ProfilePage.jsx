import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { authError } from "../services/authService";
import { validateProfile } from "../utils/accountValidation";
import PageHeader from "../components/common/PageHeader";
import Notice from "../components/common/Notice";
import PasswordForm from "../components/account/PasswordForm";
import AddressBook from "../components/account/AddressBook";

const ProfilePage = () => {
  const { user, saveProfile } = useAuth();
  const [name, setName] = useState(user.full_name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setSaved(false);

    const body = { full_name: name.trim(), phone: phone.trim() || null };
    const invalid = validateProfile(body);
    if (invalid) return setError(invalid);

    setBusy(true);
    setError("");

    try {
      const profile = await saveProfile(body);
      if (!profile) return;
      setName(profile.full_name);
      setPhone(profile.phone ?? "");
      setSaved(true);
    } catch (failure) {
      setError(authError(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tv-page">
      <PageHeader title="Hồ sơ cá nhân"
        description={`Vai trò: ${user.role}`} />
      <div className="profile-grid">
        <form className="account-form tv-panel" onSubmit={submit}>
          <h2>Thông tin tài khoản</h2>
          <label>Email<input className="form-control" value={user.email} readOnly /></label>
          <label>Họ tên<input className="form-control" value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name" maxLength={100} required disabled={busy} /></label>
          <label>Điện thoại<input className="form-control" type="tel" value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel" disabled={busy} /></label>
          <Notice error={error} message={saved ? "Đã lưu hồ sơ." : ""} />
          <button className="button" type="submit" disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu hồ sơ"}
          </button>
        </form>
        <PasswordForm />
      </div>
      {user.role === "CUSTOMER" && <AddressBook />}
    </div>
  );
};

export default ProfilePage;
