import { describe, expect, it } from "vitest";
import { appRoutes } from "./appRoutes";

describe("public and private application routes", () => {
  it("keeps the landing page public and workspace pages distinct", () => {
    expect(appRoutes.landing).toBe("/");
    expect(appRoutes.journal).toBe("/app");
    expect(appRoutes.calendar).toBe("/app/news");
  });
});
