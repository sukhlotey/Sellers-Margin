import axios from "axios";

const API_URL = "http://localhost:5000/api/subscription";

export const getPlans = () => axios.get(`${API_URL}/plans`);

export const createPayment = (token, plan) =>
  axios.post(
    `${API_URL}/create-order`,
    { plan },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const getUserSubscription = (token) =>
  axios.get(`${API_URL}/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
