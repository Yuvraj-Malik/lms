import api from "./client.js";

export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  googleAuth: (data) => api.post("/auth/google", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
};

export const courseApi = {
  list: (params) => api.get("/courses", { params }),
  categories: () => api.get("/courses/categories"),
  get: (id) => api.get(`/courses/${id}`),
  create: (formData) => api.post("/courses", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, formData) => api.put(`/courses/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  remove: (id) => api.delete(`/courses/${id}`),
};

export const moduleApi = {
  listForCourse: (courseId) => api.get(`/courses/${courseId}/modules`),
  create: (courseId, data) => api.post(`/courses/${courseId}/modules`, data),
  update: (id, data) => api.put(`/modules/${id}`, data),
  remove: (id) => api.delete(`/modules/${id}`),
  complete: (id) => api.post(`/modules/${id}/complete`),
};

export const enrollmentApi = {
  enroll: (courseId) => api.post(`/enrollments/${courseId}`),
  my: () => api.get("/enrollments/my"),
  status: (courseId) => api.get(`/enrollments/status/${courseId}`),
  forCourse: (courseId) => api.get(`/enrollments/course/${courseId}`),
};

export const assignmentApi = {
  listForCourse: (courseId) => api.get(`/courses/${courseId}/assignments`),
  get: (id) => api.get(`/assignments/${id}`),
  create: (courseId, data) => api.post(`/courses/${courseId}/assignments`, data),
  update: (id, data) => api.put(`/assignments/${id}`, data),
  remove: (id) => api.delete(`/assignments/${id}`),
};

export const submissionApi = {
  submit: (assignmentId, formData) =>
    api.post(`/assignments/${assignmentId}/submissions`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  forAssignment: (assignmentId) => api.get(`/assignments/${assignmentId}/submissions`),
  my: () => api.get("/submissions/my"),
  grade: (id, data) => api.put(`/submissions/${id}/grade`, data),
};

export const adminApi = {
  stats: () => api.get("/admin/stats"),
  enrollmentsByCourse: () => api.get("/admin/analytics/enrollments-by-course"),
  avgProgressByCourse: () => api.get("/admin/analytics/avg-progress-by-course"),
  signupsOverTime: () => api.get("/admin/analytics/signups-over-time"),
  submissionStatusBreakdown: () => api.get("/admin/analytics/submission-status"),
  students: () => api.get("/admin/students"),
  studentProgress: (id) => api.get(`/admin/students/${id}/progress`),
};

export const dashboardApi = {
  student: () => api.get("/dashboard/student"),
};

export const userApi = {
  updateProfile: (formData) => api.put("/users/profile", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  changePassword: (data) => api.put("/users/change-password", data),
};
