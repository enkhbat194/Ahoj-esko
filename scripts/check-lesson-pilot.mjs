import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import { resolve } from "node:path";

const root = "public/cesky-reading-uiux/";
const html = readFileSync(resolve(root + "index.html"), "utf8");
const curriculumJs = readFileSync(resolve(root + "a0-curriculum.js"), "utf8");
const pilotJs = readFileSync(resolve(root + "a0-lesson-pilot.js"), "utf8");
const pilotCss = readFileSync(resolve(root + "a0-lesson-pilot.css"), "utf8");
const storage = new Map();
const window = { localStorage: {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value))
}};
const context = { window, navigator: {} };
new Script(curriculumJs, { filename: "a0-curriculum.js" }).runInNewContext(context);
new Script(pilotJs, { filename: "a0-lesson-pilot.js" }).runInNewContext(context);
const engine = window.AhojLessonPilot;
assert.ok(engine);
assert.deepEqual([...engine.ids], ["A0-T02-L01", "A0-T02-L02", "A0-T03-L01", "A0-T03-L03"]);
assert.equal(engine.has("A0-T01-L01"), false);
assert.equal(engine.getStatus("A0-T02-L01"), "new");
for (const id of engine.ids) {
  const spec = engine.getSpec(id);
  const topic = window.AHOJ_A0_CURRICULUM.topics.find((item) => item.id === spec.topic);
  assert.ok(topic.lessons.some((item) => item.id === id));
  for (const phrase of spec.phrases) assert.ok(topic.phrases.some((item) => item.cz === phrase.cz && item.mn_natural === phrase.mn_natural));
  for (const key of ["recognize", "recall", "scenario"]) {
    assert.ok(spec[key].options.includes(spec[key].correct));
    assert.equal(spec[key].options.length, 3);
    assert.ok(spec[key].options.every((phrase) => topic.phrases.some((item) => item.cz === phrase)));
  }
}
const nodes = new Map();
const optionButtons = [0, 1, 2].map((index) => ({
  dataset: { pilotChoice: String(index) }, disabled: false, classList: { add() {} }
}));
const host = {
  innerHTML: "", handler: null,
  addEventListener(type, handler) { assert.equal(type, "click"); this.handler = handler; },
  removeEventListener(type, handler) { if (this.handler === handler) this.handler = null; },
  contains() { return true; },
  querySelector(selector) {
    if (selector.startsWith('[data-pilot-choice="')) return optionButtons[Number(selector.match(/\d+/)[0])];
    if (!nodes.has(selector)) nodes.set(selector, { textContent: "", hidden: true });
    return nodes.get(selector);
  },
  querySelectorAll() { return optionButtons; }
};
function click(attribute, index) {
  const button = { dataset: attribute === "data-pilot-choice" ? { pilotChoice: String(index) } : {},
    hasAttribute: (key) => key === attribute };
  assert.ok(host.handler);
  host.handler({ target: { closest: () => button } });
}
assert.equal(engine.mount(host, "A0-T02-L01", { onBack() {} }), true);
assert.ok(host.innerHTML.includes("Ahoj!") && host.innerHTML.includes("ТУРШИЛТ"));
click("data-pilot-next");
assert.equal(engine.getProgress("A0-T02-L01").stepIndex, 1);
const spec = engine.getSpec("A0-T02-L01");
click("data-pilot-choice", spec.recognize.options.findIndex((option) => option !== spec.recognize.correct));
assert.equal(engine.getProgress("A0-T02-L01").mistakes, 1);
click("data-pilot-choice", spec.recognize.options.indexOf(spec.recognize.correct));
click("data-pilot-next");
assert.equal(engine.getProgress("A0-T02-L01").stepIndex, 2);
click("data-pilot-said");
assert.equal(engine.getProgress("A0-T02-L01").selfReportedSpoken, true);
for (const question of [spec.recall, spec.scenario]) {
  click("data-pilot-choice", question.options.indexOf(question.correct));
  click("data-pilot-next");
}
const result = engine.getProgress("A0-T02-L01");
assert.equal(result.stepIndex, 5);
assert.equal(result.result, "practice_only");
assert.ok(result.completedAt > 0);
assert.equal(result.reviewDueAt - result.completedAt, 86400000);
assert.equal(engine.getStatus("A0-T02-L01"), "practice_done");
assert.ok(host.innerHTML.includes("«Эзэмшсэн» гэсэн дүн биш."));
engine.destroy();
assert.equal(host.handler, null);
assert.ok(html.includes('a0-lesson-pilot.js?v=1'));
assert.ok(html.includes('a0-lesson-pilot.css?v=1'));
assert.ok(html.includes("data-pilot-lesson"));
assert.ok(html.includes("AhojLessonPilot.mount(mainArea"));
assert.ok(pilotCss.includes("safe-area-inset-bottom"));
assert.ok(!pilotJs.includes("fetch("));
assert.ok(!pilotJs.includes("/api/ai/tts"));
assert.ok(pilotJs.includes("getUserMedia") && pilotJs.includes("stream.getTracks()"));
console.log("PASS A0 lesson pilot: 4 canonical IDs, phrase provenance, quiz, retry, self-reported speaking, review, storage, UI hooks.");
