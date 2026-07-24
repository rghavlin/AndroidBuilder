import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Content-Security-Policy for the PACKAGED desktop build. This config is only
// used by `vite build` (electron-dev uses the dev server), so it never touches
// dev/HMR. The policy allows only local content ('self' + the file: scheme the
// packaged app loads from) — no http:/https:, so no external web dependency can
// ever load at runtime, even if a future library tries. If the DevTools console
// reports a CSP violation for a legitimate local asset, relax that one directive.
const CSP = [
  "default-src 'self' file:",
  "script-src 'self' file:",                 // Vite prod emits external module scripts (no inline/eval)
  "style-src 'self' file: 'unsafe-inline'",  // React style={} attrs + shadcn chart <style>
  "img-src 'self' file: data: blob:",        // sprites, data URIs, canvas blobs
  "font-src 'self' file:",                    // locally bundled fonts
  "media-src 'self' file:",                   // .ogg audio (HTMLAudio + Web Audio)
  "connect-src 'self' file:",                 // fetch() of audio buffers — same-origin only
  "worker-src 'self' file: blob:",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
  "form-action 'none'",
].join("; ");

function cspPlugin(): Plugin {
  return {
    name: "inject-csp",
    transformIndexHtml() {
      return [{
        tag: "meta",
        attrs: { "http-equiv": "Content-Security-Policy", content: CSP },
        injectTo: "head-prepend",
      }];
    },
  };
}

export default defineConfig({
  plugins: [react(), cspPlugin()],
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