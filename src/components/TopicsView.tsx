import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Search, Volume2 } from 'lucide-react';
import type { TopicId, VocabCard } from '../types/lesson';
import { TOPICS } from '../data/starterCurriculum';
import { playCzechAudio } from '../utils/audioPlayer';
import { computeStudyStats, countAttachedAudioSlots, filterCards } from '../utils/studyLogic';

interface TopicsViewProps {
  cards: VocabCard[];
  dialogueCount: number;
  onStartTopicPractice: (topicId: TopicId | 'all') => void;
}

const DAILY_GOAL_TARGET = 10;

export const TopicsView: React.FC<TopicsViewProps> = ({
  cards,
  dialogueCount,
  onStartTopicPractice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTopic, setActiveTopic] = useState<TopicId | 'all'>('all');

  const stats = useMemo(() => computeStudyStats(cards, []), [cards]);

  const practicedTodayCount = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const cutoff = startOfToday.getTime();
    return cards.filter((c) => typeof c.lastPracticedAt === 'number' && c.lastPracticedAt >= cutoff).length;
  }, [cards]);

  const dailyGoalPct = Math.min(100, Math.round((practicedTodayCount / DAILY_GOAL_TARGET) * 100));

  const filteredList = useMemo(
    () => filterCards(cards, { topicId: activeTopic, query: searchQuery }),
    [cards, activeTopic, searchQuery]
  );

  return (
    <div className="space-y-6">
      {/* Progress Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: 'Нийт үг ба өгүүлбэр',
            value: <>{stats.totalCards}</>,
            color: 'text-slate-900 dark:text-white',
          },
          {
            label: 'Эзэмшсэн',
            value: (
              <>
                {stats.masteredCards}{' '}
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  ({stats.percentMastered}%)
                </span>
              </>
            ),
            color: 'text-emerald-700 dark:text-emerald-400',
          },
          {
            label: 'Холбосон аудио файл',
            value: <>{stats.totalCustomAudioSlots}</>,
            color: 'text-[#11457E] dark:text-sky-300',
          },
          {
            label: 'Харилцан яриа',
            value: <>{dialogueCount}</>,
            color: 'text-slate-900 dark:text-white',
          },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: idx * 0.03, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-5"
          >
            <p className="text-xs font-medium text-[#8E8E93]">{kpi.label}</p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Daily Speaking Goal */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-5 space-y-2"
      >
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="font-bold text-[#1C1C1E] dark:text-white">Өнөөдрийн дасгал</span>
          <span className="font-mono tabular-nums text-[#8E8E93]">
            {practicedTodayCount}/{DAILY_GOAL_TARGET} карт ({dailyGoalPct}%)
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] overflow-hidden">
          <motion.div
            className="h-full bg-[#007AFF] dark:bg-[#0A84FF] rounded-full origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: dailyGoalPct / 100 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </motion.div>

      {/* Topic Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOPICS.map((topic, idx) => {
          const topicCards = cards.filter((c) => c.topicId === topic.id);
          const mastered = topicCards.filter((c) => c.mastered).length;
          const pct = topicCards.length === 0 ? 0 : Math.round((mastered / topicCards.length) * 100);

          return (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: Math.min(idx * 0.03, 0.18), ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-[#8E8E93]">
                  {topic.nameCz} · <span className="tabular-nums">{topicCards.length} карт</span>
                </p>
                <h2 className="text-lg font-bold text-[#1C1C1E] dark:text-white">{topic.nameMn}</h2>
                <p className="text-sm text-[#636366] dark:text-[#AEAEB2]">{topic.descriptionMn}</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#8E8E93]">
                    <span>Ахиц</span>
                    <span className="font-mono tabular-nums">
                      {mastered}/{topicCards.length} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] overflow-hidden">
                    <motion.div
                      className="h-full bg-[#007AFF] dark:bg-[#0A84FF] rounded-full origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: pct / 100 }}
                      transition={{ duration: 0.35, delay: Math.min(idx * 0.03, 0.15), ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => onStartTopicPractice(topic.id)}
                  disabled={topicCards.length === 0}
                  className="w-full min-h-[44px] px-4 py-2 rounded-2xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Дасгал эхлүүлэх</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Searchable Phrase Directory */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Бүх үг, өгүүлбэрийн сан
          </h2>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Чех эсвэл Монголоор хайх..."
                aria-label="Үг хайх"
                className="w-full sm:w-64 min-h-[42px] pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>

            <select
              aria-label="Сэдвээр шүүх"
              value={activeTopic}
              onChange={(e) => setActiveTopic(e.target.value as TopicId | 'all')}
              className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 px-3 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            >
              <option value="all">Бүх сэдэв</option>
              {TOPICS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nameMn}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredList.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Хайлтад тохирох үг олдсонгүй.
            </p>
          ) : (
            filteredList.map((card) => (
              <div
                key={card.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {card.czechWord}
                    </span>
                    <span className="text-xs font-mono text-[#11457E] dark:text-sky-300">
                      [{card.phoneticHint}]
                    </span>
                    {card.mastered && (
                      <CheckCircle2
                        className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0"
                        aria-label="Мэддэг"
                      />
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{card.mongolianWord}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {card.czechSentence} ·{' '}
                    <span className="tabular-nums">{countAttachedAudioSlots(card)}/4 аудио</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() =>
                      void playCzechAudio({
                        audioId: card.audioIds.wordNormal,
                        text: card.czechWord,
                        rate: 1.0,
                      })
                    }
                    className="min-h-[40px] px-3 rounded-lg bg-[#11457E]/10 dark:bg-sky-500/15 text-[#11457E] dark:text-sky-300 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#11457E]/15 dark:hover:bg-sky-500/25 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Энгийн</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() =>
                      void playCzechAudio({
                        audioId: card.audioIds.wordSlow,
                        fallbackAudioId: card.audioIds.wordNormal,
                        text: card.czechWord,
                        rate: 0.65,
                      })
                    }
                    className="min-h-[40px] px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    Удаан
                  </motion.button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
