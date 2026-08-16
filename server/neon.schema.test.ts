import { afterEach, describe, expect, it } from "vitest";
import postgres, { type Sql } from "postgres";

let sql: Sql | null = null;

afterEach(async () => {
  if (sql) {
    await sql.end({ timeout: 5 });
    sql = null;
  }
});

describe("Neon private journal schema", () => {
  it("has the users, trades, and private trade-Journal tables required for member-owned records", async () => {
    const connectionString = process.env.NEON_DATABASE_URL;
    expect(connectionString).toMatch(/^postgresql:\/\//);

    sql = postgres(connectionString!, { max: 1, connect_timeout: 10, idle_timeout: 1 });
    const rows = await sql<{ table_name: string }[]>`
      select table_name
      from information_schema.tables
      where table_schema = 'public' and table_name in ('users', 'trades', 'trade_journal_entries')
    `;

    expect(rows.map((row) => row.table_name).sort()).toEqual(["trade_journal_entries", "trades", "users"]);
  });
});
