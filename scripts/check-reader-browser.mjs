import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";

const url = "http://127.0.0.1:17777/cesky-reading-uiux/index.html";
const chromePath = process.env.CHROME_BIN || "/usr/bin/google-chrome";
const proc = spawn(process.execPath, ["node_modules/tsx/dist/cli.mjs", "server.ts"], {
  env: { ...process.env, PORT: "17777", NODE_ENV: "production" },
  stdio: ["ignore", "pipe", "pipe"],
});
const serverLines = [];
proc.stdout.on("data", (s) => serverLines.push(String(s).slice(0, 500)));
proc.stderr.on("data", (s) => serverLines.push(String(s).slice(0, 500)));

async function waitForServer() {
  for (let n = 0; n < 80; n += 1) {
    if (proc.exitCode !== null) throw new Error("Server exited: " + serverLines.join("\n"));
    try {
      const r = await fetch("http://127.0.0.1:17777/api/health");
      if (r.ok) return;
    } catch (_err) { /* Not ready yet. */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Local Render-like server did not start");
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({
    executablePath: chromePath, headless: true,
    args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
  });
  await mkdir("test-artifacts", { recursive: true });

  for (const size of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 428, height: 926 },
  ]) {
    const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.locator(".book-card").first().click();
    await page.locator("#detailContinueBtn").click();

    await page.locator("#readerShell.aho-reader-shell").waitFor();
    assert.ok(await page.locator("#ar-text .ar-word").count() > 3, "Word-tap tokens missing");
    assert.ok(await page.locator("#ar-player").isVisible(), "Player missing");
    assert.equal(await page.locator("#ar-seek").isDisabled(), true,
      "Untimed demo TTS must not fake native seek controls");
    assert.equal(await page.locator("#ar-back").isDisabled(), true,
      "5-second skip must be unavailable without native media");

    const player = await page.locator("#ar-player").boundingBox();
    const scrolling = await page.locator("#ar-scroll").boundingBox();
    assert.ok(player && scrolling && player.y >= 0 &&
      player.y + player.height <= size.height + 3 && scrolling.height > 95,
      "Reader/player do not fit viewport " + JSON.stringify(size));

    const textBefore = await page.locator("#ar-font-size").innerText();
    await page.locator("#ar-font").click();
    assert.notEqual(await page.locator("#ar-font-size").innerText(), textBefore,
      "Font size did not change");
    await page.locator("#ar-repeat").click();
    assert.equal(await page.locator("#ar-repeat").getAttribute("aria-pressed"), "true");
    await page.locator("#ar-speed").selectOption("1.25");
    assert.equal(await page.locator("#ar-speed").inputValue(), "1.25");
    await page.locator("#ar-translation-toggle").click();
    assert.equal(await page.locator("#ar-mn").isVisible(), true);

    await page.locator("#ar-text [data-word]").first().click();
    await page.locator("#ar-quick-shade").waitFor();
    await page.locator("#ar-quick-shade [data-close-sheet]").click();
    assert.equal(await page.locator("#ar-quick-shade").count(), 0);

    await page.locator("#ar-collapse").click();
    assert.ok(await page.locator("#ar-player").evaluate((el) => el.classList.contains("is-collapsed")) !== (size.height < 700),
      "Collapse control did not toggle");

    await page.locator("#ar-complete").click();
    assert.ok((await page.locator("#ar-complete").innerText()).includes("Дараагийн бүлэг"));
    await page.locator("#ar-complete").click();
    assert.ok((await page.locator(".ar-subtitle").innerText()).includes("Бүлэг 2"));
    await page.locator("#ar-close").click();
    assert.equal(await page.locator("#readerOverlay").isVisible(), false);
    assert.equal(errors.length, 0, "JS errors: " + errors.join("\n"));

    if (size.width === 390) {
      await page.screenshot({ path: "test-artifacts/reader-390.png", fullPage: false });
    }
    console.log("PASS mobile reader:", size.width + "x" + size.height);
    await page.close();
  }

  // Real HTMLAudioElement test with short locally generated WAV (not the story dataset).
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    const samples = 8 * 8000;
    const buffer = new ArrayBuffer(44 + samples);
    const view = new DataView(buffer);
    const str = (offset, v) => [...v].forEach((letter, i) => view.setUint8(offset + i, letter.charCodeAt(0)));
    str(0, "RIFF"); view.setUint32(4, 36 + samples, true); str(8, "WAVE");
    str(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, 1, true); view.setUint32(24, 8000, true);
    view.setUint32(28, 8000, true); view.setUint16(32, 1, true);
    view.setUint16(34, 8, true); str(36, "data"); view.setUint32(40, samples, true);
    new Uint8Array(buffer, 44).fill(128);
    const blobUrl = URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
    document.querySelector("#readerOverlay").hidden = false;
    const host = document.querySelector("#readerShell");
    window.AhojReaderExperience.mount({
      host, book: { id: "ci", title: "Test", level: "A0", chapters: [{}], completedChapters: [] },
      chapter: {
        title: "Audio CI", num: 1, cz: ["Ahoj! To je zvukový test."],
        mn: ["Зөвхөн тоглуулагчийн тест."], vocab: [], audioUrl: blobUrl,
        wordTimings: [{ wordIndex: 0, startMs: 0, endMs: 6000 }],
      },
      readingState: { showTranslation: false },
      onClose: () => window.AhojReaderExperience.destroy(),
      onPrevious: () => {}, onComplete: () => {},
    });
  });
  await page.locator("#ar-seek:not([disabled])").waitFor({ timeout: 8000 });
  await page.locator("#ar-play").click();
  await page.locator("#ar-forward").click();
  assert.ok(Number(await page.locator("#ar-seek").inputValue()) > 50, "Native +5 sec failed");
  await page.locator("#ar-back").click();
  assert.ok(Number(await page.locator("#ar-seek").inputValue()) < 50, "Native -5 sec failed");
  await page.locator("#ar-seek").fill("75");
  assert.ok(Number(await page.locator("#ar-seek").inputValue()) >= 74, "Native seek failed");
  await page.locator("#ar-play").click();
  console.log("PASS HTMLAudioElement: play, pause, ±5 sec, seek");
  await page.close();
  console.log("PASS responsive reader browser interaction suite");
} finally {
  if (browser) await browser.close();
  proc.kill("SIGTERM");
}
