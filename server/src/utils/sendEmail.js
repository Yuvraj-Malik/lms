import nodemailer from "nodemailer";

/**
 * Creates a nodemailer transport instance based on available configuration.
 */
const createTransporter = () => {
  // 1. Check for dedicated EMAIL_SERVICE (e.g., gmail) or EMAIL_USER + EMAIL_PASS
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS.replace(/\s+/g, ""), // strip any spaces in Gmail App Password
      },
    });
  }

  // 2. Check for standard SMTP configuration
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return null;
};

/**
 * Sends an email using Nodemailer or falls back to console logging in development.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log("\n===== EMAIL (Mail service not configured — printed instead) =====");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text || html?.replace(/<[^>]+>/g, " "));
    console.log("===================================================================\n");
    return { simulated: true };
  }

  const from =
    process.env.EMAIL_FROM ||
    (process.env.EMAIL_USER ? `TaskPulse <${process.env.EMAIL_USER}>` : null) ||
    process.env.SMTP_FROM ||
    "TaskPulse <support@taskpulse.com>";

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text: text || html?.replace(/<[^>]+>/g, " "),
  });

  console.log(`[Email] Password reset sent to ${to} (Message ID: ${info.messageId})`);
  return { simulated: false, messageId: info.messageId };
};

export default sendEmail;

