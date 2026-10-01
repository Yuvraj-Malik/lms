// End-to-end API check against a running server seeded with `npm run seed`.
// Usage: API_URL=http://127.0.0.1:5000 npm run test:api
const BASE = (process.env.API_URL || "http://127.0.0.1:5000").replace(/\/$/, "") + "/api";

let passed = 0;
let failed = 0;
const check = (name, cond, extra = "") => {
  if (cond) {
    passed++;
    console.log(`  ok   ${name}`);
  } else {
    failed++;
    console.log(`  FAIL ${name} ${extra}`);
  }
};

const session = async (email, password) => {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`login ${email}: ${body.message}`);
  const token = body.token;
  const call = async (method, path, data) => {
    const r = await fetch(`${BASE}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(data ? { "Content-Type": "application/json" } : {}) },
      body: data ? JSON.stringify(data) : undefined,
    });
    let json = null;
    try {
      json = await r.json();
    } catch {
      /* non-JSON */
    }
    return { status: r.status, ...json };
  };
  return { user: body.user, get: (p) => call("GET", p), post: (p, d) => call("POST", p, d ?? {}), put: (p, d) => call("PUT", p, d ?? {}), del: (p) => call("DELETE", p) };
};

const anon = async (method, path, data) => {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  return { status: r.status, ...(await r.json().catch(() => ({}))) };
};

const main = async () => {
  console.log(`Testing ${BASE}\n`);
  const superA = await session("admin@lms.com", "admin123");
  const inst = await session("instructor@lms.com", "instructor123");
  const stu = await session("student@lms.com", "student123");
  const rohan = await session("rohan@lms.com", "student123");

  console.log("Auth & roles");
  check("super admin flagged", superA.user.isSuperAdmin === true);
  check("instructor is admin, not super", inst.user.role === "admin" && !inst.user.isSuperAdmin);
  check("forged Google sign-in rejected", (await anon("POST", "/auth/google", { idToken: "x.y.z", email: "admin@lms.com" })).status === 401);
  check(
    "admin sign-up without code rejected",
    (await anon("POST", "/auth/register", { name: "X", email: `x${Date.now()}@t.io`, password: "secret1", role: "admin", adminCode: "LMS-ADMIN-2026" })).status === 403
  );
  check("student blocked from admin API", (await stu.get("/admin/overview")).status === 403);
  check("instructor blocked from user management", (await inst.get("/admin/users")).status === 403);
  check("super admin can list users", Array.isArray((await superA.get("/admin/users")).users));
  check("submission files not public", (await fetch(BASE.replace("/api", "") + "/uploads/submissions/anything.pdf")).status === 404);

  console.log("\nOwnership");
  const instCourses = (await inst.get("/courses/manage")).courses;
  const allCourses = (await superA.get("/courses/manage")).courses;
  check("instructor sees only own courses", instCourses.length === 2 && instCourses.every((c) => c.createdBy._id === inst.user._id));
  check("super admin sees all courses", allCourses.length >= 6);
  const superCourse = allCourses.find((c) => c.createdBy._id === superA.user._id);
  check("instructor cannot edit another admin's course", (await inst.put(`/courses/${superCourse._id}`, { title: "hijack" })).status === 403);
  check("instructor cannot add assignment to another admin's course", (await inst.post(`/courses/${superCourse._id}/assignments`, { title: "x", deadline: "2030-01-01" })).status === 403);
  const instStudents = (await inst.get("/admin/students")).students;
  const superStudents = (await superA.get("/admin/students")).students;
  check("instructor sees only their students", instStudents.length > 0 && instStudents.length < superStudents.length);
  const instOverview = await inst.get("/admin/overview");
  check("instructor overview is scoped", instOverview.stats.courseCount === 2 && instOverview.stats.adminCount === undefined);

  console.log("\nStudent data");
  const dash = await stu.get("/dashboard/student");
  const mine = (await stu.get("/assignments/my")).assignments;
  const unsubmitted = mine.filter((a) => !a.mySubmission).length;
  check("assignments page matches dashboard", unsubmitted === dash.pendingAssignments.length + dash.overdueAssignments.length, `${unsubmitted} vs ${dash.pendingAssignments.length}+${dash.overdueAssignments.length}`);
  check("assignments only from enrolled courses", mine.every((a) => dash.enrollments.some((e) => e.course._id === a.course._id)));
  const myEnr = dash.enrollments[0];
  const mods = await stu.get(`/courses/${myEnr.course._id}/modules`);
  check("student gets modules of enrolled course", mods.modules?.length > 0);
  check("quiz answers hidden from students", mods.modules.every((m) => m.quiz.every((q) => q.answer === undefined)));
  const notEnrolled = allCourses.find((c) => c.isPublished && !dash.enrollments.some((e) => e.course._id === c._id));
  check("modules locked when not enrolled", (await stu.get(`/courses/${notEnrolled._id}/modules`)).status === 403);
  check("discussion locked when not enrolled", (await stu.get(`/discussions/course/${notEnrolled._id}`)).status === 403);

  console.log("\nQuiz & progress");
  const done = new Set(myEnr.completedModules);
  const target = mods.modules.find((m) => !done.has(m._id) && m.quiz.length);
  if (target) {
    check("cannot complete quiz module without passing", (await stu.post(`/modules/${target._id}/complete`)).status === 400);
    const wrong = await stu.post(`/modules/${target._id}/quiz`, { answers: target.quiz.map(() => 99) });
    check("wrong answers fail", wrong.passed === false && wrong.score === 0);
    const full = (await superA.get(`/courses/${myEnr.course._id}/modules`)).modules.find((m) => m._id === target._id);
    const right = await stu.post(`/modules/${target._id}/quiz`, { answers: full.quiz.map((q) => q.answer) });
    check("correct answers pass and complete module", right.passed === true && right.enrollment.completedModules.includes(target._id));
    check("progress increased", right.enrollment.progress > myEnr.progress, `${myEnr.progress} -> ${right.enrollment.progress}`);
  } else {
    console.log("  (skipped: no unfinished module with a quiz)");
  }

  console.log("\nSubmissions & grading");
  const open = mine.find((a) => !a.mySubmission);
  const sub1 = await stu.post(`/assignments/${open._id}/submissions`, { submissionType: "text", textContent: "My answer" });
  check("student can submit", sub1.status === 201 && sub1.submission.status !== "graded");
  check("bad link rejected", (await stu.post(`/assignments/${open._id}/submissions`, { submissionType: "github", submissionLink: "not a url" })).status === 400);
  const sub2 = await stu.post(`/assignments/${open._id}/submissions`, { submissionType: "url", submissionLink: "https://example.com/project" });
  check("student can resubmit before grading", sub2.status === 200 && sub2.submission.submissionType === "url");
  const ownerIsInst = instCourses.some((c) => c._id === open.course._id);
  const grader = ownerIsInst ? inst : superA;
  const other = ownerIsInst ? null : inst;
  if (other) check("non-owner admin cannot grade", (await other.put(`/submissions/${sub2.submission._id}/grade`, { marks: 1 })).status === 403);
  check("marks above maximum rejected", (await grader.put(`/submissions/${sub2.submission._id}/grade`, { marks: 9999 })).status === 400);
  const graded = await grader.put(`/submissions/${sub2.submission._id}/grade`, { marks: Math.min(80, open.maximumMarks), feedback: "Good" });
  check("owner can grade", graded.submission?.status === "graded");
  check("graded work cannot be overwritten", (await stu.post(`/assignments/${open._id}/submissions`, { submissionType: "text", textContent: "again" })).status === 409);
  check("other students cannot see the assignment's submissions", (await rohan.get(`/assignments/${open._id}/submissions`)).status === 403);
  check("owner can reopen", (await grader.post(`/admin/submissions/${sub2.submission._id}/reopen`)).status === 200);

  console.log("\nInstructor CRUD");
  const created = await inst.post("/courses", { title: "Smoke test course", description: "d", category: "Testing", instructor: "Prof. Arjun Mehta", duration: "1 week", difficulty: "Beginner", isPublished: "false" });
  check("instructor creates course", created.status === 201);
  const cid = created.course._id;
  check("draft hidden from catalog", !(await anon("GET", "/courses")).courses.some((c) => c._id === cid));
  check("draft hidden from the public", (await anon("GET", `/courses/${cid}`)).status === 404);
  check("quiz validation", (await inst.post(`/courses/${cid}/modules`, { title: "M", quiz: [{ question: "Q", options: ["a"], answer: 0 }] })).status === 400);
  const m1 = await inst.post(`/courses/${cid}/modules`, { title: "Intro", quiz: [{ question: "2+2?", options: ["3", "4"], answer: 1 }] });
  const m2 = await inst.post(`/courses/${cid}/modules`, { title: "Next", resourceLinks: "https://a.dev\nhttps://b.dev" });
  check("modules created with quiz and links", m1.module?.quiz.length === 1 && m2.module?.resourceLinks.length === 2);
  const re = await inst.put(`/courses/${cid}/modules/reorder`, { order: [m2.module._id, m1.module._id] });
  check("modules reorder", re.modules?.[0]._id === m2.module._id);
  const a = await inst.post(`/courses/${cid}/assignments`, { title: "A1", deadline: "2030-01-01", maximumMarks: 50 });
  check("assignment created", a.status === 201);
  check("assignment edited", (await inst.put(`/assignments/${a.assignment._id}`, { maximumMarks: 40 })).assignment?.maximumMarks === 40);
  check("assignment removed", (await inst.del(`/assignments/${a.assignment._id}`)).status === 200);
  check("super admin can edit instructor's course", (await superA.put(`/courses/${cid}`, { title: "Smoke test course (edited)" })).status === 200);
  check("course deleted", (await inst.del(`/courses/${cid}`)).status === 200);

  console.log("\nSuper admin controls");
  check("cannot demote yourself", (await superA.put(`/admin/users/${superA.user._id}/role`, { role: "student" })).status === 400);
  const off = await superA.put(`/admin/users/${rohan.user._id}/status`);
  check("deactivate user", off.user?.isActive === false);
  check("deactivated user is locked out immediately", (await rohan.get("/auth/me")).status === 403);
  await superA.put(`/admin/users/${rohan.user._id}/status`);
  check("reactivated user works again", (await rohan.get("/auth/me")).status === 200);

  console.log("\nPlatform settings & activity log");
  check("instructor cannot read platform settings", (await inst.get("/admin/settings")).status === 403);
  check("super admin closes registration", (await superA.put("/admin/settings", { registrationOpen: false })).settings?.registrationOpen === false);
  check("public settings reflect it", (await anon("GET", "/settings/public")).registrationOpen === false);
  check("sign-up blocked while closed", (await anon("POST", "/auth/register", { name: "Y", email: `y${Date.now()}@t.io`, password: "secret1" })).status === 403);
  await superA.put("/admin/settings", { registrationOpen: true, instructorsCanPublish: false });
  const draft = await inst.post("/courses", { title: "Needs approval", description: "d", category: "Testing", instructor: "X", duration: "1 week", isPublished: "false" });
  check("instructor publish blocked when approval is required", (await inst.put(`/courses/${draft.course._id}`, { isPublished: "true" })).status === 403);
  check("super admin can publish it", (await superA.put(`/courses/${draft.course._id}`, { isPublished: "true" })).course?.isPublished === true);
  await superA.put("/admin/settings", { instructorsCanPublish: true, instructorSignupEnabled: true, instructorSignupCode: "TEST-CODE-1234" });
  check("instructor sign-up with the code set in the UI", (await anon("POST", "/auth/register", { name: "Z", email: `z${Date.now()}@t.io`, password: "secret1", role: "admin", adminCode: "TEST-CODE-1234" })).user?.role === "admin");
  await superA.put("/admin/settings", { instructorSignupEnabled: false, instructorSignupCode: "" });
  await inst.del(`/courses/${draft.course._id}`);
  check("super admin edits a user's details", (await superA.put(`/admin/users/${rohan.user._id}`, { name: "Rohan V." })).user?.name === "Rohan V.");
  await superA.put(`/admin/users/${rohan.user._id}`, { name: "Rohan Verma" });
  check("super admin sets a password", (await superA.post(`/admin/users/${rohan.user._id}/password`, { password: "student123" })).status === 200);
  const log = await superA.get("/admin/audit");
  check("actions are recorded in the activity log", log.entries?.some((e) => e.action === "course.publish") && log.entries.some((e) => e.action === "settings.update"));
  check("instructor cannot read the activity log", (await inst.get("/admin/audit")).status === 403);
  check("super overview lists instructors", Array.isArray((await superA.get("/admin/overview")).instructors));

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
