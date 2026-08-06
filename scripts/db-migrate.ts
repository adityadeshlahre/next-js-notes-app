import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const db = drizzle(new pg.Pool({ connectionString: url }));

await migrate(db, {
  migrationsFolder: process.env.MIGRATIONS_FOLDER ?? "./migrations",
});

console.log("Migrations applied");
process.exit(0);
