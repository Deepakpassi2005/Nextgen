"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const esbuild_1 = require("esbuild");
const promises_1 = require("fs/promises");
// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
    "@google/generative-ai",
    "axios",
    "connect-pg-simple",
    "cors",
    "date-fns",
    "dotenv",
    "drizzle-orm",
    "drizzle-zod",
    "express",
    "express-rate-limit",
    "express-session",
    "jsonwebtoken",
    "memorystore",
    "multer",
    "nanoid",
    "nodemailer",
    "openai",
    "passport",
    "passport-local",
    "pg",
    "stripe",
    "uuid",
    "ws",
    "xlsx",
    "zod",
    "zod-validation-error",
];
async function buildServer() {
    await (0, promises_1.rm)("dist", { recursive: true, force: true });
    console.log("building server...");
    const pkg = JSON.parse(await (0, promises_1.readFile)("package.json", "utf-8"));
    const allDeps = [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.devDependencies || {}),
    ];
    const externals = allDeps.filter((dep) => !allowlist.includes(dep));
    await (0, esbuild_1.build)({
        entryPoints: ["src/index.ts"],
        platform: "node",
        bundle: true,
        format: "esm",
        outfile: "dist/index.js",
        define: {
            "process.env.NODE_ENV": '"production"',
        },
        minify: true,
        external: externals,
        logLevel: "info",
    });
}
buildServer().catch((err) => {
    console.error(err);
    process.exit(1);
});
