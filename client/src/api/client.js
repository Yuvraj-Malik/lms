import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export const getErrorMessage = (err) =>
  err?.response?.data?.message || err?.message || "Something went wrong. Please try again.";

export default api;
