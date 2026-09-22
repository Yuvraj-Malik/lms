import multer from "multer";
import path from "path";
import fs from "fs";

const makeStorage = (subfolder) => {
  const dest = path.join(process.cwd(), "uploads", subfolder);
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${unique}${ext}`);
    },
  });
};

const fileFilter = (allowedExts) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) return cb(null, true);
  cb(new Error(`Unsupported file type. Allowed: ${allowedExts.join(", ")}`));
};

export const uploadSubmission = multer({
  storage: makeStorage("submissions"),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: fileFilter([".pdf", ".zip", ".doc", ".docx", ".ppt", ".pptx", ".png", ".jpg", ".jpeg"]),
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
