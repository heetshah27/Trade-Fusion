import postgres, { type Sql } from "postgres";
import { afterEach, describe, expect, it } from "vitest";

let sql: Sql | null = null;

afterEach(async () => {
  if (sql) {
    await sql.end({ timeout: 5 });
    sql = null;
  }
});

describe("Neon Backtest schema", () => {
  it("has distinct private simulated-session and simulated-trade tables", async () => {
    const connectionString = process.env.NEON_DATABASE_URL;
    expect(connectionString).toMatch(/^postgresql:\/\//);
    sql = postgres(connectionString!, { max: 1, connect_timeout: 10, idle_timeout: 1 });
    const tables = await sql<{ table_name: string }[]>`
      select table_name from information_schema.tables
      where table_schema = 'public' and table_name in ('backtest_sessions', 'backtest_trades')
    `;
    const sessionColumns = await sql<{ column_name: string }[]>`
      select column_name from information_schema.columns
      where table_schema = 'public' and table_name = 'backtest_sessions'
        and column_name in ('userId', 'strategyName', 'initialBalance', 'status')
    `;
    expect(tables.map(row => row.table_name).sort()).toEqual(["backtest_sessions", "backtest_trades"]);
    expect(sessionColumns.map(row => row.column_name).sort()).toEqual(["initialBalance", "status", "strategyName", "userId"]);
  });
});
