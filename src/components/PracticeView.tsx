import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AudioLines,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Mic,
  Play,
  Repeat,
  Square,
  Upload,
  Volume2,
  Wand2,
} from 'lucide-react';
import type {
  AudioSlotType,
  LearnerSelfForm,
  SrsGrade,
  TopicId,
  VocabCard,
} from '../types/lesson';
import { TOPICS } from '../data/starterCurriculum';
import { base64ToBlob, blobToBase64, playCzechAudio, stopAllPlayback } from '../utils/audioPlayer';
import { filterCards, getNextCardIndex, type MasteryFilter } from '../utils/studyLogic';
import type { TokenUsageMetrics } from '../utils/tokenPricing';
import { appendClientUsageLog } from '../utils/usageMonitor';
import { countDueAndBuried, formatUtcDayKey, SRS_ENGINE_LABEL } from '../utils/srsScheduler';
import { CZECH_GENDER_COLORS, getQaStatusLabelMn, resolveCardDisplayCzech } from '../utils/learnerProfile';

interface PracticeViewProps {
  cards: VocabCard[];
  selectedTopic: TopicId | 'all';
  onSelectTopic: (topic: TopicId | 'all') => void;
  onToggleMastered: (cardId: string) => void;
  onRecordPractice: (cardId: string) => void;
  onAttachAudio: (cardId: string, slot: AudioSlotType, file: File) => Promise<void>;
  learnerGender: LearnerSelfForm;
  onChangeLearnerGender: (gender: LearnerSelfForm) => void;
  onReviewSrsCard: (cardId: string, grade: SrsGrade, eventId: string) => void;
}

interface SpeechEvalResult {
  pronunciationScore: number | null;
  heardText: string;
  sttTranscript: string;
  grammarIssue: boolean;
  pronunciationIssue: boolean;
  recognitionUncertainty: boolean;
  feedbackMn: string;
}

const SLOT_LABELS: Record<AudioSlotType, string> = {
  wordNormal: 'Үг · Энгийн',
  wordSlow: 'Үг · Удаан',
  sentenceNormal: 'Өгүүлбэр · Энгийн',
  sentenceSlow: 'Өгүүлбэр · Удаан',
};

const AudioWaveBars: React.FC<{ active: boolean; inverted?: boolean }> = ({ active, inverted }) => {
  if (!active) return null;
  const barColor = inverted ? 'bg-white' : 'bg-white';
  return (
    <span className="inline-flex items-end gap-0.5 h-3.5 shrink-0" aria-hidden="true">
      {[0, 1, 2, 3].map((idx) => (
        <motion.span
          key={idx}
          className={`w-0.5 rounded-full ${barColor} origin-bottom h-full`}
          animate={{ scaleY: [0.35, 1, 0.45, 0.85, 0.35] }}
          transition={{
            duration: 0.75,
            repeat: Infinity,
            delay: idx * 0.12,
            ease: 'easeInOut',
          }}
        />
      ))}
    </span>
  );
};

export const PracticeView: React.FC<PracticeViewProps> = ({
  cards,
  selectedTopic,
  onSelectTopic,
  onToggleMastered,
  onRecordPractice,
  onAttachAudio,
  learnerGender,
  onChangeLearnerGender,
  onReviewSrsCard,
}) => {
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [activeSlot, setActiveSlot] = useState<AudioSlotType | null>(null);
  const [hideTranslation, setHideTranslation] = useState(false);
  const [loopMode, setLoopMode] = useState(false);

  // Voice self-recording & AI evaluation state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<SpeechEvalResult | null>(null);
  const [editedHeardText, setEditedHeardText] = useState('');
  const [isRecheckingText, setIsRecheckingText] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const selfAudioRef = useRef<HTMLAudioElement | null>(null);

  // Swipe gesture tracking for iPhone
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState(0);

  const [uploadingSlot, setUploadingSlot] = useState<AudioSlotType | null>(null);
  const [generatingSlot, setGeneratingSlot] = useState<AudioSlotType | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);

  const filtered = useMemo(
    () => filterCards(cards, { topicId: selectedTopic, mastery: masteryFilter }),
    [cards, selectedTopic, masteryFilter]
  );

  const safeIndex = filtered.length === 0 ? 0 : Math.min(currentIndex, filtered.length - 1);
  const activeCard = filtered[safeIndex] ?? null;

  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedTopic, masteryFilter]);

  useEffect(() => {
    return () => {
      stopAllPlayback();
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, [recordedUrl]);

  const clearRecordingState = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedUrl(null);
    setRecordedBlob(null);
    setEvalResult(null);
    setEditedHeardText('');
    setEvalError(null);
    setRecordError(null);
  };

  const handlePlaySlot = async (slot: AudioSlotType) => {
    if (!activeCard) return;

    if (activeSlot === slot) {
      stopAllPlayback();
      setActiveSlot(null);
      return;
    }

    const isWord = slot === 'wordNormal' || slot === 'wordSlow';
    const isSlow = slot === 'wordSlow' || slot === 'sentenceSlow';
    const displayWord = resolveCardDisplayCzech(activeCard, learnerGender);
    const text = isWord
      ? displayWord
      : activeCard.selfFormVariants
        ? displayWord
        : activeCard.czechSentence;
    const primaryId = activeCard.audioIds[slot];
    const fallbackId = isSlow
      ? activeCard.audioIds[isWord ? 'wordNormal' : 'sentenceNormal']
      : undefined;

    onRecordPractice(activeCard.id);

    await playCzechAudio({
      audioId: primaryId,
      fallbackAudioId: fallbackId,
      text,
      rate: isSlow ? 0.65 : 1.0,
      loop: loopMode,
      onStart: () => setActiveSlot(slot),
      onEnd: () => setActiveSlot(null),
    });
  };

  const handleStep = (direction: 1 | -1) => {
    stopAllPlayback();
    setSlideDirection(direction);
    setActiveSlot(null);
    setSlotError(null);
    clearRecordingState();
    setCurrentIndex((prev) => getNextCardIndex(prev, filtered.length, direction));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touch = e.touches[0];
    if (!touch) return;
    const dx = touch.clientX - touchStartXRef.current;
    const dy = touch.clientY - touchStartYRef.current;
    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      setDragOffsetX(Math.max(-64, Math.min(64, dx * 0.45)));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setDragOffsetX(0);
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - touchStartXRef.current;
    const dy = touch.clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      handleStep(dx < 0 ? 1 : -1);
    }
  };

  const handleToggleRecording = async () => {
    setRecordError(null);
    setEvalError(null);
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setRecordError('Энэ хөтөч дээр микрофон бичих боломжгүй байна.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      setEvalResult(null);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        setRecordedBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setRecordError('Микрофоны зөвшөөрөл олгогдоогүй байна.');
    }
  };

  const handlePlaySelfRecording = () => {
    if (!recordedUrl) return;
    if (selfAudioRef.current) {
      selfAudioRef.current.pause();
    }
    const audio = new Audio(recordedUrl);
    selfAudioRef.current = audio;
    void audio.play();
  };

  const handleEvaluatePronunciation = async () => {
    if (!recordedBlob || !activeCard || isEvaluating) return;
    setIsEvaluating(true);
    setEvalError(null);
    setEvalResult(null);
    try {
      const audioBase64 = await blobToBase64(recordedBlob);
      const res = await fetch('/api/ai/evaluate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'audio',
          audioBase64,
          mimeType: recordedBlob.type || 'audio/webm',
          targetCzech: activeCard.czechWord,
        }),
      });
      const data = (await res.json()) as Partial<SpeechEvalResult> & {
        score?: number | null;
        error?: string;
        usage?: TokenUsageMetrics;
      };
      if (!res.ok || data.error) {
        setEvalError(data.error || 'Дуудлага шалгаж чадсангүй.');
        return;
      }
      if (data.usage) {
        appendClientUsageLog({
          id: `cli_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          endpoint: '/api/ai/evaluate-speech',
          usedModel: data.usage.usedModel ?? 'gemini-3.1-flash-lite',
          inputTokens: data.usage.inputTokens,
          outputTokens: data.usage.outputTokens,
          thinkingTokens: data.usage.thinkingTokens ?? 0,
          cachedTokens: data.usage.cachedTokens ?? 0,
          totalTokens: data.usage.totalTokens,
          ttsAudioGenerated: false,
          requestDurationMs: data.usage.durationMs ?? 0,
          cacheHit: false,
          estimatedCostUsd: data.usage.estimatedCostUsd,
        });
      }
      const heard = data.heardText ?? '';
      const scoreValue =
        typeof data.pronunciationScore === 'number'
          ? data.pronunciationScore
          : typeof data.score === 'number'
            ? data.score
            : null;
      setEditedHeardText(heard);
      setEvalResult({
        pronunciationScore: scoreValue,
        heardText: heard,
        sttTranscript: data.sttTranscript ?? heard,
        grammarIssue: Boolean(data.grammarIssue),
        pronunciationIssue: Boolean(data.pronunciationIssue),
        recognitionUncertainty: Boolean(data.recognitionUncertainty),
        feedbackMn: data.feedbackMn ?? '',
      });
    } catch {
      setEvalError('Сүлжээний алдаа гарлаа. Интернэт холболтоо шалгана уу.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRecheckEditedGrammar = async () => {
    if (!activeCard || !editedHeardText.trim() || isRecheckingText) return;
    setIsRecheckingText(true);
    setEvalError(null);
    try {
      const res = await fetch('/api/ai/evaluate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'text-recheck',
          editedText: editedHeardText.trim(),
          targetCzech: activeCard.czechWord,
        }),
      });
      const data = (await res.json()) as Partial<SpeechEvalResult> & {
        error?: string;
        usage?: TokenUsageMetrics;
      };
      if (!res.ok || data.error) {
        setEvalError(data.error || 'Бичвэрийн дүрэм шалгаж чадсангүй.');
        return;
      }
      if (data.usage) {
        appendClientUsageLog({
          id: `cli_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          endpoint: '/api/ai/evaluate-speech',
          usedModel: data.usage.usedModel ?? 'gemini-3.1-flash-lite',
          inputTokens: data.usage.inputTokens,
          outputTokens: data.usage.outputTokens,
          thinkingTokens: data.usage.thinkingTokens ?? 0,
          cachedTokens: data.usage.cachedTokens ?? 0,
          totalTokens: data.usage.totalTokens,
          ttsAudioGenerated: false,
          requestDurationMs: data.usage.durationMs ?? 0,
          cacheHit: false,
          estimatedCostUsd: data.usage.estimatedCostUsd,
        });
      }
      setEvalResult({
        pronunciationScore: null,
        heardText: editedHeardText.trim(),
        sttTranscript: editedHeardText.trim(),
        grammarIssue: Boolean(data.grammarIssue),
        pronunciationIssue: false,
        recognitionUncertainty: false,
        feedbackMn: data.feedbackMn ?? '',
      });
    } catch {
      setEvalError('Сүлжээний алдаа гарлаа. Интернэт холболтоо шалгана уу.');
    } finally {
      setIsRecheckingText(false);
    }
  };

  const handleQuickFileChange = async (slot: AudioSlotType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCard) return;
    setSlotError(null);
    setUploadingSlot(slot);
    try {
      await onAttachAudio(activeCard.id, slot, file);
    } finally {
      setUploadingSlot(null);
      e.target.value = '';
    }
  };

  const handleGenerateSlotAudio = async (slot: AudioSlotType) => {
    if (!activeCard || generatingSlot) return;
    const isWord = slot === 'wordNormal' || slot === 'wordSlow';
    const isSlow = slot === 'wordSlow' || slot === 'sentenceSlow';
    const text = isWord ? activeCard.czechWord : activeCard.czechSentence;

    setSlotError(null);
    setGeneratingSlot(slot);
    try {
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, slow: isSlow }),
      });
      const data = (await res.json()) as {
        audioBase64?: string;
        mimeType?: string;
        cacheHit?: boolean;
        usage?: TokenUsageMetrics;
        error?: string;
      };
      if (!res.ok || !data.audioBase64) {
        setSlotError(data.error || 'AI аудио үүсгэж чадсангүй.');
        return;
      }
      if (data.usage) {
        appendClientUsageLog({
          id: `cli_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          endpoint: '/api/ai/tts',
          usedModel: data.usage.ttsModel ?? 'gemini-3.8-flash-lite-tts',
          inputTokens: data.usage.inputTokens,
          outputTokens: data.usage.outputTokens,
          thinkingTokens: data.usage.thinkingTokens ?? 0,
          cachedTokens: data.usage.cachedTokens ?? 0,
          totalTokens: data.usage.totalTokens,
          ttsAudioGenerated: !data.cacheHit,
          requestDurationMs: data.usage.durationMs ?? 0,
          cacheHit: Boolean(data.cacheHit),
          estimatedCostUsd: data.usage.estimatedCostUsd,
        });
      }
      const blob = base64ToBlob(data.audioBase64, data.mimeType || 'audio/wav');
      const file = new File([blob], `${activeCard.id}-${slot}.wav`, { type: data.mimeType || 'audio/wav' });
      await onAttachAudio(activeCard.id, slot, file);
    } catch {
      setSlotError('AI аудио үүсгэхэд сүлжээний алдаа гарлаа.');
    } finally {
      setGeneratingSlot(null);
    }
  };

  const topicName =
    selectedTopic === 'all'
      ? 'Бүх сэдэв'
      : TOPICS.find((t) => t.id === selectedTopic)?.nameMn ?? 'Сэдэв';

  const deckProgress = filtered.length === 0 ? 0 : (safeIndex + 1) / filtered.length;
  const { dueCount, buriedCount } = useMemo(() => countDueAndBuried(cards), [cards]);
  const todayUtcKey = formatUtcDayKey();

  const handleGradeSrs = (grade: SrsGrade) => {
    if (!activeCard) return;
    const eventId = `rev_${activeCard.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    onReviewSrsCard(activeCard.id, grade, eventId);
    handleStep(1);
  };

  return (
    <div className="space-y-3.5 sm:space-y-5">
      {/* Honest Non-FSRS Smart SRS Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#636366] dark:text-[#AEAEB2]">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-[#1C1C1E] dark:text-white">{SRS_ENGINE_LABEL}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums font-medium text-[#007AFF] dark:text-[#64D2FF]">
            Өнөөдөр давтах: {dueCount}
          </span>
          {buriedCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">Хойшилсон: {buriedCount}</span>
            </>
          )}
        </div>
        <span className="text-[11px] text-[#8E8E93]">
          Миний хэлбэр: {learnerGender === 'feminine' ? 'Эмэгтэй' : 'Эрэгтэй'}
        </span>
      </div>

      {/* Compact Single-Row Filter Bar on Mobile, Expanded Chips on Desktop */}
          <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="md:hidden flex-1 min-w-0">
          <label htmlFor="mobile-topic-select" className="sr-only">
            Сэдэв сонгох
          </label>
          <select
            id="mobile-topic-select"
            value={selectedTopic}
            onChange={(e) => onSelectTopic(e.target.value as TopicId | 'all')}
            className="w-full min-h-[40px] rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] px-3 text-xs font-semibold text-[#1C1C1E] dark:text-white truncate"
          >
            <option value="all">Бүх сэдэв</option>
            {TOPICS.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.nameMn}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => onSelectTopic('all')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedTopic === 'all'
                ? 'bg-[#007AFF] dark:bg-[#0A84FF] text-white'
                : 'bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-[#F2F2F7] border border-black/[0.06] dark:border-white/[0.08]'
            }`}
          >
            Бүх сэдэв
          </button>
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => onSelectTopic(topic.id)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedTopic === topic.id
                  ? 'bg-[#007AFF] dark:bg-[#0A84FF] text-white'
                  : 'bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-[#F2F2F7] border border-black/[0.06] dark:border-white/[0.08]'
              }`}
            >
              {topic.nameMn}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-0.5 p-1 bg-[#E5E5EA] dark:bg-[#1C1C1E] rounded-xl shrink-0">
          {(
            [
              { id: 'all', label: 'Бүгд' },
              { id: 'learning', label: 'Шинэ' },
              { id: 'mastered', label: 'Мэддэг' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMasteryFilter(item.id)}
              className={`min-h-[30px] px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                masteryFilter === item.id
                  ? 'bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-white shadow-xs'
                  : 'text-[#636366] dark:text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {!activeCard ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-6 sm:p-8 text-center"
        >
          <p className="text-base font-semibold text-[#1C1C1E] dark:text-white">
            Энэ шүүлтүүрт тохирох карт олдсонгүй
          </p>
          <p className="mt-1 text-sm text-[#636366] dark:text-[#AEAEB2]">
            Сэдэв эсвэл төлөвийн шүүлтүүрээ «Бүгд» болгож өөрчлөөд дахин оролдоно уу.
          </p>
          <button
            type="button"
            onClick={() => {
              onSelectTopic('all');
              setMasteryFilter('all');
            }}
            className="mt-4 min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-sm font-semibold cursor-pointer"
          >
            Бүх картыг харуулах
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* Primary Speaking Card with Directional Swipe & Motion */}
          <section
            aria-label="Ярианы дасгалын карт"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="lg:col-span-7 overflow-hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeCard.id}
                initial={{ opacity: 0, x: slideDirection * 24 }}
                animate={{
                  opacity: 1,
                  x: dragOffsetX,
                  rotate: dragOffsetX * 0.03,
                }}
                exit={{ opacity: 0, x: slideDirection * -24 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 sm:p-7 space-y-4 sm:space-y-5"
              >
                {/* Quiet Metadata + Slim Progress Line */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-[#8E8E93]">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      <span className="font-medium text-[#1C1C1E] dark:text-[#F2F2F7] truncate">
                        {TOPICS.find((t) => t.id === activeCard.topicId)?.nameMn ?? topicName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums font-mono shrink-0">
                        {safeIndex + 1}/{filtered.length}
                      </span>
                      {activeCard.srs?.intervalDays ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums shrink-0 text-[#007AFF] dark:text-[#64D2FF]">
                            {activeCard.srs.intervalDays} хоног
                          </span>
                        </>
                      ) : (
                        <>
                          <span aria-hidden="true" className="hidden sm:inline">·</span>
                          <span className="hidden sm:inline tabular-nums shrink-0">
                            Давтсан: {activeCard.practiceCount}
                          </span>
                        </>
                      )}
                      {activeCard.srs?.buriedUntilDay === todayUtcKey && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#9A5B00] dark:text-[#FFD60A]">Өнөөдөр хойшилсон</span>
                        </>
                      )}
                      {activeCard.nounGender && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`inline-flex items-center gap-1 font-medium shrink-0 ${
                              CZECH_GENDER_COLORS[activeCard.nounGender].textClass
                            }`}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: CZECH_GENDER_COLORS[activeCard.nounGender].hex }}
                              aria-hidden="true"
                            />
                            <span>{CZECH_GENDER_COLORS[activeCard.nounGender].shortLabel}</span>
                          </span>
                        </>
                      )}
                      {activeCard.qaStatus && (
                        <span className="hidden sm:inline-flex items-center gap-1.5 text-[#8E8E93] whitespace-nowrap">
                          <span aria-hidden="true">·</span>
                          <span>{getQaStatusLabelMn(activeCard.qaStatus)}</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setHideTranslation((v) => !v)}
                      aria-label={hideTranslation ? 'Орчуулга харуулах' : 'Орчуулга нуух'}
                      className="inline-flex items-center gap-1 min-h-[34px] px-2 py-1 rounded-lg text-xs font-medium text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white shrink-0 cursor-pointer"
                    >
                      {hideTranslation ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{hideTranslation ? 'Харуулах' : 'Нуух'}</span>
                    </button>
                  </div>

                  <div className="h-1 w-full rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] overflow-hidden">
                    <motion.div
                      className="h-full bg-[#007AFF] dark:bg-[#0A84FF] origin-left"
                      initial={false}
                      animate={{ scaleX: deckProgress }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>

                {/* Word Focus */}
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1C1C1E] dark:text-white">
                      {resolveCardDisplayCzech(activeCard, learnerGender)}
                    </h1>
                    {activeCard.selfFormVariants && (
                      <div className="flex items-center p-0.5 rounded-lg bg-[#F2F2F7] dark:bg-[#2C2C2E] shrink-0">
                        {(
                          [
                            { id: 'masculine', label: 'Эр' },
                            { id: 'feminine', label: 'Эм' },
                          ] as const
                        ).map((g) => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => onChangeLearnerGender(g.id)}
                            className={`min-h-[28px] px-2 rounded-md text-[11px] font-semibold cursor-pointer ${
                              learnerGender === g.id
                                ? 'bg-white dark:bg-[#3A3A3C] text-[#007AFF] dark:text-[#64D2FF] shadow-2xs'
                                : 'text-[#8E8E93]'
                            }`}
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-mono text-[#007AFF] dark:text-[#64D2FF]">
                    [{activeCard.phoneticHint}]
                  </p>
                  <p
                    className={`text-base sm:text-lg font-medium transition-opacity duration-150 ${
                      hideTranslation ? 'opacity-0 select-none' : 'text-[#3C3C43] dark:text-[#EBEBF5]/85 opacity-100'
                    }`}
                  >
                    {activeCard.mongolianWord}
                  </p>

                  <div className="pt-2.5 grid grid-cols-2 gap-2.5">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => void handlePlaySlot('wordNormal')}
                      className={`min-h-[46px] px-3.5 py-2.5 rounded-2xl flex items-center justify-between gap-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                        activeSlot === 'wordNormal'
                          ? 'bg-[#007AFF] dark:bg-[#0A84FF] text-white'
                          : 'bg-[#007AFF]/10 dark:bg-[#0A84FF]/18 text-[#007AFF] dark:text-[#64D2FF]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        {activeSlot === 'wordNormal' ? (
                          <AudioWaveBars active />
                        ) : (
                          <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                        )}
                        <span className="truncate">Үг · Энгийн</span>
                      </span>
                      <span className="text-[11px] font-mono opacity-80 shrink-0">
                        {activeCard.audioIds.wordNormal ? 'АУДИО' : '1.0x'}
                      </span>
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => void handlePlaySlot('wordSlow')}
                      className={`min-h-[46px] px-3.5 py-2.5 rounded-2xl flex items-center justify-between gap-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                        activeSlot === 'wordSlow'
                          ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E]'
                          : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        {activeSlot === 'wordSlow' ? (
                          <AudioWaveBars active inverted />
                        ) : (
                          <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                        )}
                        <span className="truncate">Үг · Удаан</span>
                      </span>
                      <span className="text-[11px] font-mono opacity-80 shrink-0">
                        {activeCard.audioIds.wordSlow ? 'АУДИО' : '0.65x'}
                      </span>
                    </motion.button>
                  </div>
                </div>

                {/* Hairline Divider & Example Sentence */}
                <div className="border-t border-black/[0.06] dark:border-white/[0.08] pt-4 space-y-1.5">
                  <p className="text-[11px] sm:text-xs font-semibold text-[#8E8E93]">
                    Жишээ өгүүлбэр
                  </p>
                  <p className="text-base sm:text-xl font-semibold text-[#1C1C1E] dark:text-white leading-snug">
                    {activeCard.selfFormVariants
                      ? resolveCardDisplayCzech(activeCard, learnerGender)
                      : activeCard.czechSentence}
                  </p>
                  <p
                    className={`text-xs sm:text-base transition-opacity duration-150 ${
                      hideTranslation ? 'opacity-0 select-none' : 'text-[#636366] dark:text-[#AEAEB2] opacity-100'
                    }`}
                  >
                    {activeCard.mongolianSentence}
                  </p>

                  <div className="pt-2 grid grid-cols-2 gap-2.5">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => void handlePlaySlot('sentenceNormal')}
                      className={`min-h-[46px] px-3.5 py-2.5 rounded-2xl flex items-center justify-between gap-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                        activeSlot === 'sentenceNormal'
                          ? 'bg-[#007AFF] dark:bg-[#0A84FF] text-white'
                          : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        {activeSlot === 'sentenceNormal' ? (
                          <AudioWaveBars active />
                        ) : (
                          <Play className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        )}
                        <span className="truncate">Өгүүлбэр</span>
                      </span>
                      <span className="text-[11px] font-mono opacity-75 shrink-0">
                        {activeCard.audioIds.sentenceNormal ? 'АУДИО' : '1.0x'}
                      </span>
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => void handlePlaySlot('sentenceSlow')}
                      className={`min-h-[46px] px-3.5 py-2.5 rounded-2xl flex items-center justify-between gap-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                        activeSlot === 'sentenceSlow'
                          ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E]'
                          : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        {activeSlot === 'sentenceSlow' ? (
                          <AudioWaveBars active inverted />
                        ) : (
                          <Play className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        )}
                        <span className="truncate">Удаан</span>
                      </span>
                      <span className="text-[11px] font-mono opacity-75 shrink-0">
                        {activeCard.audioIds.sentenceSlow ? 'АУДИО' : '0.65x'}
                      </span>
                    </motion.button>
                  </div>
                </div>

                {/* Compact Shadowing, Self-Recording & AI Pronunciation Evaluation */}
                <div className="border-t border-black/[0.06] dark:border-white/[0.08] pt-3.5 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      onClick={() => setLoopMode((v) => !v)}
                      aria-pressed={loopMode}
                      className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                        loopMode
                          ? 'bg-[#007AFF] dark:bg-[#0A84FF] text-white'
                          : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-[#F2F2F7]'
                      }`}
                    >
                      <Repeat className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{loopMode ? 'Давтах: Асаалттай' : 'Давтах'}</span>
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      onClick={() => void handleToggleRecording()}
                      className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isRecording
                          ? 'bg-[#FF3B30] text-white'
                          : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-[#F2F2F7]'
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <Square className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Зогсоох</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Дуу бичих</span>
                        </>
                      )}
                    </motion.button>

                    {recordedUrl && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={handlePlaySelfRecording}
                        className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 bg-[#34C759]/12 text-[#248A3D] dark:text-[#30D158] cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Өөрийн дуу</span>
                      </motion.button>
                    )}

                    {recordedBlob && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        disabled={isEvaluating}
                        onClick={() => void handleEvaluatePronunciation()}
                        className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 bg-[#007AFF]/10 dark:bg-[#0A84FF]/20 text-[#007AFF] dark:text-[#64D2FF] disabled:opacity-60 cursor-pointer"
                      >
                        {isEvaluating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <AudioLines className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        <span>{isEvaluating ? 'Шалгаж байна...' : 'AI дуудлага шалгах'}</span>
                      </motion.button>
                    )}
                  </div>

                  {recordError && <p className="text-xs text-[#FF3B30]">{recordError}</p>}
                  {evalError && <p className="text-xs text-[#FF3B30]">{evalError}</p>}

                  <AnimatePresence>
                    {evalResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18 }}
                        className="rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-[#1C1C1E] dark:text-white">
                            {evalResult.pronunciationScore !== null
                              ? 'AI дуудлагын үнэлгээ'
                              : 'Бичвэрийн дүрмийн шалгалт'}
                          </span>
                          {evalResult.pronunciationScore !== null ? (
                            <span className="font-mono font-extrabold text-[#007AFF] dark:text-[#64D2FF] tabular-nums">
                              {evalResult.pronunciationScore}/100
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-[#8E8E93]">
                              Бичвэрээс дуудлага оноо тооцохгүй
                            </span>
                          )}
                        </div>

                        {evalResult.pronunciationScore !== null && (
                          <div className="h-1.5 w-full rounded-full bg-black/[0.08] dark:bg-white/[0.12] overflow-hidden">
                            <motion.div
                              className="h-full bg-[#007AFF] dark:bg-[#0A84FF] origin-left"
                              initial={{ scaleX: 0 }}
                              animate={{
                                scaleX: Math.max(0, Math.min(1, evalResult.pronunciationScore / 100)),
                              }}
                              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            />
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1.5 text-[10.5px] font-semibold">
                          <span
                            className={`px-2 py-0.5 rounded-md ${
                              evalResult.pronunciationIssue
                                ? 'bg-[#FF9500]/15 text-[#9A5B00] dark:text-[#FFD60A]'
                                : 'bg-[#34C759]/15 text-[#248A3D] dark:text-[#30D158]'
                            }`}
                          >
                            Дуудлага: {evalResult.pronunciationIssue ? 'Засах' : 'Хэвийн'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md ${
                              evalResult.grammarIssue
                                ? 'bg-[#FF3B30]/15 text-[#D70015] dark:text-[#FF453A]'
                                : 'bg-[#34C759]/15 text-[#248A3D] dark:text-[#30D158]'
                            }`}
                          >
                            Дүрэм: {evalResult.grammarIssue ? 'Асуудалтай' : 'Зөв'}
                          </span>
                          {evalResult.recognitionUncertainty && (
                            <span className="px-2 py-0.5 rounded-md bg-[#007AFF]/12 text-[#007AFF] dark:text-[#64D2FF]">
                              Яриа танилтын эргэлзээ (STT)
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor="practice-heard-edit"
                            className="block text-[11px] font-medium text-[#636366] dark:text-[#AEAEB2]"
                          >
                            Танигдсан текст (буруу танигдсан бол засаад дүрэм шалгаж болно):
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              id="practice-heard-edit"
                              type="text"
                              value={editedHeardText}
                              onChange={(e) => setEditedHeardText(e.target.value)}
                              className="flex-1 min-w-0 min-h-[34px] rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.1] px-2.5 text-xs text-[#1C1C1E] dark:text-white focus:outline-none"
                            />
                            <button
                              type="button"
                              disabled={isRecheckingText || !editedHeardText.trim()}
                              onClick={() => void handleRecheckEditedGrammar()}
                              className="min-h-[34px] px-2.5 rounded-xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-[11px] font-semibold shrink-0 disabled:opacity-50 cursor-pointer"
                            >
                              {isRecheckingText ? 'Шалгаж...' : 'Дүрэм шалгах'}
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-[#3C3C43] dark:text-[#EBEBF5] leading-relaxed">
                          {evalResult.feedbackMn}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Smart SRS 4-Grade Rating Bar (Idempotent + Sibling Burying) */}
                <div className="border-t border-black/[0.06] dark:border-white/[0.08] pt-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[#8E8E93]">
                    <span>Давтлагын үнэлгээ {activeCard.lemmaGroup ? `· бүлэг: ${activeCard.lemmaGroup}` : ''}</span>
                    <span className="tabular-nums font-mono">
                      {activeCard.srs?.lastGrade ? `Сүүлд: ${activeCard.srs.lastGrade}` : 'Шинэ карт'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(
                      [
                        { id: 'again', label: 'Дахиад', hint: '10м', cls: 'bg-[#FF3B30]/10 text-[#D70015] dark:text-[#FF453A]' },
                        { id: 'hard', label: 'Хэцүү', hint: '1х', cls: 'bg-[#FF9500]/12 text-[#9A5B00] dark:text-[#FFD60A]' },
                        { id: 'good', label: 'Сайн', hint: '1–3х', cls: 'bg-[#007AFF]/12 text-[#007AFF] dark:text-[#64D2FF]' },
                        { id: 'easy', label: 'Амархан', hint: '3–7х', cls: 'bg-[#34C759]/12 text-[#248A3D] dark:text-[#30D158]' },
                      ] as const
                    ).map((g) => (
                      <motion.button
                        key={g.id}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() => handleGradeSrs(g.id)}
                        className={`min-h-[44px] px-2 py-1.5 rounded-2xl flex flex-col items-center justify-center leading-tight cursor-pointer transition-opacity hover:opacity-90 ${g.cls}`}
                      >
                        <span className="text-xs font-bold">{g.label}</span>
                        <span className="text-[10px] font-mono opacity-80">{g.hint}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Primary Card Navigation & Mastery */}
                <div className="border-t border-black/[0.06] dark:border-white/[0.08] pt-3.5 flex items-center justify-between gap-2.5">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => handleStep(-1)}
                    aria-label="Өмнөх карт"
                    className="min-h-[46px] min-w-[46px] px-3.5 py-2.5 rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-xs sm:text-sm font-semibold text-[#1C1C1E] dark:text-white inline-flex items-center justify-center gap-1 cursor-pointer shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Өмнөх</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => onToggleMastered(activeCard.id)}
                    className={`flex-1 min-h-[46px] px-3 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      activeCard.mastered
                        ? 'bg-[#34C759] dark:bg-[#30D158] text-white'
                        : 'bg-[#007AFF] dark:bg-[#0A84FF] text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{activeCard.mastered ? 'Мэддэг болсон' : 'Мэддэг болгох'}</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => handleStep(1)}
                    aria-label="Дараах карт"
                    className="min-h-[46px] min-w-[46px] px-3.5 py-2.5 rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-xs sm:text-sm font-semibold text-[#1C1C1E] dark:text-white inline-flex items-center justify-center gap-1 cursor-pointer shrink-0"
                  >
                    <span className="hidden sm:inline">Дараах</span>
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          </section>

          {/* Right Column: Quick Audio Upload + Gemini AI TTS Cache + Queue */}
          <aside className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-5 space-y-3">
              <div>
                <h2 className="text-sm font-bold text-[#1C1C1E] dark:text-white">
                  Энэ картын аудио файлууд
                </h2>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  Өөрийн MP3/M4A файлаа оруулах эсвэл натурал AI дуудлага үүсгэн офлайн хадгална уу.
                </p>
              </div>

              <div className="space-y-1.5">
                {(['wordNormal', 'wordSlow', 'sentenceNormal', 'sentenceSlow'] as AudioSlotType[]).map(
                  (slot) => {
                    const hasCustom = Boolean(activeCard.audioIds[slot]);
                    const isGen = generatingSlot === slot;
                    return (
                      <div
                        key={slot}
                        className="flex items-center justify-between gap-2 py-2 border-b border-black/[0.05] dark:border-white/[0.06] last:border-b-0"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">
                            {SLOT_LABELS[slot]}
                          </p>
                          <p className="text-[11px] text-[#8E8E93]">
                            {hasCustom ? 'Офлайн аудио хадгалагдсан' : 'Натурал AI дуу ашиглана'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            disabled={Boolean(generatingSlot)}
                            onClick={() => void handleGenerateSlotAudio(slot)}
                            aria-label={`${SLOT_LABELS[slot]} AI дуу үүсгэх`}
                            className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-[#007AFF]/10 dark:bg-[#0A84FF]/20 text-[11px] font-semibold text-[#007AFF] dark:text-[#64D2FF] inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {isGen ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                            ) : (
                              <Wand2 className="w-3.5 h-3.5" aria-hidden="true" />
                            )}
                            <span>{isGen ? 'Үүсгэж...' : 'AI дуу'}</span>
                          </motion.button>

                          <label className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[11px] font-semibold text-[#1C1C1E] dark:text-white inline-flex items-center gap-1 cursor-pointer shrink-0">
                            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{uploadingSlot === slot ? 'Уншиж...' : hasCustom ? 'Солих' : 'Файл'}</span>
                            <input
                              type="file"
                              accept="audio/*"
                              aria-label={`${SLOT_LABELS[slot]} аудио файл сонгох`}
                              className="sr-only"
                              onChange={(e) => void handleQuickFileChange(slot, e)}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {slotError && <p className="text-xs font-medium text-[#FF3B30]">{slotError}</p>}
            </div>

            <div className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#1C1C1E] dark:text-white">Картын дараалал</h2>
                <span className="text-xs font-mono tabular-nums text-[#8E8E93]">
                  {filtered.length} үг
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                {filtered.map((card, idx) => {
                  const gSpec = card.nounGender ? CZECH_GENDER_COLORS[card.nounGender] : null;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => {
                        stopAllPlayback();
                        setSlideDirection(idx >= safeIndex ? 1 : -1);
                        setActiveSlot(null);
                        clearRecordingState();
                        setCurrentIndex(idx);
                      }}
                      className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        idx === safeIndex
                          ? 'bg-[#007AFF]/10 dark:bg-[#0A84FF]/20 text-[#007AFF] dark:text-[#64D2FF]'
                          : 'hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] text-[#1C1C1E] dark:text-[#F2F2F7]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {gSpec && (
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: gSpec.hex }}
                              title={gSpec.labelMn}
                              aria-hidden="true"
                            />
                          )}
                          <p className="text-sm font-semibold truncate">
                            {resolveCardDisplayCzech(card, learnerGender)}
                          </p>
                          {gSpec && (
                            <span className={`text-[10px] font-medium shrink-0 ${gSpec.textClass}`}>
                              · {gSpec.shortLabel}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#8E8E93] truncate">
                          {card.mongolianWord}
                        </p>
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-[#8E8E93] shrink-0">
                        {card.srs?.buriedUntilDay === todayUtcKey
                          ? 'Хойшилсон'
                          : card.mastered
                            ? 'Мэддэг'
                            : card.srs?.intervalDays
                              ? `${card.srs.intervalDays}х`
                              : `${idx + 1}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
