import type { SrsCardState, SrsGrade, VocabCard } from '../types/lesson';

export const SRS_EVENTS_STORAGE_KEY = 'ahoj_cesko_srs_events_v1';

/**
 * Explicit non-FSRS label per AHOJ_V098_OPTIMAL_STRATEGY_AND_DELIVERY ("энэ үеийн жишиг интервал нь FSRS БИШ").
 * Uses transparent deterministic fallback intervals [1, 3, 7, 14] days matching AHOJ_A0_M01_L01_CANONICAL_v0_4.
 */
export const SRS_ENGINE_LABEL = 'Жишиг давталт (1·3·7·14 хоног)';

export const BASE_INITIAL_DAYS = [1, 3, 7, 14] as const;

export interface ReviewEventRecord {
  eventId: string;
  cardId: string;
  lemmaGroup?: string;
  grade: SrsGrade;
  reviewedAtUtc: number;
  intervalDays: number;
  dueAtUtc: number;
}

export function formatUtcDayKey(ts: number = Date.now()): string {
  return new Date(ts).toISOString().slice(0, 10);
}

/**
 * Computes next deterministic interval and due timestamp for a review grade.
 */
export function scheduleNextSrsState(
  current: SrsCardState | undefined,
  grade: SrsGrade,
  nowUtc: number = Date.now()
): SrsCardState {
  const dayMs = 24 * 60 * 60 * 1000;
  const prevReps = current?.repetitions ?? 0;
  const prevInterval = current?.intervalDays ?? 0;
  const prevLapses = current?.lapses ?? 0;

  let nextReps = prevReps;
  let intervalDays = 1;
  let lapses = prevLapses;

  if (grade === 'again') {
    nextReps = 0;
    intervalDays = 0; // Due again within same session / same day
    lapses = prevLapses + 1;
  } else if (grade === 'hard') {
    nextReps = Math.max(1, prevReps);
    intervalDays = prevInterval >= 2 ? Math.max(1, Math.round(prevInterval * 1.2)) : 1;
  } else if (grade === 'good') {
    nextReps = prevReps + 1;
    if (prevReps === 0) {
      intervalDays = BASE_INITIAL_DAYS[0]; // 1d
    } else if (prevReps === 1) {
      intervalDays = BASE_INITIAL_DAYS[1]; // 3d
    } else if (prevReps === 2) {
      intervalDays = BASE_INITIAL_DAYS[2]; // 7d
    } else {
      intervalDays = Math.min(60, Math.max(BASE_INITIAL_DAYS[3], Math.round(prevInterval * 1.8)));
    }
  } else {
    // easy
    nextReps = prevReps + 2;
    if (prevReps === 0) {
      intervalDays = BASE_INITIAL_DAYS[1]; // 3d
    } else if (prevReps === 1) {
      intervalDays = BASE_INITIAL_DAYS[2]; // 7d
    } else {
      intervalDays = Math.min(90, Math.max(BASE_INITIAL_DAYS[3], Math.round(Math.max(3, prevInterval) * 2.2)));
    }
  }

  const dueAt = grade === 'again' ? nowUtc + 10 * 60 * 1000 : nowUtc + intervalDays * dayMs;

  return {
    intervalDays,
    dueAt,
    lastReviewedAt: nowUtc,
    repetitions: nextReps,
    lapses,
    lastGrade: grade,
  };
}

/**
 * Applies sibling burying per AHOJ_MODERN_APP_IMPLEMENTATION_STANDARD_v0_9_7:
 * Cards sharing the same non-empty `lemmaGroup` are buried until next UTC day when one is reviewed,
 * preventing related forms from flooding the same daily review queue.
 */
export function applySiblingBury(
  cards: VocabCard[],
  reviewedCardId: string,
  nowUtc: number = Date.now()
): VocabCard[] {
  const reviewedCard = cards.find((c) => c.id === reviewedCardId);
  const group = reviewedCard?.lemmaGroup?.trim();
  if (!group) return cards;

  const todayKey = formatUtcDayKey(nowUtc);
  return cards.map((card) => {
    if (card.id === reviewedCardId) return card;
    if (card.lemmaGroup?.trim() !== group) return card;
    return {
      ...card,
      srs: {
        intervalDays: card.srs?.intervalDays ?? 0,
        dueAt: card.srs?.dueAt ?? nowUtc,
        repetitions: card.srs?.repetitions ?? 0,
        lapses: card.srs?.lapses ?? 0,
        ...card.srs,
        buriedUntilDay: todayKey,
      },
    };
  });
}

export function isCardDueToday(card: VocabCard, nowUtc: number = Date.now()): boolean {
  const todayKey = formatUtcDayKey(nowUtc);
  if (card.srs?.buriedUntilDay === todayKey) return false;
  if (!card.srs) return !card.mastered;
  return card.srs.dueAt <= nowUtc;
}

export function countDueAndBuried(cards: VocabCard[], nowUtc: number = Date.now()): {
  dueCount: number;
  buriedCount: number;
} {
  const todayKey = formatUtcDayKey(nowUtc);
  let dueCount = 0;
  let buriedCount = 0;
  for (const c of cards) {
    if (c.srs?.buriedUntilDay === todayKey) {
      buriedCount += 1;
    } else if (isCardDueToday(c, nowUtc)) {
      dueCount += 1;
    }
  }
  return { dueCount, buriedCount };
}

/**
 * Idempotent event log append: duplicate eventIds never create duplicate review entries or double XP.
 */
export function appendIdempotentReviewEvent(
  events: ReviewEventRecord[],
  incoming: ReviewEventRecord
): { events: ReviewEventRecord[]; added: boolean } {
  if (events.some((e) => e.eventId === incoming.eventId)) {
    return { events, added: false };
  }
  return {
    events: [incoming, ...events].slice(0, 500),
    added: true,
  };
}

export function loadReviewEvents(): ReviewEventRecord[] {
  try {
    const raw = localStorage.getItem(SRS_EVENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReviewEventRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReviewEvents(events: ReviewEventRecord[]): void {
  try {
    localStorage.setItem(SRS_EVENTS_STORAGE_KEY, JSON.stringify(events.slice(0, 500)));
  } catch {
    // Ignore quota errors
  }
}
