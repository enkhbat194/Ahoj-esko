import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = path => JSON.parse(readFileSync(resolve(path), 'utf8'));
const source=read('public/cesky-reading-uiux/a0-curriculum.json');
const map=read('curriculum/system-v1/mission-map.json');
const contract=read('curriculum/system-v1/learning-contract.json');
const bands=['A0','A1','A2','B1','B2'];
const counts={A0:16,A1:16,A2:16,B1:12,B2:12};
const idRe=/^(A0|A1|A2|B1|B2)-M\d{2}$/;

assert.equal(map.status,'ARCHITECTURE_AND_MISSION_MAP_DRAFT_NOT_PUBLISHED');
assert.equal(map.missions.length,72);
assert.deepEqual(map.level_order,bands);
assert.deepEqual(map.cefr_label.A0,'Pre-A1 (product-specific A0 label)');
assert.equal(map.counts.missions,72);
assert.deepEqual(map.counts.stage_counts,counts);
assert.equal(map.counts.published_missions,0);
assert.ok(map.scale_warning.includes('NOT 72 completed lessons'));
assert.equal(contract.lesson_cycle.steps.length,15);
assert.deepEqual(contract.lesson_cycle.steps.map(s=>s.id),
  Array.from({length:15},(_,i)=>'S'+String(i+1).padStart(2,'0')));
for(const step of contract.lesson_cycle.steps){
  assert.ok(step.kind&&step.description_mn&&step.ability&&step.contract);
  assert.equal(step.required,true);
}
assert.deepEqual(contract.retrieval.default_due_days_after_success,[1,3,7,14,30]);
assert.equal(contract.feedback_loop.reader_stt_contract.current_word_speaker,'play_audio_for_current_word_only');
assert.equal(contract.audio_factory.asset_contract.unit.startsWith('One utterance per audio file'),true);
const sourceIdList=source.topics.flatMap(t=>t.lessons.map(l=>l.id));
assert.equal(source.topics.length,16);
assert.equal(sourceIdList.length,140);
assert.equal(new Set(sourceIdList).size,140);
const allMissionIds=new Set();
for(let i=0;i<map.missions.length;i++){
  const m=map.missions[i];
  assert.match(m.mission_id,idRe);
  assert.ok(!allMissionIds.has(m.mission_id),'Duplicate mission '+m.mission_id);
  allMissionIds.add(m.mission_id);
  assert.ok(m.title_mn&&m.scenario_mn&&m.can_do_mn&&m.final_task_mn,'Missing mission outcomes');
  assert.ok(Array.isArray(m.language_functions)&&m.language_functions.length);
  assert.equal(m.approved,false);
  assert.equal(m.published,false);
  assert.equal(m.content_status,'NOT_AUTHORED');
  assert.equal(m.exit_assessment_status,'NOT_VERIFIED');
  assert.equal(m.prerequisite_mission_id,i===0?null:map.missions[i-1].mission_id);
}
let offset=0;
for(const band of bands){
 const group=map.missions.filter(m=>m.level===band);
 assert.equal(group.length,counts[band],'Band count '+band);
 for(let i=0;i<group.length;i++){
  const m=group[i];
  assert.equal(m.mission_order,i+1);
  assert.equal(m.mission_id,band+'-M'+String(i+1).padStart(2,'0'));
 }
 offset+=group.length;
}
const sourceA0ByTopic=new Map(source.topics.map(t=>[t.id,t]));
const a0=map.missions.filter(m=>m.level==='A0');
for(let i=0;i<a0.length;i++){
 const expected=source.topics[i];
 const mission=a0[i];
 assert.equal(mission.title_mn,expected.title_mn);
 assert.equal(mission.can_do_mn,expected.final_task_mn);
 assert.deepEqual(mission.skills_ids,expected.lessons.map(l=>l.id));
 assert.equal(mission.outline_status,'EXISTING_140_SKILL_SOURCE_UNRECONCILED');
 assert.ok(mission.planned_sessions.length>=2);
}
const higher=map.missions.filter(m=>m.level!=='A0');
for(const mission of higher){
 assert.equal(mission.outline_status,'DRAFT_LEVEL_PLACEMENT_UNVERIFIED');
 assert.deepEqual(mission.skills_ids,[],'A1-B2 micro skills were not actually authored');
 assert.deepEqual(mission.planned_sessions,[],'A1-B2 teaching sessions must not be claimed');
}
const sids=new Set(),seen=new Set(),sessionById=new Map();
for(const s of map.provisional_a0_sessions){
 assert.match(s.session_id,/^A0-S\d{3}$/);
 assert.ok(!sids.has(s.session_id),'Duplicate session '+s.session_id);
 sids.add(s.session_id);sessionById.set(s.session_id,s);
 assert.ok(s.skill_ids.length>=2&&s.skill_ids.length<=3,'Session requires 2-3 planned targets');
 for(const id of s.skill_ids){assert.ok(!seen.has(id),'Double assigned skill '+id);seen.add(id);}
 assert.deepEqual(s.new_lexical_target_range,[0,6]);
 assert.equal(s.segmentation_status,'PROVISIONAL_AUTO_GROUPING');
 assert.equal(s.content_status,'NOT_AUTHORED');
 assert.equal(s.audio_status,'NOT_GENERATED');
 assert.equal(s.assessment_status,'NOT_VERIFIED');
 assert.equal(s.approved,false);assert.equal(s.published,false);
}
assert.equal(map.provisional_a0_sessions.length,53,'Unexpected A0 session grouping change');
assert.equal(seen.size,140);
assert.deepEqual([...seen].sort(),sourceIdList.sort(),'A0 micro-skill set loss/additions');
for(const m of a0){
 assert.deepEqual(m.planned_sessions.flatMap(id=>sessionById.get(id)?.skill_ids??[]),m.skills_ids,
 'Mission should preserve contiguous source skill order: '+m.mission_id);
}
assert.equal(map.counts.existing_a0_micro_skill_ids,140);
assert.equal(map.counts.provisional_a0_sessions,53);

const pilot=read('curriculum/system-v1/pilots/a0-t02-l01-greetings.draft.json');
assert.equal(pilot.lesson_id,'A0-T02-L01');
assert.equal(pilot.mission_id,'A0-M02');
assert.equal(pilot.session_id,'A0-S004');
assert.equal(pilot.content_status,'EDITORIAL_DRAFT_NO_AUDIO');
assert.equal(pilot.editorial_approved,false);
assert.equal(pilot.audio_ready,false);
assert.equal(pilot.published,false);
assert.equal(pilot.steps.length,15);
assert.deepEqual(pilot.steps.map(s=>s.id),contract.lesson_cycle.steps.map(s=>s.id));
const utterances=new Map(pilot.utterances.map(u=>[u.utterance_id,u]));
assert.equal(utterances.size,pilot.utterances.length,'Repeated utterance identifiers');
assert.equal(utterances.size,7);
const greetingTopic=sourceA0ByTopic.get('A0-T02');
const phraseBank=new Set(greetingTopic.phrases.map(p=>p.cz));
for(const utterance of utterances.values()){
 assert.match(utterance.utterance_id,/^CZ_A0_T02_L01_U\d{3}$/);
 assert.ok(utterance.text_cs&&utterance.mn_natural&&utterance.role);
 assert.equal(utterance.audio_status,'NOT_GENERATED');
 assert.equal(utterance.storage_key,null);
 assert.equal(utterance.content_review,'PENDING');
 if(utterance.type!=='word')
   assert.ok(phraseBank.has(utterance.text_cs),'Unreviewed Czech sentence added to pilot '+utterance.text_cs);
}
for(const step of pilot.steps){
 assert.ok(step.prompt_mn&&step.prompt_mn.length>5,'Missing student-facing instruction '+step.id);
 assert.ok(Array.isArray(step.answer_key),'Step answer key must be explicit '+step.id);
 for(const id of step.utterance_ids??[]) assert.ok(utterances.has(id),'Missing audio unit '+id);
 for(const turn of step.turns??[]) assert.ok(utterances.has(turn.audio_id),'Missing turn '+turn.audio_id);
}
assert.equal(pilot.steps[13].novel_scenario,true);
assert.equal(pilot.steps[14].novel_scenario,true);
assert.equal(pilot.steps[14].scenarios.length,2);
assert.ok(pilot.assessment_warning.includes('cannot certify pronunciation'));


const audioPolicy=read('curriculum/system-v1/audio-voice-policy.json');
assert.equal(audioPolicy.status,'POLICY_DEFINED_NOT_APPLIED_TO_LIVE_APP');
assert.equal(audioPolicy.owner_requirements.reading_section,'male_voice_only');
assert.equal(audioPolicy.owner_requirements.lesson_section,'female_and_male_voices');
assert.equal(audioPolicy.owner_requirements.dictionary,'every_published_czech_spoken_word_form_has_reusable_audio');
for(const k of ['narration','story_dialogue_turns','guided_current_word']){
 assert.deepEqual(audioPolicy.voice_roles.reading[k].allowed_genders,['male'],
  'Reading section should be male-only: '+k);
}
assert.equal(audioPolicy.voice_roles.reading.guided_current_word.playback_scope,'CURRENT_STUCK_WORD_ONLY');
const voices=audioPolicy.voice_roles.lessons.speaker_roles;
assert.equal(voices.dialogue_speaker_a.gender,'female');
assert.equal(voices.dialogue_speaker_b.gender,'male');
assert.equal(audioPolicy.legacy_archive.combined_count,276);
assert.equal(audioPolicy.legacy_archive.original_archive_count+audioPolicy.legacy_archive.remaining_count,276);
assert.equal(Object.values(audioPolicy.legacy_archive.recorded_voice_distribution).reduce((a,b)=>a+b,0),276);
assert.equal(audioPolicy.legacy_archive.publication_allowed,false);
assert.equal(audioPolicy.legacy_archive.regeneration_allowed,false);
assert.equal(audioPolicy.approval.approved,false);
assert.equal(audioPolicy.approval.published,false);
assert.equal(audioPolicy.audio_asset_contract.publication_gate.includes('per_word_published_token_coverage_100_percent'),true);
assert.equal(audioPolicy.voice_roles.dictionary.unit,'pronounced_surface_form');
const inventory=read('curriculum/system-v1/a0-topic-word-audio-inventory.draft.json');
assert.equal(inventory.status,'AUTOMATED_SOURCE_TOKENS_NOT_A_DICTIONARY_AND_NOT_PUBLISHED');
assert.equal(inventory.source_scope,'ONLY_TOPIC_PHRASES_16_A0');
assert.equal(inventory.source_phrase_count,source.topics.reduce((n,t)=>n+t.phrases.length,0));
const generated=new Map();
for(const topic of source.topics)for(const phrase of topic.phrases){
 for(const surface of (phrase.cz.normalize('NFC').match(/\p{L}+(?:[’']\p{L}+)*/gu)??[])){
  const normalized=surface.toLocaleLowerCase('cs-CZ');
  if(!generated.has(normalized))generated.set(normalized,new Set());
  generated.get(normalized).add(topic.id);
 }
}
const inventoryForms=new Set(inventory.items.map(x=>x.orthographic_form_cs));
assert.equal(inventoryForms.size,inventory.items.length,'duplicated lexicon form seeds');
assert.equal(inventoryForms.size,generated.size,'word coverage inventory out of sync');
assert.equal(inventory.count_unique_orthographic_forms,inventoryForms.size);
assert.deepEqual([...inventoryForms].sort(),[...generated.keys()].sort(),
  'Missing/redundant A0 topic word forms');
for(const entry of inventory.items){
 assert.equal(entry.form_id,'cs-form:'+entry.orthographic_form_cs);
 assert.deepEqual([...entry.source_topic_ids].sort(),[...generated.get(entry.orthographic_form_cs)].sort());
 assert.equal(entry.audio_asset_id,null);
 assert.equal(entry.audio_status,'UNMAPPED_WORD_AUDIO');
 assert.equal(entry.release_approved,false);
 assert.equal(entry.lexeme_id,null,'Do not guess lemma mappings automatically');
}

console.log('Learning system QA PASS: 72 proposed missions, 16 source A0 topics, 140 stable skills, 53 provisional A0 sessions, 15-stage cycle; 0 published.');
