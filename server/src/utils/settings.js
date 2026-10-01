import Setting from "../models/Setting.js";

let cache = null;
let cachedAt = 0;

// Platform settings with a short in-memory cache (they're read on every sign-up, quiz, submission…)
export const getSettings = async () => {
  if (cache && Date.now() - cachedAt < 10000) return cache;
  let doc = await Setting.findOne({ key: "platform" });
  if (!doc) doc = await Setting.create({ key: "platform" });
  cache = doc;
  cachedAt = Date.now();
  return doc;
};

export const clearSettingsCache = () => {
  cache = null;
};

// The instructor code can be set from the UI; ADMIN_SIGNUP_CODE in .env is the fallback
export const instructorCode = (settings) => settings.instructorSignupCode || process.env.ADMIN_SIGNUP_CODE || "";

export const publicSettings = (s) => ({
  platformName: s.platformName,
  registrationOpen: s.registrationOpen,
  googleSignInEnabled: s.googleSignInEnabled,
  instructorSignupEnabled: s.instructorSignupEnabled && !!instructorCode(s),
  instructorsCanPublish: s.instructorsCanPublish,
  allowLateSubmissions: s.allowLateSubmissions,
  banner: s.banner?.active && s.banner.message ? { message: s.banner.message, tone: s.banner.tone } : null,
});
