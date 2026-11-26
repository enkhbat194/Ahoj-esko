import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
import {createHash} from 'node:crypto';
const base='public/cesky-reading-uiux/';
const read=p=>readFileSync(base+p,'utf8');
const context={window:{}};
new Script(read('speaking-pilot-data.js')).runInNewContext(context);
const lessons=context.window.AHOJ_SPEAKING_PILOT.lessons;
assert(lessons.length>0);
assert.equal(new Set(lessons.map(l=>l.id)).size,lessons.length);
const types=new Set(['learn','match','listen','listen_meaning','context','gap','build','dialogue','recall']);
const index=read('index.html'), html=read('speaking-pilot.html'),js=read('speaking-pilot.js');
new Script(js);
for(const l of lessons){
 assert(Array.isArray(l.steps)&&l.steps.length>0);assert.equal(l.steps.at(-1).type,'recall');assert(index.includes(l.id));assert(l.steps.some(s=>s.type==='dialogue'));
 for(const s of l.steps){
  assert(types.has(s.type));
  if(s.type==='match'){assert.equal(new Set(s.pairs.map(p=>p[0])).size,s.pairs.length);assert.equal(new Set(s.pairs.map(p=>p[1])).size,s.pairs.length);}
  if(s.type==='context'||s.type==='gap')assert.equal(s.options.filter(o=>o===s.answer).length,1);
  if(s.type==='listen'||s.type==='listen_meaning')for(const item of s.items){assert.equal(item.options.filter(o=>o===(s.type==='listen_meaning'?item.answer:item.cz)).length,1);if(s.type==='listen_meaning')assert(item.cz&&item.options.every(o=>/[А-Яа-яӨөҮү]/u.test(o)));}
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
console.log('Speaking pilot: '+lessons.length+' lessons, '+lessons.reduce((n,l)=>n+l.steps.length,0)+' steps, structural checks passed.');

const audioContext={window:{}};
new Script(read('speaking-audio-manifest.js')).runInNewContext(audioContext);
for(const entry of Object.values(audioContext.window.AHOJ_SPEAKING_AUDIO)){const variants=entry.voices?Object.entries(entry.voices):[['legacy',entry]];assert(variants.length>0);for(const [role,asset] of variants){assert(['female','male','legacy'].includes(role));assert.equal(asset.status,'approved');assert(/^\.\/speaking-audio\/[a-zA-Z0-9_-]+\.mp3$/.test(asset.path));const bytes=readFileSync(base+asset.path.slice(2));assert(bytes.length>0,'Approved audio asset must exist');if(role!=='legacy'){assert(/^[a-f0-9]{64}$/i.test(asset.sha256||''));assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256.toLowerCase());}}}
audioContext.window.AHOJ_SPEAKING_AUDIO={};
new Script(js.slice(js.indexOf('function approvedAudio('),js.indexOf('function play('))).runInNewContext(audioContext);
assert.equal(audioContext.approvedAudio('Ahoj!'),null);
audioContext.window.AHOJ_SPEAKING_AUDIO={'Ahoj!':{status:'approved',path:'./speaking-audio/clip01.mp3'},'Jsem':{status:'pending',path:'./speaking-audio/clip02.mp3'},'A vy?':{status:'approved',path:'https://example.org/temporary.mp3'},'Těší mě.':{status:'approved',path:'./speaking-audio/../private.mp3'}};
assert.equal(audioContext.approvedAudio('Ahoj!'),'./speaking-audio/clip01.mp3');
assert.equal(audioContext.approvedAudio('Jsem'),null);
assert.equal(audioContext.approvedAudio('A vy?'),null);
assert.equal(audioContext.approvedAudio('Těší mě.'),null);
assert.equal(audioContext.approvedAudio('Ahoj'),null);
assert(html.includes('speaking-audio-manifest.js'));
console.log('Audio registry exact text, approval and safe local path gates passed.');

audioContext.window.AHOJ_SPEAKING_AUDIO={'Dobrý den.':{voices:{female:{status:'approved',path:'./speaking-audio/f01.mp3'},male:{status:'approved',path:'./speaking-audio/m01.mp3'}}},'Ahoj!':{voices:{female:{status:'approved',path:'./speaking-audio/f02.mp3'},male:{status:'pending',path:'./speaking-audio/m02.mp3'}}}};
assert.equal(audioContext.approvedAudio('Dobrý den.','female'),'./speaking-audio/f01.mp3');
assert.equal(audioContext.approvedAudio('Dobrý den.','male'),'./speaking-audio/m01.mp3');
assert.equal(audioContext.approvedAudio('Ahoj!','male'),null);
assert.equal(audioContext.approvedAudio('Dobry den.','female'),null);
console.log('Female/male routing and exact diacritics gates passed.');

function unknownExerciseTokens(ls){
 const known=new Set(['anna','petr']),errors=[];
 const words=s=>String(s||'').normalize('NFC').toLocaleLowerCase('cs-CZ').match(/\p{L}+/gu)||[];
 for(const l of ls)for(const [i,s] of l.steps.entries()){
  if(s.type==='learn'){for(const w of [...words(s.cz),...words(s.example)])known.add(w);continue;}
  let texts=[];
  if(s.type==='match')texts=s.pairs.map(p=>p[0]);
  if(s.type==='listen')texts=s.items.flatMap(x=>[x.cz,...x.options]);
  if(s.type==='listen_meaning')texts=s.items.map(x=>x.cz);
  if(s.type==='build')texts=s.tokens;
  if(s.type==='gap')texts=[s.cz,...s.options];
  if(s.type==='context')texts=s.options;
  if(s.type==='recall'||s.type==='dialogue')texts=s.items.flatMap(x=>[x.partner,...x.models]);
  const missing=[...new Set(texts.flatMap(words).filter(w=>!known.has(w)))];
  if(missing.length)errors.push({lesson:l.id,step:i+1,missing});
 }
 return errors;
}
// Surface vocabulary prerequisite test; names Anna/Petr are scenario context.
// This does not certify grammar, semantics, speech or pronunciation.
assert.deepEqual(unknownExerciseTokens(lessons),[]);
const broken=JSON.parse(JSON.stringify(lessons));
broken[0].steps.find(s=>s.type==='listen').items[0].options.push('mléko');
assert(unknownExerciseTokens(broken).some(x=>x.missing.includes('mléko')));
console.log('Cumulative vocabulary gate passed; negative fixture detected.');

const finalAssessment=lessons.find(l=>l.assessment===true);
assert(finalAssessment);
assert(!finalAssessment.steps.some(s=>s.type==='learn'),'Final assessment cannot introduce new target material');
assert(finalAssessment.steps.filter(s=>s.type==='dialogue').length>=2);
assert(finalAssessment.steps.at(-1).items.some(x=>x.open),'Include learner-supplied name');
console.log('Final chapter assessment structure passed.');

const pilots=lessons.filter(l=>l.review_status==='pilot_candidate');
assert(pilots.length>0);assert(lessons.some(l=>l.review_status==='legacy_draft_unvalidated'));
assert(new Set(lessons.map(l=>l.steps.length)).size>1,'Flexible lesson lengths must be exercised');
for(const l of pilots){assert(l.revision>=2);assert(l.steps.some(s=>s.type==='listen_meaning'));assert(l.steps.some(s=>s.type==='dialogue'&&s.items.every(i=>!i.partner||i.listenFirst)));}
console.log('Pilot evidence types and flexible lengths passed.');
