import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {resolve} from "node:path";

const read=path=>readFileSync(resolve(path),"utf8");
const sourceEngine=read("curriculum/system-v1/reader-adaptive-engine.mjs");
const servedEngine=read("public/cesky-reading-uiux/reader-lab-engine.mjs");
const sourceStories=read("curriculum/system-v1/reader-stories.content.draft.json");
const servedStories=read("public/cesky-reading-uiux/reader-lab-content.draft.json");
assert.equal(servedEngine,sourceEngine,"Browser reader engine must EXACTLY mirror canonical engine; prevent drift");
assert.equal(servedStories,sourceStories,"Browser reader stories must EXACTLY mirror canonical source; prevent drift");
const stories=JSON.parse(servedStories);
assert.equal(stories.status,"DRAFT_STORIES_AND_GLOSSES_NOT_NATIVE_REVIEWED_NOT_PUBLISHED");
assert.equal(stories.books.length,3);
assert.equal(stories.books.flatMap(b=>b.chapters).flatMap(c=>c.sentences).length,25);
assert.equal(stories.form_annotations.length,64);
assert.ok(stories.books.every(b=>b.published===false));
assert.ok(stories.books.every(b=>b.voice_gender==="male"));
assert.ok(stories.form_annotations.every(x=>x.audio_asset_id===null));
const browser=read("public/cesky-reading-uiux/reader-lab-ui.mjs");
const css=read("public/cesky-reading-uiux/reader-lab-ui.css");
const html=read("public/cesky-reading-uiux/index.html");
execFileSync(process.execPath,["--check","public/cesky-reading-uiux/reader-lab-ui.mjs"],{stdio:"pipe"});
execFileSync(process.execPath,["--check","public/cesky-reading-uiux/reader-lab-engine.mjs"],{stdio:"pipe"});
for(const term of [
'new URLSearchParams(location.search).get("reader_lab") === "1"',
'import {',
'from "./reader-lab-engine.mjs"',
'fetch("./reader-lab-content.draft.json"',
'localStorage.getItem(key)',
'localStorage.setItem(key',
'startReaderChapter(',
'recordReaderEvent(active,',
'readerWordTooltip(active,',
'commitReaderAttempt(profile,active,',
'activateGlobalReadingCards(profile,',
'reviewGlobalReadingCard(profile,',
'suggestLearningFocus(profile,',
'readerOverlay',
'readerShell',
'lab-word',
'lab-finish',
'data-lab-open',
'data-lab-result',
'data-lab-reveal',
'data-lab-q',
'AhojReaderLab',
'UNREVIEWED_DRAFT_PREVIEW'
])assert.ok(browser.includes(term),"Missing browser reader bridge "+term);
for(const marker of [
'<script type="module" src="./reader-lab-ui.mjs?v=1"></script>',
'window.AhojReaderLab?.isOpen?.()',
'window.AhojReaderLab.closeReader();',
'window.AhojReaderLab?.decorateReadingView?.();',
'readerLab.renderCardsTab(mainArea)',
'readerLab.renderDictionaryTab(mainArea)',
'if (!previewCards && !previewDictionary) renderPlaceholderView(tab)',
]){
 assert.ok(html.includes(marker),"Reader Lab missing from existing app "+marker);
}
assert.ok(css.includes(".reader-lab-shelf"));
assert.ok(css.includes(".lab-prose"));
assert.ok(css.includes(".lab-gloss"));
assert.ok(css.includes(".lab-flashcard"));
assert.ok(browser.includes('content.status!=="DRAFT_STORIES_AND_GLOSSES_NOT_NATIVE_REVIEWED_NOT_PUBLISHED"'));
assert.equal(browser.includes("speechSynthesis"),false,"Do not bypass dedicated male audio voice policy");
assert.equal(browser.includes("elevenlabs"),false,"Curriculum branch must not call ElevenLabs");
assert.ok(browser.includes('name:"')===false,"Do not hard-code learner name");
const flags=html.match(/reader_lab/g)??[];
assert.ok(flags.length<=3,"Feature flag must not appear in regular production behavior");
console.log("Reader Lab integration PASS: opt-in existing Premium PWA / Reader+Dictionary+Cards, 3 draft genres, 25 sentences, 64 annotated forms, no live TTS, no false publication.");
