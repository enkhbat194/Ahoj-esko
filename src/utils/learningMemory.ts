export type LearningMemoryStatus = 'Raw' | 'Extracted' | 'Validated' | 'Approved';

export interface LearningMemoryItem {
  id: string;
  conversationId: string;
  createdAt: number;
  status: LearningMemoryStatus;
  isPrivate: boolean;
  newCzechWord?: string;
  newCzechSentence?: string;
  mongolianTranslation?: string;
  studentMistake?: string;
  correctedCzech?: string;
  questionCzech?: string;
  answerCzech?: string;
  audioCacheId?: string;
  nextReviewAt: number;
  speechUncertainty?: boolean;
}

const MEMORY_STORAGE_KEY = 'ahoj_cesko_learning_memory_v1';

export function extractMemoryFromTurn(params: {
  conversationId: string;
  studentCzech?: string;
  replyCzech: string;
  replyMongolian?: string;
  suggestedReplyCzech?: string;
  coachingTipMn?: string;
  hasError?: boolean;
  speechUncertainty?: boolean;
  audioCacheId?: string;
  now?: number;
}): LearningMemoryItem {
  const now = params.now ?? Date.now();
  const hasMeaningfulContent = Boolean(params.replyCzech.trim() && params.replyMongolian?.trim());
  const nextReviewAt = now + 24 * 60 * 60 * 1000;

  return {
    id: `mem_${now}_${Math.random().toString(36).slice(2, 7)}`,
    conversationId: params.conversationId,
    createdAt: now,
    // Conversations start as Extracted (if structured fields present) or Raw — never auto-Approved
    status: hasMeaningfulContent && !params.speechUncertainty ? 'Extracted' : 'Raw',
    // Strictly private to this learner; never auto-shared to public/shared curriculum
    isPrivate: true,
    newCzechSentence: params.replyCzech.trim(),
    mongolianTranslation: params.replyMongolian?.trim(),
    studentMistake: params.hasError ? params.studentCzech?.trim() : undefined,
    correctedCzech: params.hasError ? params.suggestedReplyCzech?.trim() || params.coachingTipMn?.trim() : undefined,
    questionCzech: params.replyCzech.trim(),
    answerCzech: params.suggestedReplyCzech?.trim(),
    audioCacheId: params.audioCacheId,
    nextReviewAt,
    speechUncertainty: params.speechUncertainty,
  };
}

export function transitionMemoryStatus(
  item: LearningMemoryItem,
  nextStatus: LearningMemoryStatus
): LearningMemoryItem {
  const allowedOrder: Record<LearningMemoryStatus, number> = {
    Raw: 0,
    Extracted: 1,
    Validated: 2,
    Approved: 3,
  };
  if (allowedOrder[nextStatus] < allowedOrder[item.status]) {
    return item;
  }
  return {
    ...item,
    status: nextStatus,
  };
}

export function loadLearningMemory(): LearningMemoryItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LearningMemoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLearningMemory(items: LearningMemoryItem[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(items.slice(0, 300)));
  } catch {
    // Ignore storage errors
  }
}
