import type { DialogueRole, TurnRecord } from './courseProgress';

export function getDialogueLearnerCue(turn: { id: string; mn: string }): string {
  // Editorial *display* clarification, without changing the canonical Czech or translation.
  // Odkud jste? is grammatically correct; the source's 'Та хааных вэ?' is valid
  // but 'Та хаанаас ирсэн бэ?' is a clearer cue for this origin question.
  if ((turn.id === 'CZ-A0-M01-L01-B01-T03' || turn.id === 'CZ-A0-M01-L01-B02-T03') && turn.mn === 'Та хааных вэ?') {
    return 'Та хаанаас ирсэн бэ?';
  }
  return turn.mn;
}

export function getDialogueRoundResults(
  dialogue: { turns: readonly { id: string; speaker: string }[] },
  role: DialogueRole,
  results: Record<string, TurnRecord>,
): { total: number; tried: number; selfReviewed: number; repeat: number } {
  const own = dialogue.turns.filter(t => t.speaker === role);
  return {
    total: own.length,
    tried: own.filter(t => Boolean(results[t.id]?.response.trim()) || results[t.id]?.attempted === true).length,
    selfReviewed: own.filter(t => results[t.id]?.selfCheck === 'felt_ready').length,
    repeat: own.filter(t => results[t.id]?.selfCheck === 'needs_repeat').length,
  };
}
