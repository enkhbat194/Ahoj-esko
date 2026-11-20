import { L01_DATASET_SHA256, L01_ID, L01_WORKING_SOURCE, type L01Stage } from '../data/l01WorkingSource';

/**
 * Practice-progress record, NOT a score or source QA. Stays on this device.
 * Refuses to reuse progress for a different dataset hash or lesson.
 */
export interface L01PracticeProgress {
  schema: 1;
  lessonId: typeof L01_ID;
  sourceSha256: string;
  stage: L01Stage;
  responses: Record<string, string>;
  revealedIds: string[];
  selfReviewedIds: string[];
  exitResponse: string;
  exitAttempted: boolean;
  updatedAt: number;
}

export const L01_PROGRESS_KEY = 'ahoj_cesko_l01_v0920_practice_v1';

export function createL01Progress(): L01PracticeProgress {
  return {
    schema: 1, lessonId: L01_ID, sourceSha256: L01_DATASET_SHA256,
    stage: 'dialogue', responses: {}, revealedIds: [], selfReviewedIds: [],
    exitResponse: '', exitAttempted: false, updatedAt: 0,
  };
}

const stages: readonly L01Stage[] = ['dialogue', 'phrases', 'practice', 'exit'];
const allowedExerciseIds = new Set<string>(L01_WORKING_SOURCE.exercises.map((ex) => ex.id));

export function parseL01Progress(input: unknown): L01PracticeProgress | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const data = input as Partial<L01PracticeProgress>;
  if (data.schema !== 1 || data.lessonId !== L01_ID || data.sourceSha256 !== L01_DATASET_SHA256) return null;
  const responses: Record<string, string> = {};
  if (data.responses && typeof data.responses === 'object' && !Array.isArray(data.responses)) {
    for (const [key, value] of Object.entries(data.responses)) {
      if (allowedExerciseIds.has(key) && typeof value === 'string') responses[key] = value.slice(0, 3000);
    }
  }
  const filterIds = (items: unknown): string[] =>
    Array.isArray(items) ? [...new Set(items.filter((id): id is string => typeof id === 'string' && allowedExerciseIds.has(id)))] : [];
  return {
    schema: 1, lessonId: L01_ID, sourceSha256: L01_DATASET_SHA256,
    stage: stages.includes(data.stage as L01Stage) ? data.stage as L01Stage : 'dialogue',
    responses, revealedIds: filterIds(data.revealedIds),
    selfReviewedIds: filterIds(data.selfReviewedIds),
    exitResponse: typeof data.exitResponse === 'string' ? data.exitResponse.slice(0, 4000) : '',
    exitAttempted: data.exitAttempted === true && typeof data.exitResponse === 'string' && data.exitResponse.trim().length > 0,
    updatedAt: typeof data.updatedAt === 'number' && Number.isFinite(data.updatedAt) && data.updatedAt >= 0 ? data.updatedAt : 0,
  };
}

export function loadL01Progress(): L01PracticeProgress {
  if (typeof localStorage === 'undefined') return createL01Progress();
  try {
    const raw = localStorage.getItem(L01_PROGRESS_KEY);
    return raw ? (parseL01Progress(JSON.parse(raw)) ?? createL01Progress()) : createL01Progress();
  } catch {
    return createL01Progress();
  }
}

export function saveL01Progress(progress: L01PracticeProgress): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    const safe = parseL01Progress(progress);
    if (!safe) return false;
    localStorage.setItem(L01_PROGRESS_KEY, JSON.stringify(safe));
    return true;
  } catch {
    return false; // Safari private mode or quota limit: do not claim that work was saved.
  }
}

export function updateL01Response(progress: L01PracticeProgress, exerciseId: string, value: string): L01PracticeProgress {
  if (!allowedExerciseIds.has(exerciseId)) return progress;
  return {
    ...progress,
    responses: { ...progress.responses, [exerciseId]: value.slice(0, 3000) },
    // Changing an answer invalidates its previous self-review.
    selfReviewedIds: progress.selfReviewedIds.filter((id) => id !== exerciseId),
    updatedAt: Date.now(),
  };
}

export function reviewedL01Count(progress: L01PracticeProgress): number {
  return L01_WORKING_SOURCE.exercises.filter((ex) =>
    Boolean(progress.responses[ex.id]?.trim()) && progress.selfReviewedIds.includes(ex.id)
  ).length;
}
