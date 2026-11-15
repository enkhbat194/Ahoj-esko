import type { AudioSlotType, Dialogue, TopicId, VocabCard } from '../types/lesson';

export function normalizeCzechText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zа-яөүё0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type MasteryFilter = 'all' | 'learning' | 'mastered';

export function filterCards(
  cards: VocabCard[],
  options: {
    topicId?: TopicId | 'all';
    mastery?: MasteryFilter;
    query?: string;
  }
): VocabCard[] {
  const { topicId = 'all', mastery = 'all', query = '' } = options;
  const normQuery = normalizeCzechText(query);

  return cards.filter((card) => {
    if (topicId !== 'all' && card.topicId !== topicId) return false;
    if (mastery === 'learning' && card.mastered) return false;
    if (mastery === 'mastered' && !card.mastered) return false;

    if (normQuery) {
      const haystack = normalizeCzechText(
        `${card.czechWord} ${card.mongolianWord} ${card.czechSentence} ${card.mongolianSentence} ${card.phoneticHint}`
      );
      if (!haystack.includes(normQuery)) return false;
    }

    return true;
  });
}

export function countAttachedAudioSlots(card: VocabCard): number {
  const slots: AudioSlotType[] = ['wordNormal', 'wordSlow', 'sentenceNormal', 'sentenceSlow'];
  return slots.reduce((acc, slot) => (card.audioIds[slot] ? acc + 1 : acc), 0);
}

export interface StudyStats {
  totalCards: number;
  masteredCards: number;
  learningCards: number;
  cardsWithCustomAudio: number;
  totalCustomAudioSlots: number;
  totalDialogues: number;
  dialoguesWithAudio: number;
  percentMastered: number;
}

export function computeStudyStats(cards: VocabCard[], dialogues: Dialogue[]): StudyStats {
  const totalCards = cards.length;
  const masteredCards = cards.filter((c) => c.mastered).length;
  const learningCards = totalCards - masteredCards;

  let cardsWithCustomAudio = 0;
  let totalCustomAudioSlots = 0;

  for (const card of cards) {
    const count = countAttachedAudioSlots(card);
    if (count > 0) cardsWithCustomAudio += 1;
    totalCustomAudioSlots += count;
  }

  const totalDialogues = dialogues.length;
  const dialoguesWithAudio = dialogues.filter((d) => Boolean(d.fullAudioId)).length;
  const percentMastered = totalCards === 0 ? 0 : Math.round((masteredCards / totalCards) * 100);

  return {
    totalCards,
    masteredCards,
    learningCards,
    cardsWithCustomAudio,
    totalCustomAudioSlots,
    totalDialogues,
    dialoguesWithAudio,
    percentMastered,
  };
}

export function getNextCardIndex(currentIndex: number, listLength: number, direction: 1 | -1): number {
  if (listLength <= 0) return 0;
  return (currentIndex + direction + listLength) % listLength;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const whole = Math.floor(seconds);
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
