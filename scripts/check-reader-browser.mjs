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
    assert.equal(await page.locator("#ar-guided-toggle[role='switch']").count(), 1,
      "Czech guided reading microphone switch missing");
    assert.equal(await page.locator("#ar-word-help").count(), 1,
      "Stuck-word speaker helper missing");
    assert.equal(await page.locator("#ar-seek").isDisabled(), true,
      "Untimed demo TTS must not fake native seek controls");
    assert.equal(await page.locator("#ar-back").isDisabled(), false,
      "Without file audio, previous-sentence navigation must remain available");
    assert.equal(await page.locator("#ar-back").getAttribute("aria-label"), "Өмнөх өгүүлбэр");

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

  // Browser-only deterministic smoke: this tests UI state and word matching,
  // NOT actual microphone audio quality or iOS recognition reliability.
  {
    const micPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await micPage.addInitScript(() => {
      window.__spokenTts = [];
      window.SpeechSynthesisUtterance = class {
        constructor(text) { this.text = text; this.rate = 1; }
      };
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        value: {
          speaking: false, paused: false,
          getVoices() { return [{ name: "Mock Czech voice", lang: "cs-CZ" }]; },
          addEventListener() {}, removeEventListener() {},
          speak(utterance) { this.speaking = true; window.__spokenTts.push(utterance); },
          cancel() { this.speaking = false; },
          pause() { this.paused = true; }, resume() { this.paused = false; },
        },
      });
      window.SpeechRecognition = class {
        constructor() { window.__lastRecognizer = this; }
        start() { this.onstart?.(); }
        abort() { this.onend?.(); }
        emit(transcript) {
          const result = [{ transcript }];
          result.isFinal = true;
          this.onresult?.({ resultIndex: 0, results: [result] });
        }
      };
    });
    await micPage.goto(url, { waitUntil: "domcontentloaded" });
    await micPage.locator('[data-tab="read"]').click();
    await micPage.locator(".book-card").first().click();
    await micPage.locator("#detailContinueBtn").click();
    await micPage.locator("#readerShell.aho-reader-shell").waitFor();
    await micPage.locator("#ar-play").click();
    const firstTts = await micPage.evaluate(() => ({
      count: window.__spokenTts.length,
      text: window.__spokenTts[0]?.text || "",
    }));
    assert.equal(firstTts.count, 1, "Chapter should start with one TTS chunk");
    assert.ok(firstTts.text.includes("Slunce svítí"), "Opening Czech sentence missing");
    for (let chunk = 0; chunk < 12; chunk += 1) {
      const current = await micPage.evaluate(() =>
        window.__spokenTts.map((x) => x.text).join(" "));
      if (current.includes("Na stole") && current.includes("Dnes začíná")) break;
      await micPage.evaluate(() => window.__spokenTts.at(-1).onend?.());
      await micPage.waitForTimeout(360);
    }
    const utterances = await micPage.evaluate(() => window.__spokenTts.map((x) => x.text));
    assert.ok(utterances.length > 1, "Long chapter must be split into short Czech chunks");
    assert.ok(utterances.join(" ").includes("Na stole") &&
      utterances.join(" ").includes("Dnes začíná"), "TTS chunks skipped a sentence");
    await micPage.locator("#ar-guided-toggle").click();
    assert.equal(await micPage.locator("#ar-guided-toggle").getAttribute("aria-checked"), "true");
    assert.equal(await micPage.locator(".ar-word.is-current").innerText(), "Slunce");
    await micPage.evaluate(() => window.__lastRecognizer.emit("Slunce svítí nad Prahou"));
    assert.equal(await micPage.locator(".ar-word.is-current").innerText(), "Ema",
      "Czech STT did not advance past recognized sequence");
    await micPage.evaluate(() => window.__lastRecognizer.emit("Slunce svítí nad Prahou"));
    assert.equal(await micPage.locator(".ar-word.is-current").innerText(), "Ema",
      "Duplicated STT final result incorrectly advanced");
    await micPage.locator("#ar-word-help").click();
    assert.equal(await micPage.locator(".ar-word.is-current").innerText(), "Ema");
    assert.equal(await micPage.evaluate(() => window.__spokenTts.at(-1)?.text), "Ema",
      "Word-help speaker must play only the stuck CURRENT word");
    await micPage.evaluate(() => window.__spokenTts.at(-1).onend?.());
    await micPage.waitForTimeout(450);
    assert.equal(await micPage.locator("#ar-guided-message").innerText() !== "", true);
    assert.equal(await micPage.locator("#ar-play").getAttribute("aria-label"),
      "Микрофон сонсож байна · түр зогсоох",
      "After one stuck-word example STT should resume automatically");
    assert.equal(await micPage.locator("#ar-guided-skip").isVisible(),true,
      "Manual skip in guided mode is required");
    await micPage.evaluate(() => window.__lastRecognizer.emit("wrong word"));
    assert.equal(await micPage.locator(".ar-word.is-current").innerText(), "Ema",
      "Wrong/misrecognized word must not advance");
    await micPage.locator("#ar-guided-skip").click();
    assert.notEqual(await micPage.locator(".ar-word.is-current").innerText(),"Ema",
      "Explicit skip must advance without claiming correct pronunciation");
    await micPage.locator("#ar-guided-toggle").click();
    assert.equal(await micPage.locator("#ar-guided-toggle").getAttribute("aria-checked"), "false");
    await micPage.close();
    console.log("PASS mocked Czech browser TTS chapter continuity + STT guided word sequence + word-help");
  }

  // Unified lab integration in a Chromium mobile viewport. Native Safari
  // microphone and voice availability still require device-specific checking.
  {
    const lab = await browser.newPage({ viewport: {width:390,height:844}, deviceScaleFactor:1 });
    const errors=[];
    lab.on("pageerror",e=>errors.push(e.message));
    await lab.addInitScript(()=>{
      window.__labSpoken=[];
      window.SpeechSynthesisUtterance=class {constructor(text){this.text=text;this.rate=1;}};
      Object.defineProperty(window,"speechSynthesis",{
        configurable:true,value:{
          speaking:false,paused:false,
          getVoices(){return [{name:"Jan Czech test",lang:"cs-CZ"}];},
          addEventListener(){},removeEventListener(){},
          speak(utt){this.speaking=true;window.__labSpoken.push(utt);},
          cancel(){this.speaking=false;},pause(){this.paused=true;},resume(){this.paused=false;}
        }
      });
    });
    await lab.goto(url+"?reader_lab=1",{waitUntil:"domcontentloaded"});
    await lab.locator('[data-tab="read"]').click();
    await lab.locator(".books-grid .lab-in-library").first().waitFor({timeout:10000});
    assert.equal(await lab.locator(".books-grid .book-card").count(),5,
      "New three drafts must be INSIDE All Stories alongside the two existing books");
    assert.equal(await lab.locator(".count-pill").innerText(),"5 ном");
    await lab.screenshot({path:"test-artifacts/reader-five-books-390.png"});
    const width = await lab.evaluate(() => ({
      scroll:document.documentElement.scrollWidth,
      visual:window.innerWidth,
      cards:[...document.querySelectorAll(".lab-in-library")].map(x=>Math.round(x.getBoundingClientRect().width))
    }));
    assert.ok(width.scroll<=width.visual+2,"Reader library has horizontal overflow: "+JSON.stringify(width));
    assert.ok(width.cards.every(v=>v>80&&v<390),"Book card width not responsive");
    await lab.locator(".lab-in-library").first().click();
    await lab.locator("#readerShell.aho-reader-shell").waitFor();
    assert.ok(await lab.locator("#ar-player").isVisible(),
      "New reader MUST reuse original full player");
    assert.ok(await lab.locator("#ar-word-help").count()===1);
    assert.ok(await lab.locator("#ar-guided-skip").count()===1);
    assert.ok(await lab.locator("#ar-text [data-word]").count()>5);
    await lab.locator("#ar-play").click();
    const previewStart=await lab.evaluate(()=>window.__labSpoken.at(-1)?.text);
    assert.ok(previewStart?.includes("Je večer."),"Preview should start browser TTS without mp3");
    await lab.locator("#ar-forward").click();
    const nextText=await lab.evaluate(()=>window.__labSpoken.at(-1)?.text);
    assert.ok(nextText?.includes("Anna je doma."),"Forward button must move a Czech SENTENCE");
    const glossaryWord=lab.locator('#ar-text [data-word]').filter({hasText:"světlo"}).first();
    await glossaryWord.click();
    await lab.locator("#lab-gloss-shade:not([hidden])").waitFor();
    assert.ok((await lab.locator("#lab-gloss-shade .lab-meaning").innerText()).includes("гэрэл"),
      "Contextual glossary missing light sense");
    await lab.locator("#lab-gloss-dismiss").click();
    assert.equal(await lab.locator("#lab-gloss-shade").isHidden(),true);
    const q=lab.locator("#lab-comprehension [data-lab-q]").first();
    await q.click();
    assert.ok(await lab.locator("#lab-comprehension .lab-feedback").first().innerText()!=="");
    await lab.locator("#ar-complete").click();
    assert.ok(await lab.locator(".lab-finish-note").count()===1,
      "Completion should show saved reader cards");
    await lab.screenshot({path:"test-artifacts/reader-unified-player-390.png"});
    await lab.locator("#lab-open-cards").click();
    await lab.locator('[data-tab="cards"][aria-current="page"]').waitFor();
    assert.ok(await lab.locator(".lab-flashcard").count()>0,"Reading vocabulary did not reach Cards tab");
    await lab.locator('[data-tab="dictionary"]').click();
    assert.ok(await lab.locator(".lab-dict-list article").count()>30,
      "Reader context dictionary is missing word forms");
    await lab.screenshot({path:"test-artifacts/reader-cards-dictionary-390.png"});
    assert.deepEqual(errors,[],"Reader Lab JavaScript errors: "+errors.join("; "));
    console.log("PASS mobile Reader Lab: 5 integrated books, shared TTS/player, tap-to-gloss, flashcards, dictionary and no horizontal overflow");
    await lab.close();
  }

  // Exact canonical order. Actually complete each of the 27 exercise steps in
  // the Premium PWA mobile viewport, including genuine wrong-answer retry,
  // persisted progress, narrated listening event and microphone *attempt*.
  // Voice and microphone are mocked here; this is not Czech pronunciation QA.
  {
    const {readFileSync}=await import("node:fs");
    const course=JSON.parse(readFileSync("public/cesky-reading-uiux/lesson-a0-t01-first3.draft.json","utf8"));
    const cp=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
    const errs=[];
    cp.on("pageerror",e=>errs.push(e.message));
    await cp.addInitScript(()=>{
      window.__courseTts=[];
      window.SpeechSynthesisUtterance=class {constructor(t){this.text=t;}};
      Object.defineProperty(window,"speechSynthesis",{
        configurable:true,value:{
          getVoices(){return [{lang:"cs-CZ",name:"Czech test voice"}];},
          cancel(){},speak(u){window.__courseTts.push(u);setTimeout(()=>u.onstart?.(),20);},
          pause(){},resume(){}
        }
      });
      window.webkitSpeechRecognition=class {
        constructor(){this.lang="cs-CZ";}
        start(){setTimeout(()=>this.onresult?.({results:[[{transcript:"pes"}]]}),30);}
        abort(){}
      };
    });
    await cp.goto(url+"?reader_lab=1",{waitUntil:"domcontentloaded"});
    await cp.locator('[data-tab="stages"]').click();
    await cp.locator(".chapter-cta[data-chapter-start='0']").click();
    await cp.locator("#lessonOutlineTrack").waitFor();
    assert.equal(await cp.locator("[data-lesson-start]").count(),3,
      "Exactly first three canonical A0 lessons must be tappable; later outlines remain non-functional");
    await cp.locator('[data-lesson-start="A0-T01-L01"]').click();
    await cp.locator("#course-lab-overlay:not([hidden])").waitFor();
    await cp.screenshot({path:"test-artifacts/a0-first-lesson-390.png"});
    const width=await cp.evaluate(()=>({
      doc:document.documentElement.scrollWidth,window:innerWidth,
      modal:document.querySelector(".cl-shell")?.getBoundingClientRect().width
    }));
    assert.ok(width.doc<=width.window+2,"Lesson overlay overflow: "+JSON.stringify(width));
    assert.ok(width.modal<=390,"Lesson overlay cannot exceed viewport");
    for(let li=0;li<course.lessons.length;li++){
      const lesson=course.lessons[li];
      assert.equal(await cp.locator(".cl-header small").innerText(),
        "ČEŠTINA · "+lesson.lesson_id);
      for(let si=0;si<lesson.steps.length;si++){
        const step=lesson.steps[si];
        assert.equal(await cp.locator(".cl-step-no").innerText(),"АЛХАМ "+(si+1)+" / 9");
        switch(step.type){
          case "model":
            await cp.locator('[data-cl-action="complete-model"]').click();break;
          case "choice":
          case "listen_choice":{
            if(step.type==="listen_choice"){
              await cp.locator('.cl-hearing [data-cl-say]').click();
              await cp.waitForFunction(()=>document.querySelector("#cl-heard-flag")?.textContent?.includes("эхэлсэн"));
              assert.equal((await cp.evaluate(()=>window.__courseTts.at(-1)?.text)),
                step.utterance.text_cs,"One Czech utterance must be played for the chosen answer");
            }
            if(li===0&&si===1){
              const wrong=step.options.find(x=>x.id!==step.answer_id);
              await cp.locator('[data-cl-action="option"][data-answer="'+wrong.id+'"]').click();
              assert.equal(await cp.locator('[data-kind="bad"]').count(),1,
                "Wrong answer must NOT complete step");
              assert.equal(await cp.locator('[data-cl-action="next-step"]').count(),0);
            }
            await cp.locator('[data-cl-action="option"][data-answer="'+step.answer_id+'"]').click();
            break;
          }
          case "flashcards":
            for(let i=0;i<step.items.length;i++)await cp.locator('[data-cl-card="'+i+'"]').click();
            await cp.locator('[data-cl-action="complete-cards"]').click();
            break;
          case "match":
            for(let i=0;i<step.pairs.length;i++)
              await cp.locator('[data-cl-match="'+i+'"]').selectOption(step.pairs[i].meaning_mn);
            await cp.locator('[data-cl-action="check-match"]').click();
            break;
          case "order":{
            const remaining=step.tiles.map((x,i)=>({text:x.text,i}));
            for(const c of [...step.target_cs.normalize("NFC")]){
              const idx=remaining.findIndex(x=>x.text===c);
              assert.ok(idx>=0,"Target letter tile missing "+step.step_id);
              const tile=remaining.splice(idx,1)[0];
              await cp.locator('[data-cl-tile="'+tile.i+'"]').click();
            }
            await cp.locator('[data-cl-action="check-order"]').click();
            break;
          }
          case "cloze":
            await cp.locator("#cl-answer-input").fill(step.answer_cs);
            await cp.locator('[data-cl-action="check-cloze"]').click();break;
          case "speak":
            await cp.locator('[data-cl-action="start-mic"]').click();
            await cp.locator('[data-cl-action="next-step"]').waitFor({timeout:7000});
            assert.match(await cp.locator("#cl-feedback").innerText(),/дуудлага зөв гэсэн оноо биш/i);
            break;
          default:throw Error("Unknown browser step "+step.type);
        }
        await cp.locator('[data-cl-action="next-step"]').click();
      }
      assert.match(await cp.locator(".cl-completion h2").innerText(),/Дадлага гүйцэтгэсэн/);
      assert.match(await cp.locator(".cl-completion").innerText(),/дуудлага, сонсгол, CEFR/i);
      await cp.screenshot({path:"test-artifacts/a0-lesson-"+(li+1)+"-complete-390.png"});
      if(li<course.lessons.length-1)await cp.locator('[data-cl-action="next-lesson"]').click();
    }
    const progress=await cp.evaluate(()=>window.AhojLessonLab.getProgress());
    assert.deepEqual(course.lessons.map(x=>progress.lessons[x.lesson_id].finished),[true,true,true]);
    assert.ok(Object.keys(progress.review_queue).length>=12,"Lesson words must be added to review queue");
    assert.ok(Object.values(progress.lessons).every(x=>x.status==="PRACTICE_COMPLETE_NOT_CERTIFIED"));
    assert.ok(Object.values(progress.lessons).every(x=>x.audio_events.length>=1));
    assert.ok(Object.values(progress.lessons).every(x=>x.speech_attempts.length===1));
    await cp.locator('[data-cl-action="close"]').click();
    await cp.reload({waitUntil:"domcontentloaded"});
    await cp.waitForFunction(()=>window.AhojLessonLab?.getStatus()?.initialized===true);
    assert.deepEqual((await cp.evaluate(()=>window.AhojLessonLab.getStatus().completed)).sort(),
      course.lessons.map(l=>l.lesson_id).sort(),"Lesson progress must survive reload");
    assert.deepEqual(errs,[],"Browser course JS errors: "+errs.join("; "));
    console.log("PASS mobile A0 course: L01 L02 L03 all 27 real steps, wrong-answer correction, mocked TTS/STT, flashcards, no false mastery and persisted storage");
    await cp.close();
  }

  // Report unsupported SpeechRecognition separately from microphone denial.
  {
    const diagPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await diagPage.addInitScript(() => {
      Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: undefined });
      Object.defineProperty(window, "webkitSpeechRecognition", { configurable: true, value: undefined });
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: { getUserMedia: async () => ({
          getTracks: () => [{ stop() { window.__micTrackStopped = true; } }],
        }) },
      });
    });
    await diagPage.goto(url, { waitUntil: "domcontentloaded" });
    await diagPage.locator('[data-tab="read"]').click();
    await diagPage.locator(".book-card").first().click();
    await diagPage.locator("#detailContinueBtn").click();
    await diagPage.locator("#readerShell.aho-reader-shell").waitFor();
    assert.equal(await diagPage.locator("#ar-guided-toggle").isDisabled(), false,
      "Unsupported STT switch must remain clickable for diagnostics");
    assert.match(await diagPage.locator("#ar-guided-message").innerText(), /SpeechRecognition API байхгүй/);
    await diagPage.locator("#ar-guided-toggle").click();
    assert.match(await diagPage.locator("#ar-guided-message").innerText(), /SpeechRecognition API байхгүй/);
    await diagPage.locator("#ar-guided-retry").click();
    assert.match(await diagPage.locator("#ar-guided-message").innerText(), /Микрофон ажиллаж байна/);
    assert.equal(await diagPage.evaluate(() => window.__micTrackStopped), true);
    await diagPage.close();
    console.log("PASS separate unsupported STT vs browser microphone diagnostic");
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
