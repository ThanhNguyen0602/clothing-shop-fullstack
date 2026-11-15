import { createContext, useContext } from "react";

const AuthContext = createContext(null);

const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth requires AuthProvider");

  return value;
};

export { AuthContext, useAuth };
