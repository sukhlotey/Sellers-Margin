import { createContext, useState, useEffect } from "react";
import { loginUser, registerUser, getProfile, loginAdmin } from "../api/authApi";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [adminToken, setAdminToken] = useState(localStorage.getItem("adminToken") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      getProfile(token)
        .then((res) => setUser(res.data))
        .catch(() => {
          setUser(null);
          setToken(null);
          localStorage.removeItem("token");
        })
        .finally(() => setLoading(false));
    } else if (adminToken) {
      setAdmin({ name: localStorage.getItem("adminName"), email: localStorage.getItem("adminEmail") });
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [token, adminToken]);

  const register = async (formData) => {
    const res = await registerUser(formData);
    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setUser({ _id: res.data._id, name: res.data.name, email: res.data.email });
    return res.data.recoveryCode;
  };

  const login = async (formData) => {
    const res = await loginUser(formData);
    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setUser({ _id: res.data._id, name: res.data.name, email: res.data.email });
    return res.data.recoveryCode;
  };

  const adminLogin = async (formData) => {
    const res = await loginAdmin(formData);
    localStorage.setItem("adminToken", res.data.token);
    localStorage.setItem("adminName", res.data.name);
    localStorage.setItem("adminEmail", res.data.email);
    setAdminToken(res.data.token);
    setAdmin({ name: res.data.name, email: res.data.email });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminEmail");
    setUser(null);
    setAdmin(null);
    setToken(null);
    setAdminToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, admin, adminToken, loading, register, login, adminLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};