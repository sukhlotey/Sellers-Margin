import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/auth", // backend URL
});

// Register user
export const registerUser = (data) => API.post("/register", data);

// Login user
export const loginUser = (data) => API.post("/login", data);

// Get profile
export const getProfile = (token) =>
  API.get("/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });

  export const validateRecoveryCode = (data) => API.post("/validate-recovery-code", data);

// Reset password
export const resetPassword = (data) => API.post("/reset-password", data);

// export const getRecoveryCode = (token, password) =>
//   API.post("/recovery-code", { password }, {
//     headers: { Authorization: `Bearer ${token}` },
//   });