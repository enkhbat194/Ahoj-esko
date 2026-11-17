import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  Headphones,
  Layers,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type {
  CzechNounGender,
  LearnerSelfForm,
  StoryProgressState,
  StoredAudioMeta,
  TutorMode,
  VocabCard,
} from '../types/lesson';
import { CANONICAL_A0_M01_L01 } from '../data/canonicalL01';
import { KLIC17_CHAPTERS } from '../data/klic17Story';
import { CZECH_GENDER_COLORS, getQaStatusLabelMn } from '../utils/learnerProfile';
import type { ReviewEventRecord } from '../utils/srsScheduler';
import { SRS_ENGINE_LABEL } from '../utils/srsScheduler';
import { computeTodayDashboardMetrics } from '../utils/todaySummary';

interface TodayDashboardViewProps {
  cards: VocabCard[];
  reviewEvents: ReviewEventRecord[];
  storyProgress: StoryProgressState;
  audioMetaList: StoredAudioMeta[];
  learnerGender: LearnerSelfForm;
  onChangeLearnerGender: (gender: LearnerSelfForm) => void;
  onStartMission: () => void;
  onLaunchRoleplay: (mode: TutorMode) => void;
  onOpenReview: () => void;
  onOpenStory: () => void;
  onOpenProfile: (section?: 'general' | 'library') => void;
}

const GENDER_ORDER: CzechNounGender[] = [
  'masculine_animate',
  'masculine_inanimate',
  'feminine',
  'neuter',
];

export const TodayDashboardView: React.FC<TodayDashboardViewProps> = ({
  cards,
  reviewEvents,
  storyProgress,
  audioMetaList,
  learnerGender,
  onChangeLearnerGender,
  onStartMission,
  onLaunchRoleplay,
  onOpenReview,
  onOpenStory,
  onOpenProfile,
}) => {
  const metrics = useMemo(
    () =>
      computeTodayDashboardMetrics({
        cards,
        reviewEvents,
        storyProgress,
        chapters: KLIC17_CHAPTERS,
        audioMetaList,
      }),
    [cards, reviewEvents, storyProgress, audioMetaList]
  );

  const resumeChapter =
    KLIC17_CHAPTERS.find((c) => c.chapter === metrics.lastChapter) ?? KLIC17_CHAPTERS[0];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Quiet Context Header & Learner Self-Form Switch */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="space-y-0.5 min-w-0">
          <p className="text-xs font-medium text-[#8E8E93]">
            Өнөөдрийн сургалт · {CANONICAL_A0_M01_L01.lessonId}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C1C1E] dark:text-white">
            Ahoj! Өнөөдрийн чех хэлний дасгал
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-[#8E8E93] hidden sm:inline">Миний хэлбэр:</span>
          <div className="flex items-center p-0.5 rounded-xl bg-[#E5E5EA] dark:bg-[#1C1C1E]">
            {(
              [
                { id: 'masculine', label: 'Эр (rád)' },
                { id: 'feminine', label: 'Эм (ráda)' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeLearnerGender(opt.id)}
                className={`min-h-[32px] px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
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

      {/* Hero: Today's Guided Mission */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-7 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#8E8E93]">
          <span className="font-mono font-semibold text-[#007AFF] dark:text-[#64D2FF]">
            {CANONICAL_A0_M01_L01.lessonId}
          </span>
          <span className="flex items-center gap-1.5 flex-wrap">
            <span>{CANONICAL_A0_M01_L01.estimatedMinutes}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#9A5B00] dark:text-[#FFD60A] font-medium">
              {getQaStatusLabelMn(CANONICAL_A0_M01_L01.status)}
            </span>
          </span>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1C1E] dark:text-white leading-tight">
            {CANONICAL_A0_M01_L01.titleMn}
          </h2>
          <p className="text-sm text-[#636366] dark:text-[#AEAEB2] leading-relaxed max-w-2xl">
            {CANONICAL_A0_M01_L01.missionMn}
          </p>
        </div>

        {/* 3 Sequential Steps (Hairline inline) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {[
            { num: '01', title: 'Сонсгол (vy / ty)', desc: 'Албан ба дотно мэндчилгээ' },
            { num: '02', title: 'Хэллэг ба Хүйс', desc: 'Өөрийн хэлбэр ба 4 хүйсийн өнгө' },
            { num: '03', title: 'AI Роль тоглох', desc: 'Анхны уулзалтын богино яриа' },
          ].map((step) => (
            <div
              key={step.num}
              className="rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] px-3.5 py-3 space-y-0.5"
            >
              <p className="text-[11px] font-mono font-semibold text-[#007AFF] dark:text-[#64D2FF]">
                Алхам {step.num}
              </p>
              <p className="text-xs sm:text-sm font-bold text-[#1C1C1E] dark:text-white">
                {step.title}
              </p>
              <p className="text-[11px] text-[#636366] dark:text-[#AEAEB2]">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="pt-1 flex flex-wrap items-center gap-2.5">
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={onStartMission}
            className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Өнөөдрийн мишн эхлүүлэх</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => onLaunchRoleplay('conversation')}
            className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Bot className="w-4 h-4 text-[#007AFF] dark:text-[#64D2FF] shrink-0" />
            <span>Шууд AI-тай ярилцах</span>
          </motion.button>
        </div>
      </motion.section>

      {/* Honest Metrics Strip (Real numbers only, zero fake streaks) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Давтах карт',
            value: `${metrics.dueCount}`,
            sub:
              metrics.buriedCount > 0
                ? `${metrics.buriedCount} ойролцоо хойшилсон`
                : `Нийт ${metrics.totalCards} карт`,
          },
          {
            label: 'Klíč 17 уншлага',
            value: `${metrics.storyPercent}%`,
            sub: `${metrics.storyReadCount}/${metrics.storyTotalSentences} өгүүлбэр`,
          },
          {
            label: 'Өнөөдрийн дасгал',
            value: `${metrics.practicedTodayCount}/10`,
            sub: `Мэддэг болсон: ${metrics.masteredCount}`,
          },
          {
            label: 'Офлайн аудио',
            value: `${metrics.audioFilesCount}`,
            sub: 'Төхөөрөмжид хадгалсан',
          },
        ].map((tile) => (
          <div
            key={tile.label}
            className="rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 space-y-1"
          >
            <p className="text-xs font-medium text-[#8E8E93]">{tile.label}</p>
            <p className="text-2xl font-bold tabular-nums text-[#1C1C1E] dark:text-white">
              {tile.value}
            </p>
            <p className="text-[11px] text-[#636366] dark:text-[#AEAEB2] truncate">{tile.sub}</p>
          </div>
        ))}
      </div>

      {/* Two Action Cards: Smart SRS Review & Klíč číslo 17 Story */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1: Smart SRS Review + Czech 4-Gender Distribution */}
        <section className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#8E8E93]">{SRS_ENGINE_LABEL}</p>
                <h3 className="text-lg font-bold text-[#1C1C1E] dark:text-white">
                  Ухаалаг давталт (SRS)
                </h3>
              </div>
              <Layers className="w-5 h-5 text-[#007AFF] dark:text-[#64D2FF] shrink-0" aria-hidden="true" />
            </div>

            <p className="text-sm text-[#636366] dark:text-[#AEAEB2]">
              Өнөөдөр давтахад бэлэн <strong className="text-[#1C1C1E] dark:text-white tabular-nums">{metrics.dueCount}</strong> карт байна. Картууд чех нэр үгийн 4 хүйсийн өнгөөр ялгагддаг.
            </p>

            {/* Non-hue-only 4-Gender breakdown */}
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 pt-1 text-xs">
              {GENDER_ORDER.map((g) => {
                const spec = CZECH_GENDER_COLORS[g];
                return (
                  <span key={g} className="inline-flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: spec.hex }}
                      aria-hidden="true"
                    />
                    <span className={spec.textClass + ' font-medium'}>{spec.shortLabel}</span>
                    <span className="font-mono tabular-nums text-[#8E8E93]">
                      {metrics.genderCounts[g]}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenReview}
            className="min-h-[44px] w-full px-4 py-2 rounded-2xl bg-[#007AFF]/10 dark:bg-[#0A84FF]/20 text-[#007AFF] dark:text-[#64D2FF] text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Давтлага руу орох</span>
          </button>
        </section>

        {/* Card 2: Klíč číslo 17 Story Reader Resume */}
        <section className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#8E8E93]">
                  Интерактив зохиол · 40 бүлэг
                </p>
                <h3 className="text-lg font-bold text-[#1C1C1E] dark:text-white">
                  Klíč číslo 17
                </h3>
              </div>
              <BookOpen className="w-5 h-5 text-[#007AFF] dark:text-[#64D2FF] shrink-0" aria-hidden="true" />
            </div>

            {resumeChapter && (
              <p className="text-sm text-[#636366] dark:text-[#AEAEB2]">
                Сүүлд уншсан:{' '}
                <strong className="text-[#1C1C1E] dark:text-white">
                  {String(resumeChapter.chapter).padStart(2, '0')}. {resumeChapter.titleCs}
                </strong>{' '}
                ({resumeChapter.band}). Үг дээр дарж утга ба хүйсийг нь хараад SRS рүү шууд нэмээрэй.
              </p>
            )}

            <div className="h-1.5 w-full rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] overflow-hidden">
              <div
                className="h-full bg-[#007AFF] dark:bg-[#0A84FF] transition-all duration-200"
                style={{ width: `${metrics.storyPercent}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenStory}
            className="min-h-[44px] w-full px-4 py-2 rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#007AFF] dark:text-[#64D2FF] shrink-0" />
            <span>Зохиол үргэлжлүүлэх</span>
          </button>
        </section>
      </div>

      {/* Quiet Offline Audio & Privacy Bar */}
      <div className="rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs text-[#636366] dark:text-[#AEAEB2]">
          <ShieldCheck className="w-4 h-4 text-[#34C759] dark:text-[#30D158] shrink-0" aria-hidden="true" />
          <span>
            Микрофоны raw аудио серверт хадгалагдахгүй · Gemini 3.1/3.8 хэмнэлттэй горим идэвхтэй
          </span>
        </div>

        <button
          type="button"
          onClick={() => onOpenProfile('library')}
          className="text-xs font-semibold text-[#007AFF] dark:text-[#64D2FF] inline-flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Headphones className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Профайл ба Аудио сан</span>
        </button>
      </div>
    </div>
  );
};
