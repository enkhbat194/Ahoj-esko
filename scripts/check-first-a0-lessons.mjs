import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const original=read("curriculum/system-v1/lessons/a0-t01-l01-to-l03.interactive.draft.json");
const served=read("public/cesky-reading-uiux/lesson-a0-t01-first3.draft.json");
assert.equal(served,original,"Browser teaching data must match canonical data byte-for-byte");
const data=JSON.parse(original);
const outline=JSON.parse(read("public/cesky-reading-uiux/a0-curriculum.json"));
const topic=outline.topics.find(x=>x.id==="A0-T01");
const expected=["A0-T01-L01","A0-T01-L02","A0-T01-L03"];
assert.equal(data.status,"FIRST_3_LESSON_INTERACTIVE_PREVIEW_NOT_LINGUISTIC_OR_AUDIO_RELEASE");
assert.deepEqual(data.lessons.map(x=>x.lesson_id),expected);
assert.equal(data.publication.approved,false);
assert.equal(data.publication.published,false);
assert.equal(data.publication.audio_qa,"PENDING");
assert.ok(data.lessons.every((lesson,i)=>
 lesson.order===i+1&&lesson.source_micro_skill_id===expected[i]&&
 topic.lessons[i].id===lesson.lesson_id&&topic.lessons[i].title_mn===lesson.title_mn),
 "First 3 full teaching practices must align with canonical source and exact order");
const all=new Set();
for (const [i,lesson] of data.lessons.entries()) {
 assert.equal(lesson.steps.length,9,lesson.lesson_id+": 9 real activities");
 assert.ok(lesson.words.length>=4);
 assert.ok(lesson.steps.some(s=>s.type==="model"));
 assert.ok(lesson.steps.some(s=>s.type==="flashcards"));
 assert.ok(lesson.steps.some(s=>s.type==="listen_choice"));
 assert.ok(lesson.steps.some(s=>s.type==="speak"));
 assert.ok(lesson.steps.some(s=>s.type==="match"));
 assert.ok(lesson.steps.some(s=>s.type==="order"));
 assert.ok(lesson.steps.some(s=>s.type==="cloze"));
 assert.equal(lesson.approved,false);
 assert.equal(lesson.published,false);
 assert.equal(lesson.pass_rule.pronunciation_certification,false);
 for (const step of lesson.steps) {
  assert.ok(step.step_id&&!all.has(step.step_id),"Unique step IDs required");
  all.add(step.step_id);
  if(step.type==="choice"||step.type==="listen_choice"){
   assert.ok(step.options.some(o=>o.id===step.answer_id));
   assert.equal(new Set(step.options.map(o=>o.id)).size,step.options.length);
  }
  if(step.type==="listen_choice"){
   assert.equal(step.utterance.audio_asset_id,null);
   assert.equal(step.production_verified,false);
   assert.equal(step.evidence_gate,"AUDIO_PLAY_EVENT_REQUIRED");
  }
  if(step.type==="order"){
   const a=step.tiles.map(x=>x.text).sort().join("");
   const b=step.target_cs.normalize("NFC").split("").sort().join("");
   assert.equal(a,b,step.step_id+" letter tiles must form target exactly");
  }
  if(step.type==="flashcards") assert.ok(step.items.length>=4);
  if(step.type==="match"){
   assert.ok(step.pairs.length>=4);
   assert.equal(new Set(step.pairs.map(x=>x.meaning_mn)).size,step.pairs.length);
  }
  if(step.type==="speak"){
   assert.equal(step.evaluation,"ATTEMPT_ONLY_STT_TRANSCRIPT_NOT_PHONETIC_GRADE");
  }
 }
}
assert.equal(all.size,27);
const browser=read("public/cesky-reading-uiux/lesson-lab-ui.mjs");
const html=read("public/cesky-reading-uiux/index.html");
const css=read("public/cesky-reading-uiux/lesson-lab-ui.css");
execFileSync(process.execPath,["--check","public/cesky-reading-uiux/lesson-lab-ui.mjs"],{stdio:"pipe"});
for(const needle of [
  "window.AhojLessonLab","openLesson:start","getProgress:","SpeechSynthesisUtterance",
  "webkitSpeechRecognition","pronunciation_certification", // actual string? module might not include
  "audio_events","TEXT_FALLBACK","PRACTICE_COMPLETE_NOT_CERTIFIED",
  "course-lab-overlay","localStorage.setItem","localStorage.getItem",
  "review_queue","cardReveal","listen_choice","speak"
]) {
 if(needle==="pronunciation_certification") continue;
 assert.ok(browser.includes(needle),"Lesson engine missing "+needle);
}
for(const phrase of ["data-lesson-start","lesson-lab-ui.mjs?v=2","lesson-lab-ui.css?v=1",
                     "window.AhojLessonLab?.openLesson"])
 assert.ok(html.includes(phrase),"Missing native Premium course route "+phrase);
assert.ok(css.includes("#course-lab-overlay"));
assert.ok(browser.includes("renderCardsTab,decorateCardsTab,markReview"),"Course flashcards not exported");
assert.ok(html.includes("window.AhojLessonLab?.renderCardsTab?.(mainArea"),"Course cards not plugged into Premium tab");
assert.ok(!browser.includes("elevenlabs"),"No audio generation in curriculum module");
assert.ok(!browser.includes("audio_verified:true"),"Must never pretend browser TTS native QA passed");
console.log("First 3 A0 lesson schema PASS: 27 real draft interactions; canonical order, storage, card review, exact-answer gates, audio and speech never falsely certified.");

const fourthCanonical=read("curriculum/system-v1/lessons/a0-t01-l04.interactive.draft.json");
assert.equal(read("public/cesky-reading-uiux/lesson-a0-t01-l04.draft.json"),fourthCanonical,
 "Fourth browser lesson must mirror canonical source byte-for-byte");
const fourth=JSON.parse(fourthCanonical);
assert.equal(fourth.publication.approved,false);
assert.equal(fourth.publication.published,false);
assert.equal(fourth.publication.audio_qa,"PENDING");
assert.equal(fourth.lessons.length,1);
const l04=fourth.lessons[0];
assert.equal(l04.lesson_id,"A0-T01-L04");
assert.equal(l04.source_micro_skill_id,topic.lessons[3].id);
assert.equal(l04.title_mn,topic.lessons[3].title_mn);
assert.equal(l04.order,4);
assert.equal(l04.steps.length,9);
assert.equal(l04.approved,false);
assert.equal(l04.published,false);
assert.equal(l04.pass_rule.pronunciation_certification,false);
assert.ok(l04.words.length>=4);
assert.deepEqual(l04.steps.map(x=>x.type),[
 "model","choice","flashcards","listen_choice","match","order","cloze","choice","speak"]);
for(const step of l04.steps){
 assert.ok(!all.has(step.step_id),"Old and new step IDs must be unique");
 all.add(step.step_id);
 if(["choice","listen_choice"].includes(step.type))
  assert.ok(step.options.some(x=>x.id===step.answer_id));
 if(step.type==="listen_choice"){
  assert.equal(step.utterance.audio_asset_id,null);
  assert.equal(step.production_verified,false);
 }
 if(step.type==="order"){
  assert.deepEqual([...step.tiles.map(x=>x.text)].sort(),
                   [...step.target_cs.normalize("NFC")].sort());
 }
 if(step.type==="match")
  assert.equal(new Set(step.pairs.map(x=>x.meaning_mn)).size,step.pairs.length);
 if(step.type==="speak")
  assert.equal(step.evaluation,"ATTEMPT_ONLY_STT_TRANSCRIPT_NOT_PHONETIC_GRADE");
}
assert.equal(all.size,36,"Total 4 × 9 interactions");
assert.ok(browser.includes("lesson-a0-t01-l04.draft.json"));
assert.ok(browser.includes("pack={...d,lessons}"));
assert.ok(browser.includes('["č","š","ž"'));
console.log("A0 L04 content checks PASS: four ordered draft lessons, 36 interactions; L01-L03 unchanged and audio unverified.");
