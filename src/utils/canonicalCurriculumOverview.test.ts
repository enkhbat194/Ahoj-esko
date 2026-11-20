import test from 'node:test';
import assert from 'node:assert/strict';
import { readCanonicalCurriculumOverview } from './canonicalCurriculumOverview';

const lessonId = 'CZ-A0-M01-L01';

function fixture() {
  return {
    schema_version: 'v0.9.17',
    lessons: [{
      lesson_id: lessonId,
      level: 'A0',
      title_mn: 'Мэндчилгээ',
      mission_mn: 'Нэр асуух',
      phrases: [{ content_id: `${lessonId}-PH001`, cs_text: 'Dobrý den.', mn_working: 'Сайн байна уу.', publish: false }],
      dialogues: [{
        dialogue_id: `${lessonId}-B01`,
        turns: [{ turn_id: `${lessonId}-B01-T01`, cs: 'Dobrý den.', mn: 'Сайн байна уу.' }],
      }],
      exercises: [
        {
          exercise_id: `${lessonId}-EX01`, lesson_id: lessonId, prompt_mn: 'Юуг асуусан бэ?',
          qa_status: 'not_human_approved',
          answer_key_v0912: { working_text: 'Нэрийг нь.', grading_policy: 'manual_semantic_review', answer_source_method: 'editorial' },
          answer_crossqa_v0917: { working_answer_proposal: 'Нэрийг нь асууж байна.', grading_policy: 'manual_semantic_review', publish: false },
          cross_qa_v0916: { flags: ['EXACT_STRING_GRADING_UNSAFE'] },
        },
        {
          exercise_id: `${lessonId}-EX006`, lesson_id: lessonId, prompt_mn: 'Бие даан ярь.',
          answer_key_v0912: { working_text: 'Жишээ яриа.', grading_policy: 'semantic_can_do_rubric' },
        },
      ],
      exit_task: {
        exit_id: `${lessonId}-EXIT01`, lesson_id: lessonId,
        source_prompt: 'Шинэ нөхцөлд танилц.', needs_new_transfer_task: true, qa_status: 'pending',
      },
      exit_assessment_v0912: {
        learner_mission_mn: 'Танилцах',
        can_do_criteria_mn: 'Нэрийг асуух',
        status: 'ai_editorial_draft_native_pending',
        rubric: [
          { criterion: 'mission_completion', description_mn: 'Даалгаврын биелэлт', max_points: 2 },
          { criterion: 'interaction_repair', description_mn: 'Давтан асуух', max_points: 2 },
        ],
      },
    }],
  };
}

test('preserves source-linked 72-lesson shape and provisional scoring without ever auto-grading', () => {
  const result = readCanonicalCurriculumOverview(fixture());
  assert.ok(result);
  assert.deepEqual(result.validationErrors, []);
  assert.deepEqual(result.counts, {
    lessons: 1, phrases: 1, dialogues: 1, dialogueTurns: 1,
    exercises: 2, exits: 1, transferRewritesPending: 1,
  });
  assert.equal(result.lessons[0]?.canonicalId, lessonId);
  assert.deepEqual(result.lessons[0]?.exerciseIds, [`${lessonId}-EX01`, `${lessonId}-EX006`]);
  assert.equal(result.exercises[0]?.proposedAnswer, 'Нэрийг нь асууж байна.');
  assert.equal(result.exercises[0]?.gradingPolicy, 'manual_semantic_review');
  assert.deepEqual(result.exercises[0]?.qaFlags, ['EXACT_STRING_GRADING_UNSAFE']);
  assert.equal(result.exercises[0]?.autoGradeAllowed, false);
  assert.equal(result.exercises[0]?.publishAllowed, false);
  assert.equal(result.exercises[1]?.gradingPolicy, 'semantic_can_do_rubric');
  assert.equal(result.exitTasks[0]?.canonicalId, `${lessonId}-EXIT01`);
  assert.equal(result.exitTasks[0]?.rubricDraft[0]?.maxPoints, 2);
  assert.equal(result.exitTasks[0]?.autoGradeAllowed, false);
  assert.equal(result.exitTasks[0]?.publishAllowed, false);
});

test('rejects duplicated/cross-lesson exercise IDs and reports provenance errors', () => {
  const source = fixture();
  source.lessons[0].exercises.push({
    exercise_id: `${lessonId}-EX01`,
    lesson_id: lessonId,
    prompt_mn: 'Duplicate',
  } as (typeof source.lessons)[number]['exercises'][number]);
  source.lessons[0].exercises.push({
    exercise_id: 'CZ-A0-M01-L99-EX06',
    lesson_id: 'CZ-A0-M01-L99',
    prompt_mn: 'Wrong lesson',
  } as (typeof source.lessons)[number]['exercises'][number]);
  const result = readCanonicalCurriculumOverview(source);
  assert.ok(result);
  assert.equal(result.exercises.length, 2);
  assert.ok(result.validationErrors.some((x) => x.includes('duplicate ID')));
  assert.ok(result.validationErrors.some((x) => x.includes('invalid exercise')));
});

test('does not read random JSON as a canonical course', () => {
  assert.equal(readCanonicalCurriculumOverview({ cards: [] }), null);
  assert.equal(readCanonicalCurriculumOverview('not-json'), null);
});
