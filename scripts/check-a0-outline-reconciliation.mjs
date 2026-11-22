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



// Four wording batches are editorial proposals, NOT 48 approved lessons.
const wordingBatches=[1,2,3,4].map(n=>
  get('docs/data/a0_wording_review_batch_0'+n+'_v0_1.json'));
const wordEntries=wordingBatches.flatMap(b=>b.entries);
const wordingRows=rec.entries.filter(x=>x.classification==='wording_review');
assert.equal(wordEntries.length,48,'wording 48 total');
assert.equal(wordingRows.length,48,'wording classification 48');
assert.equal(new Set(wordEntries.map(x=>x.skill_id)).size,48,'wording duplicated IDs');
assert.equal(wordEntries.filter(x=>x.further_scope_review).length,18,'candidate scope escalation count changed');
const recById=new Map(rec.entries.map(x=>[x.skill_id,x]));
for(const w of wordEntries){
  const r=recById.get(w.skill_id);
  assert.ok(r&&r.classification==='wording_review','unexpected wording id '+w.skill_id);
  assert.equal(w.drive_title_mn,r.drive_title_mn,'wording Drive title changed '+w.skill_id);
  assert.equal(w.github_title_mn,r.github_title_mn,'wording GitHub title changed '+w.skill_id);
  assert.equal(w.initial_proposed_title_mn,r.proposed_title_mn,'wording audit proposal changed '+w.skill_id);
  for(const key of ['recommended_title_mn','recommended_can_do_mn','exit_check_draft',
    'neighbor_skill_boundary','review_issue']) assert.ok(w[key]&&w[key].length>5,key+' missing for '+w.skill_id);
  assert.ok(w.sample_draft?.cz_text&&w.sample_draft?.mn_context_gloss,'sample gap '+w.skill_id);
  assert.equal(w.sample_draft.editorial_verified,false);
  assert.equal(w.approved,false,'wording proposal incorrectly approved '+w.skill_id);
}
const decision=get('docs/data/a0_62_editorial_decision_register_v0_1.json');
assert.equal(decision.register_status,'CONSOLIDATED_EDITORIAL_WORKING_DRAFT_NOT_CANONICAL');
assert.equal(decision.entries.length,62,'62 consolidated cases');
assert.equal(new Set(decision.entries.map(x=>x.skill_id)).size,62,'62-case registry duplicates');
assert.equal(decision.total_counts.original_scope_cases,14);
assert.equal(decision.total_counts.original_wording_cases,48);
assert.equal(decision.total_counts.wording_escalated_scope_candidates,18);
assert.equal(decision.total_counts.wording_only_drafts,30);
const sourceById=new Map([...scope.entries,...wordEntries].map(x=>[x.skill_id,x]));
for(const d of decision.entries){
  const audit=recById.get(d.skill_id);
  assert.ok(audit&&sourceById.has(d.skill_id),'orphan decision '+d.skill_id);
  assert.equal(d.original_classification,audit.classification,'classification drift '+d.skill_id);
  assert.equal(d.drive_title_mn,audit.drive_title_mn,'Drive origin mismatch '+d.skill_id);
  assert.equal(d.github_title_mn,audit.github_title_mn,'repo origin mismatch '+d.skill_id);
  assert.ok(d.recommended_title_mn&&d.recommended_can_do_mn&&d.assessment_draft);
  assert.ok(d.neighbor_scope_draft&&d.issue_or_blocker,'missing decision review '+d.skill_id);
  assert.ok(d.target_examples_draft.length>0,'missing CZ draft '+d.skill_id);
  assert.equal(d.approved,false,'unapproved case falsely published '+d.skill_id);
  assert.equal(d.audio_ready,false,'draft case falsely audio-ready '+d.skill_id);
  assert.equal(d.published,false,'draft case falsely published '+d.skill_id);
  assert.equal(d.czech_review,'PENDING');
  assert.equal(d.mongolian_review,'PENDING');
  assert.equal(d.requires_scope_review,audit.classification==='scope_review'?
    true:sourceById.get(d.skill_id).further_scope_review,'scope classification mismatch');
}
console.log('A0 62-case editorial register QA PASS: 14 scope + 48 wording (18 flagged for scope recheck), 0 approved, 0 audio-ready');
