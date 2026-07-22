import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: "./client",
  // T6/R4#8: strip all console.* + debugger from the packaged desktop build
  // (this config is only used by `vite build`; electron-dev uses the dev server).
  esbuild: { drop: ["console", "debugger"] },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "client/index.html")
    },
    copyPublicDir: true
  },
  publicDir: path.resolve(__dirname, "client/public"),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
    },
  },
  base: "./",
});