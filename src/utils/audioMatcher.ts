import type { AudioSlotType, Dialogue, VocabCard } from '../types/lesson';
import { normalizeCzechText } from './studyLogic';

export type InferredAudioTarget =
  | { kind: 'card'; cardId: string; slot: AudioSlotType; score: number }
  | { kind: 'dialogue'; dialogueId: string; score: number }
  | { kind: 'unmatched' };

export function detectAudioSlotFromFilename(fileName: string): AudioSlotType | 'dialogue' {
  const base = normalizeCzechText(fileName.replace(/\.[^/.]+$/, ''));
  const tokens = base.split(' ').filter(Boolean);

  const isDialogue =
    tokens.some((t) => ['dialogue', 'dialog', 'conv', 'conversation', 'yaria', 'rozhovor'].includes(t)) ||
    base.includes('hariltsan');
  if (isDialogue) return 'dialogue';

  const isSlow = tokens.some((t) => ['slow', 'udaan', 'pomalu', 'slowly', '07x', '06x', '05x'].includes(t));
  const isSentence = tokens.some((t) =>
    ['sent', 'sentence', 'uguulber', 'veta', 'example', 'jishee', 'phrase'].includes(t)
  );

  if (isSentence) {
    return isSlow ? 'sentenceSlow' : 'sentenceNormal';
  }
  return isSlow ? 'wordSlow' : 'wordNormal';
}

function tokenizeForMatching(text: string): string[] {
  const stopWords = new Set([
    'slow',
    'udaan',
    'pomalu',
    'normal',
    'engiin',
    'fast',
    'word',
    'ug',
    'slovo',
    'sent',
    'sentence',
    'uguulber',
    'veta',
    'example',
    'jishee',
    'dialogue',
    'dialog',
    'yaria',
    'rozhovor',
    'audio',
    'mp3',
    'm4a',
    'wav',
  ]);
  return normalizeCzechText(text)
    .split(' ')
    .filter((token) => token.length >= 2 && !stopWords.has(token));
}

function tokensMatch(fileToken: string, targetToken: string): boolean {
  if (fileToken === targetToken) return true;
  if (fileToken.length >= 4 && targetToken.length >= 4) {
    const stemLen = Math.min(5, Math.min(fileToken.length, targetToken.length) - 1);
    if (stemLen >= 4 && fileToken.slice(0, stemLen) === targetToken.slice(0, stemLen)) {
      return true;
    }
  }
  return false;
}

export function matchFilenameToCurriculum(
  fileName: string,
  cards: VocabCard[],
  dialogues: Dialogue[]
): InferredAudioTarget {
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  const detectedSlot = detectAudioSlotFromFilename(fileName);
  const fileTokens = tokenizeForMatching(withoutExt);

  if (fileTokens.length === 0) {
    return { kind: 'unmatched' };
  }

  if (detectedSlot === 'dialogue') {
    let bestDialogue: { id: string; score: number } | null = null;
    for (const dlg of dialogues) {
      const dlgTokens = tokenizeForMatching(`${dlg.titleCz} ${dlg.titleMn} ${dlg.situationMn} ${dlg.id}`);
      const overlap = fileTokens.filter((ft) => dlgTokens.some((dt) => tokensMatch(ft, dt))).length;
      const score = overlap / Math.max(fileTokens.length, 1);
      if (overlap > 0 && (!bestDialogue || score > bestDialogue.score)) {
        bestDialogue = { id: dlg.id, score };
      }
    }
    if (bestDialogue && bestDialogue.score >= 0.4) {
      return { kind: 'dialogue', dialogueId: bestDialogue.id, score: bestDialogue.score };
    }
    return { kind: 'unmatched' };
  }

  let bestCard: { id: string; score: number } | null = null;
  for (const card of cards) {
    const cardTargetText =
      detectedSlot === 'sentenceNormal' || detectedSlot === 'sentenceSlow'
        ? `${card.czechWord} ${card.czechSentence}`
        : card.czechWord;
    const cardTokens = tokenizeForMatching(cardTargetText);
    const overlap = fileTokens.filter((ft) => cardTokens.some((ct) => tokensMatch(ft, ct))).length;
    const score = overlap / Math.max(fileTokens.length, 1);
    if (overlap > 0 && (!bestCard || score > bestCard.score)) {
      bestCard = { id: card.id, score };
    }
  }

  if (bestCard && bestCard.score >= 0.5) {
    return { kind: 'card', cardId: bestCard.id, slot: detectedSlot, score: bestCard.score };
  }

  return { kind: 'unmatched' };
}
