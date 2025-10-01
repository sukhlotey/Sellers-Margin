import axios from "axios";

const API = axios.create({ baseURL: "https://sellers-sense.onrender.com/api" });

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

export const deleteReport = async (batchId, token) => {
  return await API.delete(`/gst/bulk/${batchId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Delete multiple reports by batchIds
export const deleteMultipleReports = async (batchIds, token) => {
  return await API.delete("/gst/bulk", {
    headers: { Authorization: `Bearer ${token}` },
    data: { batchIds },
  });
};