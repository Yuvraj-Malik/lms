import api from "./client.js";

const multipart = { headers: { "Content-Type": "multipart/form-data" } };

export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  google: (idToken) => api.post("/auth/google", { idToken }),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  session: () => api.get("/auth/session"),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
};

export const courseApi = {
  list: (params) => api.get("/courses", { params }),
  categories: () => api.get("/courses/categories"),
  manage: () => api.get("/courses/manage"),
  get: (id) => api.get(`/courses/${id}`),
  create: (formData) => api.post("/courses", formData, multipart),
  update: (id, formData) => api.put(`/courses/${id}`, formData, multipart),
  remove: (id) => api.delete(`/courses/${id}`),
};

export const moduleApi = {
  listForCourse: (courseId) => api.get(`/courses/${courseId}/modules`),
  create: (courseId, data) => api.post(`/courses/${courseId}/modules`, data),
  update: (id, data) => api.put(`/modules/${id}`, data),
  reorder: (courseId, order) => api.put(`/courses/${courseId}/modules/reorder`, { order }),
  remove: (id) => api.delete(`/modules/${id}`),
  complete: (id) => api.post(`/modules/${id}/complete`),
  submitQuiz: (id, answers) => api.post(`/modules/${id}/quiz`, { answers }),
};

export const enrollmentApi = {
  enroll: (courseId) => api.post(`/enrollments/${courseId}`),
  my: () => api.get("/enrollments/my"),
  forCourse: (courseId) => api.get(`/enrollments/course/${courseId}`),
  verify: (credentialId) => api.get(`/enrollments/verify/${encodeURIComponent(credentialId)}`),
};

export const assignmentApi = {
  my: () => api.get("/assignments/my"),
  listForCourse: (courseId) => api.get(`/courses/${courseId}/assignments`),
  get: (id) => api.get(`/assignments/${id}`),
  create: (courseId, data) => api.post(`/courses/${courseId}/assignments`, data),
  update: (id, data) => api.put(`/assignments/${id}`, data),
  remove: (id) => api.delete(`/assignments/${id}`),
};

export const submissionApi = {
  submit: (assignmentId, formData) => api.post(`/assignments/${assignmentId}/submissions`, formData, multipart),
  forAssignment: (assignmentId) => api.get(`/assignments/${assignmentId}/submissions`),
  my: () => api.get("/submissions/my"),
  grade: (id, data) => api.put(`/submissions/${id}/grade`, data),
  fileUrl: (id) => `/api/submissions/${id}/file`,
};

export const adminApi = {
  overview: () => api.get("/admin/overview"),
  students: (params) => api.get("/admin/students", { params }),
  directory: (search) => api.get("/admin/directory", { params: { search } }),
  student: (id) => api.get(`/admin/students/${id}`),
  enroll: (studentId, courseId) => api.post("/admin/enrollments", { studentId, courseId }),
  unenroll: (enrollmentId) => api.delete(`/admin/enrollments/${enrollmentId}`),
  submissions: (params) => api.get("/admin/submissions", { params }),
  reopenSubmission: (id) => api.post(`/admin/submissions/${id}/reopen`),
  notify: (data) => api.post("/admin/notifications", data),
  // super admin only
  instructors: () => api.get("/admin/instructors"),
  users: (params) => api.get("/admin/users", { params }),
  createUser: (data) => api.post("/admin/users", data),
  setRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  toggleStatus: (id) => api.put(`/admin/users/${id}/status`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  setPassword: (id, password) => api.post(`/admin/users/${id}/password`, { password }),
  settings: () => api.get("/admin/settings"),
  saveSettings: (data) => api.put("/admin/settings", data),
  audit: (params) => api.get("/admin/audit", { params }),
};

export const dashboardApi = {
  student: () => api.get("/dashboard/student"),
};

export const userApi = {
  profile: () => api.get("/users/student-profile"),
  update: (formData) => api.put("/users/profile", formData, multipart),
  changePassword: (data) => api.put("/users/change-password", data),
};

export const notificationApi = {
  list: () => api.get("/notifications"),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put("/notifications/read-all"),
  clearAll: () => api.delete("/notifications/clear-all"),
};

export const discussionApi = {
  forCourse: (courseId) => api.get(`/discussions/course/${courseId}`),
  create: (courseId, data) => api.post(`/discussions/course/${courseId}`, data),
  reply: (id, content) => api.post(`/discussions/${id}/reply`, { content }),
  upvote: (id) => api.post(`/discussions/${id}/upvote`),
  remove: (id) => api.delete(`/discussions/${id}`),
  removeReply: (id, replyId) => api.delete(`/discussions/${id}/replies/${replyId}`),
};
