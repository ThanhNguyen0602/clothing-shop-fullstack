import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { register, authError } from "../../services/authService";
import { validEmail, validPassword, validateProfile }
  from "../../utils/accountValidation";
import AuthLayout from "../auth/AuthLayout";

const AuthForm = ({ creating = false }) => {
  const { signIn } = useAuth();
  const { state } = useLocation();
  const navigate = useNavigate();
  const request = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const title = creating ? "Đăng ký" : "Đăng nhập";

  useEffect(() => () => request.current?.abort(), []);

  const submit = async (event) => {
    event.preventDefault();
    if (request.current) return;

    const fields = new FormData(event.currentTarget);
    const email = fields.get("email").trim().toLowerCase();
    const password = fields.get("password");
    const profile = {
      full_name: String(fields.get("full_name") ?? "").trim(),
      phone: String(fields.get("phone") ?? "").trim()
    };

    const invalidProfile = creating ? validateProfile(profile, true) : "";
    if (invalidProfile) return setError(invalidProfile);
    if (!validEmail(email)) return setError("Email không đúng định dạng.");
    if (!validPassword(password)) {
      return setError("Mật khẩu cần ít nhất 8 ký tự và tối đa 72 byte UTF-8.");
    }
    if (creating && password !== fields.get("confirmPassword")) {
      return setError("Mật khẩu xác nhận chưa khớp.");
    }

    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError("");

    try {
      if (creating) {
        await register({ ...profile, email, password }, controller.signal);
        if (controller.signal.aborted) return;
        navigate("/login", { replace: true, state: {
          email, registered: true, returnTo: state?.returnTo
        } });
      } else {
        await signIn({ email, password }, controller.signal);
      }
    } catch (failure) {
      if (!controller.signal.aborted) setError(authError(failure));
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  };

  const passwordType = showPassword ? "text" : "password";

  return (
    <AuthLayout>
      <section className="auth-card">
        <h1>{creating ? "Tạo tài khoản" : "Đăng nhập"}</h1>
        <p className="auth-card__subtitle">
          {creating
            ? "Chỉ mất một phút. Bạn sẽ theo dõi được đơn hàng và lưu địa chỉ giao hàng."
            : "Chào mừng bạn quay lại."}
        </p>
        {!creating && state?.registered && (
          <p className="tv-alert tv-alert--success" role="status">
            Tạo tài khoản thành công. Mời bạn đăng nhập.
          </p>
        )}
        {error && <p className="tv-alert tv-alert--danger" role="alert">{error}</p>}
        <form onSubmit={submit} noValidate>
          {creating && (
            <div className="auth-card__grid">
              <label className="form-label">Họ tên
                <input className="form-control" name="full_name"
                  autoComplete="name" maxLength={100} required />
              </label>
              <label className="form-label">Số điện thoại
                <input className="form-control" name="phone" type="tel"
                  autoComplete="tel" required />
              </label>
            </div>
          )}
          <label className="form-label">Email
            <input className="form-control" name="email" type="email"
              autoComplete="email" placeholder="ban@email.com"
              defaultValue={state?.email ?? ""} maxLength={255} required />
          </label>
          <label className="form-label">Mật khẩu
            <span className="auth-password">
              <input className="form-control" name="password" type={passwordType}
                autoComplete={creating ? "new-password" : "current-password"}
                placeholder={creating ? "Ít nhất 8 ký tự" : ""} minLength={8} required />
              <button type="button"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </span>
          </label>
          {creating && (
            <label className="form-label">Nhập lại mật khẩu
              <input className="form-control" name="confirmPassword"
                type={passwordType} autoComplete="new-password" required />
            </label>
          )}
          <button type="submit" className="button" disabled={busy}>
            {busy ? "Đang gửi…" : title}
          </button>
        </form>
        <p className="auth-card__switch">
          {creating ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
          <Link to={creating ? "/login" : "/register"} state={{ returnTo: state?.returnTo }}>
            {creating ? "Đăng nhập" : "Đăng ký"}
          </Link>
        </p>
      </section>
    </AuthLayout>
  );
};

export default AuthForm;
