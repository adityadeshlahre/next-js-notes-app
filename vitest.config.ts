import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

import { testDatabaseUrl } from "./tests/test-env.ts";

dotenv.config({ path: "apps/web/.env" });

const devUrl =
  process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/next-js-notes-app";
const testUrl = testDatabaseUrl(devUrl);

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./apps/web/src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    globalSetup: ["./tests/global-setup.ts"],
    env: {
      DATABASE_URL: testUrl,
      TEST_DATABASE_URL: testUrl,
    },
  },
});
