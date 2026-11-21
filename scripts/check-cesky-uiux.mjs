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
for (const js of scripts) new Script(js, { filename: 'cesky-reading-uiux-inline.js' });
if (!html.includes('fetch("/api/ai/tutor"') || !html.includes('fetch("/api/ai/reading-help"')) {
  throw new Error('Reading UI must call the existing real server AI endpoints.');
}
if (!html.includes('window.location.assign("/?tab=story")')) {
  throw new Error('Reading UI must have a safe navigation path to the canonical course reader.');
}
if (html.includes('function generateAiReply(') || html.includes('book.readSeconds += 85')) {
  throw new Error('Mock AI answers or invented reading seconds must not reappear.');
}

const readerCode = readFileSync(resolve('public/cesky-reading-uiux/reader-experience.js'), 'utf8');
const readerCss = readFileSync(resolve('public/cesky-reading-uiux/reader-experience.css'), 'utf8');
new Script(readerCode, { filename: 'reader-experience.js' });
for (const marker of [
  'AhojReaderExperience.mount',
  'reader-experience.css?v=1',
  'reader-experience.js?v=1',
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

process.stdout.write('Czech reading UI/UX checks passed: HTML, JS syntax and server navigation.\n');
