import { createContext, useState, useEffect } from "react";
import { loginUser, registerUser, getProfile } from "../api/authApi";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user if token exists
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getProfile(token)
        .then((res) => setUser(res.data))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Register
  const register = async (formData) => {
    const res = await registerUser(formData);
    localStorage.setItem("token", res.data.token);
    setUser(res.data);
  };

  // Login
  const login = async (formData) => {
    const res = await loginUser(formData);
    localStorage.setItem("token", res.data.token);
    setUser(res.data);
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
