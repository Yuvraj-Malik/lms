import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  // One .env at the repository root is shared by the server and the client
  envDir: "../",
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
    proxy: {
      "/api": { target: "http://127.0.0.1:5000", changeOrigin: true },
      "/uploads": { target: "http://127.0.0.1:5000", changeOrigin: true },
    },
  },
});
