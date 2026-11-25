import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
const F = process.argv[2];
const ui = readFileSync(F + "/ui.html", "utf8");
const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
for (const name of ["portada", "c1-exportar", "c2-disenador", "c3-conversion"]) {
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, acceptDownloads: false });
  await p.goto(`file://${F}/${name}.html`);
  if (name === "c1-exportar") {
    await p.evaluate((html) => { document.getElementById("ui").srcdoc = html; }, ui);
    await p.waitForTimeout(600);
    const frame = p.frames().find((f) => f !== p.mainFrame());
    await frame.evaluate(() => {
      window.postMessage({ pluginMessage: { type: "selection", frames: [{ name: "Login", w: 360, h: 380 }] } }, "*");
    });
    await p.waitForTimeout(200);
    await frame.evaluate(() => {
      window.download = () => {}; // no descargar en la captura
      window.postMessage({ pluginMessage: { type: "result", name: "Login.raxorin.json", json: "{}", frames: 1, images: 0, variables: 3, warnings: [] } }, "*");
    });
  }
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${F}/${name}.png` });
  await p.close();
}
// Ícono 128×128
const p = await b.newPage({ viewport: { width: 128, height: 128 }, deviceScaleFactor: 1 });
await p.goto(`file://${F}/icono.html`);
await p.waitForTimeout(400);
await p.screenshot({ path: `${F}/icono-128.png` });
await b.close();
console.log("ok");
