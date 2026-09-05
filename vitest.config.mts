import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": root,
    },
  },
  test: {
    // Default env is node; DOM tests opt in per-file via
    // `// @vitest-environment jsdom` pragma comments.
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
