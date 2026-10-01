export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(" ") });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: "This record already exists." });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID." });
  }
  if (err.name === "MulterError") {
    const message = err.code === "LIMIT_FILE_SIZE" ? "That file is too large." : err.message;
    return res.status(400).json({ message });
  }

  const status = err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    message: status >= 500 && process.env.NODE_ENV === "production" ? "Something went wrong on our side." : err.message,
  });
};
