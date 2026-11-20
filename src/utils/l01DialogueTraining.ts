import { L01_WORKING_SOURCE } from '../data/l01WorkingSource';

export type L01DialogueRole = 'A' | 'B';
export type L01DialogueMode = 'explore' | 'guided' | 'challenge';
export type L01SelfCheck = 'felt_ready' | 'needs_repeat';

export interface L01TurnPracticeRecord {
  response: string;
  attempted: boolean;
  selfCheck: L01SelfCheck | null;
}

export const L01_DIALOGUE_IDS = new Set<string>(L01_WORKING_SOURCE.dialogues.map(d => d.id));
export const L01_DIALOGUE_TURN_IDS = new Set<string>(
  L01_WORKING_SOURCE.dialogues.reduce<string[]>((items, d) => {
    for (const turn of d.turns) items.push(turn.id);
    return items;
  }, []),
);

export function isL01DialogueTurnId(value: string): boolean {
  return L01_DIALOGUE_TURN_IDS.has(value);
}

export function getDialogueLearnerCue(turn: { id: string; mn: string }): string {
  // Editorial *display* clarification, without changing the canonical Czech or translation.
  // Odkud jste? is grammatically correct; the source's 'Та хааных вэ?' is valid
  // but 'Та хаанаас ирсэн бэ?' is a clearer cue for this origin question.
  if (turn.id.endsWith('-T03') && turn.mn === 'Та хааных вэ?') {
    return 'Та хаанаас ирсэн бэ?';
  }
  return turn.mn;
}

export function getDialogueRoundResults(
  dialogue: { turns: readonly { id: string; speaker: string }[] },
  role: L01DialogueRole,
  results: Record<string, L01TurnPracticeRecord>,
): { total: number; tried: number; selfReviewed: number; repeat: number } {
  const own = dialogue.turns.filter(t => t.speaker === role);
  return {
    total: own.length,
    tried: own.filter(t => Boolean(results[t.id]?.response.trim()) || results[t.id]?.attempted === true).length,
    selfReviewed: own.filter(t => results[t.id]?.selfCheck === 'felt_ready').length,
    repeat: own.filter(t => results[t.id]?.selfCheck === 'needs_repeat').length,
  };
}

export function sanitizeL01DialogueRecords(value: unknown): Record<string, L01TurnPracticeRecord> {
  const records: Record<string, L01TurnPracticeRecord> = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return records;
  for (const [id, item] of Object.entries(value)) {
    if (!isL01DialogueTurnId(id) || !item || typeof item !== 'object' || Array.isArray(item)) continue;
    const candidate = item as Partial<L01TurnPracticeRecord>;
    const selfCheck: L01SelfCheck | null =
      candidate.selfCheck === 'felt_ready' || candidate.selfCheck === 'needs_repeat' ? candidate.selfCheck : null;
    const response = typeof candidate.response === 'string' ? candidate.response.slice(0, 1000) : '';
    const attempted = candidate.attempted === true || response.trim().length > 0 || selfCheck !== null;
    if (attempted) records[id] = { response, attempted, selfCheck };
  }
  return records;
}
