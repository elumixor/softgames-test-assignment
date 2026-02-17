import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    target: "es2022",
  },
  resolve: {
    alias: {
      "@services": path.resolve(__dirname, "src/services"),
      "@utils": path.resolve(__dirname, "src/utils"),
      "@scenes": path.resolve(__dirname, "src/scenes"),
      "@components": path.resolve(__dirname, "src/components"),
    },
  },
});
