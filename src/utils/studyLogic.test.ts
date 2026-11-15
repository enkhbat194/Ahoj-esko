import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeStudyStats,
  countAttachedAudioSlots,
  filterCards,
  formatBytes,
  formatDuration,
  getNextCardIndex,
  normalizeCzechText,
} from './studyLogic';
import { STARTER_CARDS, STARTER_DIALOGUES } from '../data/starterCurriculum';

test('normalizeCzechText strips Czech diacritics and punctuation', () => {
  assert.equal(normalizeCzechText('Děkuji, prosím! Řeřicha'), 'dekuji prosim rericha');
  assert.equal(normalizeCzechText('Účet, čaj 120'), 'ucet caj 120');
});

test('filterCards filters by topic, mastery, and diacritic-insensitive search', () => {
  const cafeCards = filterCards(STARTER_CARDS, { topicId: 'cafe' });
  assert.ok(cafeCards.length >= 4);
  assert.ok(cafeCards.every((c) => c.topicId === 'cafe'));

  const searched = filterCards(STARTER_CARDS, { query: 'dekuji' });
  assert.ok(searched.some((c) => c.czechWord === 'Děkuji'));

  const mongolianSearch = filterCards(STARTER_CARDS, { query: 'кофе' });
  assert.ok(mongolianSearch.some((c) => c.czechWord === 'Dám si kávu'));
});

test('computeStudyStats tracks mastered cards and custom audio attachments accurately', () => {
  const modified = STARTER_CARDS.map((card, idx) =>
    idx === 0
      ? {
          ...card,
          mastered: true,
          audioIds: { wordNormal: 'a1', wordSlow: 'a2' },
        }
      : card
  );
  assert.equal(countAttachedAudioSlots(modified[0]), 2);
  const stats = computeStudyStats(modified, STARTER_DIALOGUES);
  assert.equal(stats.totalCards, STARTER_CARDS.length);
  assert.equal(stats.masteredCards, 1);
  assert.equal(stats.learningCards, STARTER_CARDS.length - 1);
  assert.equal(stats.cardsWithCustomAudio, 1);
  assert.equal(stats.totalCustomAudioSlots, 2);
  assert.equal(stats.totalDialogues, STARTER_DIALOGUES.length);
});

test('getNextCardIndex wraps forward and backward safely', () => {
  assert.equal(getNextCardIndex(0, 5, 1), 1);
  assert.equal(getNextCardIndex(4, 5, 1), 0);
  assert.equal(getNextCardIndex(0, 5, -1), 4);
  assert.equal(getNextCardIndex(0, 0, 1), 0);
});

test('formatDuration and formatBytes render readable strings', () => {
  assert.equal(formatDuration(0), '0:00');
  assert.equal(formatDuration(75), '1:15');
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(2048), '2.0 KB');
  assert.equal(formatBytes(1572864), '1.5 MB');
});
