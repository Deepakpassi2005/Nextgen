import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(
    __dirname,
    "..",
    "..",
    "frontend",
    "dist"
  );

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}. Build the frontend first.`
    );
  }

  app.use(express.static(distPath));

  // fallback to index.html for SPA routing
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
