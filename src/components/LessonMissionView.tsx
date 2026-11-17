import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Layers,
  Plus,
  Volume2,
} from 'lucide-react';
import type { LearnerSelfForm, TutorMode, VocabCard } from '../types/lesson';
import { CANONICAL_A0_M01_L01, type CanonicalItem } from '../data/canonicalL01';
import {
  CZECH_GENDER_COLORS,
  getQaStatusLabelMn,
  resolveCuratedCzechForm,
} from '../utils/learnerProfile';
import { playCzechAudio, stopAllPlayback } from '../utils/audioPlayer';

type MissionStage = 'dialogue' | 'phrases' | 'pronunciation' | 'practice' | 'roleplay';

interface LessonMissionViewProps {
  learnerGender: LearnerSelfForm;
  onChangeLearnerGender: (gender: LearnerSelfForm) => void;
  existingCards: VocabCard[];
  onAddCanonicalPhrasesToDeck: (cards: Omit<VocabCard, 'id' | 'audioIds' | 'mastered' | 'practiceCount'>[]) => number;
  onLaunchMissionRoleplay: (mode: TutorMode) => void;
}

const STAGES: Array<{ id: MissionStage; label: string }> = [
  { id: 'dialogue', label: '1. Сонсгол' },
  { id: 'phrases', label: '2. Хэллэг · Хүйс' },
  { id: 'pronunciation', label: '3. Дуудлага' },
  { id: 'practice', label: '4. Дасгал' },
  { id: 'roleplay', label: '5. Шалгалт' },
];

export const LessonMissionView: React.FC<LessonMissionViewProps> = ({
  learnerGender,
  onChangeLearnerGender,
  existingCards,
  onAddCanonicalPhrasesToDeck,
  onLaunchMissionRoleplay,
}) => {
  const [stage, setStage] = useState<MissionStage>('dialogue');
  const [selectedDialogueIdx, setSelectedDialogueIdx] = useState(0);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [ex01AnswerIdx, setEx01AnswerIdx] = useState<number | null>(null);
  const [revealedExIds, setRevealedExIds] = useState<Record<string, boolean>>({});
  const [addedToSrsCount, setAddedToSrsCount] = useState<number | null>(null);
  const [selectedLaunchMode, setSelectedLaunchMode] = useState<TutorMode>('conversation');

  const activeDialogue = CANONICAL_A0_M01_L01.dialogues[selectedDialogueIdx] ?? CANONICAL_A0_M01_L01.dialogues[0];
  const ex01 = CANONICAL_A0_M01_L01.exercises.find((e) => e.exerciseId === 'CZ-A0-M01-L01-EX01');
  const recallExercises = CANONICAL_A0_M01_L01.exercises.filter(
    (e) => e.exerciseId !== 'CZ-A0-M01-L01-EX01'
  );

  const handlePlayLine = async (key: string, text: string, rate = 1.0) => {
    if (playingKey === key) {
      stopAllPlayback();
      setPlayingKey(null);
      return;
    }
    await playCzechAudio({
      text,
      rate,
      onStart: () => setPlayingKey(key),
      onEnd: () => setPlayingKey(null),
    });
  };

  const resolveItemCzech = (item: CanonicalItem): string => {
    return resolveCuratedCzechForm(
      {
        agreementType: item.agreementType,
        fixed: item.csFixed,
        variants: item.csVariants,
      },
      learnerGender
    );
  };

  const corePhrases = CANONICAL_A0_M01_L01.items.filter(
    (item) => item.learningPriority === 'production' || item.agreementType === 'learner_self'
  );

  const handleAddCorePhrasesToSrs = () => {
    const candidates: Omit<VocabCard, 'id' | 'audioIds' | 'mastered' | 'practiceCount'>[] =
      corePhrases.map((item) => {
        const czechText = resolveItemCzech(item);
        return {
          topicId: 'greetings',
          canonicalId: item.id,
          lemmaGroup: item.lemmaGroup,
          qaStatus: item.qaStatus,
          selfFormVariants: item.csVariants,
          czechWord: czechText,
          phoneticHint: item.phoneticMn,
          mongolianWord: item.meaningMn,
          czechSentence: czechText,
          mongolianSentence: item.meaningMn,
        };
      });

    const added = onAddCanonicalPhrasesToDeck(candidates);
    setAddedToSrsCount(added);
  };

  const alreadySyncedCount = corePhrases.filter((item) =>
    existingCards.some((c) => c.canonicalId === item.id)
  ).length;

  return (
    <div className="space-y-4">
      {/* Lesson Header Card — Clean Metadata & Learner Self-Gender Control */}
      <section className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-6 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-[#8E8E93] flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span className="font-mono font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">
              {CANONICAL_A0_M01_L01.lessonId}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-[#9A5B00] dark:text-[#FFD60A] font-semibold">
              {getQaStatusLabelMn(CANONICAL_A0_M01_L01.status)}
            </span>
            <span aria-hidden="true">·</span>
            <span>{CANONICAL_A0_M01_L01.estimatedMinutes}</span>
          </p>

          {/* Learner Self-Gender Form Switch (Never resets progress or rewrites character lines) */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-medium text-[#8E8E93]">Миний хэлбэр:</span>
            <div className="flex items-center p-0.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E]">
              {(
                [
                  { id: 'masculine', label: 'Эрэгтэй' },
                  { id: 'feminine', label: 'Эмэгтэй' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeLearnerGender(opt.id)}
                  className={`min-h-[30px] px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    learnerGender === opt.id
                      ? 'bg-white dark:bg-[#3A3A3C] text-[#007AFF] dark:text-[#64D2FF] shadow-2xs'
                      : 'text-[#636366] dark:text-[#AEAEB2]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C1C1E] dark:text-white">
            {CANONICAL_A0_M01_L01.titleMn}
          </h1>
          <p className="text-xs sm:text-sm text-[#636366] dark:text-[#AEAEB2] leading-relaxed">
            {CANONICAL_A0_M01_L01.missionMn}
          </p>
        </div>

        {/* Stage Switcher */}
        <div className="pt-1 flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STAGES.map((st) => {
            const active = stage === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setStage(st.id)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#007AFF] dark:bg-[#0A84FF] text-white'
                    : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.06] dark:hover:bg-white/[0.1]'
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* STAGE 1: Formal (vy) & Informal (ty) Dialogues + EX01 Comprehension */}
      {stage === 'dialogue' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <section className="lg:col-span-8 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#1C1C1E] dark:text-white">
                  {activeDialogue.titleMn}
                </h2>
                <p className="text-[11px] text-[#8E8E93] mt-0.5">
                  Дүрийн яриа эх хувиараа хадгалагдана · Хэлбэр: {activeDialogue.register === 'formal' ? 'Албан (vy)' : 'Дотно (ty)'}
                </p>
              </div>
              <div className="flex items-center p-0.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E]">
                {CANONICAL_A0_M01_L01.dialogues.map((dlg, idx) => (
                  <button
                    key={dlg.dialogueId}
                    type="button"
                    onClick={() => setSelectedDialogueIdx(idx)}
                    className={`min-h-[32px] px-3 rounded-lg text-xs font-semibold cursor-pointer ${
                      selectedDialogueIdx === idx
                        ? 'bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-white shadow-2xs'
                        : 'text-[#8E8E93]'
                    }`}
                  >
                    {dlg.register === 'formal' ? 'Албан (vy)' : 'Дотно (ty)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
              {activeDialogue.turns.map((turn) => {
                const keyNorm = `${turn.turnId}-norm`;
                const keySlow = `${turn.turnId}-slow`;
                return (
                  <div key={turn.turnId} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-[11px] font-semibold text-[#8E8E93]">
                        {turn.speakerNameMn}
                      </p>
                      <p className="text-base font-bold text-[#1C1C1E] dark:text-white leading-snug">
                        {turn.textCs}
                      </p>
                      <p className="text-xs font-mono text-[#007AFF] dark:text-[#64D2FF]">
                        [{turn.phoneticMn}]
                      </p>
                      <p className="text-xs sm:text-sm text-[#636366] dark:text-[#AEAEB2]">
                        {turn.textMn}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pt-1">
                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        type="button"
                        onClick={() => void handlePlayLine(keyNorm, turn.textCs, 1.0)}
                        aria-label={`Сонсох: ${turn.textCs}`}
                        className={`min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center cursor-pointer ${
                          playingKey === keyNorm
                            ? 'bg-[#007AFF] text-white'
                            : 'bg-[#007AFF]/10 dark:bg-[#0A84FF]/20 text-[#007AFF] dark:text-[#64D2FF]'
                        }`}
                      >
                        <Volume2 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        type="button"
                        onClick={() => void handlePlayLine(keySlow, turn.textCs, 0.65)}
                        className={`min-h-[38px] px-2.5 rounded-xl text-xs font-mono font-semibold cursor-pointer ${
                          playingKey === keySlow
                            ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E]'
                            : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white'
                        }`}
                      >
                        0.6x
                      </motion.button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="lg:col-span-4 space-y-4">
            {ex01 && (
              <div className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-5 space-y-3">
                <p className="text-xs font-semibold text-[#8E8E93]">Ойлголтын шалгалт · EX01</p>
                <p className="text-sm font-bold text-[#1C1C1E] dark:text-white">{ex01.promptMn}</p>
                <div className="space-y-2">
                  {(ex01.acceptableAnswersMn ?? []).map((opt, idx) => {
                    const picked = ex01AnswerIdx === idx;
                    const isCorrect = idx === 0;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setEx01AnswerIdx(idx)}
                        className={`w-full min-h-[42px] px-3.5 py-2 rounded-2xl text-left text-xs font-semibold border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                          picked
                            ? isCorrect
                              ? 'bg-[#34C759]/12 border-[#34C759]/40 text-[#248A3D] dark:text-[#30D158]'
                              : 'bg-[#FF3B30]/10 border-[#FF3B30]/35 text-[#D70015] dark:text-[#FF453A]'
                            : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] border-transparent text-[#1C1C1E] dark:text-white'
                        }`}
                      >
                        <span>{opt}</span>
                        {picked && isCorrect && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {ex01AnswerIdx !== null && (
                  <p className="text-xs text-[#636366] dark:text-[#AEAEB2] leading-relaxed">
                    {ex01.evaluationNoteMn}
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setStage('phrases')}
              className="w-full min-h-[46px] px-4 rounded-2xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Дараагийн шат: Хэллэг · Хүйс</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </aside>
        </div>
      )}

      {/* STAGE 2: Core Phrases + Learner Self-Form Gender & 4 Noun Genders */}
      {stage === 'phrases' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <section className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#1C1C1E] dark:text-white">
                  Гол хэллэгүүд (PH001–PH013)
                </h2>
                <p className="text-[11px] text-[#8E8E93]">
                  «Миний хэлбэр» солиход зөвхөн суралцагчийн өөрийн хүйсийн хэллэг шинэчлэгдэнэ.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCorePhrasesToSrs}
                className="min-h-[38px] px-3 rounded-xl bg-[#007AFF]/10 dark:bg-[#0A84FF]/20 text-[#007AFF] dark:text-[#64D2FF] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  Давтлага (SRS) руу нэмэх ({alreadySyncedCount}/{corePhrases.length})
                </span>
              </button>
            </div>

            {addedToSrsCount !== null && (
              <p className="text-xs font-medium text-[#248A3D] dark:text-[#30D158]">
                {addedToSrsCount > 0
                  ? `Шинээр ${addedToSrsCount} хэллэг SRS давтлагын санд нэмэгдлээ.`
                  : 'Бүх үндсэн хэллэг SRS санд аль хэдийн нэмэгдсэн байна.'}
              </p>
            )}

            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
              {CANONICAL_A0_M01_L01.items.map((item) => {
                const czech = resolveItemCzech(item);
                const playKey = `ph-${item.id}`;
                const priorityLabel =
                  item.learningPriority === 'production'
                    ? 'Ярих гол'
                    : item.learningPriority === 'receptive'
                      ? 'Сонсож ойлгох'
                      : 'Нэмэлт (Өөрийн хүйс)';
                return (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-[11px] text-[#8E8E93] font-medium">
                        {priorityLabel}
                        {item.lemmaGroup ? ` · ${item.lemmaGroup}` : ''}
                        {item.agreementType === 'learner_self'
                          ? ` · ${learnerGender === 'feminine' ? 'Эмэгтэй хэлбэр' : 'Эрэгтэй хэлбэр'}`
                          : ''}
                      </p>
                      <p className="text-base font-bold text-[#1C1C1E] dark:text-white">{czech}</p>
                      <p className="text-xs font-mono text-[#007AFF] dark:text-[#64D2FF]">
                        [{item.phoneticMn}]
                      </p>
                      <p className="text-xs sm:text-sm text-[#636366] dark:text-[#AEAEB2]">
                        {item.meaningMn}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handlePlayLine(playKey, czech, 1.0)}
                      aria-label={`Сонсох: ${czech}`}
                      className={`min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center shrink-0 cursor-pointer ${
                        playingKey === playKey
                          ? 'bg-[#007AFF] text-white'
                          : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white'
                      }`}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="lg:col-span-5 space-y-4">
            {/* Curated Learner Self-Form Examples */}
            <div className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-5 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-[#1C1C1E] dark:text-white">
                  Өөрийн хүйсээр хувирдаг жишээнүүд
                </h3>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  Сонголт: {learnerGender === 'feminine' ? 'Эмэгтэй (-a / -ka)' : 'Эрэгтэй'}
                </p>
              </div>
              <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
                {CANONICAL_A0_M01_L01.extraGenderSelfExamples.map((ex) => {
                  const text = ex.variants[learnerGender];
                  return (
                    <div key={ex.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-[#007AFF] dark:text-[#64D2FF]">{text}</p>
                        <p className="text-xs text-[#636366] dark:text-[#AEAEB2]">{ex.meaningMn}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handlePlayLine(`exg-${ex.id}`, text, 1.0)}
                        aria-label={`Сонсох: ${text}`}
                        className="min-h-[36px] min-w-[36px] rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-center cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Czech 4 Noun Gender Color Architecture Preview */}
            <div className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-5 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-[#1C1C1E] dark:text-white">
                  Чех хэлний 4 хүйсийн өнгөний систем
                </h3>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  Нэр үгийн тийн ялгал ба төгсгөлийг таних стандарт өнгө.
                </p>
              </div>
              <div className="space-y-2">
                {CANONICAL_A0_M01_L01.genderColorsPreview.map((gItem) => {
                  const spec = CZECH_GENDER_COLORS[gItem.gender];
                  return (
                    <div
                      key={gItem.gender}
                      className="rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] px-3.5 py-2.5 flex items-start gap-3"
                    >
                      <span
                        className="w-3 h-3 rounded-full mt-1 shrink-0"
                        style={{ backgroundColor: spec.hex }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1C1C1E] dark:text-white">
                          {gItem.nounCs}{' '}
                          <span className="font-normal text-[#8E8E93]">— {gItem.meaningMn}</span>
                        </p>
                        <p className="text-[11px] font-medium mt-0.5" style={{ color: spec.hex }}>
                          {spec.labelMn} · {gItem.suffixHintMn}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* STAGE 3: Pronunciation Scaffolds & Vowel Length Contrasts */}
      {stage === 'pronunciation' && (
        <section className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-6 space-y-4">
          <div className="border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
            <h2 className="text-sm sm:text-base font-bold text-[#1C1C1E] dark:text-white">
              Үеийн задаргаа ба урт/богино эгшгийн ялгаа
            </h2>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              Яриа таних системийн бичвэр алдаа гаргасан байлаа ч түүнийг шууд дуудлагын оноо болгож хасдаггүй; эхлээд удаан (0.6x) хэмнэлээр сонсож дагаарай.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CANONICAL_A0_M01_L01.pronunciation.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-bold text-[#1C1C1E] dark:text-white">
                      {item.textCs}
                    </h3>
                    <span className="text-xs text-[#8E8E93]">{item.meaningMn}</span>
                  </div>

                  {/* Syllable Segmentation */}
                  <div className="flex flex-wrap items-center gap-1 font-mono text-sm font-bold">
                    {item.displaySyllables.map((syl, i) => (
                      <React.Fragment key={`${item.id}-${i}`}>
                        <span
                          className={`px-2 py-0.5 rounded-lg ${
                            i === 0
                              ? 'bg-[#007AFF]/15 text-[#007AFF] dark:text-[#64D2FF]'
                              : 'bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white'
                          }`}
                        >
                          {syl}
                        </span>
                        {i < item.displaySyllables.length - 1 && (
                          <span className="text-[#8E8E93]">·</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <p className="text-xs font-mono text-[#007AFF] dark:text-[#64D2FF]">
                    [{item.phoneticMn}]
                  </p>
                  <p className="text-xs text-[#636366] dark:text-[#AEAEB2] leading-relaxed">
                    {item.segmentationNoteMn}
                  </p>

                  {item.contrastPair && (
                    <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] space-y-1.5">
                      <p className="text-[11px] font-semibold text-[#1C1C1E] dark:text-white">
                        Эгшиг/Авианы ялгаа:
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            void handlePlayLine(`${item.id}-short`, item.contrastPair!.shortWord, 0.85)
                          }
                          className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#1C1C1E] text-left text-xs cursor-pointer"
                        >
                          <span className="font-bold text-[#1C1C1E] dark:text-white block">
                            {item.contrastPair.shortWord}
                          </span>
                          <span className="text-[10.5px] text-[#8E8E93]">
                            {item.contrastPair.shortMeaningMn}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void handlePlayLine(`${item.id}-long`, item.contrastPair!.longWord, 0.85)
                          }
                          className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#1C1C1E] text-left text-xs cursor-pointer"
                        >
                          <span className="font-bold text-[#007AFF] dark:text-[#64D2FF] block">
                            {item.contrastPair.longWord}
                          </span>
                          <span className="text-[10.5px] text-[#8E8E93]">
                            {item.contrastPair.longMeaningMn}
                          </span>
                        </button>
                      </div>
                      <p className="text-[11px] text-[#636366] dark:text-[#AEAEB2]">
                        {item.contrastPair.contrastNoteMn}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void handlePlayLine(`${item.id}-1x`, item.textCs, 1.0)}
                    className="min-h-[40px] px-3 rounded-xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Энгийн 1.0x</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handlePlayLine(`${item.id}-06x`, item.textCs, 0.65)}
                    className="min-h-[40px] px-3 rounded-xl bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Удаан 0.6x</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* STAGE 4: Active Recall Practice (EX02 - EX05) */}
      {stage === 'practice' && (
        <section className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-6 space-y-4">
          <div className="border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
            <h2 className="text-sm sm:text-base font-bold text-[#1C1C1E] dark:text-white">
              Сэргээн санах дасгал (EX02–EX05)
            </h2>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              Эхлээд өөрөө чехээр хэлж үзээд, дараа нь жишиг хариултаа нээж шалгаарай.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {recallExercises.map((ex) => {
              const revealed = Boolean(revealedExIds[ex.exerciseId]);
              const expectedText = ex.expectedBySelfForm
                ? ex.expectedBySelfForm[learnerGender]
                : ex.exampleCs ?? '';
              return (
                <div
                  key={ex.exerciseId}
                  className="rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] p-4 space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-mono text-[#8E8E93]">
                      {ex.exerciseId}
                      {ex.expectedBySelfForm
                        ? ` · ${learnerGender === 'feminine' ? 'Эмэгтэй хэлбэр' : 'Эрэгтэй хэлбэр'}`
                        : ''}
                    </p>
                    <p className="text-sm font-bold text-[#1C1C1E] dark:text-white leading-snug">
                      {ex.promptMn}
                    </p>
                  </div>

                  {revealed ? (
                    <div className="rounded-xl bg-white dark:bg-[#1C1C1E] p-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-[#007AFF] dark:text-[#64D2FF]">
                          {expectedText}
                        </p>
                        <button
                          type="button"
                          onClick={() => void handlePlayLine(ex.exerciseId, expectedText, 1.0)}
                          aria-label={`Сонсох: ${expectedText}`}
                          className="min-h-[34px] min-w-[34px] rounded-lg bg-[#007AFF]/10 text-[#007AFF] dark:text-[#64D2FF] flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-[#636366] dark:text-[#AEAEB2]">{ex.evaluationNoteMn}</p>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() =>
                      setRevealedExIds((prev) => ({ ...prev, [ex.exerciseId]: !revealed }))
                    }
                    className="min-h-[40px] px-3 rounded-xl bg-white dark:bg-[#1C1C1E] text-xs font-semibold text-[#1C1C1E] dark:text-white inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {revealed ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Хариултыг нуух</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Жишиг хариулт шалгах</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* STAGE 5: Mission Exit Roleplay Launcher (Coach / Conversation / Exam) */}
      {stage === 'roleplay' && (
        <section className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#8E8E93]">Төгсгөлийн сорил · EX06</p>
            <h2 className="text-lg font-bold text-[#1C1C1E] dark:text-white">
              Чех хамт олон эсвэл хөрштэй анх удаа танилцах
            </h2>
            <p className="text-xs sm:text-sm text-[#636366] dark:text-[#AEAEB2] leading-relaxed">
              Зорилго: Эелдэг мэндэлж, өөрийн нэрийг хэлэх, хаанаас ирснээ (Монголоос) тайлбарлах, мөн ойлгоогүй зүйлээ эелдгээр дахин асуух. Утга таарсан өөр чех хэллэг (paraphrase) бүгд зөв тооцогдоно.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#1C1C1E] dark:text-white">
              AI Roleplay горимоо сонгоно уу:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(
                [
                  {
                    id: 'coach',
                    title: 'Дэмжих (Coach)',
                    desc: 'Зөвлөмж, орчуулга ба санал болгох хариулт харуулна.',
                  },
                  {
                    id: 'conversation',
                    title: 'Яриа (Conversation)',
                    desc: 'Энгийн амьд харилцаа — алдаа гарвал товч тайлбарлана.',
                  },
                  {
                    id: 'exam',
                    title: 'Шалгалт (Exam)',
                    desc: 'Тусламж/бэлэн хариулт нууна — зорилго биелсэн эсэхийг дүгнэнэ.',
                  },
                ] as const
              ).map((m) => {
                const active = selectedLaunchMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedLaunchMode(m.id)}
                    className={`p-3.5 rounded-2xl text-left border transition-colors cursor-pointer space-y-1 ${
                      active
                        ? 'bg-[#007AFF]/10 dark:bg-[#0A84FF]/18 border-[#007AFF]/45'
                        : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1C1C1E] dark:text-white">
                        {m.title}
                      </span>
                      {active && <Check className="w-3.5 h-3.5 text-[#007AFF] dark:text-[#64D2FF]" />}
                    </div>
                    <p className="text-[11px] text-[#636366] dark:text-[#AEAEB2] leading-snug">
                      {m.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onLaunchMissionRoleplay(selectedLaunchMode)}
              className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>AI Багштай ярилцаж шалгах</span>
            </button>
            <button
              type="button"
              onClick={handleAddCorePhrasesToSrs}
              className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-xs font-semibold text-[#1C1C1E] dark:text-white inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Үгсээ SRS давтлага руу хадгалах</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
