import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import { resolve } from 'node:path';

const html = readFileSync(resolve('public/cesky-reading-uiux/index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1].trim())
  .filter(Boolean);

if (!html.includes('<html lang="mn">') || !html.trim().endsWith('</html>')) {
  throw new Error('Czech UI/UX document must have a complete HTML wrapper.');
}
if (!scripts.length) throw new Error('Czech UI/UX has no inline JavaScript.');

const curriculumJson = JSON.parse(readFileSync(resolve('public/cesky-reading-uiux/a0-curriculum.json'), 'utf8'));
const curriculumJs = readFileSync(resolve('public/cesky-reading-uiux/a0-curriculum.js'), 'utf8');
const curriculumContext = { window: {} };
new Script(curriculumJs, { filename: 'a0-curriculum.js' }).runInNewContext(curriculumContext);
const a0 = curriculumContext.window.AHOJ_A0_CURRICULUM;
if (!a0 || JSON.stringify(a0) !== JSON.stringify(curriculumJson)) {
  throw new Error('A0 curriculum browser JS must match versioned JSON source.');
}
if (!Array.isArray(a0.topics) || a0.topics.length !== 16) {
  throw new Error('Expected 16 A0 topics, read from curriculum data.');
}
const lessons = a0.topics.flatMap((topic, index) => {
  if (topic.order !== index + 1 || topic.chapter !== index || topic.id !== 'A0-T' + String(index + 1).padStart(2, '0')) {
    throw new Error('A0 topics are not sequential with stable IDs.');
  }
  if (!Array.isArray(topic.lessons) || !topic.lessons.length) throw new Error('A0 topic has no lesson outline: ' + topic.id);
  return topic.lessons;
});
if (lessons.length !== 140 || new Set(lessons.map(lesson => lesson.id)).size !== 140) {
  throw new Error('A0 curriculum lesson count/IDs invalid.');
}
if (!html.includes('a0-curriculum.js?v=1') || html.includes('const STAGE_CHAPTERS = [')) {
  throw new Error('Stage cards must load data-driven 16-topic curriculum.');
}

for (const js of scripts) new Script(js, { filename: 'cesky-reading-uiux-inline.js' });
if (!html.includes('fetch("/api/ai/tutor"') || !html.includes('fetch("/api/ai/reading-help"')) {
  throw new Error('Reading UI must call the existing real server AI endpoints.');
}
if (!html.includes('const MENU_ITEMS = ["Номын сан"') || html.includes('window.location.assign("/")') || html.includes('window.location.assign("/?tab=story")')) {
  throw new Error('Retired green React frontend must not be linked from the live reader.');
}
const entry = readFileSync(resolve('index.html'), 'utf8');
if (entry.includes('/src/main.tsx') || !entry.includes('/cesky-reading-uiux/index.html?tab=stages')) {
  throw new Error('Root document must open the new premium reading app, not the green React shell.');
}
if (html.includes('function generateAiReply(') || html.includes('book.readSeconds += 85')) {
  throw new Error('Mock AI answers or invented reading seconds must not reappear.');
}

const readerCode = readFileSync(resolve('public/cesky-reading-uiux/reader-experience.js'), 'utf8');
const readerCss = readFileSync(resolve('public/cesky-reading-uiux/reader-experience.css'), 'utf8');
new Script(readerCode, { filename: 'reader-experience.js' });
for (const marker of [
  'AhojReaderExperience.mount',
  'reader-experience.css?v=6',
  'reader-experience.js?v=6',
]) {
  if (!html.includes(marker)) throw new Error('Reader integration missing: ' + marker);
}
for (const marker of [
  'ar-player-controls',
  'ar-seek',
  'ar-speed',
  'ar-repeat',
  'ar-word',
  'showWord(id)',
  'startTts(index, oneSentence)',
  'setupFileAudio()',
]) {
  if (!readerCode.includes(marker)) throw new Error('Reader feature missing: ' + marker);
}
if (!readerCss.includes('safe-area-inset-bottom') || !readerCss.includes('ar-player.is-collapsed')) {
  throw new Error('Reader responsive/safe-area styles missing');
}

for (const marker of ['skipGuidedWord()', 'onWordTap', 'this.guidedActive ? "🎙"', 'ONE complete original sentence']) {
  if (!readerCode.includes(marker)) throw new Error('Shared reader repair missing: '+marker);
}
if (!html.includes('lesson-outline-track')) throw new Error('Lesson cards carousel missing');
process.stdout.write('Czech reading UI/UX checks passed: HTML, JS syntax and server navigation.\n');
