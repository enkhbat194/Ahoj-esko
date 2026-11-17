import test from 'node:test';
import assert from 'node:assert/strict';
import type { VocabCard } from '../types/lesson';
import {
  appendIdempotentReviewEvent,
  applySiblingBury,
  countDueAndBuried,
  formatUtcDayKey,
  scheduleNextSrsState,
} from './srsScheduler';

test('scheduleNextSrsState advances intervals 1 -> 3 -> 7 days on Good and resets on Again', () => {
  const now = Date.UTC(2026, 10, 17, 10, 0, 0);
  const step1 = scheduleNextSrsState(undefined, 'good', now);
  assert.equal(step1.intervalDays, 1);
  assert.equal(step1.repetitions, 1);

  const step2 = scheduleNextSrsState(step1, 'good', now);
  assert.equal(step2.intervalDays, 3);
  assert.equal(step2.repetitions, 2);

  const step3 = scheduleNextSrsState(step2, 'good', now);
  assert.equal(step3.intervalDays, 7);

  const reset = scheduleNextSrsState(step3, 'again', now);
  assert.equal(reset.intervalDays, 0);
  assert.equal(reset.repetitions, 0);
  assert.equal(reset.lapses, 1);
});

test('applySiblingBury buries sibling cards with same lemmaGroup for today without burying unrelated cards', () => {
  const now = Date.UTC(2026, 10, 17, 10, 0, 0);
  const today = formatUtcDayKey(now);
  const cards: VocabCard[] = [
    {
      id: 'c1',
      topicId: 'greetings',
      czechWord: 'Jak se jmenujete?',
      phoneticHint: 'Як сэ ймэнуетэ?',
      mongolianWord: 'Таныг хэн гэдэг вэ?',
      czechSentence: 'Dobrý den, jak se jmenujete?',
      mongolianSentence: 'Сайн байна уу, таныг хэн гэдэг вэ?',
      audioIds: {},
      mastered: false,
      practiceCount: 0,
      lemmaGroup: 'jmenovat',
    },
    {
      id: 'c2',
      topicId: 'greetings',
      czechWord: 'Jak se jmenuješ?',
      phoneticHint: 'Як сэ ймэнуеш?',
      mongolianWord: 'Чамайг хэн гэдэг вэ?',
      czechSentence: 'Ahoj, jak se jmenuješ?',
      mongolianSentence: 'Сайн уу, чамайг хэн гэдэг вэ?',
      audioIds: {},
      mastered: false,
      practiceCount: 0,
      lemmaGroup: 'jmenovat',
    },
    {
      id: 'c3',
      topicId: 'cafe',
      czechWord: 'Dám si kávu',
      phoneticHint: 'Дам си кааву',
      mongolianWord: 'Би кофе авъя',
      czechSentence: 'Dám si kávu.',
      mongolianSentence: 'Би кофе авъя.',
      audioIds: {},
      mastered: false,
      practiceCount: 0,
      lemmaGroup: 'kava',
    },
  ];

  const updated = applySiblingBury(cards, 'c1', now);
  assert.equal(updated[0].srs?.buriedUntilDay, undefined);
  assert.equal(updated[1].srs?.buriedUntilDay, today);
  assert.equal(updated[2].srs?.buriedUntilDay, undefined);

  const counts = countDueAndBuried(updated, now);
  assert.equal(counts.buriedCount, 1);
  assert.equal(counts.dueCount, 2);
});

test('appendIdempotentReviewEvent ignores duplicate eventId so offline re-syncs never double counts', () => {
  const ev = {
    eventId: 'rev-unique-1',
    cardId: 'card-1',
    grade: 'good' as const,
    reviewedAtUtc: 1700000000000,
    intervalDays: 1,
    dueAtUtc: 1700086400000,
  };
  const first = appendIdempotentReviewEvent([], ev);
  assert.equal(first.added, true);
  assert.equal(first.events.length, 1);

  const duplicate = appendIdempotentReviewEvent(first.events, ev);
  assert.equal(duplicate.added, false);
  assert.equal(duplicate.events.length, 1);
});
