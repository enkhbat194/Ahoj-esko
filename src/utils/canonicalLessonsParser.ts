import type { Dialogue } from '../types/lesson';
import { readCanonicalCurriculumOverview } from './canonicalCurriculumOverview';
import type { ParsedDriveCurriculum, ParsedDriveCard } from './driveCurriculumParser';

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Exact-source, preview-only bridge from the canonical 72-lesson JSON schema.
 * This parser deliberately does NOT approve content or attach audio files.
 * Source IDs remain stable even where the same phrase is taught in two lessons.
 */
export function parseCanonicalLessonsJson(input: unknown): ParsedDriveCurriculum | null {
  if (!record(input) || !Array.isArray(input.lessons)) return null;

  const cards: ParsedDriveCard[] = [];
  const dialogues: Omit<Dialogue, 'id'>[] = [];

  for (const candidate of input.lessons) {
    if (!record(candidate)) continue;
    const lessonId = stringValue(candidate.lesson_id);
    if (!/^CZ-A[01]-M\d{2}-L\d{2}$/.test(lessonId)) continue;
    const phrases = Array.isArray(candidate.phrases) ? candidate.phrases : [];
    for (const phrase of phrases) {
      if (!record(phrase)) continue;
      const canonicalId = stringValue(phrase.content_id);
      const cs = stringValue(phrase.cs_text);
      const mn = stringValue(phrase.mn_working);
      if (!canonicalId.startsWith(lessonId + '-PH') || !cs || !mn) continue;
      cards.push({
        canonicalId,
        lessonId,
        topicId: 'custom',
        czechWord: cs,
        mongolianWord: mn,
        czechSentence: cs,
        mongolianSentence: mn,
        phoneticHint: '', // No fabricated Czech phonetics; authoring is a separate QA stage.
        qaStatus: 'draft_ai',
      });
    }

    const scenes = Array.isArray(candidate.dialogues) ? candidate.dialogues : [];
    for (const scene of scenes) {
      if (!record(scene)) continue;
      const canonicalId = stringValue(scene.dialogue_id);
      if (!canonicalId.startsWith(lessonId + '-B') || !Array.isArray(scene.turns)) continue;
      const lines = scene.turns
        .filter(record)
        .map((turn) => ({
          id: stringValue(turn.turn_id),
          speaker: turn.speaker === 'B' ? 'B' as const : 'A' as const,
          speakerName: turn.speaker === 'B' ? 'B' : 'A',
          czech: stringValue(turn.cs),
          phonetic: '',
          mongolian: stringValue(turn.mn),
          qaStatus: 'draft_ai' as const,
        }))
        .filter((line) => line.id.startsWith(canonicalId + '-T') && line.czech && line.mongolian);
      if (lines.length === 0) continue;
      dialogues.push({
        canonicalId,
        lessonId,
        topicId: 'custom',
        titleMn: stringValue(scene.title_mn) || 'Харилцан яриа',
        titleCz: lines[0].czech.slice(0, 80),
        situationMn: stringValue(candidate.mission_mn),
        qaStatus: 'draft_ai',
        lines,
      });
    }
  }

  if (cards.length === 0 && dialogues.length === 0) return null;
  return { cards, dialogues, detectedFormat: 'json', canonicalOverview: readCanonicalCurriculumOverview(input) ?? undefined };
}
