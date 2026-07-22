import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(async ({ mode }) => {
  const isDev = mode !== "production" && process.env.NODE_ENV !== "production";
  // T6/R4#8: strip all console.* + debugger from production builds (633 raw
  // console calls across the engine, several on hot per-frame paths). Dev
  // keeps the console. Logger.debug/info stay dev-gated on top of this.
  const esbuild: UserConfig["esbuild"] = isDev ? {} : { drop: ["console", "debugger"] };
  
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
    esbuild,
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
