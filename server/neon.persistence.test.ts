import { afterEach, describe, expect, it } from "vitest";
import postgres, { type Sql } from "postgres";

let sql: Sql | null = null;

afterEach(async () => {
  if (sql) {
    await sql.end({ timeout: 5 });
    sql = null;
  }
});

describe("Neon trade persistence", () => {
  it("contains at least one persisted trade after a user logs a trade", async () => {
    const connectionString = process.env.NEON_DATABASE_URL;
    expect(connectionString).toMatch(/^postgresql:\/\//);

    sql = postgres(connectionString!, { max: 1, connect_timeout: 10, idle_timeout: 1 });
    const result = await sql<{ trade_count: string }[]>`select count(*)::text as trade_count from trades`;

    expect(Number(result[0]?.trade_count ?? 0)).toBeGreaterThan(0);
  });
});
