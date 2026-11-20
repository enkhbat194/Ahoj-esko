import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, Download, FileCheck2, Upload } from 'lucide-react';
import type { TutorMode } from '../types/lesson';
import { L01SelfRecorder } from './L01SelfRecorder';
import { L01_WORKING_SOURCE, type L01Stage } from '../data/l01WorkingSource';
import {
  createL01Progress, loadL01Progress, parseL01Progress,
  reviewedL01Count, saveL01Progress, updateL01Response,
  type L01PracticeProgress,
} from '../utils/l01PracticeProgress';

const stages: Array<{ id: L01Stage; title: string }> = [
  { id: 'dialogue', title: '1. Харилцан яриа' },
  { id: 'phrases', title: '2. Хэллэг' },
  { id: 'pronunciation', title: '3. Дуудлага' },
  { id: 'practice', title: '4. Дасгал' },
  { id: 'exit', title: '5. Гарах сорил' },
];

const card = 'rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-6';
const subtle = 'text-xs text-[#636366] dark:text-[#AEAEB2]';
const button = 'min-h-[42px] px-4 rounded-xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs font-semibold cursor-pointer disabled:opacity-40';
const mutedButton = 'min-h-[38px] px-3 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white text-xs font-semibold cursor-pointer disabled:opacity-40';

/**
 * A0–L01 engineering preview from canonical v0.9.20.
 * Does NOT play unaudited Gemini audio, grade free text, or approve source QA.
 */
export const CanonicalFirstLessonView: React.FC<{
  onLaunchMissionRoleplay: (mode: TutorMode) => void;
}> = ({ onLaunchMissionRoleplay }) => {
  const [progress, setProgress] = useState<L01PracticeProgress>(loadL01Progress);
  const [storageError, setStorageError] = useState(false);
  const [message, setMessage] = useState('');
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const reviewedCount = reviewedL01Count(progress);
  const nextStageIndex = stages.findIndex((s) => s.id === progress.stage) + 1;
  const isLastStage = nextStageIndex === stages.length;

  useEffect(() => {
    setStorageError(!saveL01Progress(progress));
  }, [progress]);

  const changeStage = (stage: L01Stage) => {
    setProgress((prev) => ({ ...prev, stage, updatedAt: Date.now() }));
    setMessage('');
  };

  const toggleId = (field: 'revealedIds' | 'selfReviewedIds', id: string) => {
    setProgress((prev) => ({
      ...prev,
      [field]: prev[field].includes(id) ? prev[field].filter((x) => x !== id) : [...prev[field], id],
      updatedAt: Date.now(),
    }));
  };

  const exportPractice = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'ahoj-l01-private-progress.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('Хувийн ахицын нөөц JSON файл татагдлаа. Төхөөрөмжөөс гадуур аюулгүй хадгалаарай.');
  };

  const importPractice = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (file.size > 150000) throw new Error('too large');
      const decoded: unknown = JSON.parse(await file.text());
      const safe = parseL01Progress(decoded);
      if (!safe) throw new Error('wrong version');
      setProgress(safe);
      setMessage('Энэ хичээлийн ижил хувилбарын хувийн ахицыг сэргээсэн.');
    } catch {
      setMessage('Сэргээсэнгүй: файл буруу, эвдэрсэн эсвэл хичээлийн эхийн хувилбар өөр байна.');
    }
  };

  return (
    <div className="space-y-4">
      <section className={card + ' space-y-3'}>
        <div className="flex flex-wrap justify-between gap-2 items-center">
          <span className="text-[11px] font-mono text-[#636366] dark:text-[#AEAEB2]">
            {L01_WORKING_SOURCE.lessonId} · v0.9.20
          </span>
          <span className="text-[11px] font-semibold text-[#9A5B00] dark:text-[#FFD60A]">
            Редакцын ноорог · Нийтлэх зөвшөөрөлгүй
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#1C1C1E] dark:text-white">
          {L01_WORKING_SOURCE.titleMn}
        </h1>
        <p className="text-sm text-[#636366] dark:text-[#AEAEB2]">{L01_WORKING_SOURCE.missionMn}</p>
        <div className="flex items-center justify-between gap-2">
          <span className={subtle}>Өөрөө шалгасан дасгал: {reviewedCount}/{L01_WORKING_SOURCE.exercises.length}</span>
          <span className={subtle}>Энэ нь баталгаажсан оноо биш</span>
        </div>
        <div className="h-2 rounded-full bg-[#F2F2F7] dark:bg-[#3A3A3C] overflow-hidden">
          <div className="h-full bg-[#007AFF] dark:bg-[#0A84FF] transition-all" style={{ width: `${100 * reviewedCount / L01_WORKING_SOURCE.exercises.length}%` }} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {stages.map((st) => (
            <button
              type="button" key={st.id}
              onClick={() => changeStage(st.id)}
              aria-current={progress.stage === st.id ? 'step' : undefined}
              className={progress.stage === st.id ? button : mutedButton}
            >{st.title}</button>
          ))}
        </div>
      </section>

      {storageError && (
        <p role="alert" className="text-xs text-[#D70015] dark:text-[#FF453A]">
          Safari энэ төхөөрөмжид ахиц хадгалж чадсангүй. Нөөц JSON файлаа экспортлоорой.
        </p>
      )}

      {progress.stage === 'dialogue' && (
        <section className={card + ' space-y-4'}>
          <h2 className="text-base font-bold">Харилцан яриаг уншаад дүрүүдийн үгийг дагаж хэл</h2>
          <div className="flex flex-wrap gap-2">
            {L01_WORKING_SOURCE.dialogues.map((d, index) => (
              <button className={dialogueIndex === index ? button : mutedButton} key={d.id}
                onClick={() => setDialogueIndex(index)} type="button">{d.titleMn}</button>
            ))}
          </div>
          {L01_WORKING_SOURCE.dialogues[dialogueIndex].turns.map((turn) => (
            <div key={turn.id} className="rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] p-3 space-y-1">
              <span className="text-[11px] font-mono text-[#8E8E93]">Дүр {turn.speaker} · {turn.id.split('-').at(-1)}</span>
              <p className="font-bold text-[#1C1C1E] dark:text-white">{turn.cs}</p>
              <p className={subtle}>{turn.mn}</p>
            </div>
          ))}
          <p className={subtle + ' flex gap-2 items-start'}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            Gemini 3.8-ийн баталгаажсан эх-аудио одоогоор энэ хичээлийн ID-тай холбогдоогүй. Буруу аудио автоматаар тоглуулахгүй.
          </p>
        </section>
      )}

      {progress.stage === 'phrases' && (
        <section className={card + ' space-y-3'}>
          <h2 className="text-base font-bold">Үндсэн 6 хэллэг — эх өгөгдлийн яг ижил ID</h2>
          {L01_WORKING_SOURCE.phrases.map((phrase) => (
            <div className="rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] p-3" key={phrase.id}>
              <p className="text-[11px] font-mono text-[#8E8E93]">{phrase.id}</p>
              <p className="text-lg font-bold text-[#1C1C1E] dark:text-white">{phrase.cs}</p>
              <p className={subtle}>{phrase.mn}</p>
              {'isTemplate' in phrase && phrase.isTemplate && (
                <p className={subtle}>«…» нь бөглөх зай. Түүнийг бэлэн дуудлага гэж үзэхгүй.</p>
              )}
            </div>
          ))}
        </section>
      )}

      {progress.stage === 'pronunciation' && (
        <section className={card + ' space-y-4'}>
          <h2 className="text-base font-bold">Үгээр бүлэглэн, дараа нь бүтнээр хэлэх</h2>
          <p className={subtle}>
            Доорх нь үгийн бүлэглэл; Чех хэлний авианы/үеийн шинжлэх ухаанч хуваалт биш.
            Үеийн баталгаажсан аудио иртэл тийм тайлбар зохиож харуулахгүй.
          </p>
          {L01_WORKING_SOURCE.phrases.map((phrase) => (
            <div key={phrase.id} className="rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] p-3 space-y-2">
              <p className="text-[11px] text-[#8E8E93] font-mono">{phrase.id}</p>
              <div className="flex flex-wrap gap-1.5">
                {phrase.cs.split(/\s+/).map((word, index) => (
                  <span key={index} className="px-2 py-1 rounded-lg bg-white dark:bg-[#1C1C1E] text-sm font-semibold">{word}</span>
                ))}
              </div>
              <p className="text-base font-bold">{phrase.cs}</p>
              <p className={subtle}>{phrase.mn}</p>
            </div>
          ))}
          <L01SelfRecorder />
        </section>
      )}

      {progress.stage === 'practice' && (
        <section className={card + ' space-y-4'}>
          <h2 className="text-base font-bold">6 дасгал — бич, жишигтэй харьцуул, өөрөө шалгасан гэж тэмдэглэ</h2>
          <p className={subtle}>Хариултын утгыг одоогоор автоматаар зөв/буруу гэж үнэлэхгүй. Жишиг хариултууд редакцын ноорог.</p>
          {L01_WORKING_SOURCE.exercises.map((ex) => {
            const revealed = progress.revealedIds.includes(ex.id);
            const reviewed = progress.selfReviewedIds.includes(ex.id);
            const answered = Boolean(progress.responses[ex.id]?.trim());
            return (
              <div key={ex.id} className="rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] p-4 space-y-2.5">
                <p className="text-[11px] font-mono text-[#8E8E93]">{ex.id}</p>
                <p className="text-sm font-semibold text-[#1C1C1E] dark:text-white">{ex.promptMn}</p>
                <textarea
                  rows={2}
                  aria-label={`Хариулт: ${ex.id}`}
                  value={progress.responses[ex.id] ?? ''}
                  onChange={(e) => setProgress((p) => updateL01Response(p, ex.id, e.target.value))}
                  placeholder="Энд хариултаа бич…"
                  className="w-full rounded-xl p-3 bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.1] text-sm resize-y"
                />
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={mutedButton}
                    onClick={() => toggleId('revealedIds', ex.id)}>
                    {revealed ? 'Жишиг хариултыг нуух' : 'Жишиг хариултыг харах'}
                  </button>
                  <button
                    type="button" className={reviewed ? button : mutedButton}
                    disabled={!answered || !revealed}
                    onClick={() => toggleId('selfReviewedIds', ex.id)}>
                    {reviewed ? 'Өөрийн шалгалтын тэмдэглэлтэй ✓' : 'Өөрөө шалгасан гэж тэмдэглэх'}
                  </button>
                </div>
                {revealed && (
                  <div className="rounded-xl bg-white dark:bg-[#1C1C1E] p-3 space-y-1">
                    <p className="text-sm font-semibold">{ex.proposedAnswer}</p>
                    <p className={subtle}>Ноорог жишиг · {ex.gradingPolicy} (утга, нөхцөлөөр нягтална)</p>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {progress.stage === 'exit' && (
        <section className={card + ' space-y-4'}>
          <div className="space-y-1">
            <p className="text-[11px] font-mono text-[#8E8E93]">{L01_WORKING_SOURCE.exit.id}</p>
            <h2 className="text-base font-bold">Гарах сорил — шинэ нөхцөлд харилцах</h2>
            <p className={subtle}>{L01_WORKING_SOURCE.exit.situationMn}</p>
            <p className="text-sm">{L01_WORKING_SOURCE.exit.missionMn}</p>
          </div>
          <textarea rows={5} aria-label="Гарах сорилын хариулт" value={progress.exitResponse}
            onChange={(e) => setProgress((p) => ({ ...p, exitResponse: e.target.value.slice(0, 4000), exitAttempted: false, updatedAt: Date.now() }))}
            placeholder="Шинэ нөхцөлд хэлэх чех өгүүлбэрүүдээ бич…"
            className="w-full rounded-xl p-3 bg-[#F2F2F7] dark:bg-[#2C2C2E] text-sm resize-y"
          />
          <p className={subtle}>Шалгуурын ноорог (нийт 8 боломжит оноо; автомат үнэлгээ ХИЙХГҮЙ):</p>
          {L01_WORKING_SOURCE.exit.rubric.map((criterion) => (
            <div key={criterion.criterion} className="flex items-start gap-2 text-xs">
              <FileCheck2 className="w-4 h-4 shrink-0 text-[#8E8E93]" />
              <span>{criterion.descriptionMn} — {criterion.maxPoints} онооны дээд хэмжээ</span>
            </div>
          ))}
          <button
            type="button" className={button}
            disabled={!progress.exitResponse.trim()}
            onClick={() => setProgress((p) => ({ ...p, exitAttempted: true, updatedAt: Date.now() }))}>
            Хариултын оролдлогыг хадгалах
          </button>
          {progress.exitAttempted && (
            <p role="status" className={subtle}>
              Гарах сорилын оролдлогыг энэ төхөөрөмжид хадгалсан. Тэнцсэн/унасан оноо гаргаагүй.
            </p>
          )}
          <p className={subtle}>Энэ сорилын шинэ нөхцөлийн даалгавар редакцын засвар хүлээж байгаа.</p>
          <button type="button" className={mutedButton} onClick={() => onLaunchMissionRoleplay('coach')}>
            AI багштай дасгал хийх (албан шалгалтын оноо биш)
          </button>
        </section>
      )}

      <section className={card + ' space-y-3'}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold">Хувийн ахицын нөөц</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={mutedButton} onClick={exportPractice}>
              <Download className="w-3.5 h-3.5 inline mr-1" />Экспорт
            </button>
            <label className={mutedButton + ' inline-flex items-center gap-1'}>
              <Upload className="w-3.5 h-3.5" />Сэргээх
              <input type="file" accept=".json,application/json" className="sr-only"
                onChange={(e) => { void importPractice(e.currentTarget.files?.[0]); e.currentTarget.value = ''; }} />
            </label>
          </div>
        </div>
        <p className={subtle}>Төхөөрөмж дээр хадгална. Нэвтрэлтгүйгээр өөр төхөөрөмж рүү автоматаар синк хийхгүй. Тиймээс нөөц файлаа хадгалаарай.</p>
        {message && <p role="status" className={subtle}>{message}</p>}
        {!isLastStage && (
          <button type="button" className={button + ' w-full flex justify-center items-center gap-2'}
            onClick={() => changeStage(stages[nextStageIndex].id)}>
            Дараагийн шат <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </section>
    </div>
  );
};
