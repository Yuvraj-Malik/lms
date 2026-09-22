# TaskPulse / Ridgeline — Learning Management System (LMS)

> **Major Project Submission**  
> **Domain:** Full Stack Development (MERN Stack)  
> **Organization:** Quillance Infotech Pvt. Ltd. | Major Project Brief  
> **Student:** Yuvraj Malik — Computer Engineering, Thapar Institute of Engineering and Technology  

A production-ready, full-stack Learning Management System (LMS) built with the **MERN stack** (MongoDB, Express, React, Node.js) and enhanced with **Firebase Google Authentication** and **Nodemailer Gmail Email Services**. The system seamlessly connects students and administrators/instructors through secure, role-based dashboards to manage digital learning activities.

---

## 1. Project Overview & Objectives

TaskPulse LMS provides a centralized digital learning platform for course delivery, module tracking, and assignment assessment.

- **Centralized Platform:** Course creation, module sequencing, and assignment lifecycle.
- **Secure Dual-Engine Authentication:** Email/password with bcrypt hashing and JWT HTTP-only cookies, plus **Firebase Google OAuth 2.0** and **Gmail Nodemailer Password Recovery**.
- **Role-Based Access Control:** Strict separation between Student and Admin/Instructor permissions.
- **Course & Module Management:** Ordered module sequences with rich descriptions, lecture notes, video links, PDF resources, and code repositories.
- **Multi-Format Submissions:** Students submit work via Text, GitHub repository link, Google Drive link, Live URL, or direct File Upload.
- **Automated Progress Tracking:** Real-time calculation of course completion percentages and progress bars upon module completion.
- **Instructor Grading & Analytics:** Interactive administration dashboard with Recharts analytics charts, student monitoring, and submission evaluation with marks and personalized feedback.

---

## 2. Core Full Stack Flow & System Architecture

```text
User / Browser (React 19 + Tailwind CSS)
       │
       ├── Axios (withCredentials: true, proxy: /api)
       ├── Firebase Client SDK (Google OAuth 2.0)
       ▼
REST API Backend (Node.js + Express 5)
       │
       ├── JWT Auth Middleware & Role Guard (Student / Admin)
       ├── Nodemailer Service (Gmail App Password / Custom SMTP)
       ├── Multer File Upload Middleware
       ▼
Database Layer (MongoDB Atlas via Mongoose 9)
       └── Collections: Users, Courses, Modules, Enrollments, Assignments, Submissions
```

---

## 3. Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19, Vite 8, React Router v7 | Single Page Application architecture, custom hooks, context state |
| **Styling** | Tailwind CSS v4 | Curated color palette, dark mode / light mode toggle, glassmorphism |
| **Data Visualization** | Recharts 3 | Bar charts, line graphs, and donut charts on admin dashboard |
| **Backend** | Node.js 24 + Express 5 | RESTful architecture, custom async handlers, error middlewares |
| **Database** | MongoDB Atlas + Mongoose 9 | Scalable document models, indexing, compound constraints, aggregations |
| **Authentication** | JWT (HTTP-only cookies) + bcryptjs | Secure password hashing, token validation, protected route guards |
| **OAuth Integration** | Firebase Auth SDK v12 | Google Sign-In with popup, user profile sync with MongoDB |
| **Email Service** | Nodemailer | Gmail SMTP with App Passwords, HTML email templates |
| **File Handling** | Multer | Multipart/form-data parsing and disk storage |

---

## 4. User Roles & Capabilities

### Student Role
- **Account & Security:** Register, log in, sign in with Google, reset password via email.
- **Course Discovery:** Search courses in real-time, filter by category and difficulty (Beginner, Intermediate, Advanced), sort by newest or title.
- **Enrollment & Learning:** One-click enrollment, view enrolled courses in "My Courses", open ordered module sequences.
- **Interactive Materials:** Access lecture notes, external PDF documentation, video lectures, and code links. Mark modules as completed to update progress.
- **Assignment Submissions:** View upcoming and overdue deadlines; submit via Text, GitHub link, Drive link, Project URL, or File upload.
- **Feedback & Grades:** View scored marks, instructor review comments, and submission status (`submitted`, `graded`, `late`).

### Admin / Instructor Role
- **Course Management:** Full CRUD operations (create, edit, delete, publish) with duration, difficulty, and cover images.
- **Module Builder:** Add, edit, delete, and reorder modules with rich notes and external resource links.
- **Assignment Management:** Create course assignments with custom deadlines, instructions, and maximum marks.
- **Submission Evaluation:** Review all student submissions, view submitted links or download files, assign marks, and write constructive feedback.
- **Student Progress Monitoring:** Inspect individual student enrollment progress across all courses.
- **Platform Analytics:** Real-time metrics on total enrollments, avg course completion, submission statuses, and signup timelines.

---

## 5. Seeded Course Curriculum (6 Complete Courses)

The project includes 6 fully-structured, ready-to-demonstrate courses in MongoDB:

1. **Full Stack Development with MERN** (*Intermediate • 10 weeks • Web Development*)
   - *Module Sequence (from Project Brief):*
     1. HTML Fundamentals (Semantic HTML, Forms, Accessibility)
     2. CSS Fundamentals (Flexbox, CSS Grid, Modern Tailwind)
     3. JavaScript Basics & ES6+ (DOM, Event Loop, Async/Await)
     4. Frontend Development with React (Hooks, Components, Router)
     5. Backend Development with Node & Express (REST APIs, Middleware)
     6. Database Integration with MongoDB (Mongoose, Aggregations)
   - *Assignments:* Responsive Product Landing Page, Task & Kanban Manager, Full Stack REST API.
2. **Python for Data Science & Machine Learning** (*Beginner • 8 weeks • Data Science*)
   - *Modules:* Python Core, NumPy & Pandas, Data Visualization (Seaborn), ML Foundations.
   - *Assignments:* Exploratory Data Analysis on Customer Churn.
3. **Java Full Stack & Spring Boot Microservices** (*Intermediate • 10 weeks • Software Engineering*)
   - *Modules:* Core Java & OOP, Spring Boot RESTful Services, JPA/Hibernate, Spring Security.
   - *Assignments:* Secure Banking REST API.
4. **DevOps Engineering, Docker & CI/CD Pipelines** (*Advanced • 6 weeks • DevOps & Cloud*)
   - *Modules:* Docker Containerization, GitHub Actions CI/CD, Kubernetes Fundamentals.
   - *Assignments:* Multi-Stage Dockerfile & CI Pipeline.
5. **Modern UI/UX Design & Frontend Engineering** (*Beginner • 6 weeks • Design*)
   - *Modules:* UI Design Systems & Typography, Tailwind CSS Layouts.
   - *Assignments:* High-Fidelity Mobile App Prototype.
6. **Database Systems & Advanced SQL Architecture** (*Intermediate • 5 weeks • Databases*)
   - *Modules:* Relational Modeling & Normalization (3NF), Advanced SQL & Query Tuning.

---

## 6. Demo Accounts

| Role | Name | Email | Password | Google Auth |
|---|---|---|---|---|
| **Admin** | Dr. Neha Kapoor | `admin@lms.com` | `admin123` | Supported |
| **Student** | Aditi Sharma | `student@lms.com` | `student123` | Supported |
| **Student** | Rohan Verma | `rohan@lms.com` | `student123` | Supported |
| **Student** | Yuvraj Malik | `malikyuvraj2701@gmail.com` | `student123` | Supported (Firebase) |
| **Student** | Priya Nair | `priya.sharma@lms.com` | `student123` | Supported |

---

## 7. Environment Variables (`.env`)

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5174
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/lms
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Email Service (Nodemailer for Password Reset)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM="TaskPulse LMS <your_email@gmail.com>"

# Admin Signup Code (for instructor registration)
ADMIN_SIGNUP_CODE=LMS-ADMIN-2026

# Firebase Client Configuration (Vite)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 8. Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB instance (MongoDB Atlas or local MongoDB)

### Step 1: Clone and Configure Environment
```bash
git clone <repository_url>
cd lms-project
# Configure .env with your MongoDB URI, Gmail credentials, and Firebase config
```

### Step 2: Start the Backend Server
```bash
cd server
npm install
npm run seed     # Seeds 6 courses, 23 modules, 6 assignments, and demo accounts
npm run dev      # Starts Express API on http://localhost:5000
```

### Step 3: Start the Frontend Client
```bash
cd client
npm install
npm run dev      # Starts Vite React client on http://localhost:5174
```

Access the application in your browser at `http://localhost:5174`.

---

## 9. API Endpoints Reference

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new student or admin with code | Public |
| `POST` | `/api/auth/login` | Email/password login with JWT cookie | Public |
| `POST` | `/api/auth/google` | Firebase Google OAuth profile synchronization | Public |
| `POST` | `/api/auth/logout` | Clear session cookie | Authenticated |
| `GET` | `/api/auth/me` | Fetch active user profile | Authenticated |
| `POST` | `/api/auth/forgot-password` | Dispatch reset email via Gmail Nodemailer | Public |
| `POST` | `/api/auth/reset-password/:token`| Reset password using token | Public |
| `GET` | `/api/courses` | List courses (supports search, category, sort) | Public |
| `GET` | `/api/courses/:id` | Get course details and modules | Public |
| `POST` | `/api/courses` | Create new course | Admin |
| `PUT` | `/api/courses/:id` | Update course details | Admin |
| `DELETE`| `/api/courses/:id` | Delete course | Admin |
| `GET` | `/api/courses/:courseId/modules` | List ordered course modules | Public |
| `POST` | `/api/modules/:id/complete` | Mark module as completed | Student |
| `POST` | `/api/enrollments/:courseId` | Enroll in course | Student |
| `GET` | `/api/enrollments/my` | Get current student enrollments | Student |
| `POST` | `/api/assignments/:id/submissions` | Submit assignment (text/link/file) | Student |
| `PUT` | `/api/submissions/:id/grade` | Grade submission with marks and feedback | Admin |
| `GET` | `/api/dashboard/student` | Get student metrics & progress summary | Student |
| `GET` | `/api/users/student-profile` | Student learning summary, transcript, & certificates | Student |
| `PUT` | `/api/users/profile` | Update profile (name, bio, department, avatar, notifs) | Authenticated |
| `PUT` | `/api/users/change-password` | Change password with current password verification | Authenticated |
| `GET` | `/api/notifications` | List unread and recent user notifications | Authenticated |
| `PUT` | `/api/notifications/:id/read` | Mark individual notification as read | Authenticated |
| `PUT` | `/api/notifications/read-all` | Mark all user notifications as read | Authenticated |
| `GET` | `/api/admin/stats` | Platform statistics with completion rates | Admin |
| `GET` | `/api/admin/analytics/*` | Chart analytics data (enrollments, signups, etc.) | Admin |
| `GET` | `/api/admin/users` | List all users with search, role, and status filters | Admin |
| `PUT` | `/api/admin/users/:id/role` | Toggle user role between student and admin | Admin |
| `PUT` | `/api/admin/users/:id/status` | Toggle user account activation (disable/enable) | Admin |
| `DELETE`| `/api/admin/users/:id` | Permanently delete user account | Admin |
| `GET` | `/api/admin/submissions` | Global submissions hub with status filters | Admin |
| `POST` | `/api/admin/students/enroll` | Manually enroll student into a course | Admin |
| `POST` | `/api/admin/students/unenroll` | Manually unenroll student from a course | Admin |
| `DELETE`| `/api/admin/submissions/:id/reset`| Reset submission to allow student resubmission | Admin |
| `POST` | `/api/admin/assignments/extend-deadline`| Extend assignment deadline for student | Admin |

---

## 10. Known Limitations & Production Transparency

In accordance with strict engineering integrity and academic grading standards:

1. **Email Service (Nodemailer Gmail SMTP):** Password reset and alert emails are dispatched through Gmail's SMTP service using App Passwords. If environment variables `EMAIL_USER` or `EMAIL_PASS` are absent or misconfigured in local test environments, password reset tokens are returned gracefully with console diagnostics.
2. **Admin Registration Security:** Admin account creation is protected by a static secret code (`ADMIN_SIGNUP_CODE` in `.env`). In enterprise production deployments, this would be replaced with an organization SSO whitelist, invitation token workflow, or hierarchical permissions matrix.
3. **Local File Storage:** Uploaded student assignment attachments and profile avatars are parsed by Multer and persisted to the local `/server/uploads` directory. For multi-instance cloud deployments (AWS ECS, GCP Cloud Run), this would integrate with an object store such as AWS S3 or Cloudflare R2 with pre-signed upload URLs.
4. **Google OAuth Client Keys:** The Google Sign-In button interfaces with Firebase Web SDK. In local development or air-gapped environments without Firebase internet access, standard email/password authentication provides full platform coverage.

---

## 11. Future Improvements (Roadmap & Good-to-Have Features)

The following architectural enhancements are designed for future phase expansion:

- **Interactive Quiz Module:** Timed multiple-choice quizzes per course module with randomized question pools and instant automated scoring.
- **Discussion Forums & Peer Collaboration:** Course-specific discussion threads where students can ask questions, upvote answers, and receive verified answers from instructors.
- **Course Ratings & Student Reviews:** Star ratings (1-5) and written testimonials on public course catalog pages.
- **Live Classroom / WebRTC Integration:** Integrated video conferencing sessions for live lectures, office hours, and screen sharing.
- **Payment Gateway Integration:** Stripe / Razorpay checkout integration for paid courses, premium tracks, and physical certificate shipping.
- **Automated PDF Certificate Generation:** Server-side PDF generation using Puppeteer/PDFKit with cryptographic verification QR codes.

---

## 12. Resume Description & Skills Demonstrated

### Resume Project Description
> **Learning Management System (LMS) - Full Stack Web Application**  
> Developed a full-stack Learning Management System that enables students to register, enroll in courses, access structured learning modules, submit assignments across multiple formats, and track learning progress with live visual completion bars.  
> Implemented dual-engine authentication (JWT HTTP-only cookies and Firebase Google OAuth 2.0), automated password recovery via Gmail Nodemailer, role-based access control, responsive student/admin dashboards with interactive Recharts analytics, REST APIs, and MongoDB database persistence.

### Skills Demonstrated
- **Frontend Development:** Responsive React 19 single-page application, Tailwind CSS v4 design system, dark mode, Recharts data visualization.
- **Backend Development:** Node.js, Express 5 REST API design, async middleware, error handling, file streaming, Nodemailer integration.
- **Database Management:** MongoDB Atlas, Mongoose 9 models, relational references, indexing, automated timestamps.
- **Authentication & Security:** JWT tokens in HTTP-only cookies, bcryptjs password hashing, Firebase Google OAuth, sanitization.
- **CRUD Operations:** Complete course, module, assignment, and submission lifecycle workflows.

