import pg from "pg";

const { Client } = pg;

const DEV_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/next-js-notes-app";
const TEST_DB = "notes_app_test";

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

  const testUrl = new URL(DEV_URL);
  testUrl.pathname = `/${TEST_DB}`;
  process.env.TEST_DATABASE_URL = testUrl.toString();
}
