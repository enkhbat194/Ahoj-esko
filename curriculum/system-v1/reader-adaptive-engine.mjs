/**
 * AHOJ independent reader core, no network, audio generation or browser storage.
 * Pure functions: callers persist state through their own approved persistence layer.
 * Reading for pleasure is not a quiz gate. Signals are hints, not a diagnosis or CEFR score.
 */
const TOKEN_RE = /\p{L}+(?:[’']\p{L}+)*/gu;
const REVIEW_DAYS = [1, 3, 7, 14, 30];
const DAY = 86_400_000;
const LOWER = s => String(s ?? "").normalize("NFC").toLocaleLowerCase("cs-CZ");
const unique = arr => [...new Set(arr)];

export function tokenizeCzech(text) {
  return [...String(text ?? "").matchAll(TOKEN_RE)].map(m => ({
    text: m[0], normalized: LOWER(m[0]), start: m.index, end: m.index + m[0].length
  }));
}
export function validateReaderChapter(chapter, formAnnotations) {
  if (!chapter?.chapter_id || !Array.isArray(chapter.sentences))
    throw new Error("Invalid chapter");
  if (!Array.isArray(formAnnotations)) throw new Error("Missing form annotations");
  const bySurface = new Map();
  const byId = new Map();
  for (const item of formAnnotations) {
    if (!item.form_id || !item.sense_key || !item.lexeme_id || !item.surface_form_cs)
      throw new Error("Incomplete reader form annotation");
    const normalized=LOWER(item.surface_form_cs);
    if (bySurface.has(normalized) || byId.has(item.form_id))
      throw new Error("Duplicate/ambiguous form record: "+normalized);
    bySurface.set(normalized,item);
    byId.set(item.form_id,item);
  }
  if (!chapter.sentences.length) throw new Error("Empty chapter");
  for (const sentence of chapter.sentences) {
    if (!sentence.sentence_id || !sentence.text_cs || !sentence.translation_mn_draft)
      throw new Error("Incomplete reader sentence");
    const tokens=tokenizeCzech(sentence.text_cs);
    if (!tokens.length) throw new Error("Empty Czech sentence: "+sentence.sentence_id);
    for (const word of tokens)
      if (!bySurface.has(word.normalized))
        throw new Error("Unmapped Czech word "+word.text+" in "+sentence.sentence_id);
  }
  return {bySurface,byId};
}

function keyFor(item, phrases=[], sentenceId=null) {
  const phrase = phrases.find(p => p.card_unit==="fixed_phrase" &&
    p.source_sentence_id===sentenceId &&
    LOWER(p.trigger_surface_form_cs)===LOWER(item.surface_form_cs));
  return phrase ? "phrase:"+phrase.phrase_id : item.sense_key;
}
function asCard(item, cardKey, reason, atMs, phrase) {
  const phraseCard=cardKey.startsWith("phrase:");
  return {
    card_key:cardKey, lexeme_id:item.lexeme_id, form_id:item.form_id,
    display_cs:phraseCard ? phrase.text_cs : item.surface_form_cs,
    meaning_mn:phraseCard ? phrase.translation_mn : item.meaning_mn_in_this_context_draft,
    card_unit:phraseCard?"fixed_phrase":"lexeme_in_context",
    reason_first_queued:reason, created_at_ms:atMs, due_at_ms:atMs+DAY,
    successful_independent_reviews:0, review_interval_index:0,
    audio_asset_id:null, audio_status:"NOT_REQUESTED",
    editorial_status:"UNVERIFIED_DRAFT"
  };
}
function cardCandidates(state) {
  const first = new Map();
  for (const token of state.tokens) {
    if (token.role==="context_only" || state.known_sense_keys.includes(token.sense_key))
      continue;
    if (!first.has(token.card_key)) first.set(token.card_key,token);
  }
  // Priority words were selected editorially for the particular story,
  // but all unfamiliar words remain available for on-demand glossary/review.
  return [...first.values()].sort((a,b) =>
    Number(b.role==="target")-Number(a.role==="target") ||
    a.token_order-b.token_order
  );
}
function addCard(state, cardKey, reason, atMs) {
  if (state.flashcards.some(c=>c.card_key===cardKey)) return;
  const token=state.tokens.find(t=>t.card_key===cardKey);
  if (!token || token.role==="context_only") return;
  const phrase=state.phrases.find(p=>"phrase:"+p.phrase_id===cardKey);
  const card=asCard(token,cardKey,reason,atMs,phrase);
  if (state.flashcards.length < state.card_activation_cap)
    state.flashcards.push(card);
  else if (!state.card_backlog.some(c=>c.card_key===cardKey))
    state.card_backlog.push(card);
}
function record(state,key) {
  return state.evidence[key] ?? (state.evidence[key]={
    lookups:0,wrong_answers:0,independent_correct:0,retries:0,active_pauses:0,
    pronunciation_uncertain:0
  });
}
export function startReaderChapter({
  chapter,formAnnotations,phraseAnnotations=[],
  knownSenseKeys=[],knownFormIds=[],cardActivationCap=4
}) {
  const {bySurface}=validateReaderChapter(chapter,formAnnotations);
  const tokens=[];
  for (const s of chapter.sentences) {
    for (const t of tokenizeCzech(s.text_cs)) {
      const a=bySurface.get(t.normalized);
      tokens.push({
        sentence_id:s.sentence_id, token_order:tokens.length, text:t.text,
        start:t.start,end:t.end,form_id:a.form_id,
        lemma_cs:a.lemma_cs, lexeme_id:a.lexeme_id,sense_key:a.sense_key,
        meaning_mn_draft:a.meaning_mn_in_this_context_draft,
        role:a.teaching_role, editorial_status:a.editorial_status,
        form_known:knownFormIds.includes(a.form_id),
        sense_known:knownSenseKeys.includes(a.sense_key),
        card_key:keyFor(a,phraseAnnotations,s.sentence_id)
      });
    }
  }
  if (!Number.isInteger(cardActivationCap)||cardActivationCap<1||cardActivationCap>20)
    throw new Error("Invalid card activation cap");
  const state={
    schema_version:"0.1.0",status:"EDITORIAL_PREVIEW_NO_CEFR_MASTERY",
    chapter_id:chapter.chapter_id,known_sense_keys:unique(knownSenseKeys),
    tokens,phrases:phraseAnnotations.filter(p=>p.chapter_id===chapter.chapter_id),
    card_activation_cap:cardActivationCap,
    flashcards:[],card_backlog:[], evidence:{},answer_log:[],
    processed_event_ids:[],chapter_read:false,pronunciation_mastered:false,
    reading_profile:{feedback_mode:"CONTEXTUAL",long_pause_samples:0},
    metrics:{glossary_opens:0,reading_retries:0,optional_quiz_correct:0,optional_quiz_wrong:0}
  };
  return state;
}
function validateEvent(state,event) {
  if (!state || !event || typeof event.type!=="string" ||
      !Number.isFinite(event.at_ms) || event.at_ms<0)
    throw new Error("Invalid reading event or timestamp");
  if (event.event_id && state.processed_event_ids.includes(event.event_id)) return false;
  return true;
}
export function recordReaderEvent(oldState,event,{chapter}={}) {
  if (!validateEvent(oldState,event)) return oldState;
  const state=structuredClone(oldState);
  if (event.event_id) state.processed_event_ids.push(event.event_id);
  const findToken=()=>state.tokens.find(t=>(event.form_id&&t.form_id===event.form_id) ||
    (event.sense_key&&t.sense_key===event.sense_key) ||
    (event.token_order!==undefined&&t.token_order===event.token_order));
  const match=findToken();
  switch(event.type) {
    case "gloss_opened":
    case "marked_unknown": {
      if (!match) throw new Error("Unknown glossary target");
      record(state,match.card_key).lookups++;
      state.metrics.glossary_opens++;
      addCard(state,match.card_key,event.type,event.at_ms);
      break;
    }
    case "reading_retry": {
      if (!match) throw new Error("Unknown retry target");
      record(state,match.card_key).retries++;
      state.metrics.reading_retries++;
      break;
    }
    case "word_recognized_by_stt": {
      if (!match) throw new Error("Unknown speech target");
      // Recognition ≠ intelligible pronunciation; never add "mastered".
      record(state,match.card_key).pronunciation_uncertain++;
      break;
    }
    case "active_pause": {
      if (!match) throw new Error("Unknown pause target");
      // Ignore background tabs/screen locks and extreme outliers.
      if (event.foreground===true &&
        Number.isFinite(event.duration_ms) &&
        event.duration_ms>=12000 && event.duration_ms<=60000) {
        record(state,match.card_key).active_pauses++;
        state.reading_profile.long_pause_samples++;
      }
      break;
    }
    case "optional_comprehension_answer": {
      const q=chapter?.comprehension_checks?.find(x=>x.id===event.question_id);
      if (!q) throw new Error("Unknown chapter comprehension question");
      const correct=Number.isInteger(event.choice_index)&&event.choice_index===q.correct_index;
      state.answer_log.push({question_id:q.id,choice_index:event.choice_index,correct,at_ms:event.at_ms});
      if (correct) state.metrics.optional_quiz_correct++;
      else state.metrics.optional_quiz_wrong++;
      const targets=state.tokens.filter(t=>q.focus.includes(t.lemma_cs));
      for (const key of unique(targets.map(t=>t.card_key))) {
        const e=record(state,key);
        if (correct) e.independent_correct++;
        else {e.wrong_answers++;addCard(state,key,"comprehension_error",event.at_ms);}
      }
      break;
    }
    case "chapter_finished": {
      state.chapter_read=true;
      // The user read the story. It is *not* a certificate of listening/speaking/CEFR.
      // Keep every unknown as a deduplicated candidate, but activate only the
      // first few cards. Other cards remain in a backlog for later sessions.
      for(const t of cardCandidates(state))
        addCard(state,t.card_key,"unknown_in_chapter",event.at_ms);
      break;
    }
    default: throw new Error("Unsupported reading event "+event.type);
  }
  return state;
}
export function reviewReaderCard(oldState,{
  card_key,result,at_ms
}) {
  if(!Number.isFinite(at_ms)||at_ms<0)throw new Error("Review needs timestamp");
  if(!["independent_correct","correct_with_hint","incorrect"].includes(result))
    throw new Error("Unknown flashcard review result");
  const state=structuredClone(oldState);
  const card=state.flashcards.find(c=>c.card_key===card_key);
  if(!card)throw new Error("Card not yet activated: "+card_key);
  if(result==="independent_correct"){
    card.successful_independent_reviews++;
    card.review_interval_index=Math.min(card.review_interval_index+1,REVIEW_DAYS.length-1);
  }else if(result==="incorrect")card.review_interval_index=0;
  else card.review_interval_index=Math.max(0,card.review_interval_index-1);
  card.due_at_ms=at_ms+REVIEW_DAYS[card.review_interval_index]*DAY;
  card.last_result=result;
  card.last_reviewed_at_ms=at_ms;
  // Review performance contributes evidence but does not establish CEFR or pronunciation.
  const e=record(state,card_key);
  if(result==="incorrect")e.wrong_answers++;
  else if(result==="independent_correct")e.independent_correct++;
  return state;
}
export function getReaderAdaptation(state) {
  const focus=Object.entries(state.evidence).map(([card_key,x])=>{
    const nonTimeStruggle=x.lookups+x.wrong_answers+x.retries;
    const weak=nonTimeStruggle>=2 ||
      (x.active_pauses>=2 && nonTimeStruggle>=1);
    const urgency=x.wrong_answers*3+x.lookups+x.retries+
      (x.active_pauses>=2&&nonTimeStruggle>=1?1:0);
    return {card_key,weak,urgency,lookups:x.lookups,
      errors:x.wrong_answers,pauses:x.active_pauses};
  }).filter(x=>x.weak).sort((a,b)=>b.urgency-a.urgency);
  const quizAttempts=state.metrics.optional_quiz_correct+state.metrics.optional_quiz_wrong;
  const readingSupport=focus.length>0 || (quizAttempts>=2&&state.metrics.optional_quiz_wrong>=2)
    ? "SHOW_INLINE_GLOSS_AND_OFFER_SHORTER_NEXT_PASSAGE":"NORMAL_CONTEXTUAL_READER";
  return {
    status:"RULE_BASED_ADAPTATION_NOT_LIVE_AI",
    reading_support:readingSupport,
    prioritized_cards:focus.map(x=>x.card_key),
    weak_evidence:focus,
    pending_flashcards:state.flashcards.length,
    backlog_flashcards:state.card_backlog.length,
    next_action:focus.length>0 ? "REVIEW_WEAK_WORDS_IN_NEW_SENTENCES" :
      state.chapter_read ? "OFFER_NEXT_CHAPTER_BASED_ON_INTEREST" : "CONTINUE_STORY",
    warning:"Pause duration alone is not a weakness signal. A chapter finished or STT recognized is not language mastery."
  };
}
export function readerWordTooltip(state,{sentence_id,start}){
  const token=state.tokens.find(t=>t.sentence_id===sentence_id&&t.start===start);
  if(!token)throw new Error("Unknown reading token");
  return {surface_cs:token.text,lemma_cs:token.lemma_cs,
    mn_meaning_draft:token.meaning_mn_draft,
    is_known_sense:token.sense_known,is_known_form:token.form_known,
    can_add_flashcard:token.role!=="context_only",
    editorial_status:token.editorial_status,
    audio_status:"NOT_REQUESTED", pronunciation_score_available:false};
}

/**
 * Cross-feature data contract: the caller persists this JSON as learner data.
 * Reader text and global cards are separate. It does not collect personally
 * identifying data and does not send events to AI or third parties.
 */
export function createLearnerReadingProfile() {
  return {
    schema_version:"0.1.0",status:"LOCAL_PROFILE_SCHEMA_NOT_CONNECTED_TO_APP",
    reading_attempt_ids:[],reading_history:[],lexical_evidence:{},
    flashcards:[],card_backlog:[],known_reading_sense_keys:[],
    topic_preferences:[],native_speech_proficiency:"NOT_ASSESSED"
  };
}
function accumulateEvidence(target,addition){
  for(const field of ["lookups","wrong_answers","independent_correct","retries",
    "active_pauses","pronunciation_uncertain"]){
    target[field]=(target[field]||0)+(addition[field]||0);
  }
}
export function commitReaderAttempt(oldProfile,readerState,{
  attempt_id,story_id,genre,at_ms
}) {
  if (!attempt_id || !story_id || !genre || !Number.isFinite(at_ms)||at_ms<0)
    throw new Error("Reader profile commit needs stable attempt/story/genre and timestamp");
  if (!readerState?.chapter_read)
    throw new Error("Only explicit completed reading can be archived; partial session remains separate");
  if (oldProfile.reading_attempt_ids.includes(attempt_id))
    return oldProfile;
  const profile=structuredClone(oldProfile);
  profile.reading_attempt_ids.push(attempt_id);
  profile.reading_history.push({
    attempt_id,story_id,genre,chapter_id:readerState.chapter_id,
    at_ms,lookups:readerState.metrics.glossary_opens,
    optional_quiz_correct:readerState.metrics.optional_quiz_correct,
    optional_quiz_wrong:readerState.metrics.optional_quiz_wrong,
    note:"Reading completed is NOT mastery or CEFR grade"
  });
  for(const [key,e] of Object.entries(readerState.evidence)){
    const target=profile.lexical_evidence[key] ??
      (profile.lexical_evidence[key]={});
    accumulateEvidence(target,e);
  }
  const mergeCard=card=>{
    if(profile.flashcards.some(c=>c.card_key===card.card_key)||
       profile.card_backlog.some(c=>c.card_key===card.card_key))return;
    // Keep global cap management to app preferences; no card is dropped.
    profile.card_backlog.push(structuredClone(card));
  };
  for(const card of [...readerState.flashcards,...readerState.card_backlog])mergeCard(card);
  return profile;
}
export function activateGlobalReadingCards(oldProfile,{max_active=4}={}) {
  if(!Number.isInteger(max_active)||max_active<1||max_active>100)
    throw new Error("Invalid global card cap");
  const profile=structuredClone(oldProfile);
  while(profile.flashcards.length<max_active&&profile.card_backlog.length){
    const c=profile.card_backlog.shift();
    if(!profile.flashcards.some(x=>x.card_key===c.card_key))profile.flashcards.push(c);
  }
  return profile;
}
export function reviewGlobalReadingCard(oldProfile,{card_key,result,at_ms}) {
  if(!Number.isFinite(at_ms)||at_ms<0)throw new Error("Review timestamp required");
  if(!["independent_correct","correct_with_hint","incorrect"].includes(result))
    throw new Error("Unknown review result");
  const profile=structuredClone(oldProfile);
  const card=profile.flashcards.find(x=>x.card_key===card_key);
  if(!card)throw new Error("Global card not active");
  card.review_history??=[];
  card.review_history.push({result,at_ms});
  if(result==="independent_correct"){
    card.successful_independent_reviews++;
    card.review_interval_index=Math.min(card.review_interval_index+1,REVIEW_DAYS.length-1);
  } else if(result==="incorrect")card.review_interval_index=0;
  else card.review_interval_index=Math.max(0,card.review_interval_index-1);
  card.due_at_ms=at_ms+REVIEW_DAYS[card.review_interval_index]*DAY;
  card.last_result=result;
  card.last_reviewed_at_ms=at_ms;
  const evidence=profile.lexical_evidence[card.card_key] ??
    (profile.lexical_evidence[card.card_key]={});
  if(result==="incorrect")evidence.wrong_answers=(evidence.wrong_answers||0)+1;
  if(result==="independent_correct")evidence.independent_correct=(evidence.independent_correct||0)+1;
  const correctDays=unique(card.review_history.filter(x=>x.result==="independent_correct")
     .map(x=>Math.floor(x.at_ms/DAY)));
  if(correctDays.length>=2 && !card.review_history.slice(-1).some(x=>x.result==="incorrect")){
    if(!card.card_key.startsWith("phrase:") &&
       !profile.known_reading_sense_keys.includes(card.card_key))
      profile.known_reading_sense_keys.push(card.card_key);
  } else if(result==="incorrect"){
    profile.known_reading_sense_keys=
      profile.known_reading_sense_keys.filter(k=>k!==card.card_key);
  }
  return profile;
}
export function suggestLearningFocus(profile,{now_ms,desired_genre=null}){
  if(!Number.isFinite(now_ms)||now_ms<0)throw new Error("Current time required");
  const dueCards=profile.flashcards.filter(c=>c.due_at_ms<=now_ms)
    .sort((a,b)=>a.due_at_ms-b.due_at_ms).map(c=>c.card_key);
  const weak=Object.entries(profile.lexical_evidence).map(([key,e])=>{
    const errors=e.wrong_answers||0,looks=e.lookups||0,retries=e.retries||0;
    return {card_key:key,priority:errors*3+looks+retries,errors,looks};
  }).filter(x=>x.errors>0||x.looks>=2||x.priority>=2)
    .sort((a,b)=>b.priority-a.priority);
  const history=profile.reading_history;
  const last=history.at(-1);
  const nextGuidance=weak.length
    ?"EXPLAIN_WEAK_WORDS_IN_NEW_CONTEXT_THEN_OFFER_STORY"
    :dueCards.length?"REVIEW_DUE_WORDS_THEN_OFFER_STORY"
    :"OFFER_INTERESTING_READING";
  return {
    status:"EVIDENCE_BASED_RULES_NOT_LIVE_AI",
    next_guidance:nextGuidance,
    due_flashcards:dueCards,
    weak_contextual_sense_keys:weak.map(x=>x.card_key),
    learner_preference_genre:desired_genre??last?.genre??null,
    suggested_support:weak.length>0?"MORE_CONTEXT_AND_OPTIONAL_SLOWER_TEXT":"NORMAL_READING",
    notes:"Reading duration alone never determines ability. Repeated independent recall marks READING familiarity only, not Czech phonetics or CEFR level."
  };
}
