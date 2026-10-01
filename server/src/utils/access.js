import Course from "../models/Course.js";

// Central place for "who may touch what".
//  - Super admin: everything.
//  - Admin (instructor): only courses they created, and everything inside them.
//  - Student: only their own records.

export const isSuper = (user) => !!user && user.role === "admin" && user.isSuperAdmin === true;

export const isAdmin = (user) => !!user && user.role === "admin";

export const ownsCourse = (user, course) =>
  !!user && !!course && (isSuper(user) || String(course.createdBy) === String(user._id));

// Returns null when the user may see every course (super admin),
// otherwise the list of course ids the admin manages.
export const managedCourseIds = async (user) => {
  if (isSuper(user)) return null;
  const courses = await Course.find({ createdBy: user._id }).select("_id");
  return courses.map((c) => c._id);
};

// Mongo filter helper: { course: { $in: ids } } or {} for super admin
export const courseScope = async (user, field = "course") => {
  const ids = await managedCourseIds(user);
  return ids === null ? {} : { [field]: { $in: ids } };
};

export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Loads a course and asserts the user manages it. Throws HttpError otherwise.
export const loadManagedCourse = async (user, courseId) => {
  const course = await Course.findById(courseId);
  if (!course) throw new HttpError(404, "Course not found.");
  if (!ownsCourse(user, course)) {
    throw new HttpError(403, "You can only manage courses you created.");
  }
  return course;
};
