import test from 'node:test';
import assert from 'node:assert/strict';
import { KLIC17_CHAPTERS } from '../data/klic17Story';
import { computeTodayDashboardMetrics, filterCardsByGender } from './todaySummary';
import type { VocabCard } from '../types/lesson';

const SAMPLE_CARDS: VocabCard[] = [
  {
    id: '1',
    topicId: 'greetings',
    czechWord: 'muž',
    phoneticHint: 'муж',
    mongolianWord: 'эрэгтэй хүн',
    czechSentence: 'Ten muž je můj kolega.',
    mongolianSentence: 'Тэр эрэгтэй хүн миний хамт ажиллагч.',
    audioIds: {},
    mastered: false,
    practiceCount: 1,
    lastPracticedAt: Date.now(),
    nounGender: 'masculine_animate',
  },
  {
    id: '2',
    topicId: 'work',
    czechWord: 'klíč',
    phoneticHint: 'клийч',
    mongolianWord: 'түлхүүр',
    czechSentence: 'Klíč číslo 17.',
    mongolianSentence: '17 дугаартай түлхүүр.',
    audioIds: {},
    mastered: true,
    practiceCount: 3,
    nounGender: 'masculine_inanimate',
  },
  {
    id: '3',
    topicId: 'transport',
    czechWord: 'jízdenka',
    phoneticHint: 'йииздэнка',
    mongolianWord: 'тасалбар',
    czechSentence: 'Potřebuji jízdenku.',
    mongolianSentence: 'Надад тасалбар хэрэгтэй.',
    audioIds: {},
    mastered: false,
    practiceCount: 0,
    nounGender: 'feminine',
  },
  {
    id: '4',
    topicId: 'greetings',
    czechWord: 'číslo',
    phoneticHint: 'чийсло',
    mongolianWord: 'дугаар',
    czechSentence: 'Jaké je vaše telefonní číslo?',
    mongolianSentence: 'Таны утасны дугаар хэд вэ?',
    audioIds: {},
    mastered: false,
    practiceCount: 0,
    nounGender: 'neuter',
  },
];

test('computeTodayDashboardMetrics calculates SRS due count, story progress, and 4-gender counts accurately', () => {
  const metrics = computeTodayDashboardMetrics({
    cards: SAMPLE_CARDS,
    reviewEvents: [],
    storyProgress: {
      readSentenceIds: ['CZ-0001', 'CZ-0002', 'CZ-0003', 'CZ-0004'],
      knownWords: ['klíč'],
      lastChapter: 7,
    },
    chapters: KLIC17_CHAPTERS,
    audioMetaList: [{ id: 'a1' }],
  });

  assert.equal(metrics.totalCards, 4);
  assert.equal(metrics.masteredCount, 1);
  assert.equal(metrics.dueCount, 3);
  assert.equal(metrics.storyReadCount, 4);
  assert.equal(metrics.storyTotalSentences, 800);
  assert.equal(metrics.lastChapter, 7);
  assert.equal(metrics.audioFilesCount, 1);
  assert.deepEqual(metrics.genderCounts, {
    masculine_animate: 1,
    masculine_inanimate: 1,
    feminine: 1,
    neuter: 1,
  });
});

test('filterCardsByGender isolates each Czech noun gender cleanly', () => {
  assert.equal(filterCardsByGender(SAMPLE_CARDS, 'all').length, 4);
  assert.equal(filterCardsByGender(SAMPLE_CARDS, 'masculine_animate')[0]?.czechWord, 'muž');
  assert.equal(filterCardsByGender(SAMPLE_CARDS, 'masculine_inanimate')[0]?.czechWord, 'klíč');
  assert.equal(filterCardsByGender(SAMPLE_CARDS, 'feminine')[0]?.czechWord, 'jízdenka');
  assert.equal(filterCardsByGender(SAMPLE_CARDS, 'neuter')[0]?.czechWord, 'číslo');
});
