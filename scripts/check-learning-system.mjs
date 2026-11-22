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


const top100=read('curriculum/system-v1/lexicon/top100.candidate.json');
assert.equal(top100.status,'MODEL_EDITORIAL_TOP100_CANDIDATE_UNAPPROVED_NOT_CORPUS_TOP100');
assert.equal(top100.items.length,100,'Top100 candidate requires 100 lexemes');
assert.equal(top100.exact_count,100);
const lexById=new Map(top100.items.map(x=>[x.lexeme_id,x]));
assert.equal(lexById.size,100,'Top100 duplicated ID');
assert.equal(new Set(top100.items.map(x=>x.lemma_cs.normalize('NFC'))).size,100,'Top100 duplicated Czech lemma');
assert.deepEqual(top100.cumulative_stages.top100.ids,top100.items.map(x=>x.lexeme_id));
for(let i=0;i<top100.items.length;i++){
 const w=top100.items[i];
 assert.equal(w.lexeme_id,'CS-LEX-'+String(i+1).padStart(4,'0'));
 assert.equal(w.learning_priority_order,i+1);
 assert.equal(w.sense_id,w.lexeme_id+'-S01');
 assert.ok(w.lemma_cs&&w.part_of_speech&&w.mn_meaning_contextual_draft);
 assert.ok(sids.has(w.first_proposed_session_id),'Lexicon references unknown session '+w.lemma_cs);
 assert.equal(w.corpus_rank,null,'Never fake Czech corpus frequency rank');
 assert.equal(w.approved,false,'No native speaker review yet');
 assert.equal(w.published,false);
 assert.equal(w.audio_status,'NOT_REQUESTED');
}
assert.ok(lexById.has(top100.items.find(x=>x.lemma_cs==='být').lexeme_id),
 'Core být missing');
for(const w of ['to','a','na','do','v'])assert.ok(top100.items.some(x=>x.lemma_cs===w),
 'Missing Czech function word '+w);

const cat=read('curriculum/system-v1/exercise-catalog.json');
assert.equal(cat.templates.length,12);
assert.deepEqual(cat.core_exercises_per_learning_session_recommendation,[7,9]);
assert.ok(cat.pedagogical_stage_relation.includes('NOT 15 separate'));
const byType=new Map(cat.templates.map(x=>[x.exercise_type,x]));
assert.equal(byType.size,cat.templates.length);
for(const type of cat.selection_rules.mandatory)assert.ok(byType.has(type));
for(const x of cat.templates){
 assert.ok(x.title_mn&&Array.isArray(x.required_fields));
 for(const stage of x.pedagogical_stage_ids)assert.ok(
 contract.lesson_cycle.steps.some(s=>s.id===stage),'Unknown stage '+stage);
}

const pack=read('curriculum/system-v1/lessons/a0-intro-001.content.draft.json');
assert.equal(pack.status,'FIRST_A0_TEACHING_PACK_DRAFT_EDITORIAL_PENDING_NOT_IN_APP');
assert.equal(pack.pack_id,'A0-PACK-INTRO-001');
assert.equal(pack.linked_provisional_session_id,'A0-S004');
assert.deepEqual(pack.coverage.authored_skill_ids,['A0-T02-L01','A0-T02-L02']);
assert.deepEqual(pack.coverage.NOT_YET_AUTHORED,['A0-T02-L03']);
const session004=sessionById.get('A0-S004');
assert.deepEqual(pack.coverage.source_session_skill_ids,session004.skill_ids,
 'Declared partial source coverage must be exact');
for(const id of pack.coverage.authored_skill_ids)assert.ok(session004.skill_ids.includes(id));
const newIds=new Set(pack.new_lexeme_ids);
assert.equal(newIds.size,pack.new_lexeme_ids.length);
assert.equal(newIds.size,6,'Intro pilot exceeds 6 new lexemes');
for(const id of newIds){
 assert.ok(lexById.has(id),'unknown lesson lexeme '+id);
 assert.equal(lexById.get(id).first_proposed_session_id,'A0-S004','word assigned to wrong session: '+id);
}
assert.equal(pack.exercises.length,9);
const exerciseIds=new Set();
for(const item of pack.exercises){
 assert.ok(!exerciseIds.has(item.exercise_id));exerciseIds.add(item.exercise_id);
 assert.ok(byType.has(item.type),'Unknown exercise type '+item.type);
 assert.ok(item.instructions_mn&&item.answer_key&&Number.isFinite(item.estimated_seconds));
 if(item.type==='listen_choose')assert.equal(item.gating.status,'BLOCKED_MISSING_APPROVED_AUDIO');
}
for(const type of cat.selection_rules.mandatory)
 assert.ok(pack.exercises.some(x=>x.type===type),'Missing mandatory introductory exercise '+type);
assert.equal(pack.exercises.filter(x=>x.type==='novel_transfer').length,1);
assert.equal(pack.exercises.filter(x=>x.type==='novel_transfer')[0].novel,true);
const packAudioIds=new Set(pack.utterances.map(x=>x.utterance_id));
assert.equal(packAudioIds.size,pack.utterances.length);
for(const u of pack.utterances){
 assert.ok(u.text_cs&&u.mn_natural_draft);
 assert.equal(u.audio_status,'NOT_REQUESTED');
 assert.equal(u.audio_asset_id,null);
 assert.equal(u.published,false);
}
for(const ex of pack.exercises){
 for(const id of ex.utterance_ids??[])assert.ok(packAudioIds.has(id),'Missing utterance '+id);
 for(const pair of ex.pairs??[])assert.ok(packAudioIds.has(pair.utterance_id));
 for(const word of ex.cards??[])assert.ok(newIds.has(word.lexeme_id),'Card outside first lesson vocabulary');
 for(const review of ex.review_targets??[])assert.ok(newIds.has(review.lexeme_id));
}
assert.equal(pack.release.published,false);
assert.equal(pack.release.audio,'NOT_REQUESTED');

console.log('Learning system QA PASS: 72 proposed missions, 16 source A0 topics, 140 stable skills, 53 provisional A0 sessions, 15-stage cycle; 0 published.');
