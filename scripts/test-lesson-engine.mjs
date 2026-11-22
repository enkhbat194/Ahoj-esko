import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  normalizeCzechText,assessExercise,canAutoGrade,getTextOnlyLearningPlan
} from "../curriculum/system-v1/lesson-engine.mjs";

const read = (p) => JSON.parse(readFileSync(new URL("../"+p,import.meta.url),"utf8"));
const pack=read("curriculum/system-v1/lessons/a0-intro-001.content.draft.json");
const lex=read("curriculum/system-v1/lexicon/top100.candidate.json");
const ex=(type)=>{const found=pack.exercises.find(e=>e.type===type);assert.ok(found,type);return found;};
assert.equal(normalizeCzechText("  BÝT  "),"být");
assert.notEqual(normalizeCzechText("byt"),normalizeCzechText("být"),"Czech length diacritic cannot be dropped");
assert.equal(canAutoGrade("cloze"),true);
assert.equal(canAutoGrade("guided_dialogue"),false);
assert.equal(assessExercise(ex("context_hook"),"STAFF").status,"CORRECT");
assert.equal(assessExercise(ex("context_hook"),"FRIEND").status,"INCORRECT");
const pairs=ex("meaning_match").answer_key.pairs;
assert.equal(assessExercise(ex("meaning_match"),pairs).status,"CORRECT");
assert.equal(assessExercise(ex("meaning_match"),{...pairs,P4:"Би Анна авъя."}).status,"INCORRECT");
assert.equal(assessExercise(ex("sentence_reorder"),["t1","t2","t3"]).status,"CORRECT");
assert.equal(assessExercise(ex("sentence_reorder"),["t2","t1","t3"]).status,"INCORRECT");
assert.equal(assessExercise(ex("cloze")," SE ").status,"CORRECT");
assert.equal(assessExercise(ex("cloze"),"den").status,"INCORRECT");
assert.equal(assessExercise(ex("word_card"),true).status,"PRACTICE_ONLY");
assert.equal(assessExercise(ex("listen_choose"),"greeting").status,"BLOCKED_AUDIO");
assert.equal(assessExercise(ex("guided_dialogue"),["Ahoj."]).status,"REQUIRES_SEMANTIC_EVALUATOR");
assert.equal(assessExercise(ex("novel_transfer"),["Dobrý den."]).status,"REQUIRES_SEMANTIC_EVALUATOR");
assert.equal(assessExercise(ex("delayed_review"),true).status,"NOT_DUE_STATE_AVAILABLE");
assert.equal(assessExercise(null,null).status,"INVALID");
const plan=getTextOnlyLearningPlan(pack,lex);
assert.equal(plan.status,"EDITORIAL_PREVIEW_ONLY");
assert.equal(plan.vocabulary.length,6);
assert.equal(plan.text_exercises.length,8);
assert.deepEqual(plan.audio_blocked_exercise_ids,["A0-P001-E07"]);
assert.deepEqual(plan.fully_authored_skill_ids,["A0-T02-L01","A0-T02-L02"]);
assert.deepEqual(plan.missing_skill_ids,["A0-T02-L03"]);
assert.equal(plan.can_publish,false);
assert.ok(plan.vocabulary.every(x=>!x.editorial_approved));
console.log("Lesson engine PASS: 6 draft lexemes, 9 exercises (8 text, 1 audio-blocked), exact grading only, no fabricated speaking pass.");
