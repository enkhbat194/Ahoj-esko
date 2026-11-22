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

// v0.2 editorial readiness contract: proposals are evidence, never auto-approved.
// A structural PASS below does NOT certify Czech/Mongolian language quality or audio.
const scope=get('docs/data/a0_14_scope_editorial_decisions_v0_2.json');
const scopeRows=rec.entries.filter(x=>x.classification==='scope_review');
assert.equal(scope.count,14,'14-case register header');
assert.equal(scope.entries.length,14,'14-case register rows');
assert.equal(scopeRows.length,14,'reconciliation cases classified as scope');
assert.equal(new Set(scope.entries.map(x=>x.skill_id)).size,14,'duplicate 14-case IDs');
const scopeMap=new Map(scope.entries.map(x=>[x.skill_id,x]));
for (const r of scopeRows){
  const e=scopeMap.get(r.skill_id);
  assert.ok(e,'missing editorial case '+r.skill_id);
  assert.equal(e.topic_id,r.topic_id,'topic changed '+r.skill_id);
  assert.equal(e.drive_title_mn,r.drive_title_mn,'Drive name drift '+r.skill_id);
  assert.equal(e.github_title_mn,r.github_title_mn,'GitHub name drift '+r.skill_id);
  assert.equal(e.previous_proposed_title_mn,r.proposed_title_mn,'proposal history drift '+r.skill_id);
  for (const key of ['recommended_title_mn','recommended_can_do_mn','register_and_context',
    'exit_assessment_draft','neighbor_overlap_resolution','blockers']) {
    assert.ok(typeof e[key]==='string'&&e[key].trim().length>8,'missing '+key+' '+r.skill_id);
  }
  assert.ok(Array.isArray(e.target_utterances)&&e.target_utterances.length>0,'missing utterance '+r.skill_id);
  for (const u of e.target_utterances){
    assert.ok(u.cz&&u.mn_natural_draft&&u.provenance_status,'incomplete utterance '+r.skill_id);
    assert.equal(u.editorial_verified,false,'unverified Czech sample falsely approved '+r.skill_id);
  }
  assert.ok(Array.isArray(e.external_crosscheck_urls)&&e.external_crosscheck_urls.length>0,
    'missing external cross-check links '+r.skill_id);
  assert.equal(e.approved,false,'scope proposal must remain unapproved '+r.skill_id);
  assert.equal(e.czech_native_signoff,'PENDING');
  assert.equal(e.mongolian_editor_signoff,'PENDING');
  assert.equal(e.audio_pronunciation_signoff,'PENDING');
}
assert.equal(scope.status,'EDITORIAL_DECISION_DRAFT_NOT_APPROVED');
console.log('A0 editorial scope audit PASS: 14/14 source-linked cases, 0 approved; language/audio QA pending');

