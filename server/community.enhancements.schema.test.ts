import { afterEach, describe, expect, it } from "vitest";
import postgres, { type Sql } from "postgres";

let sql: Sql | null = null;

afterEach(async () => {
  if (sql) {
    await sql.end({ timeout: 5 });
    sql = null;
  }
});

describe("Neon Trader’s Room enhancement schema", () => {
  it("has community enhancements plus member trading-style and custom-avatar columns", async () => {
    const connectionString = process.env.NEON_DATABASE_URL;
    expect(connectionString).toMatch(/^postgresql:\/\//);
    sql = postgres(connectionString!, { max: 1, connect_timeout: 10, idle_timeout: 1 });

    const tables = await sql<{ table_name: string }[]>`
      select table_name from information_schema.tables
      where table_schema = 'public'
        and table_name in ('community_post_attachments', 'community_post_reactions', 'community_comment_reactions', 'community_notifications')
    `;
    const columns = await sql<{ column_name: string }[]>`
      select column_name from information_schema.columns
      where table_schema = 'public' and table_name = 'users'
        and column_name in ('tradingStyle', 'profileAvatarUrl', 'profileAvatarKey')
    `;
    const uniqueIndexes = await sql<{ indexname: string }[]>`
      select indexname from pg_indexes
      where schemaname = 'public'
        and indexname in ('community_post_reactions_user_post_unique', 'community_comment_reactions_user_comment_unique')
    `;

    expect(tables.map(row => row.table_name).sort()).toEqual([
      "community_comment_reactions",
      "community_notifications",
      "community_post_attachments",
      "community_post_reactions",
    ]);
    expect(columns.map(row => row.column_name).sort()).toEqual(["profileAvatarKey", "profileAvatarUrl", "tradingStyle"]);
    expect(uniqueIndexes.map(row => row.indexname).sort()).toEqual([
      "community_comment_reactions_user_comment_unique",
      "community_post_reactions_user_post_unique",
    ]);
  });
});
