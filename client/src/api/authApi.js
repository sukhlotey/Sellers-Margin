import axios from "axios";

const API = axios.create({
  baseURL: "https://sellers-sense.onrender.com/api", // backend URL
});

// Register user
export const registerUser = (data) => API.post("/auth/register", data);

// Login user
export const loginUser = (data) => API.post("/auth/login", data);

export const loginAdmin = (data) => API.post("/admin/login", data);

// Get profile
export const getProfile = (token) =>
  API.get("/auth/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });

  export const validateRecoveryCode = (data) => API.post("/auth/validate-recovery-code", data);

// Reset password
export const resetPassword = (data) => API.post("/auth/reset-password", data);

// export const getRecoveryCode = (token, password) =>
//   API.post("/recovery-code", { password }, {
//     headers: { Authorization: `Bearer ${token}` },
//   });

export const getDashboardData = (token) =>
  API.get("/admin/dashboard", {
    headers: { Authorization: `Bearer ${token}` },
  });