/**
 * Draft-only canonical lesson catalog.
 *
 * The source contains 72 lessons with both exercises and exit assessments.
 * This adapter preserves IDs, source grading policies and provisional rubrics
 * without granting learner-facing publication or automatic correctness scores.
 *
 * It is intentionally separate from the card/dialogue preview importer:
 * a preview must never imply that a full course has been imported.
 */

export type DraftContentStatus = 'draft_ai';

export interface CanonicalExerciseDraft {
  canonicalId: string;
  lessonId: string;
  promptMn: string;
  proposedAnswer: string;
  answerSourceMethod: string;
  gradingPolicy: string;
  qaFlags: string[];
  qaStatus: DraftContentStatus;
  autoGradeAllowed: false;
  publishAllowed: false;
}

export interface CanonicalRubricCriterionDraft {
  criterion: string;
  descriptionMn: string;
  maxPoints: number;
}

export interface CanonicalExitDraft {
  canonicalId: string;
  lessonId: string;
  promptMn: string;
  missionMn: string;
  canDoCriteriaMn: string;
  needsTransferRewrite: boolean;
  rubricDraft: CanonicalRubricCriterionDraft[];
  qaStatus: DraftContentStatus;
  autoGradeAllowed: false;
  publishAllowed: false;
}

export interface CanonicalLessonDraft {
  canonicalId: string;
  level: 'A0' | 'A1';
  titleMn: string;
  missionMn: string;
  phraseIds: string[];
  dialogueIds: string[];
  exerciseIds: string[];
  exitId: string;
  qaStatus: DraftContentStatus;
}

export interface CanonicalCurriculumOverview {
  sourceSchemaVersion: string;
  lessons: CanonicalLessonDraft[];
  exercises: CanonicalExerciseDraft[];
  exitTasks: CanonicalExitDraft[];
  counts: {
    lessons: number;
    phrases: number;
    dialogues: number;
    dialogueTurns: number;
    exercises: number;
    exits: number;
    transferRewritesPending: number;
  };
  validationErrors: string[];
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function objects(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(record) : [];
}

/** No I/O and no side effects. Safe to call on Drive-imported draft JSON. */
export function readCanonicalCurriculumOverview(input: unknown): CanonicalCurriculumOverview | null {
  if (!record(input) || !Array.isArray(input.lessons)) return null;

  const lessons: CanonicalLessonDraft[] = [];
  const exercises: CanonicalExerciseDraft[] = [];
  const exitTasks: CanonicalExitDraft[] = [];
  const validationErrors: string[] = [];
  const seen = new Set<string>();
  let phrases = 0;
  let dialogues = 0;
  let dialogueTurns = 0;

  const takeId = (id: string, pattern: RegExp, context: string): boolean => {
    if (!pattern.test(id)) {
      validationErrors.push(`${context}: invalid ID ${id || '(empty)'}`);
      return false;
    }
    if (seen.has(id)) {
      validationErrors.push(`${context}: duplicate ID ${id}`);
      return false;
    }
    seen.add(id);
    return true;
  };

  for (const [lessonIndex, candidate] of input.lessons.entries()) {
    if (!record(candidate)) {
      validationErrors.push(`lesson[${lessonIndex}]: invalid record`);
      continue;
    }

    const lessonId = str(candidate.lesson_id);
    if (!takeId(lessonId, /^CZ-A[01]-M\\d{2}-L\\d{2}$/, 'lesson')) continue;

    const phraseIds: string[] = [];
    for (const phrase of objects(candidate.phrases)) {
      const id = str(phrase.content_id);
      if (!id.startsWith(lessonId + '-PH') ||
          !takeId(id, /^CZ-A[01]-M\\d{2}-L\\d{2}-PH\\d+$/, 'phrase') ||
          !str(phrase.cs_text) || !str(phrase.mn_working)) {
        validationErrors.push(`lesson ${lessonId}: invalid phrase or missing source text ${id}`);
        continue;
      }
      phraseIds.push(id);
      phrases++;
    }

    const dialogueIds: string[] = [];
    for (const dialogue of objects(candidate.dialogues)) {
      const id = str(dialogue.dialogue_id);
      if (!id.startsWith(lessonId + '-B') ||
          !takeId(id, /^CZ-A[01]-M\\d{2}-L\\d{2}-B\\d+$/, 'dialogue')) {
        validationErrors.push(`lesson ${lessonId}: invalid dialogue ID ${id}`);
        continue;
      }

      dialogueIds.push(id);
      dialogues++;
      for (const turn of objects(dialogue.turns)) {
        const turnId = str(turn.turn_id);
        if (!turnId.startsWith(id + '-T') ||
            !takeId(turnId, /^CZ-A[01]-M\\d{2}-L\\d{2}-B\\d+-T\\d+$/, 'dialogue turn') ||
            !str(turn.cs) || !str(turn.mn)) {
          validationErrors.push(`dialogue ${id}: invalid turn ${turnId}`);
          continue;
        }
        dialogueTurns++;
      }
    }

    const exerciseIds: string[] = [];
    for (const exercise of objects(candidate.exercises)) {
      const id = str(exercise.exercise_id);
      if (!id.startsWith(lessonId + '-EX') ||
          !takeId(id, /^CZ-A[01]-M\\d{2}-L\\d{2}-EX\\d+$/, 'exercise') ||
          (str(exercise.lesson_id) && str(exercise.lesson_id) !== lessonId) ||
          !str(exercise.prompt_mn)) {
        validationErrors.push(`lesson ${lessonId}: invalid exercise or missing prompt ${id}`);
        continue;
      }
      const answerKey = record(exercise.answer_key_v0912) ? exercise.answer_key_v0912 : {};
      const answerQa = record(exercise.answer_crossqa_v0917) ? exercise.answer_crossqa_v0917 : {};
      const crossQa = record(exercise.cross_qa_v0916) ? exercise.cross_qa_v0916 : {};
      const proposedAnswer = str(answerQa.working_answer_proposal) || str(answerKey.working_text);

      exercises.push({
        canonicalId: id,
        lessonId,
        promptMn: str(exercise.prompt_mn),
        proposedAnswer,
        answerSourceMethod: str(answerKey.answer_source_method),
        gradingPolicy: str(answerQa.grading_policy) || str(answerKey.grading_policy) || 'unreviewed',
        qaFlags: Array.isArray(crossQa.flags) ? crossQa.flags.filter((x): x is string => typeof x === 'string') : [],
        qaStatus: 'draft_ai',
        autoGradeAllowed: false,
        publishAllowed: false,
      });
      exerciseIds.push(id);
    }

    let exitId = '';
    if (record(candidate.exit_task)) {
      const exit = candidate.exit_task;
      const id = str(exit.exit_id);
      if (id.startsWith(lessonId + '-EXIT') &&
          takeId(id, /^CZ-A[01]-M\\d{2}-L\\d{2}-EXIT\\d+$/, 'exit') &&
          (!str(exit.lesson_id) || str(exit.lesson_id) === lessonId) &&
          str(exit.source_prompt)) {
        const assessment = record(candidate.exit_assessment_v0912) ? candidate.exit_assessment_v0912 : {};
        const rubrics = objects(assessment.rubric).map((row) => ({
          criterion: str(row.criterion),
          descriptionMn: str(row.description_mn),
          maxPoints: typeof row.max_points === 'number' && row.max_points >= 0 ? row.max_points : 0,
        }));
        exitTasks.push({
          canonicalId: id,
          lessonId,
          promptMn: str(exit.display_prompt_mn_v0916) || str(exit.source_prompt),
          missionMn: str(assessment.learner_mission_mn),
          canDoCriteriaMn: str(assessment.can_do_criteria_mn),
          needsTransferRewrite: exit.needs_new_transfer_task === true,
          rubricDraft: rubrics,
          qaStatus: 'draft_ai',
          autoGradeAllowed: false,
          publishAllowed: false,
        });
        exitId = id;
      } else {
        validationErrors.push(`lesson ${lessonId}: invalid exit ${id}`);
      }
    } else {
      validationErrors.push(`lesson ${lessonId}: missing exit task`);
    }

    lessons.push({
      canonicalId: lessonId,
      level: candidate.level === 'A1' ? 'A1' : 'A0',
      titleMn: str(candidate.title_mn),
      missionMn: str(candidate.mission_mn),
      phraseIds,
      dialogueIds,
      exerciseIds,
      exitId,
      qaStatus: 'draft_ai',
    });
  }

  return {
    sourceSchemaVersion: str(input.schema_version) || 'unknown',
    lessons,
    exercises,
    exitTasks,
    counts: {
      lessons: lessons.length,
      phrases,
      dialogues,
      dialogueTurns,
      exercises: exercises.length,
      exits: exitTasks.length,
      transferRewritesPending: exitTasks.filter((exit) => exit.needsTransferRewrite).length,
    },
    validationErrors,
  };
}
