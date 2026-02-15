import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    target: "es2022",
  },
  resolve: {
    alias: {
      "@utils": path.resolve(__dirname, "src/utils/index.ts"),
    },
  },
});
