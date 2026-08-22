import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const landing = readFileSync(new URL("../pages/Landing.tsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");
const layout = readFileSync(new URL("../components/DashboardLayout.tsx", import.meta.url), "utf8");
const account = readFileSync(new URL("../pages/Account.tsx", import.meta.url), "utf8");
const backtest = readFileSync(new URL("../pages/Backtest.tsx", import.meta.url), "utf8");

describe("Trade Fusion palette tokens", () => {
  it("uses a near-black foundation with blue primary actions", () => {
    expect(css).toContain("--background: oklch(0.075 0.006 258)");
    expect(css).toContain("--primary: oklch(0.64 0.20 255)");
    expect(css).toContain(".tf-cta-primary {");
    expect(css).toContain("oklch(0.68 0.20 255)");
    expect(css).toContain("body { background-color: #050609;");
    expect(css).toContain(".tf-hero-grid { opacity: 0.035; }");
  });

  it("keeps profit, loss, and caution colors separate from the primary action system", () => {
    expect(css).toContain("--profit: oklch(0.72 0.18 145)");
    expect(css).toContain("--loss: oklch(0.65 0.22 25)");
    expect(css).toContain(".tf-backtest-page [data-slot=\"button\"][class*=\"bg-emerald-\"]");
    expect(css).not.toContain("\n  button[class*=\"bg-emerald-\"]");
  });

  it("uses explicit blue primary actions across the reviewed route surfaces", () => {
    expect(landing).toContain('data-mobile-palette="near-black"');
    expect(landing).toContain("!bg-[oklch(0.66_0.18_250)]");
    expect(dashboard).toContain("bg-blue-500");
    expect(layout).toContain("from-blue-400 to-blue-600");
    expect(account).toContain("tf-action-glow bg-blue-500 text-white hover:bg-blue-400");
    expect(backtest).toContain("tf-backtest-page");
  });
});
