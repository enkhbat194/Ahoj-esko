import { useEffect, useRef, useState } from 'react';
import type { TutorMode, VocabCard } from '../types/lesson';
import { L01_DATASET_SHA256, L01_ID, type L01Stage } from '../data/l01WorkingSource';
import { starterCourse, type Course } from '../utils/courseSource';
import { installCourse, linkedLesson, loadCourse, openPrivateInvitation } from '../utils/courseStorage';
import { isComplete, loadProgress } from '../utils/courseProgress';
import { CourseLessonView, panel, quiet, secondary } from './CourseLessonView';

const lastKey = 'ahoj-course-v0920-last-lesson';
function initialId() {
  try { return linkedLesson() || localStorage.getItem(lastKey) || L01_ID; } catch { return L01_ID; }
}
interface Props {
  openingStage?: L01Stage;
  onLaunchMissionRoleplay?: (mode: TutorMode) => void;
  onAddCards?: (items: Omit<VocabCard,'id'|'audioIds'|'practiceCount'|'mastered'>[], preserveIds?: boolean) => number;
}
export function CanonicalCourseView({onLaunchMissionRoleplay, onAddCards, openingStage}: Props) {
  const [course, setCourse] = useState<Course>(starterCourse);
  const [id, setId] = useState(initialId);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const request = useRef(0);
  useEffect(() => {
    let current = true;
    const params = new URLSearchParams(location.hash.slice(1));
    const invitation = params.get('access');
    const initialize = async () => {
      try {
        let result = await loadCourse();
        if (invitation) {
          try {
            if (!result?.clips.size) result = await openPrivateInvitation(invitation);
            if (current) {
              params.delete('access');
              history.replaceState(history.state, '', location.pathname + location.search + '#' + params);
            }
          } catch {
            if (current) setError('Хувийн багцыг нээж чадсангүй. Холбоосоо бүтнээр нь нээх эсвэл хадгалсан файлаа сонгоорой.');
          }
        }
        if (current && result) setCourse(result);
      } catch { if (current) setError('Хадгалсан багцыг нээж чадсангүй. Сургалтын файлаа дахин сонгоорой.'); }
      finally { if (current) setBusy(false); }
    };
    void initialize();
    return () => { current = false; };
  }, []);
  const install = async (file?: File) => {
    if (!file) return;
    const number = ++request.current;
    setBusy(true); setError('');
    try { const next = await installCourse(file); if (number === request.current) setCourse(next); }
    catch (e) { if (number === request.current) setError(e instanceof Error ? e.message : 'Файл нээгдсэнгүй.'); }
    finally { if (number === request.current) setBusy(false); }
  };
  const select = (next: string) => {
    setId(next);
    const params = new URLSearchParams(location.hash.slice(1));
    params.set('lesson', next);
    history.replaceState(history.state, '', location.pathname + location.search + '#' + params);
    try { localStorage.setItem(lastKey, next); } catch { /* each lesson also offers a backup */ }
    window.scrollTo({top:0});
  };
  const index = Math.max(0, course.lessons.findIndex(l => l.lessonId === id));
  const lesson = course.lessons[index];
  const addCards = () => onAddCards!(lesson.phrases.map(p => ({
    canonicalId: p.id, lessonId: lesson.lessonId, curriculumSha256: L01_DATASET_SHA256, topicId: 'custom' as const,
    czechWord: p.cs, mongolianWord: p.mn, phoneticHint: '', czechSentence: p.cs, mongolianSentence: p.mn, qaStatus: 'draft_ai' as const,
  })), true);
  return <div className="space-y-3">
    <section className={panel}>
      <label className="block text-sm font-semibold" htmlFor="canonical-lesson">Хичээл сонгох</label>
      <select id="canonical-lesson" value={lesson.lessonId} disabled={busy} onChange={e => select(e.target.value)}
        className="w-full min-h-12 rounded-xl border border-black/15 dark:border-white/20 bg-white dark:bg-[#262628] px-2 text-base">
        {['A0','A1'].map(level => <optgroup key={level} label={level}>
          {course.lessons.filter(l => l.lessonId.startsWith('CZ-'+level+'-')).map(l =>
            <option value={l.lessonId} key={l.lessonId}>{l.lessonId.slice(3)} · {l.titleMn}{isComplete(loadProgress(l),l) ? ' ✓' : ''}</option>)}
        </optgroup>)}
      </select>
      {busy && <p role="status">Хичээлийн эх, аудиог шалгаж байна…</p>}
      {!busy && <details open={course.lessons.length === 1 ? true : undefined}><summary className={quiet}>Сургалтын багц · {course.lessons.length} хичээл</summary>
        <p className={quiet}>Хувийн сургалтын багц эсвэл v0.9.20 эх файлаа сонго. Нэг удаа оруулсны дараа энэ төхөөрөмж дээр хадгална.</p>
        <label className={secondary+' inline-block mt-2'}>Сургалтын файл сонгох<input type="file" accept=".ahoj,.json,application/json" className="sr-only"
          onChange={e => {void install(e.currentTarget.files?.[0]); e.currentTarget.value='';}}/></label>
      </details>}
      {error && <p role="alert" className={quiet}>{error}</p>}
    </section>
    {!busy && <CourseLessonView openingStage={openingStage} key={lesson.lessonId} lesson={lesson} clips={course.clips} nextLesson={course.lessons[index+1]}
      onSelect={select} onAddCards={onAddCards ? addCards : undefined}
      onTutor={lesson.lessonId === L01_ID && onLaunchMissionRoleplay ? () => onLaunchMissionRoleplay('coach') : undefined}/>}
  </div>;
}
