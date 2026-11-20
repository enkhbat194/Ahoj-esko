import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpenText, Check, ChevronDown, ChevronUp, Eye, EyeOff, Mic2, RotateCcw, UserRound, UsersRound } from 'lucide-react';
import { L01SelfRecorder } from './L01SelfRecorder';
import { CourseAudioButton } from './CourseAudioButton';
import { getDialogueLearnerCue, getDialogueRoundResults } from '../utils/courseDialogue';
import type { Course, CourseLesson } from '../utils/courseSource';
import type { CourseProgress, DialogueMode, SelfCheck, TurnRecord } from '../utils/courseProgress';

const panel = 'rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] p-3.5';
const button = 'min-h-[42px] rounded-xl px-4 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
const primary = button + ' bg-[#007AFF] dark:bg-[#0A84FF] text-white';
const secondary = button + ' bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white border border-black/[0.07] dark:border-white/[0.08]';
const subdued = 'text-xs text-[#636366] dark:text-[#AEAEB2]';

export const CourseDialogueCoach: React.FC<{
  lesson: CourseLesson;
  clips: Course['clips'];
  progress: CourseProgress;
  setProgress: React.Dispatch<React.SetStateAction<CourseProgress>>;
}> = ({ lesson, clips, progress, setProgress }) => {
  const { mode, role, turnIndex } = progress;
  const scenes = lesson.dialogues;
  const sceneIndex = Math.max(0, scenes.findIndex(s => s.id === progress.sceneId));
  const [revealed, setRevealed] = useState(false);
  const [hint, setHint] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const dialogue = scenes[sceneIndex] ?? scenes[0];
  const isFinished = turnIndex >= dialogue.turns.length;
  const turn = !isFinished ? dialogue.turns[turnIndex] : undefined;
  const isLearner = turn?.speaker === role;
  const localTranslation = turn ? getDialogueLearnerCue(turn) : '';

  const results = useMemo(
    () => getDialogueRoundResults(dialogue, role, progress.dialogueRecords),
    [dialogue, role, progress.dialogueRecords],
  );
  const ownRecord = turn ? progress.dialogueRecords[turn.id] : undefined;
  const attempted = ownRecord?.attempted === true || Boolean(ownRecord?.response.trim());
  const reviewed = ownRecord?.selfCheck != null;

  const start = (nextMode: DialogueMode, nextScene = sceneIndex, nextRole = role) => {
    setProgress(prev => ({...prev, sceneId: scenes[nextScene].id, mode: nextMode, role: nextRole, turnIndex: 0, updatedAt: Date.now()}));
    setRevealed(false);
    setHint(false);
    setShowTranscript(false);
  };
  const advance = (step: number) => {
    setProgress(prev => {
      const index = Math.max(0, Math.min(dialogue.turns.length, prev.turnIndex + step));
      const finishedScenes = index === dialogue.turns.length ? [...new Set([...prev.finishedScenes, dialogue.id])] : prev.finishedScenes;
      return {...prev, turnIndex: index, finishedScenes, updatedAt: Date.now()};
    });
    setRevealed(false);
    setHint(false);
  };

  const updateRecord = (id: string, patch: Partial<TurnRecord>) => {
    if (!dialogue.turns.some(t => t.id === id)) return;
    setProgress((prev) => {
      const before: TurnRecord = prev.dialogueRecords[id] ?? { response: '', attempted: false, selfCheck: null };
      const next = { ...before, ...patch };
      return {
        ...prev,
        dialogueRecords: { ...prev.dialogueRecords, [id]: next },
        updatedAt: Date.now(),
      };
    });
  };

  const setWrittenAttempt = (id: string, value: string) => {
    updateRecord(id, { response: value.slice(0, 1000), attempted: value.trim().length > 0, selfCheck: null });
  };

  const selectSelfCheck = (id: string, value: SelfCheck) => {
    updateRecord(id, { attempted: true, selfCheck: value });
  };

  return (
    <section className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-6 space-y-4">
      <div className="space-y-1">
        <p className="text-[11px] tracking-wide font-bold uppercase text-[#007AFF] dark:text-[#64D2FF]">
          Харилцан яриа
        </p>
        <h2 className="text-lg sm:text-xl font-bold text-[#1C1C1E] dark:text-white">
          {dialogue.titleMn}
        </h2>
        <p className={subdued}>
          {lesson.missionMn}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {scenes.map((scene, index) => (
          <button
            key={scene.id}
            type="button"
            onClick={() => start('explore', index)}
            aria-pressed={sceneIndex === index}
            className={`rounded-2xl p-3 text-left border transition-colors cursor-pointer ${sceneIndex === index
              ? 'border-[#007AFF]/65 bg-[#007AFF]/10 dark:bg-[#0A84FF]/20'
              : 'border-black/[0.06] dark:border-white/[0.08] bg-[#F2F2F7] dark:bg-[#2C2C2E]'}`}
          >
            <span className="text-[11px] font-mono text-[#8E8E93]">Яриа {index + 1} · {scene.turns.length} ээлж</span>
            <p className="text-sm font-bold mt-0.5 text-[#1C1C1E] dark:text-white">{scene.titleMn.replace(/^Харилцан яриа \d+\. /, '')}</p>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold">Сурах хэлбэрээ сонго</p>
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] p-1">
          {([
            { id: 'explore', title: 'Утга ойлгох', detail: '1' },
            { id: 'guided', title: 'Дүрээр ярих', detail: '2' },
            { id: 'challenge', title: 'Тусламжгүй', detail: '3' },
          ] as const).map((option) => (
            <button key={option.id} type="button"
              aria-pressed={mode === option.id}
              onClick={() => start(option.id)}
              className={`min-h-[46px] rounded-xl px-1.5 py-2 text-xs font-semibold cursor-pointer ${mode === option.id
                ? 'bg-white dark:bg-[#3A3A3C] text-[#007AFF] dark:text-[#64D2FF] shadow-sm'
                : 'text-[#636366] dark:text-[#AEAEB2]'}`}>
              <span className="block text-[10px] opacity-65">{option.detail}-р шат</span>
              {option.title}
            </button>
          ))}
        </div>
        <p className={subdued}>
          {mode === 'explore'
            ? 'Яриаг нэг ээлжээр уншиж, хэн юу хэлж байгааг ойлго.'
            : mode === 'guided'
              ? 'Дүрээ сонго. Нөгөө хүний хэлснийг уншаад, өөрийн ээлжинд чехээр хэл. Монгол утгын тусламж бий.'
              : 'Бодит харилцаа шиг өөрийн ээлжинд санаж хэл. Тусламж болон жишиг хариулт эхэндээ нуугдсан байна.'}
        </p>
      </div>

      {mode !== 'explore' && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold">Миний дүр:</span>
          <div className="flex items-center gap-2">
            {(['B', 'A'] as const).map((candidate) => (
              <button type="button" key={candidate} onClick={() => start(mode, sceneIndex, candidate)}
                aria-pressed={role === candidate}
                className={role === candidate ? primary : secondary}>
                <UserRound className="inline w-3.5 h-3.5 mr-1" />{candidate}
              </button>
            ))}
          </div>
          <span className={subdued}>
            Өөрийн {role === 'B' ? 'B' : 'A'} дүрийн ээлжид чи ярьж, бусдад хариулна.
          </span>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#1C1C1E] dark:text-white">
            {isFinished ? 'Дууслаа' : `Ээлж ${turnIndex + 1}/${dialogue.turns.length}`}
          </span>
          {mode !== 'explore' && (
            <span className={subdued}>
              {results.selfReviewed}/{results.total} өөрөө хэлж чадсан гэж тэмдэглэсэн
            </span>
          )}
        </div>
        <div className="h-2 bg-[#F2F2F7] dark:bg-[#3A3A3C] rounded-full overflow-hidden">
          <div className="h-full bg-[#007AFF] dark:bg-[#0A84FF] transition-all"
            style={{ width: `${Math.round(turnIndex / dialogue.turns.length * 100)}%` }} />
        </div>
      </div>

      {isFinished ? (
        <div className={panel + ' space-y-4'}>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-[#007AFF] dark:text-[#64D2FF]" />
            <h3 className="text-base font-bold">Ярианы бүх ээлжийг үзэж дууслаа</h3>
          </div>
          {mode !== 'explore' && (
            <div className="space-y-1">
              <p className="text-sm">Оролдлого: {results.tried}/{results.total} өөрийн ээлж</p>
              <p className={subdued}>
                Өөрийн тэмдэглэл: {results.selfReviewed} чадсан гэж үзсэн · {results.repeat} дахин давтах.
                Энэ нь дуудлагын автомат шалгалт биш.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button className={secondary} type="button" onClick={() => start(mode)}>
              <RotateCcw className="inline w-4 h-4 mr-1" />Энэ яриаг дахин давтах
            </button>
            <button className={primary} type="button" onClick={() => start(mode === 'explore' ? 'guided' : 'challenge')}>
              {mode === 'explore' ? 'Одоо дүрээр ярья' : 'Тусламжгүй давтая'}
              <ArrowRight className="inline w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      ) : turn && (
        <div className="space-y-3">
          <div className={`rounded-3xl p-4 sm:p-6 border ${isLearner && mode !== 'explore'
            ? 'bg-[#007AFF]/[0.07] border-[#007AFF]/30 dark:bg-[#0A84FF]/15'
            : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] border-transparent'}`}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-[#636366] dark:text-[#AEAEB2]">
                {isLearner && mode !== 'explore' ? <UserRound className="w-4 h-4" /> : <UsersRound className="w-4 h-4" />}
                {mode === 'explore' ? `Дүр ${turn.speaker}` : (isLearner ? 'Одоо ЧИ ярь' : `Ярилцагч ${turn.speaker} хэлж байна`)}
              </span>
              <span className="text-[10px] font-mono text-[#8E8E93]">{turn.id.split('-').at(-1)}</span>
            </div>

            {mode === 'explore' || !isLearner ? (
              <div className="space-y-2">
                <p className="text-lg sm:text-xl leading-relaxed font-bold text-[#1C1C1E] dark:text-white">{turn.cs}</p>
                {(mode !== 'challenge' || hint) && (
                  <p className="text-sm text-[#636366] dark:text-[#AEAEB2]">{localTranslation}</p>
                )}
                {mode === 'challenge' && !hint && (
                  <button type="button" className={secondary} onClick={() => setHint(true)}>Монгол утгыг харах</button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-[#8E8E93]">
                  {mode === 'guided' ? 'Юу хэлэхээ монголоор харууллаа' : 'Хариултаа өөрөө санаад хэл'}
                </p>
                {mode === 'guided' || hint ? (
                  <p className="text-base font-semibold text-[#1C1C1E] dark:text-white">{localTranslation}</p>
                ) : (
                  <p className="text-base text-[#636366] dark:text-[#AEAEB2]">
                    Чехээр өөрөө ярь. Хэлж чадахгүй бол тусламж нээж болно.
                  </p>
                )}
                {mode === 'challenge' && !hint && (
                  <button className={secondary} type="button" onClick={() => setHint(true)}>
                    Монгол утгын тусламж
                  </button>
                )}
                <L01SelfRecorder key={turn.id} />
                <button type="button" className={attempted ? primary : secondary}
                  onClick={() => updateRecord(turn.id, { attempted: true, selfCheck: null })}>
                  <Mic2 className="inline w-4 h-4 mr-1" />
                  {attempted ? 'Оролдлоо гэж тэмдэглэгдсэн' : 'Би амаар хэлж үзлээ'}
                </button>
                <label className={subdued + ' block font-semibold'} htmlFor={`dlg-response-${turn.id}`}>
                  Хүсвэл хэлсэн үгээ бич (албагүй)
                </label>
                <textarea
                  id={`dlg-response-${turn.id}`}
                  rows={2}
                  maxLength={1000}
                  placeholder="Чехээр хэлсэн хувилбараа бич..."
                  value={ownRecord?.response ?? ''}
                  onChange={(e) => setWrittenAttempt(turn.id, e.target.value)}
                  className="w-full min-h-[74px] rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.1] p-3 text-sm text-[#1C1C1E] dark:text-white"
                />
                <button type="button" className={secondary}
                  disabled={!attempted} onClick={() => setRevealed(!revealed)}
                  aria-expanded={revealed}>
                  {revealed ? <EyeOff className="inline w-4 h-4 mr-1" /> : <Eye className="inline w-4 h-4 mr-1" />}
                  {revealed ? 'Жишиг хариулт нуух' : 'Жишиг хариулт харах'}
                </button>
                {revealed && (
                  <div className="space-y-3 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/[0.07] dark:border-white/[0.1] p-3">
                    <p className="text-sm font-bold text-[#1C1C1E] dark:text-white">{turn.cs}</p>
                    <p className={subdued}>
                      Энэ бол эх ярианы нэг жишээ. Ижил утгыг өөр зөв Чех өгүүлбэрээр хэлж болно.
                      Текст таарсан эсэхийг дуудлагын оноо гэж үзэхгүй.
                    </p>
                    <p className={subdued + ' font-semibold'}>Өөрийн ажиглалт:</p>
                    <div className="flex flex-wrap gap-2">
                      <button className={ownRecord?.selfCheck === 'felt_ready' ? primary : secondary}
                        type="button" disabled={!attempted}
                        onClick={() => selectSelfCheck(turn.id, 'felt_ready')}>
                        Өөрөө хэлж чадсан
                      </button>
                      <button className={ownRecord?.selfCheck === 'needs_repeat' ? primary : secondary}
                        type="button" disabled={!attempted}
                        onClick={() => selectSelfCheck(turn.id, 'needs_repeat')}>
                        Дахин давтана
                      </button>
                    </div>
                    {!attempted && <p className={subdued}>Эхлээд амаар оролдсоноо тэмдэглэ, эсвэл хариулт бич.</p>}
                  </div>
                )}
              </div>
            )}
            {(mode === 'explore' || !isLearner || revealed) && <CourseAudioButton clips={clips.get(turn.id)} />}
          </div>

          <div className="flex items-center justify-between gap-2">
            <button type="button" className={secondary} disabled={turnIndex === 0} onClick={() => advance(-1)}>
              <ArrowLeft className="inline w-4 h-4 mr-1" />Өмнөх
            </button>
            <button type="button" className={primary}
              disabled={mode !== 'explore' && isLearner && !reviewed}
              onClick={() => advance(1)}>
              {turnIndex === dialogue.turns.length - 1 ? 'Дуусгах' : 'Дараагийн ээлж'}
              <ArrowRight className="inline w-4 h-4 ml-1" />
            </button>
          </div>
          {mode !== 'explore' && isLearner && !reviewed && (
            <p className={subdued}>
              Дараагийн ээлж рүү орохын өмнө амаар хэлж үзээд, жишиг хариултаа харьцуулж,
              өөрөө шалгасан тэмдэглэлээ сонгоно.
            </p>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.1] overflow-hidden">
        <button type="button"
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-xs font-semibold cursor-pointer"
          disabled={mode === 'challenge' && !isFinished} onClick={() => setShowTranscript((v) => !v)}
          aria-expanded={showTranscript}>
          <span className="inline-flex items-center gap-2">
            <BookOpenText className="w-4 h-4" />
            Бүтэн ярианы эх (зөвхөн лавлахад)
          </span>
          {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showTranscript && (
          <div className="px-4 pb-4 space-y-3">
            {dialogue.turns.map((item) => (
              <div key={item.id} className="text-xs border-t border-black/[0.06] dark:border-white/[0.08] pt-2">
                <p className="font-semibold text-[#1C1C1E] dark:text-white">Дүр {item.speaker}: {item.cs}</p>
                <p className="text-[#636366] dark:text-[#AEAEB2]">{getDialogueLearnerCue(item)}</p>
                {getDialogueLearnerCue(item) !== item.mn &&
                  <p className="text-[10px] text-[#8E8E93]">Эхийн орчуулга: {item.mn}</p>}
              </div>
            ))}
          </div>
        )}
      </div>


    </section>
  );
};
