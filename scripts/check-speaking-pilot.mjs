import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const base='public/cesky-reading-uiux/';
const read=p=>readFileSync(base+p,'utf8');
const context={window:{}};
new Script(read('speaking-pilot-data.js')).runInNewContext(context);
const lessons=context.window.AHOJ_SPEAKING_PILOT.lessons;
assert.equal(lessons.length,6);
assert.equal(new Set(lessons.map(l=>l.id)).size,6);
const types=new Set(['learn','match','listen','context','gap','build','dialogue','recall']);
const index=read('index.html'), html=read('speaking-pilot.html'),js=read('speaking-pilot.js');
new Script(js);
for(const l of lessons){
 assert.equal(l.steps.length,9);assert.equal(l.steps.at(-1).type,'recall');assert(index.includes(l.id));assert(l.steps.some(s=>s.type==='dialogue'));
 for(const s of l.steps){
  assert(types.has(s.type));
  if(s.type==='match'){assert.equal(new Set(s.pairs.map(p=>p[0])).size,s.pairs.length);assert.equal(new Set(s.pairs.map(p=>p[1])).size,s.pairs.length);}
  if(s.type==='context'||s.type==='gap')assert.equal(s.options.filter(o=>o===s.answer).length,1);
  if(s.type==='listen')for(const item of s.items)assert.equal(item.options.filter(o=>o===item.cz).length,1);
  if(s.type==='build')assert.equal([...s.tokens].sort().join('|'),[...s.answer].sort().join('|'));
  if(s.type==='dialogue'||s.type==='recall')for(const item of s.items)assert(item.mn&&item.models.length);
 }
}
assert(html.includes('speaking-pilot-data.js'));assert(html.includes('speaking-pilot.js'));assert(!html.includes('bottom-nav'));assert(!/<(?:input|textarea)\b/i.test(html));assert(index.includes('./speaking-pilot.html?lesson='));
const logic=js.slice(js.indexOf('function normalize('),js.indexOf('const lessons='));
const c={};new Script(logic).runInNewContext(c);
assert.equal(c.speechMatch('Dobrý den!',['Dobrý den.'],false),'recognized');
assert.equal(c.speechMatch('Dobry den',['Dobrý den.'],false),'unmatched');
assert.equal(c.speechMatch('Jsem Jan.',['Jsem Petr.'],true),'ungraded');
assert.equal(c.buildMatch(['Jak','se','jmenujete?'],['Jak','se','jmenujete?']),true);
assert.equal(c.buildMatch(['se','Jak'],['Jak','se']),false);
console.log('Speaking pilot: 6 lessons, 54 steps, syntax, routing, answer integrity, strict Czech diacritics and ungraded open speech passed.');

const audioContext={window:{}};
new Script(read('speaking-audio-manifest.js')).runInNewContext(audioContext);
for(const entry of Object.values(audioContext.window.AHOJ_SPEAKING_AUDIO)){assert.equal(entry.status,'approved');assert(/^\.\/speaking-audio\/[a-zA-Z0-9_-]+\.mp3$/.test(entry.path));assert(readFileSync(base+entry.path.slice(2)).length>0,'Approved audio asset must exist');}
audioContext.window.AHOJ_SPEAKING_AUDIO={};
new Script(js.slice(js.indexOf('function approvedAudio('),js.indexOf('function play(text,onDone)'))).runInNewContext(audioContext);
assert.equal(audioContext.approvedAudio('Ahoj!'),null);
audioContext.window.AHOJ_SPEAKING_AUDIO={'Ahoj!':{status:'approved',path:'./speaking-audio/clip01.mp3'},'Jsem':{status:'pending',path:'./speaking-audio/clip02.mp3'},'A vy?':{status:'approved',path:'https://example.org/temporary.mp3'},'Těší mě.':{status:'approved',path:'./speaking-audio/../private.mp3'}};
assert.equal(audioContext.approvedAudio('Ahoj!'),'./speaking-audio/clip01.mp3');
assert.equal(audioContext.approvedAudio('Jsem'),null);
assert.equal(audioContext.approvedAudio('A vy?'),null);
assert.equal(audioContext.approvedAudio('Těší mě.'),null);
assert.equal(audioContext.approvedAudio('Ahoj'),null);
assert(html.includes('speaking-audio-manifest.js'));
console.log('Audio registry exact text, approval and safe local path gates passed.');
