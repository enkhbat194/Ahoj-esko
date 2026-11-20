import assert from 'node:assert/strict';
import test from 'node:test';
import { L01_ID, L01_WORKING_SOURCE } from '../data/l01WorkingSource';
import {
  getDialogueLearnerCue, getDialogueRoundResults,
  isL01DialogueTurnId, sanitizeL01DialogueRecords,
} from './l01DialogueTraining';
import { createL01Progress, parseL01Progress } from './l01PracticeProgress';

test('every scripted dialogue turn belongs to the exact v0.9.20 lesson, with preserved Czech', () => {
  const all = L01_WORKING_SOURCE.dialogues.flatMap((d) => d.turns.map(t => ({ id: t.id, cs: t.cs })));
  assert.equal(all.length, 11);
  assert.equal(new Set(all.map(x => x.id)).size, 11);
  assert.ok(all.every(x => x.id.startsWith(L01_ID + '-B')));
  const b01 = L01_WORKING_SOURCE.dialogues[0];
  assert.equal(b01.turns[2].cs, 'Odkud jste?');
  assert.equal(getDialogueLearnerCue(b01.turns[2]), 'Та хаанаас ирсэн бэ?');
  assert.equal(b01.turns[2].mn, 'Та хааных вэ?'); // canonical remains unmodified
  assert.equal(getDialogueLearnerCue(b01.turns[3]), 'Би Монголоос.');
});

test('self-review is separate from automated correctness, and is keyed by exact source IDs', () => {
  const dialogue = L01_WORKING_SOURCE.dialogues[0];
  const id = dialogue.turns[1].id;
  const result = getDialogueRoundResults(dialogue, 'B', {
    [id]: { response: 'Jmenuji se Eba.', attempted: true, selfCheck: 'needs_repeat' },
  });
  assert.deepEqual(result, { total: 3, tried: 1, selfReviewed: 0, repeat: 1 });
  const next = getDialogueRoundResults(dialogue, 'B', {
    [id]: { response: 'Jmenuji se Eba.', attempted: true, selfCheck: 'felt_ready' },
  });
  assert.equal(next.selfReviewed, 1);
  assert.equal(next.repeat, 0);
});

test('dialogue progress survives version-bound local data and prevents fabricated source IDs', () => {
  const valid = L01_WORKING_SOURCE.dialogues[0].turns[1].id;
  const p = createL01Progress();
  p.dialogueRecords = {
    [valid]: { response: 'Jmenuji se Eba.', attempted: true, selfCheck: 'needs_repeat' },
  };
  const parsed = parseL01Progress(JSON.parse(JSON.stringify(p)));
  assert.equal(parsed?.dialogueRecords[valid]?.response, 'Jmenuji se Eba.');
  assert.equal(parsed?.dialogueRecords[valid]?.selfCheck, 'needs_repeat');
  assert.deepEqual(parsed?.dialogueRecords, p.dialogueRecords);

  const invalid = sanitizeL01DialogueRecords({
    fake: { response: 'spoof', attempted: true, selfCheck: 'felt_ready' },
    [valid]: { response: 'x'.repeat(1500), attempted: true, selfCheck: 'approved' },
  });
  assert.equal(isL01DialogueTurnId('fake'), false);
  assert.equal(Object.hasOwn(invalid, 'fake'), false);
  assert.equal(invalid[valid]?.response.length, 1000);
  assert.equal(invalid[valid]?.selfCheck, null);
});

test('existing v0.9.20 exercises and exits remain intact when old iPhone progress is restored', () => {
  const p = createL01Progress();
  delete (p as unknown as { dialogueRecords?: object }).dialogueRecords;
  const upgraded = parseL01Progress(p);
  assert.ok(upgraded);
  assert.deepEqual(upgraded.dialogueRecords, {});
  assert.equal(upgraded.responses[L01_ID + '-EX01'], undefined);
  assert.equal(upgraded.exitAttempted, false);
});
