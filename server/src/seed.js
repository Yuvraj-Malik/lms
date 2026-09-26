import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env"),
});

import connectDB from "./config/db.js";
import User from "./models/User.js";
import Course from "./models/Course.js";
import Module from "./models/Module.js";
import Assignment from "./models/Assignment.js";
import Enrollment from "./models/Enrollment.js";
import Submission from "./models/Submission.js";

const run = async () => {
  await connectDB();
  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Module.deleteMany({}),
    Assignment.deleteMany({}),
    Enrollment.deleteMany({}),
    Submission.deleteMany({}),
  ]);

  console.log("Creating users...");
  const admin = await User.create({
    name: "Dr. Neha Kapoor (Admin)",
    email: "admin@lms.com",
    password: "admin123",
    role: "admin",
    isSuperAdmin: true,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    bio: "Head of Computer Science & Full Stack Engineering. Over 12 years of industry and academic experience.",
  });

  const student1 = await User.create({
    name: "Aditi Sharma",
    email: "student@lms.com",
    password: "student123",
    role: "student",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    bio: "Passionate CS undergraduate focusing on MERN stack and cloud architectures.",
  });

  const student2 = await User.create({
    name: "Rohan Verma",
    email: "rohan@lms.com",
    password: "student123",
    role: "student",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    bio: "Software developer exploring Python, data structures, and database systems.",
  });

  const student3 = await User.create({
    name: "Yuvraj Malik",
    email: "malikyuvraj2701@gmail.com",
    password: "student123",
    role: "student",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
    bio: "Full stack enthusiast building modern digital products and web systems.",
  });

  const student4 = await User.create({
    name: "Priya Nair",
    email: "priya.sharma@lms.com",
    password: "student123",
    role: "student",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    bio: "UI/UX designer transitioning into full stack frontend engineering.",
  });

  // Backdate account creation so "Joined" dates reflect a realistic history
  // (mongoose timestamps always set createdAt to "now"; bypass via the raw driver).
  const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  await Promise.all([
    User.collection.updateOne({ _id: admin._id }, { $set: { createdAt: daysAgo(120) } }),
    User.collection.updateOne({ _id: student1._id }, { $set: { createdAt: daysAgo(60) } }),
    User.collection.updateOne({ _id: student2._id }, { $set: { createdAt: daysAgo(45) } }),
    User.collection.updateOne({ _id: student3._id }, { $set: { createdAt: daysAgo(35) } }),
    User.collection.updateOne({ _id: student4._id }, { $set: { createdAt: daysAgo(25) } }),
  ]);

  console.log("Creating courses...");

  // Course 1: Full Stack Development (Matches PDF Page 4 exactly)
  const course1 = await Course.create({
    title: "Full Stack Development with MERN",
    description:
      "Master modern end-to-end web application development. Covers HTML/CSS basics, JavaScript ES6+, React frontends, Node.js/Express backends, and MongoDB database integration.",
    category: "Web Development",
    instructor: "Dr. Neha Kapoor",
    duration: "10 weeks",
    difficulty: "Intermediate",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80",
    createdBy: admin._id,
  });

  // Course 2: Python for Data Science
  const course2 = await Course.create({
    title: "Python for Data Science & Machine Learning",
    description:
      "A hands-on, practical introduction to data analysis with Python. Work with NumPy, Pandas, Matplotlib, Seaborn, and introductory scikit-learn models.",
    category: "Data Science",
    instructor: "Prof. Arjun Mehta",
    duration: "8 weeks",
    difficulty: "Beginner",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    createdBy: admin._id,
  });

  // Course 3: Java Enterprise Application Development (From PDF Page 5 Suggested Stacks)
  const course3 = await Course.create({
    title: "Java Full Stack & Spring Boot Microservices",
    description:
      "Build resilient enterprise web architectures using Java 21, Spring Boot REST APIs, Hibernate/JPA, MySQL database persistence, and modern React clients.",
    category: "Software Engineering",
    instructor: "Rajesh Sharma",
    duration: "10 weeks",
    difficulty: "Intermediate",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
    createdBy: admin._id,
  });

  // Course 4: Cloud Computing & DevOps Essentials
  const course4 = await Course.create({
    title: "DevOps Engineering, Docker & CI/CD Pipelines",
    description:
      "Comprehensive guide to modern software delivery. Learn containerization with Docker, Kubernetes orchestration, automated testing, and GitHub Actions CI/CD pipelines.",
    category: "DevOps & Cloud",
    instructor: "Sarah Jenkins",
    duration: "6 weeks",
    difficulty: "Advanced",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    createdBy: admin._id,
  });

  // Course 5: UI/UX Design & Frontend Systems
  const course5 = await Course.create({
    title: "Modern UI/UX Design & Frontend Engineering",
    description:
      "Bridge the gap between design and code. Learn Figma design systems, wireframing, accessibility best practices, and implementing pixel-perfect interfaces with Tailwind CSS.",
    category: "Design",
    instructor: "Priya Nair",
    duration: "6 weeks",
    difficulty: "Beginner",
    image: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80",
    createdBy: admin._id,
  });

  // Course 6: Database Systems & SQL Architecture
  const course6 = await Course.create({
    title: "Database Systems & Advanced SQL Architecture",
    description:
      "In-depth exploration of database design, third normal form (3NF), complex SQL queries, query execution plans, indexing strategies, and comparing SQL with NoSQL MongoDB architectures.",
    category: "Databases",
    instructor: "Dr. Amit Patel",
    duration: "5 weeks",
    difficulty: "Intermediate",
    image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=800&q=80",
    createdBy: admin._id,
  });

  console.log("Creating modules with learning materials...");

  // Course 1 Modules (Ordered sequence from PDF Page 4)
  const modulesCourse1 = [
    {
      title: "HTML Fundamentals",
      description: "Semantic HTML5 elements, accessibility principles, forms, and page structure.",
      moduleOrder: 1,
      notes:
        "HTML (HyperText Markup Language) forms the structural backbone of every web application. In this module, focus on semantic elements like <main>, <header>, <nav>, <section>, and <article>, as well as ARIA labels for screen readers.",
      resourceLinks: [
        "https://developer.mozilla.org/en-US/docs/Learn/HTML",
        "https://www.w3.org/WAI/fundamentals/accessibility-intro/",
        "https://github.com/mdn/learning-area/tree/main/html",
      ],
    },
    {
      title: "CSS Fundamentals",
      description: "Responsive layouts, Flexbox, Grid systems, and CSS custom properties.",
      moduleOrder: 2,
      notes:
        "Mastering Flexbox and CSS Grid is essential for responsive interfaces. Ensure you understand 1D layout flows with Flexbox versus 2D multi-dimensional coordinate layouts with CSS Grid.",
      resourceLinks: [
        "https://css-tricks.com/snippets/css/a-guide-to-flexbox/",
        "https://css-tricks.com/snippets/css/complete-guide-grid/",
        "https://web.dev/learn/css/",
      ],
    },
    {
      title: "JavaScript Basics & ES6+",
      description: "Variables, execution contexts, closures, async/await, and DOM manipulation.",
      moduleOrder: 3,
      notes:
        "JavaScript powers modern client-side dynamism. We cover closures, lexical scope, the JavaScript event loop, microtask queues, and modern ES6+ syntax including arrow functions, destructuring, and async/await.",
      resourceLinks: [
        "https://javascript.info/",
        "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        "https://github.com/getify/You-Dont-Know-JS",
      ],
    },
    {
      title: "Frontend Development with React",
      description: "Component hierarchy, state and props, useEffect lifecycle, and custom hooks.",
      moduleOrder: 4,
      notes:
        "React enables declarative UI programming. In this module, we build reusable component libraries, manage global state, handle side effects cleanly with useEffect, and configure client-side routing.",
      resourceLinks: [
        "https://react.dev/learn",
        "https://vitejs.dev/guide/",
        "https://reactrouter.com/",
      ],
    },
    {
      title: "Backend Development with Node & Express",
      description: "HTTP protocol, RESTful routing, custom middleware, and JWT authentication.",
      moduleOrder: 5,
      notes:
        "Express provides an unopinionated routing engine for Node.js. Learn to structure controllers, async handler wrappers, JWT authorization middleware, and secure cookie handling.",
      resourceLinks: [
        "https://expressjs.com/en/guide/routing.html",
        "https://nodejs.org/docs/latest/api/",
        "https://jwt.io/introduction",
      ],
    },
    {
      title: "Database Integration with MongoDB",
      description: "Document models, Mongoose schemas, relationships, indexing, and aggregations.",
      moduleOrder: 6,
      notes:
        "MongoDB is a document database designed for horizontal scalability and rapid development. Learn schema validation, virtuals, pre/post hooks, and aggregation pipelines for analytics.",
      resourceLinks: [
        "https://www.mongodb.com/docs/manual/",
        "https://mongoosejs.com/docs/guide.html",
        "https://university.mongodb.com/",
      ],
    },
  ];

  for (const m of modulesCourse1) {
    await Module.create({ ...m, course: course1._id });
  }

  // Course 2 Modules
  const modulesCourse2 = [
    {
      title: "Python Core & Functional Concepts",
      description: "Control structures, list comprehensions, lambda functions, and file I/O.",
      moduleOrder: 1,
      notes: "Foundational Python syntax, data structures (lists, tuples, dicts, sets), and pythonic idioms.",
      resourceLinks: ["https://docs.python.org/3/tutorial/", "https://realpython.com/"],
    },
    {
      title: "NumPy & Pandas for Data Analysis",
      description: "Multi-dimensional arrays, Series, DataFrames, indexing, and data cleaning.",
      moduleOrder: 2,
      notes: "Handling missing values, grouping, merging, and reshaping large datasets with Pandas.",
      resourceLinks: ["https://pandas.pydata.org/docs/getting_started/", "https://numpy.org/doc/stable/"],
    },
    {
      title: "Data Visualization with Matplotlib & Seaborn",
      description: "Histogram plots, heatmaps, categorical distributions, and custom themes.",
      moduleOrder: 3,
      notes: "Communicating insights visually through chart design and statistical plotting.",
      resourceLinks: ["https://seaborn.pydata.org/tutorial.html", "https://matplotlib.org/stable/tutorials/"],
    },
    {
      title: "Introduction to Machine Learning with Scikit-Learn",
      description: "Supervised learning, linear regression, classification trees, and model evaluation.",
      moduleOrder: 4,
      notes: "Train/test splits, cross-validation, precision/recall metrics, and model pipelines.",
      resourceLinks: ["https://scikit-learn.org/stable/getting_started.html"],
    },
  ];

  for (const m of modulesCourse2) {
    await Module.create({ ...m, course: course2._id });
  }

  // Course 3 Modules
  const modulesCourse3 = [
    {
      title: "Core Java & OOP Architecture",
      description: "Polymorphism, interfaces, generics, streams, and concurrency.",
      moduleOrder: 1,
      notes: "Deep dive into JVM memory model, garbage collection, and modern Java features.",
      resourceLinks: ["https://dev.java/learn/"],
    },
    {
      title: "Spring Boot RESTful Services",
      description: "Dependency injection, controllers, DTOs, and global exception handling.",
      moduleOrder: 2,
      notes: "Configuring application.properties, actuator, and building modular REST controllers.",
      resourceLinks: ["https://spring.io/guides/gs/rest-service/"],
    },
    {
      title: "Persistence with Spring Data JPA & Hibernate",
      description: "Entity relationships, repositories, transaction management, and migrations.",
      moduleOrder: 3,
      notes: "Mapping OneToMany and ManyToMany associations with optimal lazy loading strategies.",
      resourceLinks: ["https://spring.io/projects/spring-data-jpa"],
    },
    {
      title: "Spring Security & JWT Authentication",
      description: "Role-based access control, security filter chains, and token validation.",
      moduleOrder: 4,
      notes: "Implementing stateless security filters and fine-grained method authorization.",
      resourceLinks: ["https://docs.spring.io/spring-security/reference/"],
    },
  ];

  for (const m of modulesCourse3) {
    await Module.create({ ...m, course: course3._id });
  }

  // Course 4 Modules
  const modulesCourse4 = [
    {
      title: "Containerization with Docker",
      description: "Dockerfiles, multi-stage builds, container networks, and Docker Compose.",
      moduleOrder: 1,
      notes: "Optimizing container layer caching, reducing image sizes, and local dev environments.",
      resourceLinks: ["https://docs.docker.com/get-started/"],
    },
    {
      title: "Continuous Integration with GitHub Actions",
      description: "Automated test runs, linting, build pipelines, and secret management.",
      moduleOrder: 2,
      notes: "Writing robust YAML workflows with matrix builds and status badges.",
      resourceLinks: ["https://docs.github.com/en/actions"],
    },
    {
      title: "Kubernetes Fundamentals",
      description: "Pods, ReplicaSets, Deployments, Services, and Ingress routing.",
      moduleOrder: 3,
      notes: "Declarative cluster configuration, rolling updates, and self-healing deployments.",
      resourceLinks: ["https://kubernetes.io/docs/tutorials/kubernetes-basics/"],
    },
  ];

  for (const m of modulesCourse4) {
    await Module.create({ ...m, course: course4._id });
  }

  // Course 5 Modules
  const modulesCourse5 = [
    {
      title: "UI Design Systems & Typography",
      description: "Color theory, type scales, spacing tokens, and Figma components.",
      moduleOrder: 1,
      notes: "Creating scalable design tokens and auto-layout components in Figma.",
      resourceLinks: ["https://www.figma.com/resource-library/"],
    },
    {
      title: "Tailwind CSS & Responsive Layouts",
      description: "Utility-first workflows, custom configuration, dark mode, and animations.",
      moduleOrder: 2,
      notes: "Building high-performance interfaces without writing repetitive custom CSS.",
      resourceLinks: ["https://tailwindcss.com/docs"],
    },
  ];

  for (const m of modulesCourse5) {
    await Module.create({ ...m, course: course5._id });
  }

  // Course 6 Modules
  const modulesCourse6 = [
    {
      title: "Relational Modeling & Normalization",
      description: "Entity Relationship Diagrams (ERD), 1NF, 2NF, 3NF, and Boyce-Codd.",
      moduleOrder: 1,
      notes: "Designing normalized schemas that prevent update and deletion anomalies.",
      resourceLinks: ["https://www.postgresql.org/docs/"],
    },
    {
      title: "Advanced SQL & Query Optimization",
      description: "Window functions, Common Table Expressions (CTEs), and index tuning.",
      moduleOrder: 2,
      notes: "Reading EXPLAIN ANALYZE execution plans and eliminating sequential scans.",
      resourceLinks: ["https://use-the-index-luke.com/"],
    },
  ];

  for (const m of modulesCourse6) {
    await Module.create({ ...m, course: course6._id });
  }

  console.log("Creating assignments...");
  const in3days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const in7days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const in14days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const past5days = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

  const assign1 = await Assignment.create({
    course: course1._id,
    title: "Responsive Product Landing Page",
    description:
      "Construct a modern, mobile-first responsive landing page for a SaaS platform using semantic HTML5 and clean CSS (Flexbox / Grid).",
    instructions:
      "Include a sticky header, hero section with call-to-action, feature cards grid, testimonial section, and responsive footer. Submit either a GitHub repo link or hosted URL.",
    deadline: past5days,
    maximumMarks: 50,
  });

  const assign2 = await Assignment.create({
    course: course1._id,
    title: "Interactive Task & Kanban Manager",
    description:
      "Develop a frontend application using React and Tailwind CSS that lets users create, filter, drag, and complete productivity tasks.",
    instructions:
      "Ensure all states are preserved in local storage. Implement form validation for task inputs. Submit your GitHub repository link.",
    deadline: in3days,
    maximumMarks: 100,
  });

  const assign3 = await Assignment.create({
    course: course1._id,
    title: "Full Stack REST API & Database Integration",
    description:
      "Build a secure RESTful API using Node.js, Express, and MongoDB with JWT authentication and full CRUD endpoints.",
    instructions:
      "Include user registration, login, protected routes, and input validation. Provide Postman collection or automated test scripts in your repo.",
    deadline: in14days,
    maximumMarks: 100,
  });

  const assign4 = await Assignment.create({
    course: course2._id,
    title: "Exploratory Data Analysis on Customer Churn",
    description:
      "Analyze a telecom dataset using Pandas to identify key customer retention drivers, visualize trends with Seaborn, and document your findings.",
    instructions:
      "Submit your Jupyter Notebook (.ipynb) or a Google Colab / Drive link with annotated Markdown cells.",
    deadline: in7days,
    maximumMarks: 100,
  });

  const assign5 = await Assignment.create({
    course: course3._id,
    title: "Secure Banking REST API with Spring Boot",
    description:
      "Develop a Spring Boot application modeling account transfers with ACID transaction guarantees, Spring Data JPA, and unit tests.",
    instructions: "Submit your GitHub repository link with a comprehensive README.",
    deadline: in14days,
    maximumMarks: 100,
  });

  const assign6 = await Assignment.create({
    course: course4._id,
    title: "Multi-Stage Dockerfile & CI Pipeline",
    description:
      "Containerize a full-stack web application with minimal image size and configure a GitHub Actions workflow.",
    instructions: "Submit a GitHub repository link containing your Dockerfile, compose file, and .github/workflows.",
    deadline: in7days,
    maximumMarks: 100,
  });

  console.log("Enrolling students & updating progress...");

  // Student 1 (Aditi Sharma) enrolled in Course 1, Course 2, Course 4
  const c1Modules = await Module.find({ course: course1._id }).sort({ moduleOrder: 1 });
  const enr1 = await Enrollment.create({
    student: student1._id,
    course: course1._id,
    progress: 67, // 4 of 6 completed
    completedModules: [c1Modules[0]._id, c1Modules[1]._id, c1Modules[2]._id, c1Modules[3]._id],
    enrollmentDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
  });

  const c2Modules = await Module.find({ course: course2._id }).sort({ moduleOrder: 1 });
  await Enrollment.create({
    student: student1._id,
    course: course2._id,
    progress: 50, // 2 of 4 completed
    completedModules: [c2Modules[0]._id, c2Modules[1]._id],
    enrollmentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  });

  await Enrollment.create({
    student: student1._id,
    course: course4._id,
    progress: 0,
    completedModules: [],
    enrollmentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  });

  // Student 3 (Yuvraj Malik - user account matching .env email)
  await Enrollment.create({
    student: student3._id,
    course: course1._id,
    progress: 50,
    completedModules: [c1Modules[0]._id, c1Modules[1]._id, c1Modules[2]._id],
    enrollmentDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  });

  const c4Modules = await Module.find({ course: course4._id }).sort({ moduleOrder: 1 });
  await Enrollment.create({
    student: student3._id,
    course: course4._id,
    progress: 100,
    completedModules: c4Modules.map((m) => m._id),
    status: "completed",
    enrollmentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  });

  // Student 2 (Rohan Verma)
  await Enrollment.create({
    student: student2._id,
    course: course1._id,
    progress: 33,
    completedModules: [c1Modules[0]._id, c1Modules[1]._id],
    enrollmentDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
  });

  const c6Modules = await Module.find({ course: course6._id }).sort({ moduleOrder: 1 });
  await Enrollment.create({
    student: student2._id,
    course: course6._id,
    progress: 50,
    completedModules: [c6Modules[0]._id],
    enrollmentDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
  });

  // Student 4 (Priya Nair)
  const c5Modules = await Module.find({ course: course5._id }).sort({ moduleOrder: 1 });
  await Enrollment.create({
    student: student4._id,
    course: course5._id,
    progress: 100,
    completedModules: c5Modules.map((m) => m._id),
    status: "completed",
    enrollmentDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
  });

  console.log("Creating assignment submissions & grades...");

  // Graded submission for Aditi on Assignment 1
  await Submission.create({
    assignment: assign1._id,
    student: student1._id,
    submissionType: "github",
    submissionLink: "https://github.com/aditi-sharma/modern-saas-landing",
    submissionDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    marks: 48,
    feedback:
      "Good semantic hierarchy and layout breakpoints. Code is structured cleanly. Minor: review aria-label on navigation toggle.",
    status: "graded",
  });

  // Graded submission for Yuvraj on Assignment 1
  await Submission.create({
    assignment: assign1._id,
    student: student3._id,
    submissionType: "github",
    submissionLink: "https://github.com/yuvrajmalik/saas-landing-page",
    submissionDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    marks: 50,
    feedback:
      "Clean responsive implementation and typographic scale. Met all rubric requirements including keyboard navigation.",
    status: "graded",
  });

  // Graded submission for Rohan on Assignment 1 (Late)
  await Submission.create({
    assignment: assign1._id,
    student: student2._id,
    submissionType: "url",
    submissionLink: "https://rohan-landing-page.vercel.app",
    submissionDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    marks: 42,
    feedback:
      "Solid responsive behavior and asset optimization. Deducted 8 points for late submission per course policy.",
    status: "graded",
  });

  // Pending submission for Aditi on Assignment 2 (Awaiting review)
  await Submission.create({
    assignment: assign2._id,
    student: student1._id,
    submissionType: "github",
    submissionLink: "https://github.com/aditi-sharma/react-kanban-task-manager",
    submissionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: "submitted",
  });

  // Pending submission for Yuvraj on Assignment 2 (Awaiting review)
  await Submission.create({
    assignment: assign2._id,
    student: student3._id,
    submissionType: "github",
    submissionLink: "https://github.com/yuvrajmalik/taskpulse-kanban-react",
    submissionDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
    status: "submitted",
  });

  console.log("\n========================================================");
  console.log(" Rich sample data successfully seeded into MongoDB!");
  console.log("========================================================");
  console.log("Admin Account   : admin@lms.com / admin123");
  console.log("Student Account : student@lms.com / student123 (Aditi Sharma)");
  console.log("Your Account    : malikyuvraj2701@gmail.com / student123 (Yuvraj Malik)");
  console.log("Other Students  : rohan@lms.com / student123, priya.sharma@lms.com / student123");
  console.log("Courses Count   : 6 fully structured courses");
  console.log("Modules Count   : 23 ordered learning modules with resources");
  console.log("Assignments     : 6 assignments with graded & pending submissions");
  console.log("========================================================\n");

  process.exit(0);
};

run().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
