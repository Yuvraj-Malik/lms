import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// Single .env at the repository root is shared by the server and the Vite client
dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env"),
  quiet: true,
});

const { default: connectDB } = await import("./config/db.js");
const { default: app } = await import("./app.js");

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set. Add it to .env before starting the server.");
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

await connectDB();
app.listen(PORT, "0.0.0.0", () => {
  console.log(`LMS server running on http://127.0.0.1:${PORT}`);
});
