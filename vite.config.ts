import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8000,
    allowedHosts: true,
  },
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom", "zustand"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@mklyml/editor": path.resolve(__dirname, "../milkly-mklyml/mkly-editor/src"),
      "@mklyml/core": path.resolve(__dirname, "../milkly-mklyml/mkly/src"),
      "@mklyml/kits/newsletter": path.resolve(__dirname, "../milkly-mklyml/mkly-kits/newsletter/src/index.ts"),
      "@mklyml/plugins/email": path.resolve(__dirname, "../milkly-mklyml/mkly-plugins/email/src/index.ts"),
      "@mkly": path.resolve(__dirname, "../milkly-mklyml/mkly/src"),
      "@mkly-kits": path.resolve(__dirname, "../milkly-mklyml/mkly-kits"),
    },
  },
});
