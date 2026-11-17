import type {
  CzechNounGender,
  StoryChapter,
  StoryProgressState,
  StoredAudioMeta,
  VocabCard,
} from '../types/lesson';
import { countDueAndBuried, type ReviewEventRecord } from './srsScheduler';

export type GenderFilter = 'all' | CzechNounGender;

export interface TodayDashboardMetrics {
  totalCards: number;
  dueCount: number;
  buriedCount: number;
  masteredCount: number;
  practicedTodayCount: number;
  reviewEventsCount: number;
  storyReadCount: number;
  storyTotalSentences: number;
  storyPercent: number;
  lastChapter: number;
  audioFilesCount: number;
  genderCounts: Record<CzechNounGender, number>;
}

export function computeTodayDashboardMetrics(params: {
  cards: VocabCard[];
  reviewEvents: ReviewEventRecord[];
  storyProgress: StoryProgressState;
  chapters: StoryChapter[];
  audioMetaList: Pick<StoredAudioMeta, 'id'>[];
  nowUtc?: number;
}): TodayDashboardMetrics {
  const {
    cards,
    reviewEvents,
    storyProgress,
    chapters,
    audioMetaList,
    nowUtc = Date.now(),
  } = params;

  const { dueCount, buriedCount } = countDueAndBuried(cards, nowUtc);
  const startOfDay = new Date(nowUtc);
  startOfDay.setHours(0, 0, 0, 0);
  const dayCutoff = startOfDay.getTime();

  const practicedTodayCount = cards.filter(
    (c) => typeof c.lastPracticedAt === 'number' && c.lastPracticedAt >= dayCutoff
  ).length;

  const storyTotalSentences = chapters.reduce((sum, ch) => sum + ch.sentences.length, 0);
  const readSet = new Set(storyProgress.readSentenceIds);
  let storyReadCount = 0;
  for (const ch of chapters) {
    for (const s of ch.sentences) {
      if (readSet.has(s.id)) storyReadCount += 1;
    }
  }
  const storyPercent =
    storyTotalSentences > 0 ? Math.round((storyReadCount / storyTotalSentences) * 100) : 0;

  const genderCounts: Record<CzechNounGender, number> = {
    masculine_animate: 0,
    masculine_inanimate: 0,
    feminine: 0,
    neuter: 0,
  };
  for (const card of cards) {
    if (card.nounGender) {
      genderCounts[card.nounGender] += 1;
    }
  }

  return {
    totalCards: cards.length,
    dueCount,
    buriedCount,
    masteredCount: cards.filter((c) => c.mastered).length,
    practicedTodayCount,
    reviewEventsCount: reviewEvents.length,
    storyReadCount,
    storyTotalSentences,
    storyPercent,
    lastChapter: storyProgress.lastChapter || 1,
    audioFilesCount: audioMetaList.length,
    genderCounts,
  };
}

export function filterCardsByGender(
  cards: VocabCard[],
  genderFilter: GenderFilter
): VocabCard[] {
  if (genderFilter === 'all') return cards;
  return cards.filter((card) => card.nounGender === genderFilter);
}
