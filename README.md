# Ridgeline — Learning Management System

> **Major project:** Full Stack Development (MERN) · Quillance Infotech Pvt. Ltd.
> **Student:** Yuvraj Malik — Computer Engineering, Thapar Institute of Engineering and Technology

Ridgeline is a full-stack LMS. Students enroll in courses, work through ordered modules, pass short quizzes, submit
assignments and track their progress. Instructors build and run their own courses. A super admin oversees the whole
platform.

---

## 1. Problem statement and objectives

Course material, deadlines and grades usually live in different places, so students lose track of what's due and
instructors can't see who is falling behind. Ridgeline puts them in one application:

- Secure registration and login, with separate student, instructor and super admin roles
- Course, module, quiz and assignment management for instructors
- Enrollment, module completion, quiz attempts and assignment submission for students
- Progress tracking and grading dashboards for both sides
- Everything is stored in MongoDB and served through a REST API

## 2. Roles

| Role | What they can do |
|---|---|
| **Student** | Register / sign in (email or Google), browse and enroll in published courses, study modules, take quizzes, submit work (text, file, GitHub, Drive or link), see grades and feedback, track progress, download certificates, join course discussions |
| **Instructor** (`role: admin`) | Everything for **courses they created**: edit details, publish/unpublish, add/reorder/edit modules, build quizzes, post/edit/delete assignments, enroll/remove students, grade and reopen submissions, moderate discussions, message their students. They can't see or change other instructors' courses. |
| **Super admin** (`role: admin` + `isSuperAdmin`) | Everything an instructor can do, on **every** course. Plus: create accounts, change anyone's role, deactivate or delete accounts, transfer course ownership, and send platform-wide announcements. The last active super admin can't be removed. |

Access rules are enforced on the server (`server/src/utils/access.js`), not only hidden in the UI.

## 3. Features

**Students**
- Dashboard with next module to study per course, deadlines, overdue work, recent grades
- Course catalog with search, category and difficulty filters
- Learning view: ordered modules, notes, resource links, quiz, previous/next navigation, private notes, discussion
- Quizzes are graded on the server; answers are never sent to the browser before submitting
- A module with a quiz is completed by passing it (pass mark set per module)
- Assignments hub (to do / awaiting grade / graded) and a submission page that supports text, file upload, GitHub, Google Drive or any project link; resubmit until it's graded
- Progress page, profile with certificates, printable certificate with a public verification link
- In-app notifications (new assignment, grade, announcements), optional email copies, light/dark theme

**Instructors / super admin**
- Overview: students, completion rate, grading queue (oldest first), submissions breakdown, enrollments per course, 30-day enrollment trend, upcoming deadlines
- Course editor with tabs: Modules (with quiz builder), Assignments, Students (enroll/remove, CSV export), Submissions (grade with marks + feedback, reopen), Discussion, Settings (details, cover image, publish, delete, owner)
- Global submissions queue, student list and per-student progress (courses, submissions, quiz results)
- Announcements to a course, all their students or one person
- Super admin only: **Users & roles** page

**Optional features from the brief that are implemented:** quiz module, certificate generation + verification, email notifications, course search and filtering, discussion forum, dark mode, profile photo upload, password reset, analytics charts.

## 4. Technology

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Vite 8, Tailwind CSS 4, lucide-react icons |
| Backend | Node.js, Express 5, Multer (uploads), Nodemailer (email), express-rate-limit |
| Database | MongoDB with Mongoose 9 |
| Auth | bcrypt password hashing, JWT in an HTTP-only cookie, Firebase Google sign-in verified on the server with `jose` |

## 5. Architecture

```
Browser (React SPA)
   │  axios, cookies
   ▼
Express REST API  ──  auth middleware (protect / requireRole / requireSuperAdmin)
   │                   ownership checks (utils/access.js)
   ▼
MongoDB (Mongoose models)
```

## 6. Database collections

| Collection | Main fields |
|---|---|
| users | name, email, password (bcrypt), role, isSuperAdmin, isActive, avatar, bio, department, authProvider, googleId, notificationPreferences |
| courses | title, description, category, instructor, duration, difficulty, image, isPublished, **createdBy** (owner) |
| modules | course, title, description, notes, resourceLinks[], moduleOrder, quiz[{question, options[], answer, explanation}], quizPassPercent |
| enrollments | student, course, enrollmentDate, status, progress, completedModules[], completedAt — unique (student, course) |
| assignments | course, title, description, instructions, deadline, maximumMarks |
| submissions | assignment, student, submissionType, textContent / submissionLink / filePath, submissionDate, marks, feedback, status — unique (assignment, student) |
| quizattempts | student, module, course, answers[], score, total, passed |
| discussions | course, user, title, content, category, upvotes[], replies[] |
| notifications | user, sentBy, title, message, link, type, isRead |

## 7. Setup

Requirements: Node.js 20+, a MongoDB database (Atlas or local).

```bash
git clone https://github.com/Yuvraj-Malik/lms.git
cd lms
cp .env.example .env          # then fill in MONGO_URI and JWT_SECRET at minimum

cd server
npm install
npm run seed                  # WARNING: wipes and refills the database with demo data
npm run dev                   # API on http://localhost:5000

cd ../client
npm install
npm run dev                   # app on http://localhost:5174
```

The Vite dev server proxies `/api` and `/uploads` to the API, so the browser only talks to one origin.

**Check the API end to end** (with the server running on seeded data):

```bash
cd server
npm run test:api              # 47 checks: roles, ownership, quizzes, submissions, grading, super admin
```

## 8. Environment variables

See `.env.example`. The server and client share the single `.env` in the repository root.
`VITE_*` values are compiled into the browser bundle, so they must only ever hold public Firebase config.

## 9. Demo accounts (after `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Super admin | admin@lms.com | admin123 |
| Instructor (owns 2 courses) | instructor@lms.com | instructor123 |
| Student | student@lms.com | student123 |
| Student | rohan@lms.com | student123 |
| Student (completed a course, has a certificate) | priya.sharma@lms.com | student123 |

Change these passwords on any deployed copy.

## 10. API overview

All routes are under `/api`. "Owner" means the instructor who created the course, or the super admin.

| Method | Route | Who |
|---|---|---|
| POST | /auth/register, /auth/login, /auth/google, /auth/forgot-password, /auth/reset-password/:token | Public |
| GET | /auth/me, /auth/session · POST /auth/logout | Signed in |
| GET | /courses, /courses/categories, /courses/:id | Public (drafts only for owner) |
| GET | /courses/manage | Admin (own courses; super admin: all) |
| POST · PUT · DELETE | /courses, /courses/:id | Owner |
| GET | /courses/:courseId/modules | Owner (with answers) or enrolled student (answers hidden) |
| POST · PUT | /courses/:courseId/modules, /courses/:courseId/modules/reorder, /modules/:id | Owner |
| DELETE | /modules/:id | Owner |
| POST | /modules/:id/complete, /modules/:id/quiz | Enrolled student |
| POST | /enrollments/:courseId · GET /enrollments/my | Student |
| GET | /enrollments/course/:courseId | Owner |
| GET | /enrollments/verify/:credentialId | Public |
| GET | /assignments/my | Student |
| GET | /courses/:courseId/assignments, /assignments/:id | Owner or enrolled student |
| POST · PUT · DELETE | /courses/:courseId/assignments, /assignments/:id | Owner |
| POST | /assignments/:id/submissions | Enrolled student |
| GET | /assignments/:id/submissions · PUT /submissions/:id/grade | Owner |
| GET | /submissions/my | Student |
| GET | /submissions/:id/file | The student who submitted, or the owner |
| GET | /dashboard/student, /users/student-profile | Student |
| PUT | /users/profile, /users/change-password | Signed in |
| GET · PUT · DELETE | /notifications… | Signed in (own only) |
| GET · POST · DELETE | /discussions… | Owner or enrolled student |
| GET | /admin/overview, /admin/students, /admin/students/:id, /admin/submissions, /admin/directory | Admin (scoped to own courses) |
| POST · DELETE | /admin/enrollments, /admin/enrollments/:id, /admin/submissions/:id/reopen, /admin/notifications | Owner |
| GET · POST · PUT · DELETE | /admin/users…, /admin/instructors | Super admin |

## 11. Security notes

- Passwords hashed with bcrypt; sessions are JWTs in HTTP-only cookies
- Google sign-in: the server verifies the Firebase ID token's signature, issuer and audience before trusting the email
- Deactivated accounts are locked out on their next request, not just at login
- Instructor sign-up only works when `ADMIN_SIGNUP_CODE` is set; there is no built-in default code
- Password-reset links are built from `CLIENT_URL`, never from request headers
- Login, register, reset and Google endpoints are rate-limited
- Submission files are not public; they're downloaded through an authorised route
- Quiz answers are checked on the server

## 12. Known limitations

- Uploaded files are stored on the server's disk. On hosts with ephemeral disks (e.g. Render's free tier) they're lost on redeploy; production would use object storage such as S3.
- Study notes are saved in the browser (per user, per course), not in the database.
- Emails need Gmail app-password or SMTP settings; without them they're printed to the server console.

## 13. Future improvements

Timed quizzes with question pools, course ratings and reviews, attendance tracking, object storage for uploads, and
automated tests for the React app.

## 14. Resume description

**Ridgeline LMS — Full Stack Web Application (MERN).** Built a learning management system where students enroll in
courses, complete ordered modules and server-graded quizzes, submit assignments in five formats and track progress.
Implemented role-based access with course ownership for instructors and a super admin role, JWT + verified Google
sign-in, grading with feedback, notifications, certificates with public verification, and analytics dashboards.
