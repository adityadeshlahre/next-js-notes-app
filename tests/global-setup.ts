import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

import { TEST_DB, testDatabaseUrl } from "./test-env.ts";

const { Client, Pool } = pg;

const DEV_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/next-js-notes-app";

export default async function globalSetup() {
  const server = new URL(DEV_URL);
  server.pathname = "/postgres";
  const admin = new Client({ connectionString: server.toString() });
  await admin.connect();
  const exists = await admin.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [TEST_DB]);
  if (exists.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${TEST_DB}"`);
  }
  await admin.end();

  const testUrl = testDatabaseUrl(DEV_URL);
  process.env.TEST_DATABASE_URL = testUrl;

  await migrate(drizzle(new Pool({ connectionString: testUrl })), {
    migrationsFolder: "packages/db/src/migrations",
  });
}
