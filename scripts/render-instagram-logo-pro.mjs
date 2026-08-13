import { chromium } from "playwright-core";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const context = browser.contexts()[0];
const page = await context.newPage();
await page.setViewportSize({ width: 1080, height: 1080 });

await page.setContent(`<!doctype html><html><head><style>
  * { box-sizing: border-box; }
  html, body { width: 1080px; height: 1080px; margin: 0; overflow: hidden; }
  body { display: grid; place-items: center; background: radial-gradient(circle at 74% 14%, rgba(54, 141, 255, .22), transparent 33%), radial-gradient(circle at 15% 90%, rgba(22, 204, 160, .08), transparent 30%), #07101f; }
  .ring { position: relative; width: 790px; height: 790px; display: grid; place-items: center; overflow: hidden; border: 20px solid rgba(121, 183, 255, .34); border-radius: 244px; background: radial-gradient(circle at 70% 16%, rgba(65, 153, 255, .29), transparent 42%), linear-gradient(148deg, #173f78, #071426 76%); box-shadow: 0 60px 150px rgba(0, 0, 0, .50), inset 0 0 95px rgba(50, 145, 255, .10); }
  .t, .f { position: absolute; font-family: Arial, Helvetica, sans-serif; font-size: 404px; font-weight: 900; line-height: 1; letter-spacing: -.19em; }
  .t { z-index: 2; transform: translate(-112px, -34px); color: #f8fbff; text-shadow: 0 8px 35px rgba(255,255,255,.10); }
  .f { z-index: 1; transform: translate(112px, 43px); color: #5fa8ff; text-shadow: 0 12px 42px rgba(34, 130, 255, .42); }
  .up { position: absolute; z-index: 3; top: 120px; right: 126px; height: 105px; width: 22px; border-radius: 999px; background: #55e5ad; box-shadow: 0 0 34px rgba(85,229,173,.85); }
  .down { position: absolute; z-index: 3; bottom: 121px; left: 126px; height: 82px; width: 22px; border-radius: 999px; background: #fa7185; }
  .line { position: absolute; z-index: 0; width: 620px; height: 1px; background: linear-gradient(90deg, transparent, rgba(132,190,255,.22), transparent); }
</style></head><body><main class="ring" aria-label="Trade Fusion TF monogram"><span class="line"></span><span class="t">T</span><span class="f">F</span><i class="up"></i><i class="down"></i></main></body></html>`);
await page.screenshot({ path: "/home/ubuntu/Downloads/trade-fusion-instagram-logo-pro.png", type: "png", clip: { x: 0, y: 0, width: 1080, height: 1080 } });
await page.close();
await browser.close();
