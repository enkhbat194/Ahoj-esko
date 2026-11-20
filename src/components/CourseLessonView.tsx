import { useEffect, useState } from 'react';
import { ArrowRight, Download, Upload } from 'lucide-react';
import { L01_ID, type L01Stage } from '../data/l01WorkingSource';
import type { Course, CourseLesson } from '../utils/courseSource';
import { isComplete, loadProgress, parseProgress, reviewedCount, saveProgress, updateResponse } from '../utils/courseProgress';
import { CourseDialogueCoach } from './CourseDialogueCoach';
import { CourseAudioButton } from './CourseAudioButton';
import { L01SelfRecorder } from './L01SelfRecorder';

const stages: {id: L01Stage; title: string}[] = [
  {id: 'dialogue', title: 'Яриа'}, {id: 'phrases', title: 'Хэллэг'}, {id: 'pronunciation', title: 'Дуудлага'},
  {id: 'practice', title: 'Дасгал'}, {id: 'exit', title: 'Гарах сорил'},
];
export const panel = 'rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 p-4 sm:p-5 space-y-3';
const tile = 'rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] p-4 space-y-2';
export const quiet = 'text-sm text-[#53545A] dark:text-[#B4B9BD]';
export const secondary = 'min-h-11 rounded-xl px-3 py-2 bg-[#F2F2F7] dark:bg-[#333438] text-sm font-semibold disabled:opacity-40';
const primary = 'min-h-11 rounded-xl px-4 py-2 bg-[#0064CF] text-sm font-semibold text-white disabled:opacity-40';
const answerBox = 'w-full rounded-xl p-3 bg-white dark:bg-[#1C1C1E] border border-black/15 dark:border-white/20 text-base';
const toggle = (ids: string[], id: string) => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];

interface Props {
  openingStage?: L01Stage;
  lesson: CourseLesson; clips: Course['clips']; nextLesson?: CourseLesson;
  onSelect: (id: string) => void; onTutor?: () => void;
  onAddCards?: () => number;
}
export function CourseLessonView({lesson, clips, nextLesson, onSelect, onTutor, onAddCards, openingStage}: Props) {
  const [p, set] = useState(() => {
    const progress = loadProgress(lesson);
    return openingStage ? {...progress, stage: openingStage} : progress;
  });
  const [saved, setSaved] = useState(true);
  const [message, setMessage] = useState('');
  const [flipped, setFlipped] = useState<string[]>([]);
  const reviewed = reviewedCount(p, lesson);
  const completed = isComplete(p, lesson);
  const nameExample = lesson.lessonId === L01_ID ? lesson.dialogues[0].turns[1] : undefined;
  const stageIndex = stages.findIndex(s => s.id === p.stage);
  useEffect(() => { setSaved(saveProgress(p)); }, [p]);
  const go = (stage: L01Stage) => {
    set(prev => ({...prev, stage, updatedAt: Date.now()}));
    setMessage('');
  };
  const exportProgress = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(p)], {type:'application/json'}));
    const a = document.createElement('a');
    a.href = url; a.download = lesson.lessonId + '-progress.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  const restore = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 160000) throw Error();
      const result = parseProgress(JSON.parse(await file.text()), lesson);
      if (!result) throw Error();
      set(result); setMessage('Энэ хичээлийн ахицыг сэргээв.');
    } catch { setMessage('Энэ хичээлд тохирох ахицын файл сонгоорой.'); }
  };
  return <div className="space-y-3" data-lesson-id={lesson.lessonId}>
    <section className={panel}>
      <p className={quiet}>{lesson.lessonId} · Сургалтын ноорог</p>
      <h1 className="text-2xl font-bold">{lesson.titleMn}</h1>
      <p>{lesson.missionMn}</p>
      <p className={quiet}>Яриа {p.finishedScenes.length}/{lesson.dialogues.length} · Хэллэг {p.practicedPhrases.length}/{lesson.phrases.length} · Дасгал {reviewed}/{lesson.exercises.length}</p>
      <nav aria-label="Хичээлийн шат" className="flex flex-wrap gap-2">{stages.map((s,i) =>
        <button type="button" key={s.id} aria-current={s.id === p.stage ? 'step' : undefined}
          className={s.id === p.stage ? primary : secondary} onClick={() => go(s.id)}>{i+1}. {s.title}</button>)}</nav>
    </section>
    {!saved && <p role="alert">Энэ төхөөрөмж ахиц хадгалж чадсангүй. Доорх товчоор нөөц хуулбараа татаарай.</p>}
    {p.stage === 'dialogue' && <CourseDialogueCoach lesson={lesson} clips={clips} progress={p} setProgress={set}/>}
    {p.stage === 'phrases' && <section className={panel}><h2 className="text-lg font-bold">Хэллэг бүрийг өөрөө хэлээрэй</h2>
      {lesson.phrases.map(line => <div key={line.id} className={tile} data-source-id={line.id}>
        {openingStage === 'phrases' ? <button type="button" className="w-full min-h-16 text-left" aria-expanded={flipped.includes(line.id)}
          onClick={() => setFlipped(ids => toggle(ids,line.id))}>
          <strong lang="cs" className="block text-lg">{line.cs}</strong>
          <span>{flipped.includes(line.id) ? line.mn : 'Монгол утгыг харах'}</span>
        </button> : <><p lang="cs" className="font-bold text-lg">{line.cs}</p><p>{line.mn}</p></>}
        <CourseAudioButton clips={clips.get(line.id)} template={line.isTemplate}/>
        {line.isTemplate && nameExample && clips.has(nameExample.id) && <details>
          <summary className={quiet}>Нэрээ нөхөж хэлсэн жишээг сонсох</summary><p lang="cs">{nameExample.cs}</p>
          <CourseAudioButton clips={clips.get(nameExample.id)}/></details>}
        <button type="button" className={secondary} aria-pressed={p.practicedPhrases.includes(line.id)}
          onClick={() => set(prev => ({...prev, practicedPhrases: toggle(prev.practicedPhrases,line.id), updatedAt: Date.now()}))}>
          {p.practicedPhrases.includes(line.id) ? 'Хэлж үзсэн ✓' : 'Хэлж үзлээ'}</button>
      </div>)}
      {lesson.grammar && <p className={tile}><b>Өгүүлбэрийн загвар</b><br/>{lesson.grammar}</p>}
      {onAddCards && <button type="button" className={secondary} onClick={() => setMessage('Давтлагын карт шинээр нэмсэн тоо ' + onAddCards())}>Хэллэгүүдийг давтлагад нэмэх</button>}
    </section>}
    {p.stage === 'pronunciation' && <section className={panel}><h2 className="text-lg font-bold">Хэсгээр нь хэлээд бүтнээр давтаарай</h2>
      {lesson.chunks.map(chunk => <div className={tile} key={chunk.target}><p lang="cs">{chunk.chunks.join(' · ')} → <strong>{chunk.target}</strong></p><p className={quiet}>{chunk.focus}</p></div>)}
      {lesson.phrases.map(line => <div className={tile} key={line.id}>{!lesson.chunks.length && line.cs.includes(' ') && <p className={quiet} lang="cs">{line.cs.split(/\s+/).join(' · ')}</p>}<strong lang="cs">{line.cs}</strong><p>{line.mn}</p>
        <CourseAudioButton clips={clips.get(line.id)} template={line.isTemplate}/></div>)}
      <L01SelfRecorder/>
      <button type="button" aria-pressed={p.pronunciationPracticed} className={secondary}
        onClick={() => set(prev => ({...prev, pronunciationPracticed: !prev.pronunciationPracticed, updatedAt: Date.now()}))}>
        {p.pronunciationPracticed ? 'Дуудлагаа давтсан ✓' : 'Дуудлагаа давтлаа'}</button>
    </section>}
    {p.stage === 'practice' && <section className={panel}><h2 className="text-lg font-bold">Хариулж үзээд жишигтэй харьцуулаарай</h2>
      {lesson.exercises.map((ex,i) => {
        const revealed = p.revealedIds.includes(ex.id);
        const checked = p.selfReviewedIds.includes(ex.id);
        const change = (s: string) => set(prev => updateResponse(prev, ex.id, s, lesson));
        return <section key={ex.id} className={tile} data-exercise-id={ex.id}>
          <h3 className="font-semibold">{i+1}. {ex.promptMn}</h3>
          {ex.choices && <div className="flex flex-wrap gap-2">{ex.choices.map(option => <button type="button" key={option}
            className={p.responses[ex.id] === option ? primary : secondary} onClick={() => change(option)}>{option}</button>)}</div>}
          {ex.tokens && <div className="flex flex-wrap gap-2">{ex.tokens.map((token,index) => <button type="button" key={index}
            className={secondary} onClick={() => change([p.responses[ex.id],token].filter(Boolean).join(' '))}>{token}</button>)}</div>}
          <textarea className={answerBox} rows={2} aria-label={'Хариулт ' + ex.id} value={p.responses[ex.id] || ''} onChange={e => change(e.target.value)} />
          <div className="flex flex-wrap gap-2"><button type="button" className={secondary} disabled={!p.responses[ex.id]?.trim()}
            aria-expanded={revealed} onClick={() => set(prev => ({...prev, revealedIds: toggle(prev.revealedIds,ex.id), updatedAt: Date.now()}))}>{revealed ? 'Жишиг нуух' : 'Жишиг харах'}</button>
          <button type="button" className={secondary} disabled={!revealed || !p.responses[ex.id]?.trim()} aria-pressed={checked}
            onClick={() => set(prev => ({...prev, selfReviewedIds: toggle(prev.selfReviewedIds,ex.id), updatedAt: Date.now()}))}>
            {checked ? 'Өөрөө шалгасан ✓' : 'Өөрөө шалгалаа'}</button></div>
          {revealed && <p className={quiet}>{ex.proposedAnswer}</p>}
        </section>;
      })}
    </section>}
    {p.stage === 'exit' && <section className={panel} data-exit-id={lesson.exit.id}><h2 className="text-lg font-bold">Шинэ нөхцөлд өөрөө ярья</h2>
      <p>{lesson.exit.situationMn}</p>{lesson.exit.situationMn !== lesson.exit.missionMn && <p>{lesson.exit.missionMn}</p>}
      <L01SelfRecorder/>
      <label className="block"><span className="text-sm font-semibold">Хэлсэн хариултаа тэмдэглээрэй</span>
        <textarea className={answerBox} rows={4} aria-label="Гарах сорилын хариулт" value={p.exitResponse}
          onChange={e => {const value = e.target.value; set(prev => ({...prev, exitResponse: value.slice(0,4000), exitAttempted:false, updatedAt: Date.now()}));}}/></label>
      <details><summary className="cursor-pointer">Өөрийгөө шалгах шалгуур</summary><p className={quiet}>{lesson.exit.criteriaMn}</p>
        <ul className="list-disc pl-5">{lesson.exit.rubric.map(row => <li key={row.criterion}>{row.descriptionMn}</li>)}</ul></details>
      <button type="button" className={primary} disabled={!p.exitResponse.trim()} onClick={() => set(prev => ({...prev, exitAttempted:true, updatedAt: Date.now()}))}>Оролдлогыг хадгалах</button>
      {p.exitAttempted && <p role="status">{saved ? 'Сорилын хариулт хадгалагдсан.' : 'Сорилын хариултаа нөөц хуулбараар хадгалаарай.'}</p>}
      {completed ? <div className={tile}><strong>Хичээлийн бүх дадлагыг дуусгалаа.</strong>
        {nextLesson && <button type="button" className={primary} onClick={() => onSelect(nextLesson.lessonId)}>Дараагийн хичээл · {nextLesson.titleMn}</button>}</div>
        : <p className={quiet}>Дуусгахад {lesson.dialogues.length-p.finishedScenes.length} яриа, {lesson.phrases.length-p.practicedPhrases.length} хэллэг,
          {p.pronunciationPracticed ? '' : ' дуудлагын давтлага,'} {lesson.exercises.length-reviewed} дасгал{p.exitAttempted ? '' : ', гарах сорил'} үлдсэн.</p>}
      {onTutor && <button type="button" className={secondary} onClick={onTutor}>AI багштай энэ нөхцөлөөр ярих</button>}
    </section>}
    {stageIndex < stages.length-1 && <button type="button" className={primary+' w-full'} onClick={() => go(stages[stageIndex+1].id)}>Дараагийн шат <ArrowRight className="inline w-4 h-4"/></button>}
    <details className={panel}><summary>Энэ хичээлийн ахицыг нөөцлөх</summary>
      <div className="flex flex-wrap gap-2"><button type="button" className={secondary} onClick={exportProgress}><Download className="w-4 inline"/> Татах</button>
        <label className={secondary}><Upload className="w-4 inline"/> Сэргээх<input type="file" className="sr-only" accept=".json"
          onChange={e => {void restore(e.currentTarget.files?.[0]); e.currentTarget.value='';}}/></label></div>
    </details>
    {message && <p role="status">{message}</p>}
  </div>;
}
