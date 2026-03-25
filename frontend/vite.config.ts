import { defineConfig, loadEnv, type ConfigEnv, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { metaImagesPlugin } from "../vite-plugin-meta-images";

export default async (env: ConfigEnv): Promise<UserConfig> => {
  // Load environment variables from .env and friends so VITE_API_URL works as expected
  const mode = env.mode;
  const envVars = loadEnv(mode, process.cwd(), "");
  const apiUrl = envVars.VITE_API_URL || "http://localhost:5000";

  return {
    plugins: [
      react(),
      runtimeErrorOverlay(),
      tailwindcss(),
      metaImagesPlugin(),
      ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
        ? [
            await import("@replit/vite-plugin-cartographer").then((m) =>
              m.cartographer(),
            ),
            await import("@replit/vite-plugin-dev-banner").then((m) =>
              m.devBanner(),
            ),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@shared": path.resolve(__dirname, "src/shared"),
        "@assets": path.resolve(__dirname, "../attached_assets"),
      },
    },
    css: {
      postcss: {
        plugins: [],
      },
    },
    root: path.resolve(__dirname),
    build: {
      outDir: path.resolve(__dirname, "dist"),
      emptyOutDir: true,
    },
    server: {
      host: "0.0.0.0",
      allowedHosts: true,
      // proxy only needed during development
      ...(process.env.NODE_ENV !== "production" && {
        proxy: {
          "/api": {
            target: apiUrl,
            changeOrigin: true,
          },
          "/uploads": {
            target: apiUrl,
            changeOrigin: true,
          },
        },
      }),
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
};
