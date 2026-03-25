import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";

import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
// Ensure all mongoose models are registered before use
import User from "./models/User"; // eslint-disable-line no-unused-vars
import { Assignment } from "./models/Assignment"; // eslint-disable-line no-unused-vars
import { AssignmentSubmission } from "./models/AssignmentSubmission"; // eslint-disable-line no-unused-vars
import { ApiError } from "./utils/ApiError";

// =========================
// Connect Database (ONLY ONCE)
// =========================
connectDB();

// =========================
// App & Server Setup
// =========================
const app = express();
const httpServer = createServer(app);

// =========================
// Middleware
// =========================

// CORS
// @ts-ignore
import cors from "cors";

// log environment for debugging
console.log("FRONTEND_URL env var =", process.env.FRONTEND_URL);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "http://localhost:5001",
  "http://localhost:5002",
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL,
].filter(Boolean);
console.log("Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // debug log each origin request
      console.log("CORS origin check, incoming origin =", origin);
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Normalize origin (remove trailing slash)
      const normalized = origin.replace(/\/+$/, "");
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }
      
      // allow any subdomain of vercel.app just in case
      if (/\.vercel\.app$/i.test(normalized)) {
        console.log("Allowing vercel.app origin via regex check", normalized);
        return callback(null, true);
      }

      // Log blocked origins in development
      if (process.env.NODE_ENV !== "production") {
        console.warn(`CORS blocked origin: ${normalized}`);
        return callback(null, true); // Allow in dev
      }
      
      console.error(`Rejecting origin: ${normalized}`);
      callback(new Error("Not allowed by CORS policy"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// =========================
// Security & Performance
// =========================
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP if it interferes with Vite's HMR or external assets
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images to be loaded cross-origin
}));
app.use(compression());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 2000 : 100, // Higher limit in development
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." }
});

// Apply rate limiter to all API routes
app.use("/api", limiter);


// JSON parser
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false }));

// Serve uploads directory statically
const uploadsPath = path.resolve(process.cwd(), "..", "uploads");
console.log(`[Static] Serving uploads from: ${uploadsPath}`);
if (!fs.existsSync(uploadsPath)) {
  console.warn(`[Static] WARNING: Uploads directory does not exist at ${uploadsPath}`);
}
app.use("/uploads", express.static(uploadsPath));

// Debug route to verify pathing
app.get("/debug-path", (_req, res) => {
  const dirExists = fs.existsSync(uploadsPath);
  const noticesDir = path.join(uploadsPath, "notices");
  const noticesExists = fs.existsSync(noticesDir);
  const files = noticesExists ? fs.readdirSync(noticesDir) : [];
  
  res.json({
    cwd: process.cwd(),
    dirname: __dirname,
    uploadsPath,
    dirExists,
    noticesExists,
    noticesFiles: files,
    env: process.env.NODE_ENV
  });
});

// =========================
// Logger
// =========================
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;

    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// =========================
// Routes + Error Handling
// =========================
(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // Handle Mongoose/MongoDB specific errors
    if (err.name === 'ValidationError') {
      statusCode = 400;
    } else if (err.name === 'CastError') {
      statusCode = 400;
      message = `Invalid ${err.path}: ${err.value}`;
    } else if (err.code === 11000) {
      statusCode = 400;
      message = 'Duplicate field value entered';
    }

    console.error(`[Error] ${statusCode} - ${message}`, err.stack);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(statusCode).json({
      success: false,
      message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  // =========================
  // Production Static Serving
  // =========================
  if (
    process.env.NODE_ENV === "production" &&
    process.env.SERVE_FRONTEND === "true"
  ) {
    serveStatic(app);
  }

  // =========================
  // Start Server (fixed for Render)
  // =========================
  const DEFAULT_PORT = 5000;
  const requestedPort = Number(process.env.PORT) || DEFAULT_PORT;

  // Find a free port starting at requestedPort and bind once
  const maxAttempts = 10;

  const findFreePort = (startPort: number, attemptsLeft: number): Promise<number> => {
    return new Promise((resolve, reject) => {
      if (attemptsLeft <= 0) return reject(new Error('No free ports'));
      const net = require('net');
      const tester = net.createServer()
        .once('error', (err: any) => {
          tester.close();
          if (err.code === 'EADDRINUSE') {
            resolve(findFreePort(startPort + 1, attemptsLeft - 1));
          } else {
            reject(err);
          }
        })
        .once('listening', () => {
          tester.close();
          resolve(startPort);
        })
        .listen(startPort, '0.0.0.0');
    });
  };

  try {
    const freePort = await findFreePort(requestedPort, maxAttempts);
    httpServer.listen(freePort, '0.0.0.0', () => log(`🚀 Server running on port ${freePort}`));
  } catch (err: any) {
    console.error('Failed to find free port:', err);
    process.exit(1);
  }
})();
