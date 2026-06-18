import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    coverage: {
      include: ["src/lib/**", "src/workers/**"],
      reporter: ["text", "lcov"],
    },
    setupFiles: ["./src/__tests__/setup.ts"],
  },
});
