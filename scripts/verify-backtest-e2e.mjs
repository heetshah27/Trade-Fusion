import { chromium } from "playwright-core";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const context = browser.contexts()[0];
const page = context.pages().find(candidate => candidate.url().includes("127.0.0.1:3000")) ?? await context.newPage();
const result = { sessionLoaded: false, zoneSaved: false, tradeSaved: false, snapshotDownloaded: false, saveButtonDisabled: null, tradeRequestStatus: null, cleanup: { zoneDeleted: false, tradeDeleted: false } };

try {
  await page.goto("http://127.0.0.1:3000/app/backtest", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /testing/i }).first().waitFor({ timeout: 15_000 });
  result.sessionLoaded = true;
  await page.getByRole("button", { name: /testing/i }).first().click();

  await page.getByLabel("Replay symbol").selectOption("BTCUSD");
  const chart = page.getByTestId("historical-replay-chart");
  await chart.waitFor({ timeout: 20_000 });

  await page.getByRole("button", { name: "Tools" }).click();
  await page.getByRole("menuitem", { name: /zone rectangle/i }).click();
  const chartBox = await chart.boundingBox();
  if (!chartBox) throw new Error("Historical replay chart did not expose a drawable area.");
  await page.mouse.move(chartBox.x + chartBox.width * 0.25, chartBox.y + chartBox.height * 0.3);
  await page.mouse.down();
  await page.mouse.move(chartBox.x + chartBox.width * 0.58, chartBox.y + chartBox.height * 0.58, { steps: 10 });
  await page.mouse.up();
  await page.getByTestId("supply-demand-zone").waitFor({ timeout: 10_000 });
  result.zoneSaved = true;

  const downloadPromise = page.waitForEvent("download", { timeout: 10_000 });
  await page.getByLabel("Download private chart snapshot").click();
  const download = await downloadPromise;
  await download.delete();
  result.snapshotDownloaded = true;

  await page.getByRole("button", { name: /^buy/i }).click();
  const saveTrade = page.getByRole("button", { name: /save simulated trade/i });
  await saveTrade.waitFor({ state: "visible", timeout: 5_000 });
  result.saveButtonDisabled = await saveTrade.isDisabled();
  const tradeResponsePromise = page.waitForResponse(response => response.url().includes("backtest.createTrade"), { timeout: 10_000 }).catch(() => null);
  await saveTrade.click();
  const tradeResponse = await tradeResponsePromise;
  result.tradeRequestStatus = tradeResponse?.status() ?? null;
  await page.waitForTimeout(750);
  result.tradeSaved = result.tradeRequestStatus === 200;
} finally {
  const deleteZone = page.getByRole("button", { name: /delete zone annotation/i }).first();
  if (await deleteZone.count()) {
    await deleteZone.click();
    result.cleanup.zoneDeleted = true;
  }
  const deleteTrade = page.getByRole("button", { name: /delete simulated trade/i }).first();
  if (await deleteTrade.count()) {
    await deleteTrade.click();
    result.cleanup.tradeDeleted = true;
  }
  console.log(JSON.stringify(result));
  await browser.close();
}
