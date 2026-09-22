const About = () => (
  <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
    <h1 className="font-display text-3xl font-semibold text-ink dark:text-dark-ink">About Ridgeline</h1>
    <p className="mt-5 text-base leading-relaxed text-ink-soft dark:text-dark-ink-soft">
      Ridgeline is a learning management system built to keep the essentials — courses, modules,
      assignments and progress — in one uncluttered place. Students enroll in courses, move through
      modules in order, and submit assignments before their deadlines. Admins create and manage
      courses, review submissions, and track how students are progressing across the platform.
    </p>
    <p className="mt-4 text-base leading-relaxed text-ink-soft dark:text-dark-ink-soft">
      This project was built as an individual full-stack major project for Quillance Infotech,
      using the MERN stack (MongoDB, Express, React and Node.js) with JWT authentication and
      role-based access control for students and administrators.
    </p>
  </div>
);

export default About;
