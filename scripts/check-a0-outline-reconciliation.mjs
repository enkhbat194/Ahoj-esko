// Verify immutable source snapshot, current A0 outline and documented differences. Does not imply pedagogical approval.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const get=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const repo=get('public/cesky-reading-uiux/a0-curriculum.json');
const drive=get('docs/data/a0_outline_drive_snapshot_2026-11-22.json');
const rec=get('docs/data/a0_outline_reconciliation_2026-11-23.json');
const lessons=repo.topics.flatMap(t=>t.lessons.map(l=>({id:l.id,title_mn:l.title_mn})));
const seen=(xs,kind)=>{const ids=xs.map(x=>x.id);assert.equal(new Set(ids).size,ids.length,kind+' duplicate IDs');};
assert.equal(repo.topics.length,16);assert.equal(lessons.length,140);assert.equal(drive.entries.length,140);seen(lessons,'GitHub');seen(drive.entries,'Drive');
const byId=new Map(lessons.map(x=>[x.id,x.title_mn]));
const discrepancies=drive.entries.filter(x=>{assert.ok(byId.has(x.id),'GitHub missing '+x.id);return byId.get(x.id)!==x.title_mn;});
assert.equal(discrepancies.length,rec.entries.length,'reconciliation snapshot outdated');
assert.equal(discrepancies.length,62,'expected historical mismatch count changed; reconcile before updating snapshot');
const expected=new Set(discrepancies.map(x=>x.id));
for(const r of rec.entries){assert.ok(expected.has(r.skill_id),'unverified conflict '+r.skill_id);assert.equal(byId.get(r.skill_id),r.github_title_mn);const dr=drive.entries.find(x=>x.id===r.skill_id);assert.equal(dr.title_mn,r.drive_title_mn);assert.ok(r.proposed_title_mn);assert.ok(r.proposed_can_do_mn);assert.equal(r.approved,false);}
assert.equal(new Set(rec.entries.map(x=>x.skill_id)).size,rec.entries.length,'duplicate reconciliation IDs');
console.log('A0 outline source audit PASS: 16 topics, 140 IDs, 62 documented title discrepancies (PROPOSED only)');
