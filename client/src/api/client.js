import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export const getErrorMessage = (err) =>
  err?.response?.data?.message || (err?.request && !err?.response ? "Can't reach the server. Is it running?" : err?.message) || "Something went wrong. Please try again.";

export default api;
