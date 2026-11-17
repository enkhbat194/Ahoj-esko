import React, { useMemo, useState } from 'react';
import {
  Check,
  Download,
  FileAudio,
  Moon,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Upload,
} from 'lucide-react';
import type {
  AudioSlotType,
  CzechNounGender,
  Dialogue,
  LearnerSelfForm,
  StoryProgressState,
  StoredAudioMeta,
  VocabCard,
} from '../types/lesson';
import type { ParsedDriveCard } from '../utils/driveCurriculumParser';
import { KLIC17_CHAPTERS } from '../data/klic17Story';
import { CZECH_GENDER_COLORS } from '../utils/learnerProfile';
import type { ReviewEventRecord } from '../utils/srsScheduler';
import { computeTodayDashboardMetrics } from '../utils/todaySummary';
import { AudioLibraryView } from './AudioLibraryView';

interface ProfileViewProps {
  initialSection?: 'general' | 'library';
  initialLibrarySection?: 'drive' | 'add' | 'batch' | 'list';
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  learnerGender: LearnerSelfForm;
  onChangeLearnerGender: (gender: LearnerSelfForm) => void;
  cards: VocabCard[];
  dialogues: Dialogue[];
  reviewEvents: ReviewEventRecord[];
  storyProgress: StoryProgressState;
  audioMetaList: StoredAudioMeta[];
  onAddCard: (
    card: Omit<VocabCard, 'id' | 'audioIds' | 'mastered' | 'practiceCount'>,
    files: Partial<Record<AudioSlotType, File>>
  ) => Promise<void>;
  onAttachAudio: (cardId: string, slot: AudioSlotType, file: File) => Promise<void>;
  onRemoveCardAudio: (cardId: string, slot: AudioSlotType) => Promise<void>;
  onDeleteCard: (cardId: string) => void;
  onBatchAttach: (
    assignments: Array<{
      file: File;
      targetType: 'card' | 'dialogue';
      targetId: string;
      slot?: AudioSlotType;
    }>
  ) => Promise<void>;
  onImportBackup: (data: { cards?: VocabCard[]; dialogues?: Dialogue[] }) => void;
  onResetCurriculum: () => void;
  onImportDriveCurriculum: (
    cards: ParsedDriveCard[],
    dialogues: Omit<Dialogue, 'id'>[]
  ) => void;
  onImportDriveAudioFiles: (files: File[]) => Promise<void>;
  onOpenGenderFilteredVocab: () => void;
}

const GENDER_EXAMPLES: Record<CzechNounGender, { nouns: string; hint: string }> = {
  masculine_animate: {
    nouns: 'muž, pán, student',
    hint: 'Амьтай эр хүйс · ихэвчлэн гийгүүлэгчээр төгсөнө (-án / -el)',
  },
  masculine_inanimate: {
    nouns: 'klíč, dům, čaj, chléb',
    hint: 'Амьгүй эр хүйс · эд зүйлс, байр, ундаа (-č / -m / -j)',
  },
  feminine: {
    nouns: 'zastávka, káva, jízdenka, ulice',
    hint: 'Эм хүйс · ихэвчлэн -a, заримдаа -e эсвэл зөөлөн гийгүүлэгчээр төгсөнө',
  },
  neuter: {
    nouns: 'číslo, okno, mléko, nádraží',
    hint: 'Саармаг хүйс · ихэвчлэн -o, -e эсвэл -í төгсгөлтэй',
  },
};

export const ProfileView: React.FC<ProfileViewProps> = ({
  initialSection = 'general',
  initialLibrarySection = 'drive',
  theme,
  onToggleTheme,
  learnerGender,
  onChangeLearnerGender,
  cards,
  dialogues,
  reviewEvents,
  storyProgress,
  audioMetaList,
  onAddCard,
  onAttachAudio,
  onRemoveCardAudio,
  onDeleteCard,
  onBatchAttach,
  onImportBackup,
  onResetCurriculum,
  onImportDriveCurriculum,
  onImportDriveAudioFiles,
  onOpenGenderFilteredVocab,
}) => {
  const [section, setSection] = useState<'general' | 'library'>(initialSection);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);

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

  const handleExportProgress = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      learnerGender,
      cards,
      dialogues,
      reviewEvents,
      storyProgress,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ahoj-cesko-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupNotice('Таны ахиц ба картын нөөц JSON хэлбэрээр татагдлаа.');
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Sub-Navigation inside Profile */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div
          role="tablist"
          aria-label="Профайл болон Аудио сан"
          className="inline-flex items-center gap-1 p-1 rounded-2xl bg-[#E5E5EA] dark:bg-[#1C1C1E]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={section === 'general'}
            onClick={() => setSection('general')}
            className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              section === 'general'
                ? 'bg-white dark:bg-[#3A3A3C] text-[#007AFF] dark:text-[#64D2FF] shadow-2xs'
                : 'text-[#636366] dark:text-[#AEAEB2]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Ерөнхий тохиргоо</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={section === 'library'}
            onClick={() => setSection('library')}
            className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              section === 'library'
                ? 'bg-white dark:bg-[#3A3A3C] text-[#007AFF] dark:text-[#64D2FF] shadow-2xs'
                : 'text-[#636366] dark:text-[#AEAEB2]'
            }`}
          >
            <FileAudio className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Аудио сан & Drive</span>
          </button>
        </div>

        <p className="text-xs text-[#8E8E93]">
          Хадгалсан карт: <span className="font-mono tabular-nums">{metrics.totalCards}</span> · Аудио:{' '}
          <span className="font-mono tabular-nums">{metrics.audioFilesCount}</span>
        </p>
      </div>

      {section === 'library' ? (
        <AudioLibraryView
          cards={cards}
          dialogues={dialogues}
          audioMetaList={audioMetaList}
          initialSection={initialLibrarySection}
          onAddCard={onAddCard}
          onAttachAudio={onAttachAudio}
          onRemoveCardAudio={onRemoveCardAudio}
          onDeleteCard={onDeleteCard}
          onBatchAttach={onBatchAttach}
          onImportBackup={onImportBackup}
          onResetCurriculum={onResetCurriculum}
          onImportDriveCurriculum={onImportDriveCurriculum}
          onImportDriveAudioFiles={onImportDriveAudioFiles}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Learner Self Form + Appearance & Privacy */}
          <div className="lg:col-span-5 space-y-4">
            <section className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-5 space-y-3.5">
              <div>
                <h2 className="text-base font-bold text-[#1C1C1E] dark:text-white">
                  Суралцагчийн өөрийн хэлбэр
                </h2>
                <p className="text-xs text-[#636366] dark:text-[#AEAEB2] mt-1 leading-relaxed">
                  Чех хэлэнд хүн өөрийн тухай ярихдаа тэмдэг нэр, өнгөрсөн цагийн төгсгөлийг өөрөөр хэлдэг. Бусад дүрийн яриа эх хувиараа хадгалагдана.
                </p>
              </div>

              <div className="space-y-2">
                {(
                  [
                    {
                      id: 'masculine',
                      title: 'Эрэгтэй хэлбэр (Mužský tvar)',
                      examples: 'Jsem rád · Jsem ženatý · Jsem připravený',
                    },
                    {
                      id: 'feminine',
                      title: 'Эмэгтэй хэлбэр (Ženský tvar)',
                      examples: 'Jsem ráda · Jsem vdaná · Jsem připravená',
                    },
                  ] as const
                ).map((item) => {
                  const active = learnerGender === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onChangeLearnerGender(item.id)}
                      className={`w-full rounded-2xl p-3.5 border text-left transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                        active
                          ? 'bg-[#007AFF]/10 dark:bg-[#0A84FF]/18 border-[#007AFF] dark:border-[#0A84FF]'
                          : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] border-transparent'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-[#1C1C1E] dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-xs font-mono text-[#007AFF] dark:text-[#64D2FF]">
                          {item.examples}
                        </p>
                      </div>
                      {active && (
                        <Check className="w-4 h-4 text-[#007AFF] dark:text-[#64D2FF] shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Theme + Privacy Card */}
            <section className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-[#1C1C1E] dark:text-white">
                    Дэлгэцийн горим
                  </h2>
                  <p className="text-xs text-[#8E8E93]">
                    Одоо: {theme === 'dark' ? 'Шөнийн горим' : 'Өдрийн горим'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="min-h-[42px] px-3.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-xs font-semibold text-[#1C1C1E] dark:text-white inline-flex items-center gap-2 cursor-pointer"
                >
                  {theme === 'light' ? (
                    <>
                      <Moon className="w-4 h-4" />
                      <span>Шөнийн горим</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-4 h-4" />
                      <span>Өдрийн горим</span>
                    </>
                  )}
                </button>
              </div>

              <div className="border-t border-black/[0.06] dark:border-white/[0.08] pt-3.5 space-y-2">
                <div className="flex items-start gap-2.5 text-xs text-[#636366] dark:text-[#AEAEB2]">
                  <ShieldCheck className="w-4 h-4 text-[#34C759] dark:text-[#30D158] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Таны бичсэн дуу хоолойны raw бичлэг серверт хадгалагдахгүй. Карт, SRS давтлага болон аудио санг энэ төхөөрөмжийн IndexedDB / localStorage-д хадгалж байна.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Unified 4-Gender System + Progress & Backup */}
          <div className="lg:col-span-7 space-y-4">
            <section className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-[#1C1C1E] dark:text-white">
                    Чех хэлний 4 хүйсийн өнгөний систем
                  </h2>
                  <p className="text-xs text-[#8E8E93] mt-0.5">
                    Давтлага, Сэдэв, Зохиол уншигч даяар ижил өнгө болон монгол тайлбараар тэмдэглэгдэнэ.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenGenderFilteredVocab}
                  className="min-h-[36px] px-3 rounded-xl bg-[#007AFF]/10 dark:bg-[#0A84FF]/20 text-xs font-semibold text-[#007AFF] dark:text-[#64D2FF] cursor-pointer"
                >
                  Үгсийн санд шүүж харах →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(CZECH_GENDER_COLORS) as CzechNounGender[]).map((g) => {
                  const spec = CZECH_GENDER_COLORS[g];
                  const ex = GENDER_EXAMPLES[g];
                  return (
                    <div
                      key={g}
                      className="rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] p-3.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 text-xs font-bold text-[#1C1C1E] dark:text-white">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: spec.hex }}
                            aria-hidden="true"
                          />
                          <span>{spec.labelMn}</span>
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-[#8E8E93]">
                          {metrics.genderCounts[g]} үг
                        </span>
                      </div>
                      <p className={`text-xs font-semibold ${spec.textClass}`}>{ex.nouns}</p>
                      <p className="text-[11px] text-[#636366] dark:text-[#AEAEB2] leading-snug">
                        {ex.hint}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Progress Summary & Backup Controls */}
            <section className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-5 space-y-4">
              <div>
                <h2 className="text-base font-bold text-[#1C1C1E] dark:text-white">
                  Ахицын тайлан ба Нөөцлөлт
                </h2>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  Нийт {metrics.totalCards} карт · Мэддэг {metrics.masteredCount} · SRS үнэлгээ{' '}
                  {metrics.reviewEventsCount} удаа · Зохиол {metrics.storyReadCount}/
                  {metrics.storyTotalSentences} мөр
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportProgress}
                  className="min-h-[42px] px-4 rounded-xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>JSON нөөц татах</span>
                </button>

                <label className="min-h-[42px] px-4 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>JSON сэргээх</span>
                  <input
                    type="file"
                    accept="application/json,.json"
                    aria-label="Ахиц JSON оруулах"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const text = await file.text();
                        const parsed = JSON.parse(text) as {
                          cards?: VocabCard[];
                          dialogues?: Dialogue[];
                        };
                        onImportBackup(parsed);
                        setBackupNotice('JSON нөөцлөлт амжилттай сэргээгдлээ.');
                      } catch {
                        setBackupNotice('JSON файл буруу форматтай байна.');
                      }
                      e.target.value = '';
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    onResetCurriculum();
                    setBackupNotice('Үндсэн хичээлийн сан анхны төлөвт орлоо.');
                  }}
                  className="min-h-[42px] px-3.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-xs font-semibold text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Анхны төлөв</span>
                </button>
              </div>

              {backupNotice && (
                <p role="status" className="text-xs font-semibold text-[#248A3D] dark:text-[#30D158]">
                  {backupNotice}
                </p>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
