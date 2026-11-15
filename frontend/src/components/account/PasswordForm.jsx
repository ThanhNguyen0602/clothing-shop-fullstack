import { useState } from "react";
import Notice from "../common/Notice";
import { changePassword } from "../../services/shopService";
import { apiError } from "../../services/api";
import { validPassword } from "../../utils/accountValidation";

const PasswordForm = () => {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({});

  const submit = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const fields = new FormData(formElement);
    const current = fields.get("current_password");
    const next = fields.get("new_password");

    if (!validPassword(next)) {
      setNotice({ error: "Mật khẩu mới cần ít nhất 8 ký tự và tối đa 72 byte UTF-8." });
      return;
    }
    if (next !== fields.get("confirm_password")) {
      setNotice({ error: "Mật khẩu xác nhận chưa khớp." });
      return;
    }

    setBusy(true);
    setNotice({});

    try {
      await changePassword({ current_password: current, new_password: next });
      formElement.reset();
      setNotice({ message: "Đã đổi mật khẩu." });
    } catch (failure) {
      setNotice({ error: apiError(failure) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="account-form tv-panel" onSubmit={submit}>
      <h2>Đổi mật khẩu</h2>
      <label>Mật khẩu hiện tại<input className="form-control" name="current_password"
        type="password" autoComplete="current-password" required /></label>
      <label>Mật khẩu mới<input className="form-control" name="new_password"
        type="password" autoComplete="new-password" minLength={8} required /></label>
      <label>Nhập lại mật khẩu mới<input className="form-control" name="confirm_password"
        type="password" autoComplete="new-password" required /></label>
      <Notice error={notice.error} message={notice.message} />
      <button className="button" type="submit" disabled={busy}>
        {busy ? "Đang lưu…" : "Đổi mật khẩu"}
      </button>
    </form>
  );
};

export default PasswordForm;
