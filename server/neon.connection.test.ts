import { afterEach, describe, expect, it } from "vitest";
import postgres, { type Sql } from "postgres";

let sql: Sql | null = null;

afterEach(async () => {
  if (sql) {
    await sql.end({ timeout: 5 });
    sql = null;
  }
});

describe("Neon database connection", () => {
  it("connects with the secured NEON_DATABASE_URL", async () => {
    const connectionString = process.env.NEON_DATABASE_URL;
    expect(connectionString).toMatch(/^postgresql:\/\//);

    sql = postgres(connectionString!, {
      max: 1,
      connect_timeout: 10,
      idle_timeout: 1,
    });

    const result = await sql<{ ready: number }[]>`select 1 as ready`;
    expect(result[0]?.ready).toBe(1);
  });
});
