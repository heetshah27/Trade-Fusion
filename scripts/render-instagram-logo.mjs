import { chromium } from "playwright-core";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const context = browser.contexts()[0];
const page = await context.newPage();
await page.setViewportSize({ width: 1080, height: 1080 });

await page.setContent(`<!doctype html><html><head><style>
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 1080px; height: 1080px; overflow: hidden; background: #07101f; }
  body { display: grid; place-items: center; background: radial-gradient(circle at 74% 13%, rgba(65, 148, 255, .20), transparent 34%), radial-gradient(circle at 15% 92%, rgba(15, 206, 152, .08), transparent 30%), linear-gradient(145deg, #07101f, #0a162b 78%); }
  .mark { position: relative; width: 740px; height: 740px; display: grid; place-items: center; overflow: hidden; border: 18px solid rgba(155, 205, 255, .24); border-radius: 214px; background: radial-gradient(circle at 70% 18%, rgba(93, 169, 255, .30), transparent 44%), linear-gradient(145deg, #173563, #0a162b 78%); box-shadow: 0 56px 120px rgba(0, 0, 0, .44), inset 0 0 70px rgba(76, 159, 255, .12); }
  .t, .f { position: absolute; font-family: Arial, Helvetica, sans-serif; font-size: 350px; line-height: 1; font-weight: 900; letter-spacing: -0.16em; }
  .t { transform: translate(-108px, -28px); color: #f4f7ff; text-shadow: 0 6px 28px rgba(255, 255, 255, .12); }
  .f { transform: translate(102px, 45px); color: #59a8ff; text-shadow: 0 10px 32px rgba(44, 138, 255, .35); }
  .up { position: absolute; top: 128px; right: 128px; width: 24px; height: 116px; border-radius: 999px; background: #59e7b1; box-shadow: 0 0 42px rgba(89, 231, 177, .92); }
  .down { position: absolute; bottom: 128px; left: 128px; width: 24px; height: 94px; border-radius: 999px; background: #fb7185; }
  .label { position: absolute; bottom: 86px; color: rgba(210, 227, 255, .62); font-family: Arial, Helvetica, sans-serif; font-size: 28px; font-weight: 800; letter-spacing: .33em; text-indent: .33em; }
</style></head><body><div class="mark" role="img" aria-label="Trade Fusion TF monogram"><span class="t">T</span><span class="f">F</span><span class="up"></span><span class="down"></span><span class="label">TRADE FUSION</span></div></body></html>`);

await page.screenshot({ path: "/home/ubuntu/Downloads/trade-fusion-instagram-profile.png", type: "png", clip: { x: 0, y: 0, width: 1080, height: 1080 } });
await page.close();
await browser.close();
