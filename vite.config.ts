import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";
import { apiMiddlewarePlugin } from "./src/server/vite-plugin-api";

export default defineConfig({
  plugins: [
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
    }),
    viteReact(),
    nitro({
      preset: process.env.VERCEL ? "vercel" : (process.env.NITRO_PRESET || "node-server"),
    }),
    apiMiddlewarePlugin(),
  ],
  server: {
    port: 6060,
  },
  preview: {
    port: 6060,
  },
});
