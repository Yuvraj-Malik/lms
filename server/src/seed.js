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
import Discussion from "./models/Discussion.js";
import QuizAttempt from "./models/QuizAttempt.js";
import Notification from "./models/Notification.js";

const run = async () => {
  // This script wipes every collection. Refuse to touch a production database by accident.
  if (process.env.NODE_ENV === "production" && !process.argv.includes("--force")) {
    console.error("Refusing to seed while NODE_ENV=production. Re-run with --force if you really mean it.");
    process.exit(1);
  }
  await connectDB();
  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Module.deleteMany({}),
    Assignment.deleteMany({}),
    Enrollment.deleteMany({}),
    Submission.deleteMany({}),
    Discussion.deleteMany({}),
    QuizAttempt.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  console.log("Creating users...");
  const admin = await User.create({
    name: "Dr. Neha Kapoor",
    email: "admin@lms.com",
    password: "admin123",
    role: "admin",
    isSuperAdmin: true,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    bio: "Head of Computer Science & Full Stack Engineering. Over 12 years of industry and academic experience.",
  });

  // A regular instructor: can only manage the courses they own
  const instructor = await User.create({
    name: "Prof. Arjun Mehta",
    email: "instructor@lms.com",
    password: "instructor123",
    role: "admin",
    isSuperAdmin: false,
    bio: "Data science lead. Teaches the Python and Java tracks.",
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
    bio: "Full stack enthusiast building modern digital products and cloud-native systems.",
  });

  const student4 = await User.create({
    name: "Priya Nair",
    email: "priya.sharma@lms.com",
    password: "student123",
    role: "student",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    bio: "UI/UX designer transitioning into full stack frontend engineering.",
  });

  const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  await Promise.all([
    User.collection.updateOne({ _id: admin._id }, { $set: { createdAt: daysAgo(120) } }),
    User.collection.updateOne({ _id: student1._id }, { $set: { createdAt: daysAgo(60) } }),
    User.collection.updateOne({ _id: student2._id }, { $set: { createdAt: daysAgo(45) } }),
    User.collection.updateOne({ _id: student3._id }, { $set: { createdAt: daysAgo(35) } }),
    User.collection.updateOne({ _id: student4._id }, { $set: { createdAt: daysAgo(25) } }),
  ]);

  console.log("Creating courses...");

  // Course 1: Full Stack Development
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
    createdBy: instructor._id,
  });

  // Course 3: Java Enterprise Application Development
  const course3 = await Course.create({
    title: "Java Full Stack & Spring Boot Microservices",
    description:
      "Build resilient enterprise web architectures using Java 21, Spring Boot REST APIs, Hibernate/JPA, MySQL database persistence, and modern React clients.",
    category: "Software Engineering",
    instructor: "Prof. Arjun Mehta",
    duration: "10 weeks",
    difficulty: "Intermediate",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
    createdBy: instructor._id,
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

  console.log("Creating modules with learning materials, quizzes, and resources...");

  // Course 1 Modules
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
      quiz: [
        {
          question: "Which HTML5 semantic element is best suited for independent, distributable content such as a blog post or news article?",
          options: ["<section>", "<article>", "<aside>", "<div>"],
          answer: 1,
          explanation: "<article> specifies self-contained content that could stand alone and be reused independently.",
        },
        {
          question: "What is the primary accessibility purpose of the alt attribute on <img> elements?",
          options: ["Improves page load speed", "Provides screen readers with a text equivalent for non-sighted users", "Applies default CSS padding", "Defines the image aspect ratio"],
          answer: 1,
          explanation: "Screen readers read the alt text aloud so users who cannot see the image understand its context and purpose.",
        },
        {
          question: "Which attribute ensures an input field cannot be submitted blank in HTML5 form validation?",
          options: ["validate", "required", "checked", "readonly"],
          answer: 1,
          explanation: "The 'required' attribute triggers native browser constraint validation.",
        },
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
      quiz: [
        {
          question: "In Flexbox, which property aligns items along the cross-axis?",
          options: ["justify-content", "align-items", "flex-direction", "align-content"],
          answer: 1,
          explanation: "align-items controls item alignment along the cross axis, whereas justify-content aligns along the main axis.",
        },
        {
          question: "How does CSS box-sizing: border-box calculate total element width?",
          options: ["content width + padding + border", "content width only, padding and border are outside", "width includes content, padding, and border", "width excludes border but includes margin"],
          answer: 2,
          explanation: "With border-box, the declared width encompasses content, padding, and border, preventing unexpected layout expansion.",
        },
        {
          question: "Which CSS media query breakpoint syntax correctly targets screens narrower than 768px?",
          options: ["@media (max-width: 767px)", "@media screen-width < 768", "@screen mobile", "@viewport (768px)"],
          answer: 0,
          explanation: "@media (max-width: 767px) matches viewports up to 767px.",
        },
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
      quiz: [
        {
          question: "What is the return value of Promise.all() when one of the input promises rejects?",
          options: ["Resolves with an array of nulls", "Immediately rejects with that rejection reason", "Ignores the error and returns fulfilled promises", "Waits for all others before rejecting"],
          answer: 1,
          explanation: "Promise.all fail-fasts: it immediately rejects upon the first rejected promise.",
        },
        {
          question: "In the JavaScript Event Loop, which queue executes before the next Macro-task (e.g. setTimeout)?",
          options: ["Microtask Queue (Promises, queueMicrotask)", "Worker Thread Pool", "DOM Render Pipeline", "Call Stack Backup"],
          answer: 0,
          explanation: "Microtasks are always drained completely after the current execution context and before picking the next macrotask.",
        },
        {
          question: "What will Array.prototype.map() return if no explicit return is provided inside the callback?",
          options: ["Empty array []", "Array of undefined values with identical length", "Throws a TypeError", "Array of original elements unchanged"],
          answer: 1,
          explanation: "Without an explicit return statement, JS functions return undefined, resulting in an array of undefined elements.",
        },
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
      quiz: [
        {
          question: "Why must React Hook calls remain at the top level of a component?",
          options: ["To prevent memory leaks in the browser", "So React can rely on the same execution order across renders to preserve hook state", "Because JavaScript syntax forbids nested functions", "To improve Webpack compilation time"],
          answer: 1,
          explanation: "React relies on strict call order to correctly associate hook state arrays with their respective useState/useEffect calls.",
        },
        {
          question: "What problem does the React 'key' prop solve during reconciliation of dynamic lists?",
          options: ["It provides CSS class names", "It uniquely identifies items across renders so React can reorder instead of re-creating DOM nodes", "It encrypts element state", "It binds event handlers to parent elements"],
          answer: 1,
          explanation: "Stable keys allow React's diffing algorithm to preserve component state and avoid re-mounting.",
        },
        {
          question: "When does the cleanup function returned by useEffect execute?",
          options: ["Immediately before the next effect run and upon component unmount", "Only when the browser tab closes", "Synchronously before state changes", "Never if dependency array is empty"],
          answer: 0,
          explanation: "The cleanup function executes before re-running the effect on new dependencies or when unmounting.",
        },
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
      quiz: [
        {
          question: "What are the three core arguments received by standard Express middleware functions?",
          options: ["(req, res, next)", "(input, output, err)", "(ctx, body, done)", "(request, response, dispatch)"],
          answer: 0,
          explanation: "Express passes the HTTP request, response, and the next() callback function to middleware.",
        },
        {
          question: "Why should JSON Web Tokens (JWT) generally be stored in httpOnly cookies rather than localStorage?",
          options: ["httpOnly cookies prevent JavaScript access, mitigating Cross-Site Scripting (XSS) token theft", "localStorage has smaller storage limits", "httpOnly cookies work faster", "localStorage only supports numbers"],
          answer: 0,
          explanation: "httpOnly cookies cannot be accessed via document.cookie by injected client scripts.",
        },
        {
          question: "Which HTTP status code signifies that a request lacks valid authentication credentials?",
          options: ["400 Bad Request", "401 Unauthorized", "403 Forbidden", "404 Not Found"],
          answer: 1,
          explanation: "401 indicates authentication is required and has failed or has not been provided.",
        },
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
      quiz: [
        {
          question: "In MongoDB, which query operator checks if an array field contains any matching element from a specified list?",
          options: ["$elemMatch", "$in", "$contains", "$exists"],
          answer: 1,
          explanation: "$in selects documents where the value of a field equals any value in the specified array.",
        },
        {
          question: "What is an index in MongoDB, and what is its primary operational benefit?",
          options: ["A compressed backup copy of the database", "A data structure that stores a small portion of the dataset in an easy-to-traverse form to drastically speed up query lookups", "A mechanism to encrypt data at rest", "A tool for automatic JSON validation"],
          answer: 1,
          explanation: "Indexes store sorted pointers to documents, turning O(N) collection scans into O(log N) tree lookups.",
        },
        {
          question: "In Mongoose, what is the role of virtual properties?",
          options: ["Document properties that are computed dynamically and not stored in MongoDB", "Encrypted fields on disk", "Temporary variables during schema compile time", "Database trigger functions"],
          answer: 0,
          explanation: "Virtuals are getter/setter document attributes that compute values without saving to the DB.",
        },
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
      quiz: [
        {
          question: "What is the primary difference between a Python list and a Python tuple?",
          options: ["Tuples are immutable whereas lists are mutable", "Lists are faster to search", "Tuples cannot contain strings", "Lists have fixed length"],
          answer: 0,
          explanation: "Tuples cannot be altered once created, making them hashable and memory efficient.",
        },
        {
          question: "What does the expression [x**2 for x in range(5) if x % 2 == 0] evaluate to?",
          options: ["[0, 4, 16]", "[1, 9]", "[0, 1, 4, 9, 16]", "[4, 16]"],
          answer: 0,
          explanation: "The even numbers in range(5) are 0, 2, 4. Their squares are 0, 4, 16.",
        },
      ],
    },
    {
      title: "NumPy & Pandas for Data Analysis",
      description: "Multi-dimensional arrays, Series, DataFrames, indexing, and data cleaning.",
      moduleOrder: 2,
      notes: "Handling missing values, grouping, merging, and reshaping large datasets with Pandas.",
      resourceLinks: ["https://pandas.pydata.org/docs/getting_started/", "https://numpy.org/doc/stable/"],
      quiz: [
        {
          question: "In Pandas, what is the difference between .loc and .iloc?",
          options: [".loc uses label-based indexing while .iloc uses integer position-based indexing", ".loc is deprecated", ".iloc works only on columns", ".loc only accepts boolean masks"],
          answer: 0,
          explanation: ".loc indexes by labels/index values, whereas .iloc strictly indexes by integer 0-based positions.",
        },
        {
          question: "Which method fills NaN / missing values in a Pandas DataFrame?",
          options: ["df.dropna()", "df.fillna()", "df.replace()", "df.interpolate()"],
          answer: 1,
          explanation: "fillna() replaces missing NaN values with specified scalars or interpolated values.",
        },
      ],
    },
    {
      title: "Data Visualization with Matplotlib & Seaborn",
      description: "Histogram plots, heatmaps, categorical distributions, and custom themes.",
      moduleOrder: 3,
      notes: "Communicating insights visually through chart design and statistical plotting.",
      resourceLinks: ["https://seaborn.pydata.org/tutorial.html", "https://matplotlib.org/stable/tutorials/"],
      quiz: [
        {
          question: "Which Seaborn function displays pairwise relationships and feature distributions across an entire dataset?",
          options: ["sns.heatmap()", "sns.pairplot()", "sns.boxplot()", "sns.histplot()"],
          answer: 1,
          explanation: "pairplot creates a matrix of scatter plots and histograms for all numerical columns.",
        },
        {
          question: "In Matplotlib, what does plt.subplots(2, 2) return?",
          options: ["A list of 4 numbers", "A Figure object and an array of 4 Axes subplots", "A 2x2 grid of rendered PNG files", "A 3D projection canvas"],
          answer: 1,
          explanation: "It returns (fig, axes) where axes is a 2x2 NumPy array of Axes instances.",
        },
      ],
    },
    {
      title: "Introduction to Machine Learning with Scikit-Learn",
      description: "Supervised learning, linear regression, classification trees, and model evaluation.",
      moduleOrder: 4,
      notes: "Train/test splits, cross-validation, precision/recall metrics, and model pipelines.",
      resourceLinks: ["https://scikit-learn.org/stable/getting_started.html"],
      quiz: [
        {
          question: "Why is it critical to fit scalers (like StandardScaler) ONLY on the training split, and not the test split?",
          options: ["To prevent data leakage from the test set into model training", "Because test sets cannot be transformed", "StandardScaler raises a ValueError on test sets", "It reduces accuracy"],
          answer: 0,
          explanation: "Fitting on the test set leaks test distribution parameters (mean, variance) into training.",
        },
        {
          question: "Which metric is most informative when evaluating a classifier on an imbalanced dataset with rare positive cases?",
          options: ["Overall Accuracy", "Precision-Recall AUC / F1-Score", "Mean Squared Error", "R-squared"],
          answer: 1,
          explanation: "Accuracy is deceptive when 99% of samples are negative; PR-AUC and F1 measure performance on the positive class.",
        },
      ],
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
      quiz: [
        {
          question: "In Java memory management, where are object instances allocated versus primitive local variables?",
          options: ["Objects are on the Heap, local primitive variables are on the Thread Stack", "Both are on the Stack", "Both are in Metaspace", "Primitives are on the Heap only"],
          answer: 0,
          explanation: "Local primitives reside in stack frames, whereas object instances are allocated on the garbage-collected heap.",
        },
        {
          question: "What does the Java final keyword indicate when applied to a class?",
          options: ["The class cannot be instantiated", "The class cannot be subclassed (preventing inheritance)", "The class has no methods", "All fields are automatically public"],
          answer: 1,
          explanation: "A final class cannot be extended by another class.",
        },
      ],
    },
    {
      title: "Spring Boot RESTful Services",
      description: "Dependency injection, controllers, DTOs, and global exception handling.",
      moduleOrder: 2,
      notes: "Configuring application.properties, actuator, and building modular REST controllers.",
      resourceLinks: ["https://spring.io/guides/gs/rest-service/"],
      quiz: [
        {
          question: "What annotation marks a Spring Boot controller class whose methods automatically serialize return values into JSON responses?",
          options: ["@Controller", "@RestController", "@Service", "@Component"],
          answer: 1,
          explanation: "@RestController is a composite of @Controller and @ResponseBody.",
        },
        {
          question: "What is Inversion of Control (IoC) and Dependency Injection in Spring?",
          options: ["Compiling code backwards", "A design pattern where object creation and lifecycle dependencies are managed by the Spring IoC container rather than manual 'new' instantiations", "Connecting to a database asynchronously", "Writing SQL inside HTML"],
          answer: 1,
          explanation: "Spring's IoC container instantiates, configures, and injects beans into dependent components.",
        },
      ],
    },
    {
      title: "Persistence with Spring Data JPA & Hibernate",
      description: "Entity relationships, repositories, transaction management, and migrations.",
      moduleOrder: 3,
      notes: "Mapping OneToMany and ManyToMany associations with optimal lazy loading strategies.",
      resourceLinks: ["https://spring.io/projects/spring-data-jpa"],
      quiz: [
        {
          question: "What problem does the N+1 SELECT query issue describe in JPA/Hibernate?",
          options: ["A database deadlock", "Fetching 1 parent record and then executing N individual separate queries to fetch related child entities", "Creating N tables for 1 entity", "Having more than N database connections"],
          answer: 1,
          explanation: "Lazy associations without JOIN FETCH can trigger N separate queries, destroying performance.",
        },
      ],
    },
    {
      title: "Spring Security & JWT Authentication",
      description: "Role-based access control, security filter chains, and token validation.",
      moduleOrder: 4,
      notes: "Implementing stateless security filters and fine-grained method authorization.",
      resourceLinks: ["https://docs.spring.io/spring-security/reference/"],
      quiz: [
        {
          question: "What is the primary role of OncePerRequestFilter in a Spring Boot JWT security chain?",
          options: ["It parses, validates the Bearer token, and populates the SecurityContextHolder once per HTTP request", "It caches static assets", "It restarts the Tomcat server", "It encrypts passwords in the database"],
          answer: 0,
          explanation: "OncePerRequestFilter intercepts each incoming request to validate the token and configure the security principal.",
        },
      ],
    },
  ];

  for (const m of modulesCourse3) {
    await Module.create({ ...m, course: course3._id });
  }

  // Course 4 Modules (DevOps Engineering)
  const modulesCourse4 = [
    {
      title: "Containerization with Docker",
      description: "Dockerfiles, multi-stage builds, container networks, and Docker Compose.",
      moduleOrder: 1,
      notes: "Optimizing container layer caching, reducing image sizes, and local dev environments.",
      resourceLinks: ["https://docs.docker.com/get-started/"],
      quiz: [
        {
          question: "What is the main advantage of Docker multi-stage builds?",
          options: ["Running multiple containers in one pod", "Separating build tools from runtime artifacts to produce tiny, secure production container images", "Allowing multi-threaded Dockerfiles", "Downloading images faster via P2P"],
          answer: 1,
          explanation: "Multi-stage builds leave compiler SDKs and build caches behind, copying only the final binary into a minimal scratch/alpine base.",
        },
        {
          question: "In a Dockerfile, what is the difference between COPY and ADD?",
          options: ["COPY only copies local files, whereas ADD can also extract tar archives and fetch remote URLs", "COPY is faster", "ADD is deprecated", "COPY is only for Windows containers"],
          answer: 0,
          explanation: "COPY is preferred for predictability; ADD supports automatic tar extraction and remote URLs.",
        },
        {
          question: "Why should container processes avoid running as root in production?",
          options: ["Root processes consume twice as much CPU", "To minimize security blast radius in case of container breakout vulnerabilities", "Root cannot open port 80", "Docker doesn't support root"],
          answer: 1,
          explanation: "Running as non-root enforces the principle of least privilege if an attacker escapes the container.",
        },
      ],
    },
    {
      title: "Continuous Integration with GitHub Actions",
      description: "Automated test runs, linting, build pipelines, and secret management.",
      moduleOrder: 2,
      notes: "Writing robust YAML workflows with matrix builds and status badges.",
      resourceLinks: ["https://docs.github.com/en/actions"],
      quiz: [
        {
          question: "In a GitHub Actions workflow YAML, what directive triggers jobs across multiple OS or language runtime versions concurrently?",
          options: ["strategy.matrix", "parallel.fork", "run.all", "env.versions"],
          answer: 0,
          explanation: "matrix builds allow running a job configuration across multiple parameters concurrently.",
        },
        {
          question: "Where should sensitive API keys and production deployment tokens be stored in GitHub repositories?",
          options: ["In commit messages", "In the repository's Encrypted Secrets & Variables settings", "Hardcoded in public package.json", "In .gitignore comments"],
          answer: 1,
          explanation: "GitHub Secrets encrypt sensitive credentials and mask them in workflow console logs.",
        },
      ],
    },
    {
      title: "Kubernetes Fundamentals & Cluster Orchestration",
      description: "Pods, ReplicaSets, Deployments, Services, and Ingress routing.",
      moduleOrder: 3,
      notes: "Declarative cluster configuration, rolling updates, and self-healing deployments.",
      resourceLinks: ["https://kubernetes.io/docs/tutorials/kubernetes-basics/"],
      quiz: [
        {
          question: "What is the smallest deployable computing unit in Kubernetes?",
          options: ["A Container", "A Pod", "A Node", "A Deployment"],
          answer: 1,
          explanation: "A Pod wraps one or more containers that share network namespace and storage volumes.",
        },
        {
          question: "Which Kubernetes resource provides a stable virtual IP and DNS name to route traffic across dynamic Pods?",
          options: ["ConfigMap", "Service", "DaemonSet", "PersistentVolume"],
          answer: 1,
          explanation: "A Service uses label selectors to load balance traffic across ephemeral Pod IPs.",
        },
      ],
    },
    {
      title: "Infrastructure as Code & Cloud Observability",
      description: "Terraform resource graphs, declarative provisioning, and Prometheus metrics.",
      moduleOrder: 4,
      notes: "Managing infrastructure declaratively with Terraform state and instrumenting apps with Prometheus metrics.",
      resourceLinks: ["https://www.terraform.io/intro", "https://prometheus.io/docs/introduction/overview/"],
      quiz: [
        {
          question: "What does 'terraform plan' do before applying infrastructure changes?",
          options: ["Immediately deletes all cloud servers", "Analyzes code against current state to preview resources to be created, modified, or destroyed", "Executes unit tests in the cloud", "Generates billing invoices"],
          answer: 1,
          explanation: "Terraform plan creates an execution plan allowing operators to inspect proposed changes safely.",
        },
        {
          question: "In Prometheus metrics monitoring, what is the difference between a Counter and a Gauge?",
          options: ["A Counter only increases (or resets to 0), whereas a Gauge can go up and down", "Gauges measure only integers", "Counters are only for CPU", "They are identical"],
          answer: 0,
          explanation: "Counters track cumulative metrics like request counts, while Gauges track fluctuating values like memory usage.",
        },
      ],
    },
  ];

  for (const m of modulesCourse4) {
    await Module.create({ ...m, course: course4._id });
  }

  // Course 5 Modules (Modern UI/UX Design & Frontend Engineering)
  const modulesCourse5 = [
    {
      title: "UI Design Systems & Typography",
      description: "Color theory, type scales, spacing tokens, and Figma components.",
      moduleOrder: 1,
      notes: "Creating scalable design tokens and auto-layout components in Figma.",
      resourceLinks: ["https://www.figma.com/resource-library/"],
      quiz: [
        {
          question: "What is the primary purpose of establishing a modular typographic scale (e.g. 1.25 Major Third)?",
          options: ["To force all text to be bold", "To ensure harmonious, predictable proportional visual hierarchy across headers, body, and captions", "To limit font file sizes", "To support only Google Fonts"],
          answer: 1,
          explanation: "A type scale defines mathematical ratios between sizes, creating balanced visual hierarchy.",
        },
        {
          question: "What is the minimum WCAG 2.1 AA contrast ratio required for standard body text against its background?",
          options: ["2:1", "3:1", "4.5:1", "7:1"],
          answer: 2,
          explanation: "WCAG 2.1 AA mandates a 4.5:1 contrast ratio for normal text and 3:1 for large text (18pt+).",
        },
      ],
    },
    {
      title: "Tailwind CSS & Responsive Layouts",
      description: "Utility-first workflows, custom configuration, dark mode, and animations.",
      moduleOrder: 2,
      notes: "Building high-performance interfaces without writing repetitive custom CSS.",
      resourceLinks: ["https://tailwindcss.com/docs"],
      quiz: [
        {
          question: "In Tailwind CSS, how does the mobile-first breakpoint convention operate?",
          options: ["Breakpoints like md: apply styles at that screen width and larger", "Breakpoints only apply to mobile devices", "Unprefixed utilities apply only to desktop", "Styles are generated in reverse order"],
          answer: 0,
          explanation: "Tailwind breakpoints use min-width queries, so md:flex applies on medium screens and larger.",
        },
        {
          question: "How do you apply styles conditionally for dark mode in Tailwind CSS?",
          options: ["Using the dark: variant prefix (e.g. dark:bg-slate-900)", "Writing separate dark.css files", "Using CSS variables exclusively", "By toggling browser zoom"],
          answer: 0,
          explanation: "The dark: modifier applies rules whenever dark mode class or media query is active.",
        },
      ],
    },
    {
      title: "Accessibility (WCAG 2.1 AA) & Design Tokens",
      description: "Screen readers, ARIA patterns, focus states, and cross-platform token architectures.",
      moduleOrder: 3,
      notes: "Designing for universal access with semantic markup, keyboard navigation, and tokens.",
      resourceLinks: ["https://www.w3.org/WAI/WCAG21/quickref/"],
      quiz: [
        {
          question: "Why should interactive buttons always include visible :focus-visible outline rings?",
          options: ["It is required for mouse clicks", "It enables keyboard-only and assistive technology users to see which element currently has focus", "It prevents double clicks", "It changes the button font family"],
          answer: 1,
          explanation: "Visible focus indicators are essential for keyboard navigation accessibility under WCAG 2.4.7.",
        },
      ],
    },
    {
      title: "Component Architecture & Storybook Documentation",
      description: "Compound components, UI sandboxing, automated visual regression testing.",
      moduleOrder: 4,
      notes: "Building modular component libraries with Storybook and documented state permutations.",
      resourceLinks: ["https://storybook.js.org/docs"],
      quiz: [
        {
          question: "What is Storybook primarily used for in modern frontend engineering?",
          options: ["Writing backend database migrations", "Developing, testing, and documenting isolated UI components outside the main application business logic", "Tracking server uptime", "Automating Git commits"],
          answer: 1,
          explanation: "Storybook provides an isolated sandbox environment for building and visually testing UI components.",
        },
      ],
    },
  ];

  for (const m of modulesCourse5) {
    await Module.create({ ...m, course: course5._id });
  }

  // Course 6 Modules (Database Systems & Advanced SQL Architecture)
  const modulesCourse6 = [
    {
      title: "Relational Modeling & Normalization",
      description: "Entity Relationship Diagrams (ERD), 1NF, 2NF, 3NF, and Boyce-Codd.",
      moduleOrder: 1,
      notes: "Designing normalized schemas that prevent update and deletion anomalies.",
      resourceLinks: ["https://www.postgresql.org/docs/"],
      quiz: [
        {
          question: "What requirement must a relational table satisfy to achieve Third Normal Form (3NF)?",
          options: ["It must be in 2NF and have no transitive dependencies (non-key attributes depend only on the primary key)", "It must have at least 3 foreign keys", "Every row must be indexed", "All data must be text"],
          answer: 0,
          explanation: "3NF eliminates transitive dependencies: every non-prime attribute must depend directly on the primary key.",
        },
        {
          question: "What happens when a foreign key is created with ON DELETE CASCADE?",
          options: ["Deleting the parent row automatically deletes all corresponding child rows in the referencing table", "Deletions are forbidden", "Parent rows are moved to an archive table", "Child rows have their foreign keys set to NULL"],
          answer: 0,
          explanation: "CASCADE propagates the parent deletion down to referencing rows.",
        },
      ],
    },
    {
      title: "Advanced SQL & Query Optimization",
      description: "Window functions, Common Table Expressions (CTEs), and index tuning.",
      moduleOrder: 2,
      notes: "Reading EXPLAIN ANALYZE execution plans and eliminating sequential scans.",
      resourceLinks: ["https://use-the-index-luke.com/"],
      quiz: [
        {
          question: "What is the key difference between ROW_NUMBER(), RANK(), and DENSE_RANK() window functions?",
          options: ["ROW_NUMBER is sequential with no ties; RANK skips ranks after ties (1, 2, 2, 4); DENSE_RANK does not skip ranks after ties (1, 2, 2, 3)", "DENSE_RANK only works on strings", "RANK cannot use ORDER BY", "They produce identical output"],
          answer: 0,
          explanation: "DENSE_RANK maintains contiguous integer ranking without skipping numbers when ties occur.",
        },
        {
          question: "In PostgreSQL or MySQL, what does EXPLAIN ANALYZE do when inspecting a query?",
          options: ["It executes the query and shows both the estimated plan and actual execution time, row counts, and node costs", "It deletes slow queries", "It creates missing indexes automatically", "It checks SQL syntax without running"],
          answer: 0,
          explanation: "EXPLAIN ANALYZE runs the query and prints actual execution metrics for query profiling.",
        },
      ],
    },
    {
      title: "ACID Transactions & Concurrency Control",
      description: "Isolation levels, dirty reads, write skew, two-phase locking, and MVCC.",
      moduleOrder: 3,
      notes: "Understanding transaction isolation levels and how multi-version concurrency control preserves consistency.",
      resourceLinks: ["https://en.wikipedia.org/wiki/ACID"],
      quiz: [
        {
          question: "What does the 'I' (Isolation) in ACID transaction guarantees ensure?",
          options: ["That concurrent transactions do not interfere with each other and see consistent snapshots based on the isolation level", "That queries run on isolated hardware", "That transactions never fail", "That data is compressed"],
          answer: 0,
          explanation: "Isolation prevents concurrency anomalies like dirty reads, non-repeatable reads, and phantom reads.",
        },
      ],
    },
    {
      title: "Distributed Databases & NoSQL vs SQL Tradeoffs",
      description: "CAP theorem, sharding, replication topologies, and document vs relational models.",
      moduleOrder: 4,
      notes: "Evaluating consistency versus availability tradeoffs in distributed database architectures.",
      resourceLinks: ["https://www.mongodb.com/nosql-explained"],
      quiz: [
        {
          question: "According to the CAP Theorem, what tradeoff must a distributed database make in the presence of a Network Partition (P)?",
          options: ["Choose between Consistency (C) and Availability (A)", "Choose between speed and storage", "Choose between SQL and NoSQL", "It can always guarantee all three simultaneously"],
          answer: 0,
          explanation: "When network communication fails (P), the system must choose between returning errors/stale data (AP) or blocking (CP).",
        },
      ],
    },
  ];

  for (const m of modulesCourse6) {
    await Module.create({ ...m, course: course6._id });
  }

  console.log("Creating assignments across all courses...");
  const in3days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const in5days = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const in7days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const in10days = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  const in14days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const past5days = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

  // Course 1 Assignments
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

  // Course 2 Assignments
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

  const assign4b = await Assignment.create({
    course: course2._id,
    title: "Predictive Classification Pipeline with Scikit-Learn",
    description:
      "Train, cross-validate, and tune an ensemble classifier to predict user conversion rates, preventing test-set data leakage.",
    instructions: "Submit your Python notebook with confusion matrix and ROC-AUC curves.",
    deadline: in14days,
    maximumMarks: 100,
  });

  // Course 3 Assignments
  const assign5 = await Assignment.create({
    course: course3._id,
    title: "Secure Banking REST API with Spring Boot",
    description:
      "Develop a Spring Boot application modeling account transfers with ACID transaction guarantees, Spring Data JPA, and unit tests.",
    instructions: "Submit your GitHub repository link with a comprehensive README.",
    deadline: in14days,
    maximumMarks: 100,
  });

  // Course 4 Assignments
  const assign6 = await Assignment.create({
    course: course4._id,
    title: "Multi-Stage Dockerfile & CI Pipeline",
    description:
      "Containerize a full-stack web application with minimal image size and configure a GitHub Actions workflow.",
    instructions: "Submit a GitHub repository link containing your Dockerfile, compose file, and .github/workflows.",
    deadline: in7days,
    maximumMarks: 100,
  });

  const assign6b = await Assignment.create({
    course: course4._id,
    title: "Kubernetes Cluster Deployment & Helm Charts",
    description:
      "Author declarative Kubernetes deployment manifests, secrets, configmaps, and ingress routing for a multi-tier microservice application.",
    instructions: "Submit your YAML repository or Helm chart packaged archive.",
    deadline: in10days,
    maximumMarks: 100,
  });

  // Course 5 Assignments
  const assign7 = await Assignment.create({
    course: course5._id,
    title: "Production Figma Design System & Component Library",
    description:
      "Construct a comprehensive design system in Figma incorporating auto-layout 5.0, typography styles, semantic color tokens, and interactive component variants.",
    instructions: "Submit your public Figma design file link with view permissions enabled.",
    deadline: in5days,
    maximumMarks: 100,
  });

  const assign8 = await Assignment.create({
    course: course5._id,
    title: "Accessible Web Dashboard with Tailwind CSS",
    description:
      "Implement a pixel-perfect, WCAG 2.1 AA compliant analytics dashboard with full keyboard navigation and light/dark theme support.",
    instructions: "Submit your deployed Vercel/Netlify link and GitHub repository URL.",
    deadline: in14days,
    maximumMarks: 100,
  });

  // Course 6 Assignments
  const assign9 = await Assignment.create({
    course: course6._id,
    title: "Relational Schema Normalization & Query Tuning",
    description:
      "Decompose an un-normalized billing system into 3NF, write migration scripts, and profile queries using EXPLAIN ANALYZE.",
    instructions: "Submit your SQL schema scripts and query optimization report.",
    deadline: in7days,
    maximumMarks: 100,
  });

  console.log("Enrolling students & mapping authentic module progress...");

  const c1Modules = await Module.find({ course: course1._id }).sort({ moduleOrder: 1 });
  const c2Modules = await Module.find({ course: course2._id }).sort({ moduleOrder: 1 });
  const c3Modules = await Module.find({ course: course3._id }).sort({ moduleOrder: 1 });
  const c4Modules = await Module.find({ course: course4._id }).sort({ moduleOrder: 1 });
  const c5Modules = await Module.find({ course: course5._id }).sort({ moduleOrder: 1 });
  const c6Modules = await Module.find({ course: course6._id }).sort({ moduleOrder: 1 });

  // Student 1 (Aditi Sharma)
  await Enrollment.create({
    student: student1._id,
    course: course1._id,
    progress: Math.round((4 / c1Modules.length) * 100),
    completedModules: [c1Modules[0]._id, c1Modules[1]._id, c1Modules[2]._id, c1Modules[3]._id],
    enrollmentDate: daysAgo(20),
  });

  await Enrollment.create({
    student: student1._id,
    course: course2._id,
    progress: Math.round((2 / c2Modules.length) * 100),
    completedModules: [c2Modules[0]._id, c2Modules[1]._id],
    enrollmentDate: daysAgo(10),
  });

  // Student 3 (Yuvraj Malik - logged-in user account)
  // Course 1: 3 of 6 completed (50%)
  await Enrollment.create({
    student: student3._id,
    course: course1._id,
    progress: Math.round((3 / c1Modules.length) * 100),
    completedModules: [c1Modules[0]._id, c1Modules[1]._id, c1Modules[2]._id],
    enrollmentDate: daysAgo(15),
  });

  // Course 4 (DevOps): 3 of 4 completed (75%)
  await Enrollment.create({
    student: student3._id,
    course: course4._id,
    progress: Math.round((3 / c4Modules.length) * 100),
    completedModules: [c4Modules[0]._id, c4Modules[1]._id, c4Modules[2]._id],
    enrollmentDate: daysAgo(30),
  });

  // Course 2 (Data Science): 2 of 4 completed (50%)
  await Enrollment.create({
    student: student3._id,
    course: course2._id,
    progress: Math.round((2 / c2Modules.length) * 100),
    completedModules: [c2Modules[0]._id, c2Modules[1]._id],
    enrollmentDate: daysAgo(12),
  });

  // Course 5 (Design): 1 of 4 completed (25%)
  await Enrollment.create({
    student: student3._id,
    course: course5._id,
    progress: Math.round((1 / c5Modules.length) * 100),
    completedModules: [c5Modules[0]._id],
    enrollmentDate: daysAgo(5),
  });

  // Student 2 (Rohan Verma)
  await Enrollment.create({
    student: student2._id,
    course: course1._id,
    progress: Math.round((2 / c1Modules.length) * 100),
    completedModules: [c1Modules[0]._id, c1Modules[1]._id],
    enrollmentDate: daysAgo(12),
  });

  await Enrollment.create({
    student: student2._id,
    course: course6._id,
    progress: Math.round((2 / c6Modules.length) * 100),
    completedModules: [c6Modules[0]._id, c6Modules[1]._id],
    enrollmentDate: daysAgo(8),
  });

  // Student 4 (Priya Nair) - 100% completed on UI/UX
  await Enrollment.create({
    student: student4._id,
    course: course5._id,
    progress: 100,
    completedModules: c5Modules.map((m) => m._id),
    status: "completed",
    completedAt: daysAgo(3),
    enrollmentDate: daysAgo(25),
  });

  console.log("Creating assignment submissions & grades...");

  // Graded submission for Aditi on Assignment 1
  await Submission.create({
    assignment: assign1._id,
    student: student1._id,
    submissionType: "github",
    submissionLink: "https://github.com/aditi-sharma/modern-saas-landing",
    submissionDate: daysAgo(6),
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
    submissionDate: daysAgo(6),
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
    submissionDate: daysAgo(4),
    marks: 42,
    feedback:
      "Solid responsive behavior and asset optimization. Deducted 8 points for late submission per course policy.",
    status: "graded",
  });

  // Pending submission for Aditi on Assignment 2
  await Submission.create({
    assignment: assign2._id,
    student: student1._id,
    submissionType: "github",
    submissionLink: "https://github.com/aditi-sharma/react-kanban-task-manager",
    submissionDate: daysAgo(1),
    status: "submitted",
  });

  // Pending submission for Yuvraj on Assignment 2
  await Submission.create({
    assignment: assign2._id,
    student: student3._id,
    submissionType: "github",
    submissionLink: "https://github.com/yuvrajmalik/taskpulse-kanban-react",
    submissionDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
    status: "submitted",
  });

  // Pending submission for Yuvraj on Assignment 6 (DevOps)
  await Submission.create({
    assignment: assign6._id,
    student: student3._id,
    submissionType: "github",
    submissionLink: "https://github.com/yuvrajmalik/docker-ci-pipeline",
    submissionDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
    status: "submitted",
  });

  console.log("Creating course discussions & Q&A across courses...");

  // Course 1 Discussion
  await Discussion.create({
    course: course1._id,
    user: student1._id,
    title: "Best practice for structuring custom Mongoose schema methods vs query helpers",
    content: "When building the user model authentication logic, should password comparison methods be placed on schema.methods or schema.statics? Does one offer better type safety with TypeScript/JSDoc?",
    category: "Module Question",
    upvotes: [student2._id, student3._id],
    replies: [
      {
        user: admin._id,
        content: "Instance methods (`schema.methods.comparePassword`) are ideal for actions on a specific retrieved document. Use static methods (`schema.statics.findByCredentials`) for model-level queries where the document doesn't exist yet.",
        isInstructorAnswer: true,
        createdAt: daysAgo(2),
      },
      {
        user: student3._id,
        content: "Thanks for clarifying, this resolved my login controller verification bug.",
        isInstructorAnswer: false,
        createdAt: daysAgo(1),
      },
    ],
  });

  // Course 4 Discussion (DevOps)
  await Discussion.create({
    course: course4._id,
    user: student3._id,
    title: "Multi-stage Docker build layer caching with pnpm vs npm",
    content: "When running Docker builds in GitHub Actions, should we mount the pnpm virtual store with `--mount=type=cache,target=/root/.local/share/pnpm/store` or copy package.json first? What gives the fastest cache hit rate?",
    category: "Module Question",
    upvotes: [student1._id],
    replies: [
      {
        user: admin._id,
        content: "Mounting the BuildKit cache with `target=/root/.local/share/pnpm/store` combined with copying only `pnpm-lock.yaml` first delivers sub-3-second builds because lockfile checksums avoid rebuilding unnecessary layers.",
        isInstructorAnswer: true,
        createdAt: daysAgo(3),
      },
    ],
  });

  // Course 2 Discussion (Data Science)
  await Discussion.create({
    course: course2._id,
    user: student2._id,
    title: "Handling multicollinearity in high-dimensional feature spaces",
    content: "When training linear regression models on correlated financial indicators, what threshold of Variance Inflation Factor (VIF > 5 or VIF > 10) do you typically recommend before applying Ridge regularization?",
    category: "General",
    upvotes: [student3._id],
    replies: [
      {
        user: admin._id,
        content: "VIF > 5 is a common heuristic to investigate, but L2 Ridge regularization handles multicollinearity mathematically by shrinking coefficient variance without manually dropping predictors.",
        isInstructorAnswer: true,
        createdAt: daysAgo(2),
      },
    ],
  });

  // Course 5 Discussion (UI/UX)
  await Discussion.create({
    course: course5._id,
    user: student4._id,
    title: "Contrast ratios for disabled state buttons in WCAG 2.1 AA",
    content: "Does WCAG 2.1 AA strictly require 4.5:1 contrast on disabled submit buttons, or are inactive elements exempt?",
    category: "Module Question",
    upvotes: [student1._id, student3._id],
    replies: [
      {
        user: admin._id,
        content: "Inactive UI components are explicitly exempt under WCAG Success Criterion 1.4.3. However, best UX practice is to keep the button enabled and display clear helper validation messages explaining why submission is blocked.",
        isInstructorAnswer: true,
        createdAt: daysAgo(4),
      },
    ],
  });

  // Course 6 Discussion (Databases)
  await Discussion.create({
    course: course6._id,
    user: student2._id,
    title: "B-Tree vs Hash index performance for range queries",
    content: "Why do relational engines like PostgreSQL default to B-Tree indexes instead of Hash indexes even for simple equality checks?",
    category: "Module Question",
    upvotes: [student3._id],
    replies: [
      {
        user: admin._id,
        content: "B-Trees support equality (`=`), range lookups (`<`, `<=`, `>`, `>=`), prefix matching (`LIKE 'prefix%'`), and ordered scans (`ORDER BY`), making them universally adaptable, whereas Hash indexes strictly support equality.",
        isInstructorAnswer: true,
        createdAt: daysAgo(5),
      },
    ],
  });

  // Completed modules with a quiz need a passing attempt (that's how students complete them in the app)
  const allEnrollments = await Enrollment.find({});
  for (const e of allEnrollments) {
    const mods = await Module.find({ _id: { $in: e.completedModules } });
    for (const m of mods.filter((x) => x.quiz.length)) {
      await QuizAttempt.create({
        student: e.student,
        module: m._id,
        course: e.course,
        answers: m.quiz.map((q) => q.answer),
        score: m.quiz.length,
        total: m.quiz.length,
        passed: true,
      });
    }
  }

  console.log("\n========================================================");
  console.log(" Rich curriculum, quizzes, & assignments seeded!");
  console.log("========================================================");
  console.log("Super admin     : admin@lms.com / admin123");
  console.log("Instructor      : instructor@lms.com / instructor123 (owns 2 courses)");
  console.log("Student Account : student@lms.com / student123 (Aditi Sharma)");
  console.log("Your Account    : malikyuvraj2701@gmail.com / student123 (Yuvraj Malik)");
  console.log("Courses Count   : 6 fully structured courses");
  console.log("Modules Count   : 26 ordered learning modules with quizzes & resources");
  console.log("Assignments     : 11 assignments across all 6 courses");
  console.log("========================================================\n");

  process.exit(0);
};

run().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
