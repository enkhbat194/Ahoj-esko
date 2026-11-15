import test from 'node:test';
import assert from 'node:assert/strict';
import { extractMemoryFromTurn, transitionMemoryStatus } from './learningMemory';

test('extractMemoryFromTurn creates private non-approved items and marks uncertain speech Raw', () => {
  const cleanItem = extractMemoryFromTurn({
    conversationId: 'conv_1',
    studentCzech: 'Dám si káva',
    replyCzech: 'Dáte si jednu kávu?',
    replyMongolian: 'Та нэг кофе авах уу?',
    suggestedReplyCzech: 'Ano, dám si jednu kávu.',
    coachingTipMn: 'Тусах тийн ялгал дээр kávu гэнэ.',
    hasError: true,
    speechUncertainty: false,
    now: 1_000_000,
  });

  assert.equal(cleanItem.isPrivate, true);
  assert.equal(cleanItem.status, 'Extracted');
  assert.equal(cleanItem.studentMistake, 'Dám si káva');
  assert.equal(cleanItem.correctedCzech, 'Ano, dám si jednu kávu.');

  const uncertainItem = extractMemoryFromTurn({
    conversationId: 'conv_2',
    studentCzech: 'káva',
    replyCzech: 'Myslel jste kávu?',
    replyMongolian: 'Та кофе гэсэн үү?',
    speechUncertainty: true,
  });
  assert.equal(uncertainItem.status, 'Raw');
  assert.equal(uncertainItem.isPrivate, true);
});

test('transitionMemoryStatus only moves forward Raw -> Extracted -> Validated -> Approved', () => {
  const item = extractMemoryFromTurn({
    conversationId: 'conv_3',
    replyCzech: 'Ahoj!',
    replyMongolian: 'Сайн уу!',
  });

  const validated = transitionMemoryStatus(item, 'Validated');
  assert.equal(validated.status, 'Validated');

  const downgradeAttempt = transitionMemoryStatus(validated, 'Raw');
  assert.equal(downgradeAttempt.status, 'Validated');

  const approved = transitionMemoryStatus(validated, 'Approved');
  assert.equal(approved.status, 'Approved');
});
