import { afterEach, describe, expect, it } from "vitest";
import postgres, { type Sql } from "postgres";

let sql: Sql | null = null;

afterEach(async () => {
  if (sql) {
    await sql.end({ timeout: 5 });
    sql = null;
  }
});

describe("Neon private journal and public inquiry schema", () => {
  it("has the private member tables and owner-only public contact inquiry table", async () => {
    const connectionString = process.env.NEON_DATABASE_URL;
    expect(connectionString).toMatch(/^postgresql:\/\//);

    sql = postgres(connectionString!, { max: 1, connect_timeout: 10, idle_timeout: 1 });
    const rows = await sql<{ table_name: string }[]>`
      select table_name
      from information_schema.tables
      where table_schema = 'public' and table_name in ('users', 'trades', 'trade_journal_entries', 'trade_journal_attachments', 'contact_inquiries')
    `;

    expect(rows.map((row) => row.table_name).sort()).toEqual(["contact_inquiries", "trade_journal_attachments", "trade_journal_entries", "trades", "users"]);
  });
});
