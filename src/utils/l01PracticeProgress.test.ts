import assert from 'node:assert/strict';
import test from 'node:test';
import { L01_DATASET_SHA256, L01_ID, L01_WORKING_SOURCE } from '../data/l01WorkingSource';
import {
  createL01Progress, parseL01Progress, reviewedL01Count, updateL01Response,
} from './l01PracticeProgress';

test('real v0.9.20 L01 strings are source-locked, not old UI hardcoded PH002', () => {
  assert.equal(L01_WORKING_SOURCE.sourceSha256, L01_DATASET_SHA256);
  assert.equal(L01_WORKING_SOURCE.qaStatus, 'draft_ai');
  assert.equal(L01_WORKING_SOURCE.publishAllowed, false);
  assert.equal(L01_WORKING_SOURCE.phrases.length, 6);
  assert.equal(L01_WORKING_SOURCE.phrases[1].id, `${L01_ID}-PH002`);
  assert.equal(L01_WORKING_SOURCE.phrases[1].cs, 'Jmenuji se …');
  assert.equal(L01_WORKING_SOURCE.phrases[5].cs, 'Můžete to prosím zopakovat?');
  assert.equal(L01_WORKING_SOURCE.dialogues.length, 2);
  assert.equal(L01_WORKING_SOURCE.dialogues.flatMap((d) => d.turns).length, 11);
  assert.equal(L01_WORKING_SOURCE.exercises.length, 6);
  assert.equal(L01_WORKING_SOURCE.exit.id, `${L01_ID}-EXIT01`);
  assert.equal(L01_WORKING_SOURCE.exit.needsTransferRewrite, true);
  assert.equal(L01_WORKING_SOURCE.exit.rubric.reduce((n, x) => n + x.maxPoints, 0), 8);
});

test('practice answers save and their source IDs survive serialization without approving or scoring', () => {
  const initial = createL01Progress();
  const next = updateL01Response(initial, `${L01_ID}-EX01`, 'Нэр асууж байна');
  assert.equal(reviewedL01Count(next), 0);
  next.selfReviewedIds.push(`${L01_ID}-EX01`);
  assert.equal(reviewedL01Count(next), 1);
  const restored = parseL01Progress(JSON.parse(JSON.stringify(next)));
  assert.deepEqual(restored?.responses, { [`${L01_ID}-EX01`]: 'Нэр асууж байна' });
  assert.equal(restored?.selfReviewedIds.length, 1);
  assert.equal(reviewedL01Count(updateL01Response(next, `${L01_ID}-EX01`, 'өөр хариу')), 0);
});

test('reject wrong source hash / lesson / version: never crosslink stale progress', () => {
  const valid = createL01Progress();
  assert.equal(parseL01Progress({ ...valid, lessonId: 'CZ-A0-M01-L02' }), null);
  assert.equal(parseL01Progress({ ...valid, sourceSha256: 'different' }), null);
  assert.equal(parseL01Progress({ ...valid, schema: 2 }), null);
  assert.equal(parseL01Progress(null), null);
});

test('drop injected exercise IDs and invalid flags on restore', () => {
  const p = createL01Progress();
  const restored = parseL01Progress({
    ...p, stage: 'arbitrary',
    responses: { 'fake': 'injected', [`${L01_ID}-EX02`]: 'Jmenuji se Bat.' },
    selfReviewedIds: ['fake', `${L01_ID}-EX02`, `${L01_ID}-EX02`],
    revealedIds: ['fake'], exitAttempted: true, exitResponse: '',
  });
  assert.equal(restored?.stage, 'dialogue');
  assert.deepEqual(restored?.responses, { [`${L01_ID}-EX02`]: 'Jmenuji se Bat.' });
  assert.deepEqual(restored?.selfReviewedIds, [`${L01_ID}-EX02`]);
  assert.deepEqual(restored?.revealedIds, []);
  assert.equal(restored?.exitAttempted, false);
  assert.equal(updateL01Response(p, 'fake', 'injected'), p);
});
