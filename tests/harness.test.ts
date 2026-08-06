import { describe, expect, it } from "vitest";

import pg from "pg";

const { Client } = pg;

describe("test harness", () => {
  it("connects to the test database", async () => {
    const client = new Client({
      connectionString: process.env.TEST_DATABASE_URL,
    });
    await client.connect();
    const result = await client.query<{ ok: number }>("SELECT 1 as ok");
    expect(result.rows[0]).toEqual({ ok: 1 });
    await client.end();
  });
});
