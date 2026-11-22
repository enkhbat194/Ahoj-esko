/**
 * AHOJ text-only exercise evaluator. No audio, network, DOM, storage or AI speech claims.
 * Imported by CI now and reusable from the future premium PWA lesson view.
 * Only mechanically verifiable answers are given CORRECT/INCORRECT.
 */
export function normalizeCzechText(raw) {
  return String(raw ?? "").normalize("NFC").trim().replace(/\s+/gu, " ").toLocaleLowerCase("cs-CZ");
}
export function normalizeMongolianText(raw) {
  return String(raw ?? "").normalize("NFC").trim().replace(/\s+/gu, " ").toLocaleLowerCase("mn-MN");
}
const outcome = (status, reason, extra = {}) => ({ status, reason, ...extra });
export function canAutoGrade(type) {
  return ["context_hook", "meaning_match", "sentence_reorder", "cloze"].includes(type);
}
export function assessExercise(exercise, submission, { hasApprovedAudio = false } = {}) {
  if (!exercise || typeof exercise !== "object") return outcome("INVALID", "Missing exercise");
  const { type, answer_key: key } = exercise;
  switch (type) {
    case "context_hook": {
      const choice = typeof submission === "string" ? submission : submission?.choice;
      if (!choice) return outcome("AWAITING_RESPONSE", "Choose an answer");
      return outcome(choice === key?.choice ? "CORRECT" : "INCORRECT", "context_choice", {
        answer_key: key.choice
      });
    }
    case "meaning_match": {
      const pairs = submission?.pairs ?? submission;
      if (!pairs || typeof pairs !== "object") return outcome("AWAITING_RESPONSE", "Match the pairs");
      const expected = key?.pairs ?? {};
      const total = Object.keys(expected).length;
      const correct = Object.entries(expected).filter(([id, mn]) =>
        normalizeMongolianText(pairs[id]) === normalizeMongolianText(mn)
      ).length;
      return outcome(correct === total && total > 0 ? "CORRECT" : "INCORRECT", "matching", { correct, total });
    }
    case "sentence_reorder": {
      const tokens = Array.isArray(submission) ? submission : submission?.token_sequence;
      if (!Array.isArray(tokens)) return outcome("AWAITING_RESPONSE", "Arrange words in order");
      const expected = key?.token_sequence ?? [];
      const correct = tokens.length === expected.length && tokens.every((x,i)=>x===expected[i]);
      return outcome(correct ? "CORRECT" : "INCORRECT", "token_order");
    }
    case "cloze": {
      const answer = typeof submission === "string" ? submission : submission?.text;
      if (answer === undefined || answer === null) return outcome("AWAITING_RESPONSE", "Complete the blank");
      const correct = normalizeCzechText(answer) === normalizeCzechText(key?.text);
      return outcome(correct ? "CORRECT" : "INCORRECT", "cloze_exact");
    }
    case "word_card":
      return outcome("PRACTICE_ONLY", "Card flip or reading alone is not evidence of active vocabulary mastery");
    case "listen_choose":
    case "listen_repeat":
    case "spoken_roleplay":
      if (!hasApprovedAudio || exercise.gating?.status?.startsWith("BLOCKED"))
        return outcome("BLOCKED_AUDIO", "Verified audio/recording unavailable; no pretend completion");
      return outcome("REQUIRES_AUDIO_EVALUATOR", "Recorded response and/or approved clip must be judged by a separate modality");
    case "guided_dialogue":
      return outcome("REQUIRES_SEMANTIC_EVALUATOR", "Open response and register need calibrated semantic grading");
    case "novel_transfer":
      return outcome("REQUIRES_SEMANTIC_EVALUATOR", "Novel scenario task success needs rubric-based independent assessment");
    case "delayed_review":
      return outcome("NOT_DUE_STATE_AVAILABLE", "Needs learner response history and real due date");
    case "story_recall":
      return outcome("REQUIRES_SEMANTIC_EVALUATOR", "Reading comprehension and retelling require scenario-specific answer keys");
    default:
      return outcome("UNKNOWN_EXERCISE_TYPE", "Unsupported exercise "+String(type));
  }
}
export function getTextOnlyLearningPlan(pack, lexicon) {
  if (!pack?.exercises || !lexicon?.items) throw new Error("Missing lesson or lexicon");
  const byId = new Map(lexicon.items.map(w=>[w.lexeme_id,w]));
  for (const id of pack.new_lexeme_ids??[])
    if (!byId.has(id)) throw new Error("Missing lexeme "+id);
  return {
    pack_id: pack.pack_id,
    status: "EDITORIAL_PREVIEW_ONLY",
    published: false,
    vocabulary: (pack.new_lexeme_ids??[]).map(id=>({
      lexeme_id:id, lemma_cs:byId.get(id).lemma_cs,
      meaning_mn:byId.get(id).mn_meaning_contextual_draft,
      editorial_approved:byId.get(id).approved
    })),
    text_exercises:pack.exercises.filter(x=>x.type!=="listen_choose" && x.type!=="listen_repeat" && x.type!=="spoken_roleplay"),
    audio_blocked_exercise_ids:pack.exercises.filter(x=>x.type==="listen_choose" || x.type==="listen_repeat" || x.type==="spoken_roleplay").map(x=>x.exercise_id),
    fully_authored_skill_ids:pack.coverage.authored_skill_ids,
    missing_skill_ids:pack.coverage.NOT_YET_AUTHORED,
    can_publish:false
  };
}
