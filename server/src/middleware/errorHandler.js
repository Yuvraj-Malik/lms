export const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(", ") });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: "Duplicate entry — this record already exists." });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID format." });
  }
  if (err.name === "MulterError") {
    return res.status(400).json({ message: err.message });
  }

  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || "Server error." });
};
