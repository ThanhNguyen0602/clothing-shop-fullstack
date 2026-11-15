import { useEffect, useRef, useState } from "react";
import { AuthContext } from "./AuthContext";
import { getMe, login, updateMe } from "../services/authService";

const storageKey = "greenshop.accessToken";

const AuthProvider = ({ children }) => {
  const [initialToken] = useState(() => sessionStorage.getItem(storageKey));
  const token = useRef(initialToken);
  const [user, setUser] = useState(null);
  const [phase, setPhase] = useState(initialToken ? "loading" : "ready");
  const [attempt, setAttempt] = useState(0);

  const signOut = () => {
    sessionStorage.removeItem(storageKey);
    token.current = null;
    setUser(null);
    setPhase("ready");
  };

  useEffect(() => {
    const saved = token.current;
    if (!saved) return;

    const controller = new AbortController();
    const restore = async () => {
      try {
        const profile = await getMe(saved, controller.signal);
        if (controller.signal.aborted) return;
        setUser(profile);
        setPhase("ready");
      } catch (error) {
        if (controller.signal.aborted) return;

        const status = error.response?.status;
        if (status === 401 || status === 403) {
          signOut();
          return;
        }
        setPhase("error");
      }
    };

    restore();

    return () => controller.abort();
  }, [attempt]);

  const retry = () => {
    setPhase("loading");
    setAttempt((current) => current + 1);
  };

  const signIn = async (body, signal) => {
    const result = await login(body, signal);
    if (signal.aborted) return;

    sessionStorage.setItem(storageKey, result.accessToken);
    token.current = result.accessToken;
    setUser(result.user);
  };

  const saveProfile = async (body) => {
    const current = token.current;
    if (!current) return null;

    try {
      const profile = await updateMe(current, body);
      if (token.current !== current) return null;
      setUser(profile);

      return profile;
    } catch (error) {
      const status = error.response?.status;
      if (token.current === current && (status === 401 || status === 403)) {
        signOut();
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, saveProfile }}>
      {phase === "loading" && (
        <p className="container" role="status">Đang kiểm tra phiên…</p>
      )}
      {phase === "error" && (
        <section className="container empty-state">
          <p role="alert">Chưa kết nối được để kiểm tra phiên.</p>
          <button type="button" onClick={retry}>Thử lại</button>{" "}
          <button type="button" onClick={signOut}>Về chế độ khách</button>
        </section>
      )}
      {phase === "ready" && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
