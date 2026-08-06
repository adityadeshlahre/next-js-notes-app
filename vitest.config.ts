import path from "path";
import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

dotenv.config({ path: "apps/web/.env" });

const devUrl =
  process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/next-js-notes-app";
const testUrl = new URL(devUrl);
testUrl.pathname = "/notes_app_test";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "apps/web/src"),
    },
  },
  test: {
    environment: "node",
    globalSetup: ["./tests/global-setup.ts"],
    env: {
      DATABASE_URL: testUrl.toString(),
      TEST_DATABASE_URL: testUrl.toString(),
    },
  },
});
