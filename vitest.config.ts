import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

dotenv.config({ path: "apps/web/.env" });

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["./tests/global-setup.ts"],
  },
});
