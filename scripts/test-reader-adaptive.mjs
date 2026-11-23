import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 tokenizeCzech,validateReaderChapter,startReaderChapter,recordReaderEvent,
 reviewReaderCard,getReaderAdaptation,readerWordTooltip,
 createLearnerReadingProfile,commitReaderAttempt,activateGlobalReadingCards,
 reviewGlobalReadingCard,suggestLearningFocus
} from "../curriculum/system-v1/reader-adaptive-engine.mjs";

const read=path=>JSON.parse(readFileSync(new URL("../"+path,import.meta.url),"utf8"));
const data=read("curriculum/system-v1/reader-stories.content.draft.json");
const top100=read("curriculum/system-v1/lexicon/top100.candidate.json");
const all=data.books.flatMap(b=>b.chapters);
assert.equal(data.status,"DRAFT_STORIES_AND_GLOSSES_NOT_NATIVE_REVIEWED_NOT_PUBLISHED");
assert.equal(data.books.length,3);
assert.deepEqual(data.books.map(b=>b.genre),["cosmos_mystery","romance_mystery","science_curiosity"]);
assert.equal(all.length,3);
assert.equal(all.flatMap(c=>c.sentences).length,25);
assert.equal(data.form_annotations.length,64);
assert.equal(new Set(data.form_annotations.map(f=>f.surface_form_cs)).size,64);
assert.equal(data.phrase_annotations.length,1);
assert.ok(data.form_annotations.every(f=>f.audio_asset_id===null&&f.editorial_status==="PENDING"));

const allSeen=new Set();
for (const chapter of all) {
 const {bySurface}=validateReaderChapter(chapter,data.form_annotations);
 assert.ok(chapter.comprehension_checks.length>=2);
 for (const sentence of chapter.sentences) {
  assert.ok(sentence.translation_mn_draft&&sentence.audio_asset_id===null);
  const tokens=tokenizeCzech(sentence.text_cs);
  assert.ok(tokens.length>0);
  for(const t of tokens){
   assert.ok(bySurface.has(t.normalized));
   allSeen.add(t.normalized);
  }
 }
}
assert.deepEqual([...allSeen].sort(),data.form_annotations.map(x=>x.surface_form_cs).sort());
const topIds=new Set(top100.items.map(x=>x.lexeme_id));
for (const a of data.form_annotations.filter(x=>x.lexeme_source==="existing_candidate"))
 assert.ok(topIds.has(a.lexeme_id));
const stance=data.form_annotations.find(x=>x.surface_form_cs==="stojí");
assert.equal(stance.sense_key,"stát::stand_position");
assert.equal(stance.contextual_sense_review,"PENDING_CRITICAL_PRICE_VS_STAND");


assert.equal(tokenizeCzech("Být není byt.").length,3);
assert.notEqual(tokenizeCzech("byt")[0].normalized,tokenizeCzech("být")[0].normalized);
const star=all[0],love=all[1],science=all[2];
const moon=data.form_annotations.find(x=>x.surface_form_cs==="měsíc");
assert.equal(moon.sense_key,"měsíc::celestial_body","Month vs Moon must not be silently conflated");
assert.equal(science.reading_mode,"A1_ASSISTED");
const scienceS=startReaderChapter({chapter:science,formAnnotations:data.form_annotations,
 phraseAnnotations:data.phrase_annotations,cardActivationCap:4,
 knownSenseKeys:["být::intro_reader_context"]});
assert.equal(scienceS.tokens.some(x=>x.sense_key==="měsíc::celestial_body"&&!x.sense_known),true);
const qScience=science.comprehension_checks[0];
let sci=recordReaderEvent(scienceS,{type:"optional_comprehension_answer",question_id:qScience.id,
 choice_index:0,at_ms:33000},{chapter:science});
assert.equal(sci.metrics.optional_quiz_correct,1);


assert.throws(()=>validateReaderChapter({
 chapter_id:"BAD",sentences:[{sentence_id:"bad-1",text_cs:"Nové slovo.",translation_mn_draft:""}]
},data.form_annotations),/Incomplete reader sentence/);
assert.throws(()=>validateReaderChapter({
 chapter_id:"BAD",sentences:[{sentence_id:"bad-1",text_cs:"Kosmos letí.",translation_mn_draft:"Сансар ниснэ."}]
},data.form_annotations),/Unmapped Czech word/);

let s=startReaderChapter({chapter:star,formAnnotations:data.form_annotations,
 phraseAnnotations:data.phrase_annotations,
 knownSenseKeys:["být::intro_reader_context"],cardActivationCap:3});
assert.equal(s.chapter_read,false);
assert.equal(s.pronunciation_mastered,false);
assert.equal(s.flashcards.length,0);
assert.equal(s.tokens.some(t=>t.sense_known&&t.lemma_cs==="být"),true);
const light=s.tokens.find(t=>t.lemma_cs==="světlo");
assert.ok(light && !light.sense_known);
const lightTooltip=readerWordTooltip(s,{sentence_id:light.sentence_id,start:light.start});
assert.equal(lightTooltip.surface_cs,"světlo");
assert.equal(lightTooltip.can_add_flashcard,true);
assert.equal(lightTooltip.audio_status,"NOT_REQUESTED");

const pause={
 type:"active_pause",token_order:light.token_order,duration_ms:18000,foreground:true,
 at_ms:1000,event_id:"pause-one"
};
s=recordReaderEvent(s,pause);
assert.equal(getReaderAdaptation(s).weak_evidence.length,0,"Time alone must not diagnose weakness");
s=recordReaderEvent(s,pause);
assert.equal(s.evidence[light.card_key].active_pauses,1,"Double event id must be ignored");
s=recordReaderEvent(s,{
 type:"active_pause",token_order:light.token_order,duration_ms:999000,foreground:true,
 at_ms:1500,event_id:"background-long"
});
assert.equal(s.evidence[light.card_key].active_pauses,1,"Extreme pauses are not reading difficulty");
s=recordReaderEvent(s,{type:"gloss_opened",token_order:light.token_order,at_ms:2000,event_id:"lookup-one"});
assert.equal(s.flashcards.length,1);
assert.equal(s.flashcards[0].lexeme_id,light.lexeme_id);
assert.equal(s.flashcards[0].card_key,light.card_key);
s=recordReaderEvent(s,{type:"gloss_opened",token_order:light.token_order,at_ms:3000,event_id:"lookup-two"});
assert.equal(s.flashcards.length,1,"Repeated same lemma/sense must not create duplicate cards");
assert.equal(getReaderAdaptation(s).prioritized_cards[0],light.card_key,"Repeated lookups are a weakness signal");

const answer=star.comprehension_checks[0];
s=recordReaderEvent(s,{type:"optional_comprehension_answer",question_id:answer.id,choice_index:1,at_ms:4000},
 {chapter:star});
assert.equal(s.metrics.optional_quiz_wrong,1);
assert.ok(s.flashcards.some(c=>c.display_cs==="dopis"));
s=recordReaderEvent(s,{type:"optional_comprehension_answer",question_id:answer.id,choice_index:0,at_ms:5000},
 {chapter:star});
assert.equal(s.metrics.optional_quiz_correct,1);
assert.equal(s.chapter_read,false);
s=recordReaderEvent(s,{type:"chapter_finished",at_ms:6000,event_id:"finish-star"});
assert.equal(s.chapter_read,true);
assert.equal(s.pronunciation_mastered,false);
assert.equal(s.flashcards.length,3,"Daily active card limit");
assert.ok(s.card_backlog.length>0,"All remaining unknowns kept in backlog");
const keys=new Set([...s.flashcards,...s.card_backlog].map(c=>c.card_key));
assert.equal(keys.size,s.flashcards.length+s.card_backlog.length,"No duplicate word/sense cards");
assert.ok(s.flashcards.every(c=>c.editorial_status==="UNVERIFIED_DRAFT"));
const guidance=getReaderAdaptation(s);
assert.equal(guidance.status,"RULE_BASED_ADAPTATION_NOT_LIVE_AI");
assert.equal(guidance.reading_support,"SHOW_INLINE_GLOSS_AND_OFFER_SHORTER_NEXT_PASSAGE");
assert.equal(guidance.next_action,"REVIEW_WEAK_WORDS_IN_NEW_SENTENCES");

const card=s.flashcards[0];
const originalDue=card.due_at_ms;
s=reviewReaderCard(s,{card_key:card.card_key,result:"independent_correct",at_ms:7000});
assert.equal(s.flashcards[0].successful_independent_reviews,1);
assert.ok(s.flashcards[0].due_at_ms>originalDue);
assert.equal(s.pronunciation_mastered,false);
s=reviewReaderCard(s,{card_key:card.card_key,result:"incorrect",at_ms:8000});
assert.equal(s.flashcards[0].review_interval_index,0);
assert.throws(()=>reviewReaderCard(s,{card_key:"nonexistent",result:"incorrect",at_ms:9000}),/not yet activated/);

let l=startReaderChapter({chapter:love,formAnnotations:data.form_annotations,
 phraseAnnotations:data.phrase_annotations,cardActivationCap:4});
const loveToken=l.tokens.find(x=>x.text==="rád");
assert.equal(loveToken.card_key,"phrase:CS-READ-PHR-LOVE-001");
l=recordReaderEvent(l,{type:"gloss_opened",token_order:loveToken.token_order,at_ms:10000});
assert.equal(l.flashcards[0].display_cs,"Mám tě rád.");
assert.ok(l.flashcards[0].meaning_mn.includes("эрэгтэй"));
l=recordReaderEvent(l,{type:"word_recognized_by_stt",token_order:loveToken.token_order,at_ms:11000});
assert.equal(l.pronunciation_mastered,false);
assert.equal(l.evidence[loveToken.card_key].pronunciation_uncertain,1);
l=recordReaderEvent(l,{type:"chapter_finished",at_ms:12000},{chapter:love});
assert.equal(l.flashcards.length,4);
assert.ok(l.card_backlog.length>0);
assert.equal(l.pronunciation_mastered,false);
assert.equal(l.chapter_read,true);
assert.equal(l.status,"EDITORIAL_PREVIEW_NO_CEFR_MASTERY");


// Reading → global flashcards → optional learning coach. No service calls.
let learner=createLearnerReadingProfile();
assert.equal(learner.reading_history.length,0);
assert.equal(learner.native_speech_proficiency,"NOT_ASSESSED");
assert.throws(()=>commitReaderAttempt(learner,startReaderChapter({
  chapter:star,formAnnotations:data.form_annotations
}),{attempt_id:"bad",story_id:"R-COS-01",genre:"cosmos_mystery",at_ms:30000}),
/Only explicit completed reading/);
learner=commitReaderAttempt(learner,s,{
 attempt_id:"reader-attempt-001",story_id:"R-COS-01",genre:"cosmos_mystery",at_ms:40000
});
learner=commitReaderAttempt(learner,l,{
 attempt_id:"reader-attempt-002",story_id:"R-LOVE-01",genre:"romance_mystery",at_ms:50000
});
assert.equal(learner.reading_history.length,2);
const oldCount=learner.card_backlog.length;
assert.ok(oldCount>=6);
assert.equal(new Set(learner.card_backlog.map(x=>x.card_key)).size,oldCount);
const repeated=commitReaderAttempt(learner,l,{
 attempt_id:"reader-attempt-002",story_id:"R-LOVE-01",genre:"romance_mystery",at_ms:50000
});
assert.equal(repeated.reading_history.length,2,"Repeat commit must be idempotent");
learner=activateGlobalReadingCards(learner,{max_active:4});
assert.equal(learner.flashcards.length,4);
assert.equal(learner.card_backlog.length,oldCount-4);
const firstKey=learner.flashcards[0].card_key;
let guide=suggestLearningFocus(learner,{now_ms:86_400_000,desired_genre:"science_curiosity"});
assert.equal(guide.status,"EVIDENCE_BASED_RULES_NOT_LIVE_AI");
assert.equal(guide.learner_preference_genre,"science_curiosity");
assert.ok(guide.weak_contextual_sense_keys.length>=1);
learner=reviewGlobalReadingCard(learner,{
 card_key:firstKey,result:"independent_correct",at_ms:86_400_000
});
assert.equal(learner.known_reading_sense_keys.includes(firstKey),false);
learner=reviewGlobalReadingCard(learner,{
 card_key:firstKey,result:"independent_correct",at_ms:259_200_000
});
if (!firstKey.startsWith("phrase:"))
  assert.equal(learner.known_reading_sense_keys.includes(firstKey),true,
    "Two independent reviews on distinct days = reading familiarity only");
assert.equal(learner.native_speech_proficiency,"NOT_ASSESSED");
learner=reviewGlobalReadingCard(learner,{
 card_key:firstKey,result:"incorrect",at_ms:345_600_000
});
assert.equal(learner.known_reading_sense_keys.includes(firstKey),false,
  "Forgetting must remove provisional reading familiarity");
assert.throws(()=>reviewGlobalReadingCard(learner,{
 card_key:"UNKNOWN",result:"correct_with_hint",at_ms:400_000_000
}),/Global card not active/);
guide=suggestLearningFocus(learner,{now_ms:432_000_000});
assert.ok(guide.due_flashcards.length>0,"Real due cards must be scheduled");
assert.equal(learner.reading_history[0].note.includes("NOT mastery"),true);

console.log("Reader adaptive QA PASS: 3 draft reader topics / 25 sentences / 64 annotated Czech forms; contextual sense, genre, phrase card, no duplicates, 3/4-card cap, backlog, learning signals and no fake AI/audio/CEFR mastery.");
