import axios from "axios";
import { toast } from "react-toastify";

const api = axios.create({
  baseURL: "http://localhost:5001/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor for token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 ||
      error.response?.data?.message?.toLowerCase().includes("invalid token") ||
      error.response?.data?.message?.toLowerCase().includes("token expired") ||
      error.response?.data?.message?.toLowerCase().includes("unauthorized")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      toast.error("Session expired. Please login again.");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;