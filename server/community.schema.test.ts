import { afterEach, describe, expect, it } from "vitest";
import postgres, { type Sql } from "postgres";

let sql: Sql | null = null;

afterEach(async () => {
  if (sql) {
    await sql.end({ timeout: 5 });
    sql = null;
  }
});

describe("Neon Trader’s Room schema", () => {
  it("has private community posts, comments, and reporting tables", async () => {
    const connectionString = process.env.NEON_DATABASE_URL;
    expect(connectionString).toMatch(/^postgresql:\/\//);

    sql = postgres(connectionString!, { max: 1, connect_timeout: 10, idle_timeout: 1 });
    const rows = await sql<{ table_name: string }[]>`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ('community_posts', 'community_comments', 'community_post_reports')
    `;

    expect(rows.map(row => row.table_name).sort()).toEqual([
      "community_comments",
      "community_post_reports",
      "community_posts",
    ]);
  });
});
