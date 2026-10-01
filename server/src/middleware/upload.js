import multer from "multer";
import path from "path";
import fs from "fs";

export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

const makeStorage = (subfolder) => {
  const dest = path.join(UPLOAD_ROOT, subfolder);
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${unique}${ext}`);
    },
  });
};

const fileFilter = (allowedExts) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) return cb(null, true);
  const err = new Error(`Unsupported file type. Allowed: ${allowedExts.join(", ")}`);
  err.statusCode = 400;
  cb(err);
};

export const uploadSubmission = multer({
  storage: makeStorage("submissions"),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: fileFilter([".pdf", ".zip", ".doc", ".docx", ".ppt", ".pptx", ".png", ".jpg", ".jpeg", ".txt"]),
});

export const uploadCourseImage = multer({
  storage: makeStorage("course-images"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter([".png", ".jpg", ".jpeg", ".webp"]),
});

export const uploadAvatar = multer({
  storage: makeStorage("avatars"),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: fileFilter([".png", ".jpg", ".jpeg", ".webp"]),
});

// Resolves a stored "/uploads/..." path to disk, refusing anything outside the uploads folder
export const resolveUpload = (storedPath) => {
  if (!storedPath || !storedPath.startsWith("/uploads/")) return null;
  const abs = path.normalize(path.join(UPLOAD_ROOT, storedPath.slice("/uploads/".length)));
  return abs.startsWith(UPLOAD_ROOT) ? abs : null;
};

export const removeUpload = (storedPath) => {
  const abs = resolveUpload(storedPath);
  if (abs && fs.existsSync(abs)) fs.unlink(abs, () => {});
};
