import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Plus,
  Sparkles,
  Volume2,
} from 'lucide-react';
import type {
  StoryProgressState,
  StorySentence,
  VocabCard,
} from '../types/lesson';
import { KLIC17_CHAPTERS, KLIC17_GLOSSARY, KLIC17_VERSION } from '../data/klic17Story';
import { playCzechAudio, stopAllPlayback } from '../utils/audioPlayer';
import { CZECH_GENDER_COLORS, getQaStatusLabelMn } from '../utils/learnerProfile';
import {
  buildStorySentenceCanonicalId,
  buildStorySentenceSrsCard,
  buildStoryWordCanonicalId,
  buildStoryWordSrsCard,
  calculateChapterStats,
  extractChapterGlossaryItems,
  isStoryItemInDeck,
  loadStoryProgress,
  lookupGlossaryEntry,
  markSentenceRead,
  saveStoryProgress,
  toggleKnownWord,
  tokenizeCzechSentence,
} from '../utils/storyReaderLogic';

interface StoryReaderViewProps {
  cards: VocabCard[];
  onAddStoryCardsToSrs: (
    cards: Omit<VocabCard, 'id' | 'audioIds' | 'mastered' | 'practiceCount'>[]
  ) => number;
  onOpenSrsPractice: () => void;
  onLaunchStoryRoleplay?: () => void;
  onProgressUpdate?: (progress: StoryProgressState) => void;
}

export const StoryReaderView: React.FC<StoryReaderViewProps> = ({
  cards,
  onAddStoryCardsToSrs,
  onOpenSrsPractice,
  onLaunchStoryRoleplay,
  onProgressUpdate,
}) => {
  const [progress, setProgress] = useState<StoryProgressState>(loadStoryProgress);
  const [selectedChapterNum, setSelectedChapterNum] = useState<number>(() => {
    const saved = loadStoryProgress().lastChapter;
    return KLIC17_CHAPTERS.some((c) => c.chapter === saved) ? saved : 1;
  });
  const [chapterRange, setChapterRange] = useState<'a0' | 'all'>('a0');
  const [openSentenceId, setOpenSentenceId] = useState<string | null>(
    () => KLIC17_CHAPTERS[0]?.sentences[0]?.id ?? null
  );
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [showAllTranslations, setShowAllTranslations] = useState(true);
  const [showGenderColors, setShowGenderColors] = useState(true);
  const [largeText, setLargeText] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playingChapter, setPlayingChapter] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const chapterCancelRef = useRef(false);

  useEffect(() => {
    const next = { ...progress, lastChapter: selectedChapterNum };
    saveStoryProgress(next);
    onProgressUpdate?.(next);
  }, [progress, selectedChapterNum, onProgressUpdate]);

  useEffect(() => {
    return () => {
      chapterCancelRef.current = true;
      stopAllPlayback();
    };
  }, []);

  const visibleChapters = useMemo(() => {
    if (chapterRange === 'a0') {
      return KLIC17_CHAPTERS.filter((c) => c.chapter <= 10 || c.chapter === selectedChapterNum);
    }
    return KLIC17_CHAPTERS;
  }, [chapterRange, selectedChapterNum]);

  const activeChapter = useMemo(
    () =>
      KLIC17_CHAPTERS.find((c) => c.chapter === selectedChapterNum) ?? KLIC17_CHAPTERS[0]!,
    [selectedChapterNum]
  );

  const chapterStats = useMemo(
    () => calculateChapterStats(activeChapter, progress, cards, KLIC17_GLOSSARY),
    [activeChapter, progress, cards]
  );

  const chapterGlossary = useMemo(
    () => extractChapterGlossaryItems(activeChapter, KLIC17_GLOSSARY),
    [activeChapter]
  );

  const openSentence: StorySentence | null = useMemo(
    () => activeChapter.sentences.find((s) => s.id === openSentenceId) ?? null,
    [activeChapter, openSentenceId]
  );

  const handleSelectChapter = (num: number) => {
    chapterCancelRef.current = true;
    setPlayingChapter(false);
    stopAllPlayback();
    setPlayingId(null);
    setSelectedChapterNum(num);
    const nextChapter = KLIC17_CHAPTERS.find((c) => c.chapter === num);
    setOpenSentenceId(nextChapter?.sentences[0]?.id ?? null);
    setSelectedWord(null);
    setStatusNotice(null);
  };

  const handleToggleSentence = (sentence: StorySentence) => {
    setProgress((prev) => markSentenceRead(prev, sentence.id));
    if (openSentenceId === sentence.id) {
      setOpenSentenceId(null);
      setSelectedWord(null);
    } else {
      setOpenSentenceId(sentence.id);
      setSelectedWord(null);
    }
  };

  const handlePlaySentence = async (sentence: StorySentence, rate: number) => {
    chapterCancelRef.current = true;
    setPlayingChapter(false);
    setProgress((prev) => markSentenceRead(prev, sentence.id));
    if (playingId === sentence.id) {
      stopAllPlayback();
      setPlayingId(null);
      return;
    }
    await playCzechAudio({
      text: sentence.cs,
      rate,
      voiceName: sentence.speaker === 'Klára' ? 'Zephyr' : 'Charon',
      onStart: () => setPlayingId(sentence.id),
      onEnd: () => setPlayingId(null),
    });
  };

  const handlePlayWord = async (text: string, rate: number) => {
    chapterCancelRef.current = true;
    setPlayingChapter(false);
    await playCzechAudio({
      text,
      rate,
      voiceName: 'Charon',
      onStart: () => setPlayingId(`word:${text}`),
      onEnd: () => setPlayingId(null),
    });
  };

  const handlePlayChapterAudio = async () => {
    if (playingChapter) {
      chapterCancelRef.current = true;
      setPlayingChapter(false);
      stopAllPlayback();
      setPlayingId(null);
      return;
    }
    chapterCancelRef.current = false;
    setPlayingChapter(true);
    for (const sentence of activeChapter.sentences) {
      if (chapterCancelRef.current) break;
      setProgress((prev) => markSentenceRead(prev, sentence.id));
      await new Promise<void>((resolve) => {
        void playCzechAudio({
          text: sentence.cs,
          rate: 1.0,
          voiceName: sentence.speaker === 'Klára' ? 'Zephyr' : 'Charon',
          onStart: () => setPlayingId(sentence.id),
          onEnd: () => resolve(),
        });
      });
    }
    setPlayingChapter(false);
    setPlayingId(null);
  };

  const handleAddWordToSrs = (surfaceWord: string, sentence: StorySentence) => {
    const entry = lookupGlossaryEntry(surfaceWord, KLIC17_GLOSSARY);
    if (!entry) return;
    const cardPayload = buildStoryWordSrsCard(surfaceWord, entry, sentence, activeChapter);
    const added = onAddStoryCardsToSrs([cardPayload]);
    setStatusNotice(
      added > 0
        ? `«${cardPayload.czechWord}» үгийг SRS давтлагад нэмлээ.`
        : `«${cardPayload.czechWord}» үг аль хэдийн таны SRS санд байна.`
    );
  };

  const handleAddSentenceToSrs = (sentence: StorySentence) => {
    const cardPayload = buildStorySentenceSrsCard(sentence, activeChapter);
    const added = onAddStoryCardsToSrs([cardPayload]);
    setProgress((prev) => markSentenceRead(prev, sentence.id));
    setStatusNotice(
      added > 0
        ? `«${sentence.cs}» өгүүлбэрийг SRS давтлагад нэмлээ.`
        : `«${sentence.cs}» өгүүлбэр таны SRS санд аль хэдийн байна.`
    );
  };

  const handleBatchAddChapterWords = () => {
    const pendingPayloads = chapterGlossary
      .filter((item) => !isStoryItemInDeck(item.canonicalId, item.entry.lemma, cards))
      .map((item) => buildStoryWordSrsCard(item.surfaceWord, item.entry, item.sentence, activeChapter));

    if (pendingPayloads.length === 0) {
      setStatusNotice('Энэ бүлгийн бүх баталгаажуулахад бэлэн үгс таны SRS санд орсон байна.');
      return;
    }
    const added = onAddStoryCardsToSrs(pendingPayloads);
    setStatusNotice(`${added} шинэ үгийг «${activeChapter.titleCs}» бүлгээс SRS давтлага руу нэмлээ.`);
  };

  const selectedEntry = selectedWord ? lookupGlossaryEntry(selectedWord, KLIC17_GLOSSARY) : null;
  const selectedWordCanonicalId =
    selectedWord && selectedEntry ? buildStoryWordCanonicalId(selectedEntry, selectedWord) : '';
  const selectedWordInSrs =
    selectedWord && selectedEntry
      ? isStoryItemInDeck(selectedWordCanonicalId, selectedEntry.lemma, cards)
      : false;
  const selectedWordIsKnown = selectedEntry
    ? progress.knownWords.includes(selectedEntry.lemmaGroup)
    : false;

  const readSet = useMemo(() => new Set(progress.readSentenceIds), [progress.readSentenceIds]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
      {/* Mobile Chapter Picker */}
      <div className="lg:hidden space-y-2">
        <div className="flex items-center gap-2">
          <label htmlFor="klic17-mobile-chapter" className="sr-only">
            Зохиолын бүлэг сонгох
          </label>
          <select
            id="klic17-mobile-chapter"
            value={activeChapter.chapter}
            onChange={(e) => handleSelectChapter(Number(e.target.value))}
            className="flex-1 min-w-0 min-h-[44px] rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] px-3 text-sm font-semibold text-[#1C1C1E] dark:text-white truncate"
          >
            {KLIC17_CHAPTERS.map((ch) => (
              <option key={ch.chapter} value={ch.chapter}>
                {String(ch.chapter).padStart(2, '0')}. {ch.titleCs} ({ch.sentences.length} мөр)
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onOpenSrsPractice}
            className="min-h-[44px] px-3.5 rounded-xl bg-[#007AFF]/10 dark:bg-[#0A84FF]/18 text-[#007AFF] dark:text-[#64D2FF] text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
          >
            <span>SRS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Desktop Chapter Sidebar */}
      <aside className="hidden lg:block lg:col-span-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[#1C1C1E] dark:text-white">
            Klíč číslo 17 · Бүлгүүд
          </h2>
          <div className="flex items-center gap-0.5 p-1 rounded-lg bg-[#E5E5EA] dark:bg-[#1C1C1E] shrink-0">
            <button
              type="button"
              onClick={() => setChapterRange('a0')}
              className={`min-h-[28px] px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap cursor-pointer ${
                chapterRange === 'a0'
                  ? 'bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-white shadow-2xs'
                  : 'text-[#636366] dark:text-[#8E8E93]'
              }`}
            >
              1–10 (A0→A1)
            </button>
            <button
              type="button"
              onClick={() => setChapterRange('all')}
              className={`min-h-[28px] px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap cursor-pointer ${
                chapterRange === 'all'
                  ? 'bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-white shadow-2xs'
                  : 'text-[#636366] dark:text-[#8E8E93]'
              }`}
            >
              Бүх 40
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-2">
          {visibleChapters.map((ch) => {
            const active = ch.chapter === activeChapter.chapter;
            const chRead = ch.sentences.filter((s) => readSet.has(s.id)).length;
            return (
              <button
                key={ch.chapter}
                type="button"
                onClick={() => handleSelectChapter(ch.chapter)}
                className={`w-full text-left rounded-2xl p-3.5 border transition-colors cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-[#1C1C1E] border-[#007AFF] dark:border-[#0A84FF] ring-1 ring-[#007AFF] dark:ring-[#0A84FF]'
                    : 'bg-white dark:bg-[#1C1C1E] border-black/[0.06] dark:border-white/[0.08] hover:border-black/15 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-[#1C1C1E] dark:text-white truncate">
                    {String(ch.chapter).padStart(2, '0')}. {ch.titleCs}
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-[#8E8E93] shrink-0">
                    {chRead}/{ch.sentences.length}
                  </span>
                </div>
                <p className="text-xs text-[#8E8E93] mt-1 truncate">{ch.band}</p>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Story Reader Stage */}
      <section className="lg:col-span-8 space-y-5">
        <div className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-6 space-y-5">
          {/* Header & Metadata (Zero-pill discipline) */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-medium text-[#8E8E93]">
                Klíč číslo 17 · {activeChapter.band} · {getQaStatusLabelMn('draft_ai')}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1C1E] dark:text-white">
                {String(activeChapter.chapter).padStart(2, '0')} · {activeChapter.titleCs}
              </h1>
              <p className="text-xs text-[#636366] dark:text-[#AEAEB2]">
                Өгүүлбэр дээр дарж орчуулга ба үг бүрийн задлалыг нээнэ үү · Эх: {KLIC17_VERSION}
              </p>
            </div>

            <div className="hidden lg:flex items-center gap-2 shrink-0">
              {onLaunchStoryRoleplay && (
                <button
                  type="button"
                  onClick={onLaunchStoryRoleplay}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#007AFF]/10 dark:bg-[#0A84FF]/20 text-xs font-semibold text-[#007AFF] dark:text-[#64D2FF] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>AI Роль тоглох</span>
                </button>
              )}
              <button
                type="button"
                onClick={onOpenSrsPractice}
                className="min-h-[42px] px-3.5 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#F2F2F7] dark:bg-[#2C2C2E] text-xs font-semibold text-[#1C1C1E] dark:text-white inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#007AFF] dark:text-[#64D2FF]" aria-hidden="true" />
                <span>Карт (SRS)</span>
              </button>
            </div>
          </div>

          {/* Reading & SRS Progress Strip */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#636366] dark:text-[#AEAEB2]">
              <span className="tabular-nums">
                Уншсан: <strong className="text-[#1C1C1E] dark:text-white">{chapterStats.readCount}/{chapterStats.totalSentences}</strong> мөр ({chapterStats.readPercent}%)
              </span>
              <span className="tabular-nums">
                Толиос SRS-д: <strong className="text-[#007AFF] dark:text-[#64D2FF]">{chapterStats.syncedWordsCount}/{chapterStats.glossaryCount}</strong> үг
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] overflow-hidden">
              <div
                className="h-full bg-[#007AFF] dark:bg-[#0A84FF] transition-all duration-200"
                style={{ width: `${chapterStats.readPercent}%` }}
              />
            </div>
          </div>

          {/* Reader Controls */}
          <div className="rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2 sm:flex-wrap sm:justify-start">
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => void handlePlayChapterAudio()}
                className="flex-1 sm:flex-initial min-h-[42px] px-4 py-2 rounded-full bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{playingChapter ? 'Зогсоох' : 'Бүлгийг сонсох'}</span>
              </motion.button>

              <button
                type="button"
                onClick={() => setLargeText((v) => !v)}
                aria-pressed={largeText}
                aria-label="Үсгийн хэмжээ солих"
                className="sm:order-4 min-h-[42px] px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#3A3A3C] text-xs font-mono font-semibold text-[#1C1C1E] dark:text-white whitespace-nowrap cursor-pointer shrink-0"
              >
                {largeText ? 'Аа-' : 'Аа+'}
              </button>

              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAllTranslations((v) => !v)}
                  aria-pressed={showAllTranslations}
                  className={`min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    showAllTranslations
                      ? 'bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-white'
                      : 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E]'
                  }`}
                >
                  {showAllTranslations ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{showAllTranslations ? 'Орчуулга харагдаж буй' : 'Зөвхөн Чех эх'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowGenderColors((v) => !v)}
                  aria-pressed={showGenderColors}
                  className={`min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    showGenderColors
                      ? 'bg-[#007AFF]/12 dark:bg-[#0A84FF]/22 text-[#007AFF] dark:text-[#64D2FF]'
                      : 'bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Хүйсийн өнгө</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:hidden">
              <button
                type="button"
                onClick={() => setShowAllTranslations((v) => !v)}
                aria-pressed={showAllTranslations}
                className={`min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  showAllTranslations
                    ? 'bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-white'
                    : 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E]'
                }`}
              >
                {showAllTranslations ? <Eye className="w-3.5 h-3.5 shrink-0" /> : <EyeOff className="w-3.5 h-3.5 shrink-0" />}
                <span className="truncate">{showAllTranslations ? 'Орчуулга' : 'Чех эх'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGenderColors((v) => !v)}
                aria-pressed={showGenderColors}
                className={`min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  showGenderColors
                    ? 'bg-[#007AFF]/12 dark:bg-[#0A84FF]/22 text-[#007AFF] dark:text-[#64D2FF]'
                    : 'bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">Хүйсийн өнгө</span>
              </button>
            </div>

            {showGenderColors && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#636366] dark:text-[#AEAEB2] pt-1 border-t border-black/[0.06] dark:border-white/[0.08]">
                {(Object.keys(CZECH_GENDER_COLORS) as Array<keyof typeof CZECH_GENDER_COLORS>).map(
                  (key) => {
                    const spec = CZECH_GENDER_COLORS[key];
                    return (
                      <span key={key} className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: spec.hex }}
                          aria-hidden="true"
                        />
                        <span>{spec.shortLabel}</span>
                      </span>
                    );
                  }
                )}
              </div>
            )}
          </div>

          {statusNotice && (
            <div
              role="status"
              className="rounded-2xl bg-[#34C759]/10 dark:bg-[#30D158]/15 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#1E7E34] dark:text-[#30D158]"
            >
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{statusNotice}</span>
              </span>
              <button
                type="button"
                onClick={onOpenSrsPractice}
                className="underline font-bold cursor-pointer whitespace-nowrap"
              >
                Давтлага (SRS) руу очих →
              </button>
            </div>
          )}

          {/* Sentence List (Hairline dividers, clean hierarchy) */}
          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
            {activeChapter.sentences.map((sentence) => {
              const isOpen = openSentence?.id === sentence.id;
              const isRead = readSet.has(sentence.id);
              const isPlaying = playingId === sentence.id;
              const sentenceCanonicalId = buildStorySentenceCanonicalId(sentence);
              const sentenceInSrs = isStoryItemInDeck(sentenceCanonicalId, sentence.cs, cards);

              return (
                <article
                  key={sentence.id}
                  className={`py-4 transition-colors ${
                    isPlaying
                      ? 'bg-[#007AFF]/[0.06] dark:bg-[#0A84FF]/[0.12] -mx-3 px-3 rounded-2xl'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleSentence(sentence)}
                      aria-expanded={isOpen}
                      className="flex-1 text-left min-w-0 cursor-pointer space-y-1"
                    >
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#8E8E93]">
                        <span className="font-mono font-semibold">{sentence.id}</span>
                        <span aria-hidden="true">·</span>
                        <span>{sentence.speaker}</span>
                        {sentence.lessonIds.length > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-[#007AFF] dark:text-[#64D2FF]">
                              {sentence.lessonIds[0]}
                            </span>
                          </>
                        )}
                        {isRead && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#248A3D] dark:text-[#30D158]">Уншсан</span>
                          </>
                        )}
                      </div>

                      <p
                        className={`font-semibold text-[#1C1C1E] dark:text-white leading-snug ${
                          largeText ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'
                        }`}
                      >
                        {sentence.cs}
                      </p>

                      {showAllTranslations && (
                        <p
                          className={`text-[#636366] dark:text-[#AEAEB2] ${
                            largeText ? 'text-base' : 'text-sm'
                          }`}
                        >
                          {sentence.mn}
                        </p>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => void handlePlaySentence(sentence, 1.0)}
                        aria-label={`Сонсох: ${sentence.cs}`}
                        className={`min-h-[42px] min-w-[42px] rounded-full flex items-center justify-center cursor-pointer ${
                          isPlaying
                            ? 'bg-[#007AFF] dark:bg-[#0A84FF] text-white'
                            : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white'
                        }`}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handlePlaySentence(sentence, 0.65)}
                        aria-label={`Удаанаар сонсох: ${sentence.cs}`}
                        className="min-h-[42px] px-2.5 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] text-xs font-mono font-semibold text-[#1C1C1E] dark:text-white cursor-pointer"
                      >
                        0.6x
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSentence(sentence)}
                        aria-label={isOpen ? 'Үгийн задаргаа хаах' : 'Үгийн задаргаа нээх'}
                        className="min-h-[42px] min-w-[36px] rounded-full text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white flex items-center justify-center cursor-pointer"
                      >
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Interactive Word Tokens + Sentence SRS Action */}
                  {isOpen && (
                    <div className="mt-3 pt-3 border-t border-black/[0.05] dark:border-white/[0.07] space-y-3">
                      {!showAllTranslations && (
                        <p className="text-sm font-medium text-[#1C1C1E] dark:text-[#EBEBF5]">
                          {sentence.mn}
                        </p>
                      )}

                      {sentence.reviewNote && (
                        <p className="text-xs text-[#9A5B00] dark:text-[#FFD60A] bg-[#FF9500]/10 dark:bg-[#FF9F0A]/15 rounded-xl px-3 py-2">
                          Анхаарах тэмдэглэл: {sentence.reviewNote}
                        </p>
                      )}

                      <div className="space-y-1.5">
                        <p className="text-[11px] font-medium text-[#8E8E93]">
                          Үг дээр дарж утга, хүйс, үндсэн хэлбэрийг харна уу
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Чех үг сонгох">
                          {tokenizeCzechSentence(sentence.cs).map((token, idx) => {
                            if (!token.isWord) {
                              return (
                                <span
                                  key={`${sentence.id}-p-${idx}`}
                                  className="text-sm text-[#8E8E93] px-0.5 select-none"
                                >
                                  {token.text}
                                </span>
                              );
                            }

                            const entry = lookupGlossaryEntry(token.text, KLIC17_GLOSSARY);
                            const isSelected =
                              selectedWord !== null &&
                              token.lookupKey === selectedWord.toLocaleLowerCase('cs-CZ') &&
                              openSentence?.id === sentence.id;
                            const genderSpec =
                              showGenderColors && entry?.nounGender
                                ? CZECH_GENDER_COLORS[entry.nounGender]
                                : null;

                            return (
                              <button
                                key={`${sentence.id}-w-${idx}`}
                                type="button"
                                onClick={() => setSelectedWord(token.lookupKey)}
                                className={`min-h-[38px] px-2.5 py-1 rounded-xl text-sm font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-[#007AFF] dark:bg-[#0A84FF] text-white'
                                    : entry
                                    ? 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C]'
                                    : 'bg-transparent border border-black/[0.08] dark:border-white/[0.1] text-[#636366] dark:text-[#AEAEB2]'
                                }`}
                              >
                                {genderSpec && !isSelected && (
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: genderSpec.hex }}
                                    aria-hidden="true"
                                  />
                                )}
                                <span
                                  className={
                                    entry && !isSelected
                                      ? 'underline decoration-black/20 dark:decoration-white/25 underline-offset-4'
                                      : ''
                                  }
                                >
                                  {token.text}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Word Inspector Panel */}
                      {selectedWord && (
                        <div className="rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] p-4 space-y-3">
                          {selectedEntry ? (
                            <>
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#8E8E93]">
                                    <span>Үндсэн хэлбэр: <strong className="text-[#1C1C1E] dark:text-white">{selectedEntry.lemma}</strong></span>
                                    {selectedEntry.nounGender && (
                                      <>
                                        <span aria-hidden="true">·</span>
                                        <span
                                          className={`inline-flex items-center gap-1.5 font-semibold ${
                                            CZECH_GENDER_COLORS[selectedEntry.nounGender].textClass
                                          }`}
                                        >
                                          <span
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{
                                              backgroundColor:
                                                CZECH_GENDER_COLORS[selectedEntry.nounGender].hex,
                                            }}
                                            aria-hidden="true"
                                          />
                                          <span>{CZECH_GENDER_COLORS[selectedEntry.nounGender].labelMn}</span>
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <p className="text-lg font-bold text-[#1C1C1E] dark:text-white">
                                    {selectedEntry.mn}
                                  </p>
                                  <p className="text-xs font-mono text-[#007AFF] dark:text-[#64D2FF]">
                                    [{selectedEntry.phonetic}] · {selectedEntry.grammar}
                                  </p>
                                  <p className="text-xs text-[#636366] dark:text-[#AEAEB2]">
                                    {selectedEntry.note}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => void handlePlayWord(selectedEntry.lemma, 1.0)}
                                    className="min-h-[40px] px-3 rounded-xl bg-white dark:bg-[#3A3A3C] text-xs font-semibold text-[#1C1C1E] dark:text-white inline-flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>Сонсох</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handlePlayWord(selectedEntry.lemma, 0.65)}
                                    className="min-h-[40px] px-2.5 rounded-xl bg-white dark:bg-[#3A3A3C] text-xs font-mono font-semibold text-[#1C1C1E] dark:text-white cursor-pointer"
                                  >
                                    0.6x
                                  </button>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleAddWordToSrs(selectedWord, sentence)}
                                  className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                    selectedWordInSrs
                                      ? 'bg-[#34C759]/15 dark:bg-[#30D158]/20 text-[#1E7E34] dark:text-[#30D158]'
                                      : 'bg-[#007AFF] dark:bg-[#0A84FF] text-white'
                                  }`}
                                >
                                  {selectedWordInSrs ? (
                                    <>
                                      <Check className="w-4 h-4 shrink-0" />
                                      <span>SRS-д нэмэгдсэн</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-4 h-4 shrink-0" />
                                      <span>+ SRS давтлага руу нэмэх</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setProgress((prev) => toggleKnownWord(prev, selectedEntry.lemmaGroup))
                                  }
                                  aria-pressed={selectedWordIsKnown}
                                  className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                    selectedWordIsKnown
                                      ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E]'
                                      : 'bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-white'
                                  }`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>{selectedWordIsKnown ? 'Мэддэг үг ✓' : 'Мэддэг үг'}</span>
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-1.5">
                              <p className="text-sm font-semibold text-[#1C1C1E] dark:text-white">
                                «{selectedWord}»
                              </p>
                              <p className="text-xs text-[#636366] dark:text-[#AEAEB2]">
                                Энэ үгийн үндсэн хэлбэр, хэрэглээг баталгаажуулаагүй байна. Таамгаар толь үүсгээгүй тул бүтэн өгүүлбэрийг SRS сандаа хадгалах боломжтой.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Sentence SRS Action Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleAddSentenceToSrs(sentence)}
                          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                            sentenceInSrs
                              ? 'bg-[#34C759]/12 dark:bg-[#30D158]/18 text-[#1E7E34] dark:text-[#30D158]'
                              : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C]'
                          }`}
                        >
                          {sentenceInSrs ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Өгүүлбэр SRS-д орсон</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Өгүүлбэрийг SRS-д нэмэх</span>
                            </>
                          )}
                        </button>

                        <span className="text-[11px] text-[#8E8E93]">
                          {sentence.delivery === 'spoken' ? 'Ярианы мөр' : 'Давтлагын мөр'}
                        </span>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        {/* Chapter Curated Glossary & Batch Sync Section */}
        <div className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1C1C1E] dark:text-white">
                Энэ бүлгийн толь ({chapterGlossary.length} үг)
              </h2>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                {getQaStatusLabelMn('draft_ai')} · Үг бүрийг тусад нь эсвэл бөөнөөр нь SRS-д нэмнэ үү.
              </p>
            </div>
            {chapterGlossary.length > 0 && (
              <button
                type="button"
                onClick={handleBatchAddChapterWords}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Бүлгийн бүх үгсийг SRS-д нэмэх</span>
              </button>
            )}
          </div>

          {chapterGlossary.length === 0 ? (
            <p className="text-sm text-[#636366] dark:text-[#AEAEB2]">
              Энэ бүлэгт тольчлогдсон үгс хараахан бүртгэгдээгүй байна. Өгүүлбэрүүдийг шууд SRS санд нэмэх боломжтой.
            </p>
          ) : (
            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
              {chapterGlossary.map((item) => {
                const inDeck = isStoryItemInDeck(item.canonicalId, item.entry.lemma, cards);
                const genderSpec = item.entry.nounGender
                  ? CZECH_GENDER_COLORS[item.entry.nounGender]
                  : null;
                return (
                  <div
                    key={item.canonicalId}
                    className="py-3 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {genderSpec && (
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: genderSpec.hex }}
                            aria-hidden="true"
                          />
                        )}
                        <span className="text-sm font-bold text-[#1C1C1E] dark:text-white">
                          {item.entry.lemma}
                        </span>
                        <span className="text-xs font-mono text-[#007AFF] dark:text-[#64D2FF]">
                          [{item.entry.phonetic}]
                        </span>
                        {genderSpec && (
                          <span className={`text-[11px] font-medium ${genderSpec.textClass}`}>
                            {genderSpec.shortLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#636366] dark:text-[#AEAEB2]">
                        {item.entry.mn} · {item.entry.grammar}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => void handlePlayWord(item.entry.lemma, 1.0)}
                        aria-label={`Сонсох: ${item.entry.lemma}`}
                        className="min-h-[38px] min-w-[38px] rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white flex items-center justify-center cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddWordToSrs(item.surfaceWord, item.sentence)}
                        className={`min-h-[38px] px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                          inDeck
                            ? 'bg-[#34C759]/12 dark:bg-[#30D158]/18 text-[#1E7E34] dark:text-[#30D158]'
                            : 'bg-[#007AFF]/10 dark:bg-[#0A84FF]/18 text-[#007AFF] dark:text-[#64D2FF]'
                        }`}
                      >
                        {inDeck ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>SRS-д буй</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>SRS-д нэмэх</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
