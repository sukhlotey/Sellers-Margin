import { createContext, useState, useEffect } from "react";
import { loginUser, registerUser, getProfile } from "../api/authApi";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
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
    } else {
      setLoading(false);
    }
  }, [token]);

  const register = async (formData) => {
    const res = await registerUser(formData);
    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setUser({ _id: res.data._id, name: res.data.name, email: res.data.email });
    return res.data.recoveryCode; // Return recoveryCode for Register.jsx
  };

  const login = async (formData) => {
    const res = await loginUser(formData);
    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setUser({ _id: res.data._id, name: res.data.name, email: res.data.email });
    return res.data.recoveryCode; // Return recoveryCode if present
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};