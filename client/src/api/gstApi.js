import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

// Upload settlement file
export const uploadSettlement = async (formData, token) => {
  return await API.post("/gst/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
};

// Fetch all reports of logged-in seller
export const fetchReports = async (token) => {
  return await API.get("/gst/bulk/history", {
    headers: { Authorization: `Bearer ${token}` },
  });
};