import { L01_DATASET_SHA256, L01_ID, type L01Stage } from '../data/l01WorkingSource';
import type { CourseLesson } from './courseSource';

export type DialogueMode = 'explore' | 'guided' | 'challenge';
export type DialogueRole = 'A' | 'B';
export type SelfCheck = 'felt_ready' | 'needs_repeat';
export interface TurnRecord { response: string; attempted: boolean; selfCheck: SelfCheck | null }
export interface CourseProgress {
  schema: 1; lessonId: string; sourceSha256: string; stage: L01Stage;
  responses: Record<string, string>; revealedIds: string[]; selfReviewedIds: string[];
  exitResponse: string; exitAttempted: boolean; updatedAt: number;
  dialogueRecords: Record<string, TurnRecord>;
  sceneId: string; turnIndex: number; mode: DialogueMode; role: DialogueRole;
  finishedScenes: string[]; practicedPhrases: string[]; pronunciationPracticed: boolean;
}
const stages = ['dialogue','phrases','pronunciation','practice','exit'] as const;

export function freshProgress(lesson: CourseLesson): CourseProgress {
  return {
    schema: 1, lessonId: lesson.lessonId, sourceSha256: L01_DATASET_SHA256, stage: 'dialogue',
    responses: {}, revealedIds: [], selfReviewedIds: [], exitResponse: '', exitAttempted: false, updatedAt: 0,
    dialogueRecords: {}, sceneId: lesson.dialogues[0].id, turnIndex: 0, mode: 'explore', role: 'B',
    finishedScenes: [], practicedPhrases: [], pronunciationPracticed: false,
  };
}
const bounded = (v: unknown, limit: number) => typeof v === 'string' ? v.slice(0, limit) : '';
function validIds(value: unknown, ids: Set<string>) {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && ids.has(id)))] : [];
}
export function parseProgress(input: unknown, lesson: CourseLesson): CourseProgress | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const data = input as Partial<CourseProgress>;
  if (data.schema !== 1 || data.lessonId !== lesson.lessonId || data.sourceSha256 !== L01_DATASET_SHA256) return null;
  const exercises = new Set(lesson.exercises.map(ex => ex.id));
  const scene = lesson.dialogues.find(d => d.id === data.sceneId) || lesson.dialogues[0];
  const responses: Record<string, string> = {};
  for (const id of exercises) {
    if (typeof data.responses?.[id] === 'string') responses[id] = bounded(data.responses[id], 3000);
  }
  const records: Record<string, TurnRecord> = {};
  for (const dialogue of lesson.dialogues) for (const turn of dialogue.turns) {
    const row = data.dialogueRecords?.[turn.id];
    if (!row || typeof row !== 'object') continue;
    const response = bounded(row.response, 1000);
    if (!response.trim() && row.attempted !== true) continue;
    records[turn.id] = { response, attempted: true,
      selfCheck: row.selfCheck === 'felt_ready' || row.selfCheck === 'needs_repeat' ? row.selfCheck : null };
  }
  const exitResponse = bounded(data.exitResponse, 4000);
  return {
    ...freshProgress(lesson), stage: stages.includes(data.stage!) ? data.stage! : 'dialogue',
    responses, revealedIds: validIds(data.revealedIds, exercises), selfReviewedIds: validIds(data.selfReviewedIds, exercises),
    exitResponse, exitAttempted: !!exitResponse.trim() && data.exitAttempted === true,
    updatedAt: Number.isFinite(data.updatedAt) && data.updatedAt! >= 0 ? data.updatedAt! : 0,
    dialogueRecords: records, sceneId: scene.id,
    turnIndex: Number.isInteger(data.turnIndex) ? Math.max(0, Math.min(data.turnIndex!, scene.turns.length)) : 0,
    mode: data.mode === 'guided' || data.mode === 'challenge' ? data.mode : 'explore', role: data.role === 'A' ? 'A' : 'B',
    finishedScenes: validIds(data.finishedScenes, new Set(lesson.dialogues.map(d => d.id))),
    practicedPhrases: validIds(data.practicedPhrases, new Set(lesson.phrases.map(p => p.id))),
    pronunciationPracticed: data.pronunciationPracticed === true,
  };
}
export function progressKey(id: string) {
  return id === L01_ID ? 'ahoj_cesko_l01_v0920_practice_v1' : 'ahoj_course_' + L01_DATASET_SHA256 + '_' + id;
}
export function loadProgress(lesson: CourseLesson): CourseProgress {
  try { return parseProgress(JSON.parse(localStorage.getItem(progressKey(lesson.lessonId)) || 'null'), lesson) || freshProgress(lesson); }
  catch { return freshProgress(lesson); }
}
export function saveProgress(progress: CourseProgress) {
  try { localStorage.setItem(progressKey(progress.lessonId), JSON.stringify(progress)); return true; }
  catch { return false; }
}
export function updateResponse(p: CourseProgress, id: string, value: string, lesson: CourseLesson) {
  if (!lesson.exercises.some(ex => ex.id === id)) return p;
  return {...p, responses: {...p.responses, [id]: value.slice(0,3000)},
    selfReviewedIds: p.selfReviewedIds.filter(x => x !== id), updatedAt: Date.now()};
}
export function reviewedCount(p: CourseProgress, lesson: CourseLesson) {
  return lesson.exercises.filter(ex => p.responses[ex.id]?.trim() && p.selfReviewedIds.includes(ex.id)).length;
}
export function isComplete(p: CourseProgress, lesson: CourseLesson) {
  return lesson.dialogues.every(d => p.finishedScenes.includes(d.id)) && lesson.phrases.every(ph => p.practicedPhrases.includes(ph.id))
    && p.pronunciationPracticed && reviewedCount(p, lesson) === lesson.exercises.length && p.exitAttempted;
}
