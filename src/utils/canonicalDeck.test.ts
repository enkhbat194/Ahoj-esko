import test from 'node:test';
import assert from 'node:assert/strict';
import { selectCanonicalCardsToAdd, canonicalCardFingerprint, type CanonicalCardInput } from './canonicalDeck.ts';
import type { VocabCard } from '../types/lesson';

function draft(id: string, czechWord: string, mongolianWord: string): CanonicalCardInput {
  return { canonicalId: id, topicId: 'greetings', czechWord, mongolianWord, czechSentence: czechWord, mongolianSentence: mongolianWord, phoneticHint: '', qaStatus: 'draft_ai' };
}
function stored(card: CanonicalCardInput): VocabCard {
  return { ...card, id: 'stored-1', audioIds: { wordNormal: 'real-user-audio' }, mastered: true, practiceCount: 8, srs: { intervalDays: 7, dueAt: 10, repetitions: 3, lapses: 0 } };
}

test('an ID collision is blocked, not attached to legacy SRS/audio progress', () => {
  const legacy = stored(draft('CZ-A0-M01-L01-PH002', 'Ahoj.', 'Сайн уу.'));
  const result = selectCanonicalCardsToAdd([legacy], [draft('CZ-A0-M01-L01-PH002', 'Jmenuji se …', 'Намайг … гэдэг.')], 100);
  assert.deepEqual(result.conflictingIds, ['CZ-A0-M01-L01-PH002']);
  assert.equal(result.additions.length, 0);
  assert.equal(legacy.audioIds.wordNormal, 'real-user-audio');
  assert.equal(legacy.srs?.intervalDays, 7);
});

test('same Czech with a genuinely different Mongolian meaning is not silently dropped', () => {
  const old = stored(draft('A', 'Ahoj.', 'Сайн уу.'));
  const next = selectCanonicalCardsToAdd([old], [draft('B', 'Ahoj.', 'Баяртай.')], 111);
  assert.equal(next.additions.length, 1);
  assert.equal(next.additions[0].mongolianWord, 'Баяртай.');
});

test('exact Czech/Mongolian duplicate is not added twice in one batch', () => {
  const next = selectCanonicalCardsToAdd([], [draft('X', 'Děkuji.', 'Баярлалаа.'), draft('Y', 'Děkuji.', 'Баярлалаа.')], 123);
  assert.equal(next.additions.length, 1);
  assert.deepEqual(next.conflictingIds, []);
});

test('identical IDs with different content within one batch are blocked', () => {
  const next = selectCanonicalCardsToAdd([], [draft('X', 'Ahoj.', 'Сайн уу.'), draft('X', 'Nerozumím.', 'Ойлгохгүй байна.')], 125);
  assert.equal(next.additions.length, 1);
  assert.deepEqual(next.conflictingIds, ['X']);
});

test('Czech diacritics survive fingerprinting', () => {
  assert.notEqual(canonicalCardFingerprint(draft('A', 'rád', 'баяртай')), canonicalCardFingerprint(draft('B', 'rad', 'баяртай')));
});
