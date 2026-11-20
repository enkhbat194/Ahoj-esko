import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDriveCurriculumText } from './driveCurriculumParser';
import { selectCanonicalCardsToAdd } from './canonicalDeck';

test('nested canonical lessons import source IDs and turns without claiming approval', () => {
  const source = {
    schema_version: 'v0.9.17',
    status: 'AI_REVIEWED_NOT_HUMAN_CERTIFIED',
    lessons: [{
      lesson_id: 'CZ-A0-M01-L01', title_mn: 'Мэндчилгээ',
      mission_mn: 'Танилцах',
      phrases: [
        { content_id: 'CZ-A0-M01-L01-PH001', cs_text: 'Dobrý den.', mn_working: 'Сайн байна уу.', publish: false },
        { content_id: 'CZ-A0-M01-L01-PH002', cs_text: 'Dobrý den.', mn_working: 'Сайн байна уу.', publish: false },
      ],
      dialogues: [{
        dialogue_id: 'CZ-A0-M01-L01-B01', title_mn: 'Албан танилцалт',
        turns: [
          { turn_id: 'CZ-A0-M01-L01-B01-T01', speaker: 'A', cs: 'Dobrý den.', mn: 'Сайн байна уу.' },
          { turn_id: 'CZ-A0-M01-L01-B01-T02', speaker: 'B', cs: 'Dobrý den.', mn: 'Сайн байна уу.' },
        ],
      }],
    }],
  };
  const result = parseDriveCurriculumText(JSON.stringify(source), 'canonical-v0920.json');
  assert.equal(result.cards.length, 2);
  assert.equal(result.cards[0]?.canonicalId, 'CZ-A0-M01-L01-PH001');
  assert.equal(result.cards[0]?.lessonId, 'CZ-A0-M01-L01');
  assert.equal(result.cards[0]?.qaStatus, 'draft_ai');
  assert.equal(result.dialogues.length, 1);
  assert.equal(result.dialogues[0]?.canonicalId, 'CZ-A0-M01-L01-B01');
  assert.equal(result.dialogues[0]?.lines[1]?.id, 'CZ-A0-M01-L01-B01-T02');
  assert.equal(result.dialogues[0]?.qaStatus, 'draft_ai');

  // Different canonical occurrences must survive despite identical Czech+MN.
  const imported = selectCanonicalCardsToAdd([], result.cards, 123, { preserveDistinctCanonicalIds: true });
  assert.equal(imported.additions.length, 2);
  assert.deepEqual(imported.conflictingIds, []);
  const repeat = selectCanonicalCardsToAdd(imported.additions, result.cards, 456, { preserveDistinctCanonicalIds: true });
  assert.equal(repeat.additions.length, 0);
});

test('invalid or empty canonical sources do not become fake curriculum', () => {
  const malformed = { lessons: [{ lesson_id: 'UNSAFE', phrases: [{ cs_text: 'Ahoj', mn_working: 'Сайн уу.' }] }] };
  const result = parseDriveCurriculumText(JSON.stringify(malformed), 'unsafe.json');
  assert.equal(result.cards.length, 0);
});
