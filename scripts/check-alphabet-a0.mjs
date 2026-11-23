import { existsSync, readFileSync, statSync } from 'node:fs';
import { Script } from 'node:vm';

const base = 'public/cesky-reading-uiux/';
const files = ['alphabet-a0.html', 'alphabet-a0.css', 'alphabet-a0.js', 'alphabet-fruit-sprite.webp'];
for (const filename of files) {
  const path = base + filename;
  if (!existsSync(path) || statSync(path).size < 512) throw new Error('A0 asset missing or empty: ' + path);
}
const html = readFileSync(base + files[0], 'utf8');
const css = readFileSync(base + files[1], 'utf8');
const js = readFileSync(base + files[2], 'utf8');
const main = readFileSync(base + 'index.html', 'utf8');
new Script(js, { filename: 'alphabet-a0.js' });
const checks = [
  ['eight-step navigation', js.includes("state.step>=8") && js.includes("state.step++")],
  ['C sound distinct from its name', js.includes("name:'cé',sound:'/t͡s/'")],
  ['all four Czech words', ['ananas','banán','citrón','dort'].every(word => js.includes("word:'" + word + "'"))],
  ['four fruit positions', ['data-fruit="','background-position:0 0','background-position:100% 100%'].every(x => (js + css).includes(x))],
  ['picture/letter/text recognition', js.includes('choice-grid') && js.includes('letter-choices') && js.includes('text-choices')],
  ['automatic audio and replay', js.includes('playCurrent(false)') && js.includes('replayCount++')],
  ['microphone + explicit uncertainty', js.includes("recognition.lang='cs-CZ'") && js.includes('pronunciationScore:null')],
  ['mic permission after audio completion', js.includes('ahoj-mic-granted') && js.includes('startRecognition();')],
  ['attempt and error logging', js.includes('state.attempts.push') && js.includes('state.errorCount++')],
  ['session persistence', js.includes('localStorage.setItem(KEY')],
  ['no-screen-scroll layout', css.includes('overflow:hidden') && css.includes('100dvh')],
  ['persistent five tabs', ['Үе давах','Унших','AI','Карт','Толь'].every(label => html.includes(label))],
  ['entry point linked to Chapter 0', main.includes('window.location.assign("./alphabet-a0.html")')],
  ['recap contains approved words', js.includes('ananas · banán · citrón · dort')],
];
for (const [name, okay] of checks) if (!okay) throw new Error('A0 QA failed: ' + name);
console.log('A0 Chapter 0 automated QA: ' + checks.length + '/' + checks.length + ' passed.');
