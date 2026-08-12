import { readFile } from "node:fs/promises";
import postgres from "postgres";

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) {
  throw new Error("NEON_DATABASE_URL is required to apply the community migration.");
}

const migrationPath = process.argv[2] || "drizzle/0001_complete_jazinda.sql";
const migration = await readFile(migrationPath, "utf8");
const statements = migration
  .split("--> statement-breakpoint")
  .map(statement => statement.trim())
  .filter(Boolean);

const sql = postgres(connectionString, { max: 1, prepare: false });

try {
  for (const statement of statements) {
    await sql.unsafe(statement);
  }
  console.log(`Applied ${statements.length} migration statements from ${migrationPath} to Neon.`);
} finally {
  await sql.end({ timeout: 5 });
}
