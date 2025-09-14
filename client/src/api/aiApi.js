import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/ai";

// Send title + description to backend AI optimizer
export const optimizeListing = async (data, token) => {
  return axios.post(`${API_URL}/optimize`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Fetch saved history
export const fetchAiHistory = async (token) => {
  return axios.get(`${API_URL}/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
