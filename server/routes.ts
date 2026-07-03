import type { Express } from "express";
import { createServer, type Server } from "http";

// This app has no HTTP API. The Express server exists only to host the Vite dev
// server (see server/vite.ts) so Electron dev can load http://localhost:5000 with
// HMR. All game persistence is client-side (IndexedDB/localStorage on web,
// Electron IPC to the filesystem on desktop) — there are no routes to register.
export async function registerRoutes(app: Express): Promise<Server> {
  return createServer(app);
}
