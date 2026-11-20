import { L01_DATASET_SHA256, L01_WORKING_SOURCE } from '../data/l01WorkingSource';
import receipts from '../data/courseAudioReceipts.json';
import { readCanonicalCurriculumOverview } from './canonicalCurriculumOverview';

export interface CourseLine { id: string; cs: string; mn: string; isTemplate?: boolean }
export interface CourseTurn extends CourseLine { speaker: 'A' | 'B' }
export interface CourseScene { id: string; titleMn: string; turns: readonly CourseTurn[] }
export interface CourseExercise { id: string; promptMn: string; proposedAnswer: string; gradingPolicy: string; choices?: string[]; tokens?: string[] }
export interface CourseLesson {
  lessonId: string; titleMn: string; missionMn: string;
  phrases: readonly CourseLine[]; dialogues: readonly CourseScene[]; exercises: readonly CourseExercise[];
  grammar?: string;
  chunks: readonly {target: string; chunks: readonly string[]; focus: string}[];
  exit: {id: string; situationMn: string; missionMn: string; criteriaMn: string; needsTransferRewrite: boolean;
    rubric: readonly {criterion: string; descriptionMn: string; maxPoints: number}[]};
}
export interface CourseAudio { receipt: typeof receipts.clips[number]; blob: Blob }
export interface Course { lessons: readonly CourseLesson[]; clips: Map<string, CourseAudio[]> }

function exerciseControls(prompt: string, markdown: string): Pick<CourseExercise,'choices'|'tokens'> {
  const position = markdown.indexOf(prompt);
  const following = position >= 0 ? markdown.slice(position + prompt.length).split('\n', 2)[1] || '' : '';
  const options = following.match(/^\s*-\s*(.+\s+\/\s+.+)$/)?.[1] ||
    prompt.match(/_{2,}.*?\(([^()]+\s+\/\s+[^()]+)\)\s*$/)?.[1];
  if (options) return {choices: options.split(/\s+\/\s+/).map(s => s.trim())};
  const tokens = (prompt.includes(':') ? prompt.slice(prompt.lastIndexOf(':')+1) : prompt).trim();
  if (/^[\p{Script=Latin} ]+(?:\s+\/\s+[\p{Script=Latin} ]+){2,}[.?!]?$/u.test(tokens)) return {tokens: tokens.split(/\s+\/\s+/)};
  return {};
}

export const starterCourse: Course = { lessons: [{ ...L01_WORKING_SOURCE, grammar: 'Jmenuji se... / Jak se jmenujete?',
  exercises: L01_WORKING_SOURCE.exercises.map(ex => ({...ex,
    ...exerciseControls(ex.promptMn, ''), ...(ex.id.endsWith('EX01') ? {choices:['Таны нэрийг','Нас','Утасны дугаар']} :
      ex.id.endsWith('EX04') ? {choices:['Jsem z Mongolska.','Těší mě.','Jak se jmenujete?']} : {})})),
  chunks: [
  { target: 'Jmenuji se', chunks: ['jme', 'nu', 'ji', 'se'], focus: 'Jmenuji se-ийг холбоотой хэллэг болгох' },
  { target: 'jmenujete', chunks: ['jme', 'nu', 'je', 'te'], focus: '-te хүндэтгэлийн хэлбэр, эхний үеийн өргөлт' },
] }], clips: new Map() };

export async function digest(bytes: ArrayBuffer | Uint8Array<ArrayBuffer> | string) {
  const hash = await crypto.subtle.digest('SHA-256', typeof bytes === 'string' ? new TextEncoder().encode(bytes) : bytes);
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}

// The exact byte hash is verified before interpreting these source fields.
interface SourceLesson {
  raw_lesson_markdown: string;
  phrases: {content_id: string; cs_text: string; mn_working: string}[];
  dialogues: {dialogue_id: string; title_mn: string; turns: {turn_id: string; cs: string; mn: string; speaker: 'A'|'B'}[]}[];
  exit_assessment_v0912: {situation_mn: string};
  pedagogy_working_v0911?: {grammar_micro?: string; pronunciation_orthographic_chunks?: CourseLesson['chunks']};
}

export async function readCourse(file: Blob): Promise<Course> {
  if (file.size > 32_000_000) throw Error('Сургалтын файлын хэмжээ хэтэрсэн.');
  let source = await file.text();
  let data = JSON.parse(source);
  const packed = data.format === 'ahoj-private-course-1';
  let answers = new Map<string, string>();
  let waves: Record<string, unknown> = {};
  if (packed) {
    if (typeof data.source !== 'string' || typeof data.contracts !== 'string' ||
        await digest(data.contracts) !== receipts.contractsSha256) throw Error('Дасгалын эх таарахгүй байна.');
    answers = new Map(data.contracts.trim().split('\n').map((line: string) => {
      const row = JSON.parse(line);
      return [row.exercise_id, row.effective_reference_answer_draft];
    }));
    waves = data.audio;
    source = data.source;
    data = JSON.parse(source);
  }
  if (await digest(source) !== L01_DATASET_SHA256) throw Error('Хичээлийн эх v0.9.20-той таарахгүй байна.');
  const overview = readCanonicalCurriculumOverview(data);
  if (!overview || overview.validationErrors.length || overview.lessons.length !== 72) throw Error('Хичээлийн холбоос зөрсөн.');
  const exercises = new Map(overview.exercises.map(ex => [ex.canonicalId, ex]));
  const exits = new Map(overview.exitTasks.map(ex => [ex.canonicalId, ex]));
  const lessons = overview.lessons.map((row, i): CourseLesson => {
    const raw: SourceLesson = data.lessons[i];
    const exit = exits.get(row.exitId)!;
    return {
      lessonId: row.canonicalId, titleMn: row.titleMn, missionMn: row.missionMn,
      phrases: raw.phrases.map(p => ({id: p.content_id, cs: p.cs_text, mn: p.mn_working, isTemplate: /…|\.\.\./.test(p.cs_text)})),
      dialogues: raw.dialogues.map(s => ({ id: s.dialogue_id, titleMn: s.title_mn,
        turns: s.turns.map(t => ({id: t.turn_id, cs: t.cs, mn: t.mn, speaker: t.speaker})) })),
      exercises: row.exerciseIds.map(id => {
        const ex = exercises.get(id)!;
        return {id, ...exerciseControls(ex.promptMn, raw.raw_lesson_markdown), promptMn: ex.promptMn, proposedAnswer: answers.get(id) || ex.proposedAnswer, gradingPolicy: ex.gradingPolicy};
      }),
      grammar: raw.pedagogy_working_v0911?.grammar_micro,
      chunks: raw.pedagogy_working_v0911?.pronunciation_orthographic_chunks || [],
      exit: { id: exit.canonicalId, situationMn: raw.exit_assessment_v0912.situation_mn, missionMn: exit.missionMn,
        criteriaMn: exit.canDoCriteriaMn, needsTransferRewrite: exit.needsTransferRewrite, rubric: exit.rubricDraft },
    };
  });
  const clips = new Map<string, CourseAudio[]>();
  if (packed) {
    if (!waves || typeof waves !== 'object' || Array.isArray(waves)) throw Error('Аудионы бүртгэл гэмтсэн.');
    const lines = new Map(lessons.flatMap(l => [...l.phrases, ...l.dialogues.flatMap(d => d.turns)]).map(s => [s.id, s.cs]));
    for (const receipt of receipts.clips) {
      const value = waves[receipt.wavSha256];
      const cs = lines.get(receipt.sourceId);
      if (typeof value !== 'string' || !cs || await digest(cs) !== receipt.textSha256) throw Error('Аудионы эх таарахгүй байна.');
      const bytes = Uint8Array.from(atob(value), ch => ch.charCodeAt(0));
      if (await digest(bytes) !== receipt.wavSha256) throw Error('Аудио файл гэмтсэн байна.');
      const items = clips.get(receipt.sourceId) || [];
      items.push({receipt, blob: new Blob([bytes], {type: 'audio/wav'})});
      clips.set(receipt.sourceId, items);
    }
  }
  return {lessons, clips};
}
