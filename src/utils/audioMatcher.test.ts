import test from 'node:test';
import assert from 'node:assert/strict';
import { detectAudioSlotFromFilename, matchFilenameToCurriculum } from './audioMatcher';
import { STARTER_CARDS, STARTER_DIALOGUES } from '../data/starterCurriculum';

test('detectAudioSlotFromFilename identifies normal/slow word, sentence, and dialogue files', () => {
  assert.equal(detectAudioSlotFromFilename('dobry_den.mp3'), 'wordNormal');
  assert.equal(detectAudioSlotFromFilename('dobry_den_slow.m4a'), 'wordSlow');
  assert.equal(detectAudioSlotFromFilename('dobry_den_udaan.mp3'), 'wordSlow');
  assert.equal(detectAudioSlotFromFilename('dekuji_sentence.mp3'), 'sentenceNormal');
  assert.equal(detectAudioSlotFromFilename('dekuji_uguulber_pomalu.wav'), 'sentenceSlow');
  assert.equal(detectAudioSlotFromFilename('kavarna_dialogue.mp3'), 'dialogue');
  assert.equal(detectAudioSlotFromFilename('hariltsan_yaria_1.m4a'), 'dialogue');
});

test('matchFilenameToCurriculum matches Czech words and dialogues automatically', () => {
  const m1 = matchFilenameToCurriculum('dobry_den_slow.mp3', STARTER_CARDS, STARTER_DIALOGUES);
  assert.equal(m1.kind, 'card');
  if (m1.kind === 'card') {
    assert.equal(m1.cardId, 'card-1');
    assert.equal(m1.slot, 'wordSlow');
  }

  const m2 = matchFilenameToCurriculum('dekuji_sentence_udaan.mp3', STARTER_CARDS, STARTER_DIALOGUES);
  assert.equal(m2.kind, 'card');
  if (m2.kind === 'card') {
    assert.equal(m2.cardId, 'card-3');
    assert.equal(m2.slot, 'sentenceSlow');
  }

  const m3 = matchFilenameToCurriculum('kavarna_dialogue.mp3', STARTER_CARDS, STARTER_DIALOGUES);
  assert.equal(m3.kind, 'dialogue');
  if (m3.kind === 'dialogue') {
    assert.equal(m3.dialogueId, 'dlg-1');
  }
});
