import mongoose from "mongoose";
import Module from "../models/Module.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import QuizAttempt from "../models/QuizAttempt.js";
import asyncHandler from "../utils/asyncHandler.js";
import { recalcProgress, recalcCourseProgress } from "../utils/progress.js";
import { ownsCourse, loadManagedCourse, HttpError } from "../utils/access.js";
import { createNotification } from "./notificationController.js";
import { getSettings } from "../utils/settings.js";
import { audit } from "../utils/audit.js";

const normaliseLinks = (links) => {
  if (links === undefined) return undefined;
  const arr = Array.isArray(links) ? links : String(links).split(/\r?\n/);
  return arr.map((l) => String(l).trim()).filter(Boolean);
};

const normaliseQuiz = (quiz) => {
  if (quiz === undefined) return undefined;
  if (!Array.isArray(quiz)) throw new HttpError(400, "Quiz must be a list of questions.");
  return quiz.map((q, i) => {
    const options = (q.options || []).map((o) => String(o).trim()).filter(Boolean);
    const answer = Number(q.answer);
    if (!String(q.question || "").trim()) throw new HttpError(400, `Question ${i + 1} is empty.`);
    if (options.length < 2) throw new HttpError(400, `Question ${i + 1} needs at least two options.`);
    if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) {
      throw new HttpError(400, `Pick the correct option for question ${i + 1}.`);
    }
    return { question: String(q.question).trim(), options, answer, explanation: String(q.explanation || "").trim() };
  });
};

// Strip answers before sending quiz to students
const studentView = (m) => {
  const o = m.toObject();
  o.quiz = (o.quiz || []).map(({ _id, question, options }) => ({ _id, question, options }));
  return o;
};

// @route GET /api/courses/:courseId/modules
// Managers get everything (incl. answers). Enrolled students get content without answers.
export const getModulesForCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return res.status(404).json({ message: "Course not found." });

  const modules = await Module.find({ course: course._id }).sort({ moduleOrder: 1 });

  if (ownsCourse(req.user, course)) {
    return res.json({ modules, canManage: true });
  }

  const enrollment = await Enrollment.findOne({ course: course._id, student: req.user._id });
  if (!enrollment) {
    return res.status(403).json({ message: "Enroll in this course to open its modules." });
  }

  // Best quiz attempt per module, so the UI can show "Passed 4/5"
  const attempts = await QuizAttempt.aggregate([
    { $match: { student: req.user._id, course: course._id } },
    { $sort: { score: -1, createdAt: -1 } },
    { $group: { _id: "$module", best: { $first: "$$ROOT" }, attempts: { $sum: 1 } } },
  ]);
  const byModule = Object.fromEntries(
    attempts.map((a) => [String(a._id), { score: a.best.score, total: a.best.total, passed: a.best.passed, attempts: a.attempts }])
  );

  res.json({
    modules: modules.map((m) => ({ ...studentView(m), quizResult: byModule[String(m._id)] || null })),
    enrollment,
    canManage: false,
  });
});

// @route POST /api/courses/:courseId/modules (owner / super admin)
export const createModule = asyncHandler(async (req, res) => {
  const course = await loadManagedCourse(req.user, req.params.courseId);
  const { title, description, notes, resourceLinks, moduleOrder, quiz, quizPassPercent } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: "Module title is required." });

  const count = await Module.countDocuments({ course: course._id });
  let order = moduleOrder ? Number(moduleOrder) : count + 1;
  if (!Number.isInteger(order) || order < 1) {
    return res.status(400).json({ message: "Module order must be a positive whole number." });
  }
  order = Math.min(order, count + 1);

  // Make room so orders stay 1..n without gaps or duplicates
  await Module.updateMany({ course: course._id, moduleOrder: { $gte: order } }, { $inc: { moduleOrder: 1 } });

  const module = await Module.create({
    course: course._id,
    title: title.trim(),
    description: description || "",
    notes: notes || "",
    resourceLinks: normaliseLinks(resourceLinks) || [],
    moduleOrder: order,
    quiz: normaliseQuiz(quiz) || [],
    quizPassPercent: quizPassPercent !== undefined && quizPassPercent !== "" ? Number(quizPassPercent) : (await getSettings()).defaultQuizPassPercent,
  });
  audit(req, "module.create", `Added module "${module.title}" to ${course.title}`, { targetType: "course", targetId: course._id, link: `/admin/courses/${course._id}` });

  await recalcCourseProgress(course._id);
  res.status(201).json({ module });
});

// @route PUT /api/modules/:id (owner / super admin)
export const updateModule = asyncHandler(async (req, res) => {
  const module = await Module.findById(req.params.id);
  if (!module) return res.status(404).json({ message: "Module not found." });
  await loadManagedCourse(req.user, module.course);

  const { title, description, notes, resourceLinks, quiz, quizPassPercent } = req.body;
  if (title !== undefined) {
    if (!String(title).trim()) return res.status(400).json({ message: "Module title is required." });
    module.title = String(title).trim();
  }
  if (description !== undefined) module.description = description;
  if (notes !== undefined) module.notes = notes;
  const links = normaliseLinks(resourceLinks);
  if (links) module.resourceLinks = links;
  const q = normaliseQuiz(quiz);
  if (q) module.quiz = q;
  if (quizPassPercent !== undefined) module.quizPassPercent = Number(quizPassPercent);

  await module.save();
  audit(req, "module.update", `Edited module "${module.title}"`, { targetType: "course", targetId: module.course, link: `/admin/courses/${module.course}` });
  res.json({ module });
});

// @route PUT /api/courses/:courseId/modules/reorder  { order: [moduleId, ...] }
export const reorderModules = asyncHandler(async (req, res) => {
  const course = await loadManagedCourse(req.user, req.params.courseId);
  const order = req.body.order;
  const existing = await Module.find({ course: course._id }).select("_id");
  const ids = new Set(existing.map((m) => String(m._id)));

  if (!Array.isArray(order) || order.length !== ids.size || !order.every((id) => ids.has(String(id)))) {
    return res.status(400).json({ message: "Order must list every module in this course exactly once." });
  }

  await Module.bulkWrite(
    order.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { moduleOrder: i + 1 } } }))
  );
  const modules = await Module.find({ course: course._id }).sort({ moduleOrder: 1 });
  res.json({ modules });
});

// @route DELETE /api/modules/:id (owner / super admin)
export const deleteModule = asyncHandler(async (req, res) => {
  const module = await Module.findById(req.params.id);
  if (!module) return res.status(404).json({ message: "Module not found." });
  await loadManagedCourse(req.user, module.course);

  await module.deleteOne();
  await QuizAttempt.deleteMany({ module: module._id });
  await Module.updateMany(
    { course: module.course, moduleOrder: { $gt: module.moduleOrder } },
    { $inc: { moduleOrder: -1 } }
  );
  await recalcCourseProgress(module.course);
  audit(req, "module.delete", `Deleted module "${module.title}"`, { targetType: "course", targetId: module.course, link: `/admin/courses/${module.course}` });

  res.json({ message: "Module deleted." });
});

const notifyCompletion = async (user, module, enrollment) => {
  const course = await Course.findById(module.course).select("title");
  if (enrollment.status === "completed") {
    await createNotification({
      user: user._id,
      title: "Course completed",
      message: `You finished every module in "${course?.title}". Your certificate is on your profile.`,
      link: "/dashboard/profile",
      type: "course_completed",
    });
  } else {
    await createNotification({
      user: user._id,
      title: "Module completed",
      message: `"${module.title}" done — you're at ${enrollment.progress}% in ${course?.title}.`,
      link: `/dashboard/courses/${module.course}/learn`,
      type: "module_completed",
    });
  }
};

const completeModuleFor = async (user, module, enrollment) => {
  const already = enrollment.completedModules.some((m) => String(m) === String(module._id));
  if (!already) enrollment.completedModules.push(module._id);
  await recalcProgress(enrollment);
  if (!already) notifyCompletion(user, module, enrollment);
  return enrollment;
};

const loadEnrollment = async (user, module) => {
  const enrollment = await Enrollment.findOne({ student: user._id, course: module.course });
  if (!enrollment) throw new HttpError(403, "You are not enrolled in this course.");
  return enrollment;
};

// @route POST /api/modules/:id/complete  (student)
export const markModuleComplete = asyncHandler(async (req, res) => {
  const module = await Module.findById(req.params.id);
  if (!module) return res.status(404).json({ message: "Module not found." });
  const enrollment = await loadEnrollment(req.user, module);

  if (module.quiz.length > 0) {
    const passed = await QuizAttempt.exists({ student: req.user._id, module: module._id, passed: true });
    if (!passed) {
      return res.status(400).json({
        message: `Pass this module's quiz (${module.quizPassPercent}% or more) before marking it complete.`,
      });
    }
  }

  await completeModuleFor(req.user, module, enrollment);
  res.json({ enrollment, message: "Module marked as completed." });
});

// @route POST /api/modules/:id/quiz  { answers: [optionIndex, ...] }  (student)
// Graded on the server so answers never have to be sent to the browser.
export const submitQuiz = asyncHandler(async (req, res) => {
  const module = await Module.findById(req.params.id);
  if (!module) return res.status(404).json({ message: "Module not found." });
  if (!module.quiz.length) return res.status(400).json({ message: "This module has no quiz." });
  const enrollment = await loadEnrollment(req.user, module);

  const answers = Array.isArray(req.body.answers) ? req.body.answers.map((a) => (a === null ? -1 : Number(a))) : [];
  if (answers.length !== module.quiz.length) {
    return res.status(400).json({ message: "Answer every question before submitting." });
  }

  const results = module.quiz.map((q, i) => ({
    questionId: q._id,
    selected: answers[i],
    correctAnswer: q.answer,
    correct: answers[i] === q.answer,
    explanation: q.explanation,
  }));
  const score = results.filter((r) => r.correct).length;
  const total = module.quiz.length;
  const passed = Math.round((score / total) * 100) >= module.quizPassPercent;

  await QuizAttempt.create({
    student: req.user._id,
    module: module._id,
    course: module.course,
    answers,
    score,
    total,
    passed,
  });

  if (passed) await completeModuleFor(req.user, module, enrollment);

  res.json({ score, total, passed, passPercent: module.quizPassPercent, results, enrollment });
});

// Exported for admin student-progress views
export const quizSummaryFor = async (studentId, courseIds) => {
  const match = { student: new mongoose.Types.ObjectId(String(studentId)) };
  if (courseIds) match.course = { $in: courseIds };
  return QuizAttempt.aggregate([
    { $match: match },
    { $sort: { score: -1 } },
    { $group: { _id: "$module", best: { $first: "$score" }, total: { $first: "$total" }, passed: { $max: "$passed" }, attempts: { $sum: 1 } } },
    { $lookup: { from: "modules", localField: "_id", foreignField: "_id", as: "module" } },
    { $unwind: "$module" },
    { $project: { _id: 0, moduleId: "$_id", moduleTitle: "$module.title", course: "$module.course", best: 1, total: 1, passed: 1, attempts: 1 } },
  ]);
};
