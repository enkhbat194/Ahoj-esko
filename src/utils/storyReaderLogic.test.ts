import test from 'node:test';
import assert from 'node:assert/strict';
import { KLIC17_CHAPTERS, KLIC17_GLOSSARY } from '../data/klic17Story';
import {
  buildStorySentenceCanonicalId,
  buildStorySentenceSrsCard,
  buildStoryWordCanonicalId,
  buildStoryWordSrsCard,
  calculateChapterStats,
  extractChapterGlossaryItems,
  isStoryItemInDeck,
  lookupGlossaryEntry,
  markSentenceRead,
  normalizeCzechToken,
  toggleKnownWord,
  tokenizeCzechSentence,
} from './storyReaderLogic';
import type { StoryProgressState, VocabCard } from '../types/lesson';

test('normalizeCzechToken strips punctuation and folds Czech diacritics case cleanly', () => {
  assert.equal(normalizeCzechToken('Dobrý'), 'dobrý');
  assert.equal(normalizeCzechToken('„Klíč!“'), 'klíč');
  assert.equal(normalizeCzechToken('jízdenku?'), 'jízdenku');
});

test('tokenizeCzechSentence preserves words and punctuation cleanly', () => {
  const tokens = tokenizeCzechSentence('Ahoj, jak se máš?');
  const wordTexts = tokens.filter((t) => t.isWord).map((t) => t.lookupKey);
  assert.deepEqual(wordTexts, ['ahoj', 'jak', 'se', 'máš']);
  assert.equal(tokens.some((t) => !t.isWord && t.text.includes(',')), true);
});

test('lookupGlossaryEntry returns verified entries and returns null for unlisted words without hallucinating', () => {
  const den = lookupGlossaryEntry('den.', KLIC17_GLOSSARY);
  assert.ok(den);
  assert.equal(den.lemma, 'den');
  assert.equal(den.nounGender, 'masculine_inanimate');
  assert.equal(den.qaStatus, 'draft_ai');

  const unverified = lookupGlossaryEntry('neznáméslovo', KLIC17_GLOSSARY);
  assert.equal(unverified, null);
});

test('KLIC17_CHAPTERS loads all 40 chapters and 800 Drive story sentences cleanly', () => {
  assert.equal(KLIC17_CHAPTERS.length, 40);
  const totalSentences = KLIC17_CHAPTERS.reduce((sum, ch) => sum + ch.sentences.length, 0);
  assert.equal(totalSentences, 800);
  assert.equal(KLIC17_CHAPTERS[0]?.titleCs, 'Nový dům');
  assert.equal(KLIC17_CHAPTERS[0]?.sentences[0]?.id, 'CZ-0001');
});

test('buildStoryWordSrsCard preserves nounGender, lemmaGroup, canonicalId, and draft_ai QA status', () => {
  const ch1 = KLIC17_CHAPTERS[0]!;
  const sentence = ch1.sentences[0]!; // Dobrý den.
  const entry = lookupGlossaryEntry('den', KLIC17_GLOSSARY)!;
  const card = buildStoryWordSrsCard('den', entry, sentence, ch1);

  assert.equal(card.czechWord, 'den');
  assert.equal(card.nounGender, 'masculine_inanimate');
  assert.equal(card.lemmaGroup, 'den');
  assert.equal(card.qaStatus, 'draft_ai');
  assert.equal(card.canonicalId, buildStoryWordCanonicalId(entry, 'den'));
  assert.ok(card.mongolianWord.includes('өдөр'));
});

test('buildStorySentenceSrsCard builds valid SRS card with canonical story ID', () => {
  const ch1 = KLIC17_CHAPTERS[0]!;
  const sentence = ch1.sentences[14]!; // Jsem z Mongolska.
  const card = buildStorySentenceSrsCard(sentence, ch1);

  assert.equal(card.canonicalId, buildStorySentenceCanonicalId(sentence));
  assert.equal(card.czechWord, sentence.cs);
  assert.equal(card.qaStatus, 'draft_ai');
});

test('isStoryItemInDeck detects duplicates by canonicalId or normalized Czech word', () => {
  const entry = lookupGlossaryEntry('klíč', KLIC17_GLOSSARY)!;
  const cid = buildStoryWordCanonicalId(entry, 'klíč');
  const deck: VocabCard[] = [
    {
      id: 'c1',
      topicId: 'work',
      czechWord: 'Klíč',
      phoneticHint: 'клийч',
      mongolianWord: 'түлхүүр',
      czechSentence: 'Klíč číslo 17',
      mongolianSentence: '17 дугаартай түлхүүр',
      audioIds: {},
      mastered: false,
      practiceCount: 0,
    },
  ];
  assert.equal(isStoryItemInDeck(cid, 'klíč', deck), true);
  assert.equal(isStoryItemInDeck('KLIC17-WORD:unknown', 'neznámé', deck), false);
});

test('progress helpers track read sentences, known words, and chapter stats', () => {
  const ch1 = KLIC17_CHAPTERS[0]!;
  let progress: StoryProgressState = { readSentenceIds: [], knownWords: [], lastChapter: 1 };
  progress = markSentenceRead(progress, 'CZ-0001');
  progress = markSentenceRead(progress, 'CZ-0001'); // idempotent
  assert.equal(progress.readSentenceIds.length, 1);

  progress = toggleKnownWord(progress, 'Dobrý');
  assert.deepEqual(progress.knownWords, ['dobrý']);
  progress = toggleKnownWord(progress, 'dobrý');
  assert.deepEqual(progress.knownWords, []);

  const glossaryItems = extractChapterGlossaryItems(ch1, KLIC17_GLOSSARY);
  assert.ok(glossaryItems.length >= 10);

  const stats = calculateChapterStats(ch1, progress, [], KLIC17_GLOSSARY);
  assert.equal(stats.readCount, 1);
  assert.equal(stats.totalSentences, 20);
  assert.equal(stats.readPercent, 5);
  assert.equal(stats.syncedWordsCount, 0);
});
