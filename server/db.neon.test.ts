import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { getDb } from "./db";

describe("application Neon database helper", () => {
  it("connects through getDb using the secured Neon runtime URL", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();

    const result = await db!.execute(sql`select 1 as ready`);
    expect(result[0]).toMatchObject({ ready: 1 });
  });
});
