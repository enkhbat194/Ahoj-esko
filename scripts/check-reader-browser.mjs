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

  // Installed PWA navigation: Workbox must serve the actual Czech reader HTML,
  // not rewrite /cesky-reading-uiux/index.html to the React app shell.
  {
    const pwa = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    pwa.on("pageerror", (error) => errors.push(error.message));
    await pwa.goto("http://127.0.0.1:17777/", { waitUntil: "domcontentloaded" });
    await pwa.waitForURL("**/cesky-reading-uiux/index.html?tab=stages", { timeout: 10000 });
    assert.equal(await pwa.locator(".premium-home").count(), 0, "Old green React home is still visible");
    assert.ok(await pwa.locator(".chapter-slide").count() > 0, "New Stage landing page is missing");
    // Old installed icons can keep ?tab=read: the start page MUST still be stages.
    await pwa.goto("http://127.0.0.1:17777/cesky-reading-uiux/index.html?tab=read", { waitUntil: "domcontentloaded" });
    assert.ok(await pwa.locator('[data-tab="stages"][aria-current="page"]').count() === 1,
      "Legacy ?tab=read PWA starts on the wrong tab");
    assert.ok(await pwa.locator(".chapter-slide").count() > 0, "Stage content missing at legacy start URL");
    assert.equal(new URL(pwa.url()).searchParams.get("tab"), "stages",
      "Legacy old PWA URL was not normalized to the Stage landing");
    await pwa.locator('[data-tab="read"]').click();
    assert.ok(await pwa.locator(".book-card").count() > 0, "New reading library is missing");
    await pwa.locator(".book-card").first().click();
    await pwa.locator("#detailContinueBtn").click();
    await pwa.locator("#readerShell.aho-reader-shell").waitFor();
    assert.ok(await pwa.locator("#ar-player").isVisible(), "Installed PWA did not reach modern reader");
    await pwa.screenshot({ path: "test-artifacts/pwa-reader-from-home.png" });
    assert.deepEqual(errors, [], "Installed PWA JavaScript errors: " + errors.join("; "));
    await pwa.close();
    console.log("PASS root → new dark Stage landing → Read tab → chapter player; no legacy React");
  }

  for (const size of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 428, height: 926 },
  ]) {
    const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url, { waitUntil: "domcontentloaded" });
    assert.ok(await page.locator(".chapter-slide").count() > 0,
      "New Stage home should be the default at every viewport");
    await page.locator('[data-tab="read"]').click();
    await page.locator(".book-card").first().click();
    await page.locator("#detailContinueBtn").click();

    await page.locator("#readerShell.aho-reader-shell").waitFor();
    await page.locator("#readerShell").evaluate((el) => Promise.all(el.getAnimations().map((animation) => animation.finished.catch(() => {}))));
    assert.ok(await page.locator("#ar-text .ar-word").count() > 3, "Word-tap tokens missing");
    // At least two sentences in the first paragraph must occupy separate lines.
    const sentenceNodes = page.locator("#ar-text .ar-paragraph").first().locator(".ar-sentence");
    assert.ok(await sentenceNodes.count() >= 2, "Expected multi-sentence Czech paragraph for line-break QA");
    const firstSentence = await sentenceNodes.nth(0).boundingBox();
    const secondSentence = await sentenceNodes.nth(1).boundingBox();
    assert.ok(firstSentence && secondSentence &&
      secondSentence.y >= firstSentence.y + firstSentence.height + 8 &&
      Math.abs(secondSentence.x - firstSentence.x) <= 2,
      "Each Czech sentence must begin on a new line: " + JSON.stringify({ firstSentence, secondSentence }));
    assert.ok(await page.locator("#ar-player").isVisible(), "Player missing");
    assert.equal(await page.locator(".ar-sentence-audio").count(), 0,
      "Reference reader keeps speakers out of the Czech text");
    assert.equal(await page.locator(".ar-chapter-title").count(), 0,
      "Reader must not duplicate the chapter heading under its header");
    assert.equal(await page.locator(".ar-guided-disabled[aria-disabled='true']").count(), 1,
      "Guided reading preview must show a disabled control, not a fake working mic");
    assert.equal(await page.locator("#ar-seek").isDisabled(), true,
      "Untimed demo TTS must not fake native seek controls");
    assert.equal(await page.locator("#ar-back").isDisabled(), true,
      "5-second skip must be unavailable without native media");

    if (size.width === 320) await page.screenshot({ path: "test-artifacts/reader-small-before.png", fullPage: false });
    const player = await page.locator("#ar-player").boundingBox();
    const scrolling = await page.locator("#ar-scroll").boundingBox();
    assert.ok(player && scrolling && player.y >= 0 &&
      player.y + player.height <= size.height + 3 && scrolling.height > 95,
      "Reader/player do not fit viewport " + JSON.stringify({ size, player, scrolling }));

    if (size.height >= 800) {
      assert.ok(player.height <= 305,
        "Expanded reader must preserve text: player was " + player.height + "px at " + size.width + "x" + size.height);
      assert.ok(scrolling.height >= 360,
        "Reading text canvas too short: " + scrolling.height + "px");
    }
    assert.ok(await page.locator("#ar-header-font").count() === 0 || await page.locator("#ar-font-head").count() === 1,
      "Header font shortcut missing");
    const initiallyCollapsed = await page.locator("#ar-player").evaluate((el) => el.classList.contains("is-collapsed"));
    if (initiallyCollapsed) await page.locator("#ar-collapse").click();
    if (size.width === 390) await page.screenshot({ path: "test-artifacts/reader-expanded-390.png", fullPage: false });
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
    assert.equal(await page.locator(".ar-sheet-listen").count(), 1, "Sentence audio action missing from quick dictionary");
    await page.locator("#ar-quick-shade [data-close-sheet]").click();
    assert.equal(await page.locator("#ar-quick-shade").count(), 0);

    const beforeCollapse = await page.locator("#ar-player").evaluate((el) => el.classList.contains("is-collapsed"));
    await page.locator("#ar-collapse").click();
    const afterCollapse = await page.locator("#ar-player").evaluate((el) => el.classList.contains("is-collapsed"));
    assert.notEqual(afterCollapse, beforeCollapse, "Collapse control did not toggle");

    await page.locator("#ar-complete").click();
    assert.ok((await page.locator("#ar-complete").innerText()).includes("Дараагийн бүлэг"));
    await page.locator("#ar-complete").click();
    assert.ok((await page.locator(".ar-subtitle").innerText()).includes("Бүлэг 2"));
    if (size.width === 390) {
      await page.screenshot({ path: "test-artifacts/reader-390.png", fullPage: false });
    }
    await page.locator("#ar-close").click();
    assert.equal(await page.locator("#readerOverlay").isVisible(), false);
    assert.equal(errors.length, 0, "JS errors: " + errors.join("\n"));

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
  await page.locator("#ar-seek").evaluate((el) => {
    el.value = "75";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  assert.ok(Number(await page.locator("#ar-seek").inputValue()) >= 74, "Native seek failed");
  await page.locator("#ar-play").click();
  console.log("PASS HTMLAudioElement: play, pause, ±5 sec, seek");
  await page.close();
  console.log("PASS responsive reader browser interaction suite");
} finally {
  if (browser) await browser.close();
  proc.kill("SIGTERM");
}
