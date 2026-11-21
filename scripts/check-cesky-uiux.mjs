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

process.stdout.write('Czech reading UI/UX checks passed: HTML, JS syntax and server navigation.\n');
