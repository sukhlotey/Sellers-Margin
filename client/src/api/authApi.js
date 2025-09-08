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
