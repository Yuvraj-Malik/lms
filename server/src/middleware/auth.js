import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { isSuper } from "../utils/access.js";

const readToken = (req) => {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  return token;
};

export const protect = async (req, res, next) => {
  try {
    const token = readToken(req);
    if (!token) {
      return res.status(401).json({ message: "Not authenticated. Please log in." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists." });
    }
    if (user.isActive === false) {
      return res.status(403).json({ message: "Your account has been deactivated. Please contact an administrator." });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// Attaches req.user when a valid token is present, but never blocks the request.
export const optionalAuth = async (req, res, next) => {
  try {
    const token = readToken(req);
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive !== false) req.user = user;
    }
  } catch {
    // ignore invalid tokens on public routes
  }
  next();
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission to perform this action." });
  }
  next();
};

export const requireSuperAdmin = (req, res, next) => {
  if (!isSuper(req.user)) {
    return res.status(403).json({ message: "Only the super admin can perform this action." });
  }
  next();
};
