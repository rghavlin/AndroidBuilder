import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(async ({ mode }) => {
  const isDev = mode !== "production" && process.env.NODE_ENV !== "production";
  
  return {
    plugins: [
      react(),
      ...(isDev ? [runtimeErrorOverlay()] : []),
      ...(isDev && process.env.REPL_ID !== undefined
        ? [
            await import("@replit/vite-plugin-cartographer").then((m) =>
              m.cartographer(),
            ),
          ]
        : []),
    ],
    // Web production build (itch.io) is served from a subpath, so assets must
    // load via relative URLs. Dev keeps an absolute base so the Vite dev server
    // (hosted by server/index.ts on localhost:5000) resolves correctly.
    base: isDev ? "/" : "./",
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
