import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
import assert from 'node:assert/strict';
function collectAudio(lessons){
 const map=new Map();
 function add(text,lesson,usage){if(typeof text!=="string"||!text.trim())return;const r=map.get(text)||{text,lessons:[],uses:[]};if(!r.lessons.includes(lesson))r.lessons.push(lesson);if(!r.uses.includes(usage))r.uses.push(usage);map.set(text,r);}
 for(const l of lessons)for(const s of l.steps){if(s.type==="learn"){add(s.cz,l.id,"unit");add(s.example,l.id,"example");}if(s.type==="listen")for(const i of s.items)add(i.cz,l.id,"listen");if(s.type==="dialogue"||s.type==="recall")for(const i of s.items){add(i.partner,l.id,"partner");for(const m of i.models)add(m,l.id,"model");}}
 return [...map.values()];
}
function auditAudio(demand,records,voiceMap){
 const ids=new Map();let invalid=0,duplicates=0;const conflicts=new Set();
 for(const r of records){if(typeof r.history_item_id!=="string"||!r.history_item_id||typeof r.text_cs!=="string"||!r.text_cs.trim()||typeof r.voice_id!=="string"||!r.voice_id||!/^[a-f0-9]{64}$/i.test(r.sha256||"")){invalid++;continue;}
 const old=ids.get(r.history_item_id);if(old){duplicates++;if(old.text_cs!==r.text_cs||old.voice_id!==r.voice_id||old.sha256!==r.sha256)conflicts.add(r.history_item_id);continue;}ids.set(r.history_item_id,r);}
 const safe=[...ids.values()].filter(r=>!conflicts.has(r.history_item_id));
 const rows=demand.map(d=>{const exact=safe.filter(r=>r.text_cs===d.text);const roles={female:0,male:0,unknown:0};for(const r of exact){const role=Object.hasOwn(voiceMap,r.voice_id)?voiceMap[r.voice_id]:"unknown";roles[role==="female"||role==="male"?role:"unknown"]++;}
 return {...d,exact_candidates:exact.length,roles,missing_roles:["female","male"].filter(role=>!roles[role]),status:exact.length?"candidate_only":"missing_from_supplied_index"};});
 return {summary:{records_input:records.length,unique_valid:safe.length,invalid,duplicates,conflicting_ids:conflicts.size,texts:rows.length,exact_texts:rows.filter(r=>r.exact_candidates).length,both_known_roles:rows.filter(r=>r.roles.female&&r.roles.male).length,missing_role_slots:rows.reduce((n,r)=>n+r.missing_roles.length,0)},rows,policy:"Exact metadata matches only. No pronunciation QA, file byte verification, or publication approval inferred. No private IDs, paths, URLs or voice IDs in output."};
}
const c={window:{}};new Script(readFileSync('public/cesky-reading-uiux/speaking-pilot-data.js','utf8')).runInNewContext(c);
const demand=collectAudio(c.window.AHOJ_SPEAKING_PILOT.lessons);
const args=process.argv.slice(2);
if(args[0]==='--self-test'){
 const h='a'.repeat(64),r={history_item_id:'h1',text_cs:'Dobrý den.',voice_id:'f',sha256:h,publish_allowed:false};
 const q=auditAudio([{text:r.text_cs},{text:'Dobry den.'}],[r,{...r},{...r,history_item_id:'h2',voice_id:'m'},{...r,history_item_id:'bad',sha256:'x'}],{f:'female',m:'male'});
 assert.equal(q.summary.exact_texts,1);assert.equal(q.summary.both_known_roles,1);assert.equal(q.summary.duplicates,1);assert.equal(q.summary.invalid,1);
 const x=auditAudio([{text:r.text_cs}],[r,{...r,text_cs:'Ahoj!'}],{f:'female'});assert.equal(x.summary.exact_texts,0);assert.equal(x.summary.conflicting_ids,1);
 assert.equal(new Set(demand.map(r=>r.text)).size,demand.length);assert(demand.every(r=>r.lessons.length&&r.uses.length));console.log('Audio demand and candidate audit: PASS');
}else if(args[0]==='--demand'){console.log(JSON.stringify({count:demand.length,rows:demand},null,2));}
else{
 if(args.length<2)throw Error('Usage: node scripts/audit-speaking-audio.mjs VOICE_MAP.json ARCHIVE_INDEX.json [NEW_INDEX.json ...]');
 const roles=JSON.parse(readFileSync(args[0],'utf8'));if(!roles||typeof roles!=='object'||Object.values(roles).some(x=>x!=='female'&&x!=='male'))throw Error('Voice map must map verified voice IDs to female/male');
 const records=args.slice(1).flatMap(p=>{const a=JSON.parse(readFileSync(p,'utf8'));if(!Array.isArray(a.records))throw Error('Missing records array');return a.records;});
 console.log(JSON.stringify(auditAudio(demand,records,roles),null,2));
}
