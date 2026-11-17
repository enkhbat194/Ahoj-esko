import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  Download,
  FileAudio,
  FolderUp,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  Volume2,
  Wand2,
} from 'lucide-react';
import type { AudioSlotType, Dialogue, StoredAudioMeta, TopicId, VocabCard } from '../types/lesson';
import { TOPICS } from '../data/starterCurriculum';
import { matchFilenameToCurriculum } from '../utils/audioMatcher';
import { playCzechAudio } from '../utils/audioPlayer';
import { filterCards, formatBytes } from '../utils/studyLogic';
import type { TokenUsageMetrics } from '../utils/tokenPricing';
import type { ParsedDriveCard } from '../utils/driveCurriculumParser';
import { appendClientUsageLog } from '../utils/usageMonitor';
import { GoogleDriveProjectPanel } from './GoogleDriveProjectPanel';

interface AudioLibraryViewProps {
  cards: VocabCard[];
  dialogues: Dialogue[];
  audioMetaList: StoredAudioMeta[];
  initialSection?: 'drive' | 'add' | 'batch' | 'list';
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
}

interface PendingBatchItem {
  id: string;
  file: File;
  targetType: 'card' | 'dialogue';
  targetId: string;
  slot: AudioSlotType;
}

const SLOT_SHORT_LABELS: Record<AudioSlotType, string> = {
  wordNormal: 'Үг (Энгийн)',
  wordSlow: 'Үг (Удаан)',
  sentenceNormal: 'Өгүүлбэр (Энгийн)',
  sentenceSlow: 'Өгүүлбэр (Удаан)',
};

export const AudioLibraryView: React.FC<AudioLibraryViewProps> = ({
  cards,
  dialogues,
  audioMetaList,
  initialSection = 'drive',
  onAddCard,
  onAttachAudio,
  onRemoveCardAudio,
  onDeleteCard,
  onBatchAttach,
  onImportBackup,
  onResetCurriculum,
  onImportDriveCurriculum,
  onImportDriveAudioFiles,
}) => {
  // Add Card Form State
  const [topicId, setTopicId] = useState<TopicId>('custom');
  const [czechWord, setCzechWord] = useState('');
  const [phoneticHint, setPhoneticHint] = useState('');
  const [mongolianWord, setMongolianWord] = useState('');
  const [czechSentence, setCzechSentence] = useState('');
  const [mongolianSentence, setMongolianSentence] = useState('');
  const [newFiles, setNewFiles] = useState<Partial<Record<AudioSlotType, File>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSavingCard, setIsSavingCard] = useState(false);

  // AI Card Generator State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Batch Matcher State
  const [pendingBatch, setPendingBatch] = useState<PendingBatchItem[]>([]);
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [batchMessage, setBatchMessage] = useState<string | null>(null);

  // Matrix search
  const [query, setQuery] = useState('');
  const [mobileSection, setMobileSection] = useState<'drive' | 'add' | 'batch' | 'list'>(
    initialSection
  );

  const filteredCards = useMemo(() => filterCards(cards, { query }), [cards, query]);

  const audioNameMap = useMemo(() => {
    const map = new Map<string, StoredAudioMeta>();
    for (const meta of audioMetaList) {
      map.set(meta.id, meta);
    }
    return map;
  }, [audioMetaList]);

  const handleGenerateCardWithAI = async () => {
    const promptText = aiPrompt.trim();
    if (!promptText || isGeneratingCard) return;

    setAiError(null);
    setFormError(null);
    setFormSuccess(null);
    setIsGeneratingCard(true);
    try {
      const res = await fetch('/api/ai/generate-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptText }),
      });
      const data = (await res.json()) as {
        czechWord?: string;
        phoneticHint?: string;
        mongolianWord?: string;
        czechSentence?: string;
        mongolianSentence?: string;
        usage?: TokenUsageMetrics;
        error?: string;
      };
      if (!res.ok || data.error) {
        setAiError(data.error || 'AI карт бэлдэж чадсангүй.');
        return;
      }
      if (data.usage) {
        appendClientUsageLog({
          id: `cli_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          endpoint: '/api/ai/generate-card',
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
      if (data.czechWord) setCzechWord(data.czechWord);
      if (data.phoneticHint) setPhoneticHint(data.phoneticHint);
      if (data.mongolianWord) setMongolianWord(data.mongolianWord);
      if (data.czechSentence) setCzechSentence(data.czechSentence);
      if (data.mongolianSentence) setMongolianSentence(data.mongolianSentence);
      setFormSuccess('AI талбаруудыг бөглөлөө. Шалгаад «Шинэ карт хадгалах» дарна уу.');
    } catch {
      setAiError('Сүлжээний алдаа гарлаа. Интернэт холболтоо шалгана уу.');
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!czechWord.trim() || !mongolianWord.trim()) {
      setFormError('Чех үг болон Монгол утгыг заавал оруулна уу.');
      return;
    }

    setIsSavingCard(true);
    try {
      await onAddCard(
        {
          topicId,
          czechWord: czechWord.trim(),
          phoneticHint: phoneticHint.trim() || czechWord.trim(),
          mongolianWord: mongolianWord.trim(),
          czechSentence: czechSentence.trim() || czechWord.trim(),
          mongolianSentence: mongolianSentence.trim() || mongolianWord.trim(),
        },
        newFiles
      );
      setCzechWord('');
      setPhoneticHint('');
      setMongolianWord('');
      setCzechSentence('');
      setMongolianSentence('');
      setAiPrompt('');
      setNewFiles({});
      setFormSuccess('Шинэ карт болон аудио амжилттай хадгалагдлаа.');
    } finally {
      setIsSavingCard(false);
    }
  };

  const handleBatchFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files ?? []);
    if (fileList.length === 0) return;
    setBatchMessage(null);

    const items: PendingBatchItem[] = fileList.map((file, idx) => {
      const match = matchFilenameToCurriculum(file.name, cards, dialogues);
      if (match.kind === 'dialogue') {
        return {
          id: `batch-${Date.now()}-${idx}`,
          file,
          targetType: 'dialogue',
          targetId: match.dialogueId,
          slot: 'wordNormal',
        };
      }
      if (match.kind === 'card') {
        return {
          id: `batch-${Date.now()}-${idx}`,
          file,
          targetType: 'card',
          targetId: match.cardId,
          slot: match.slot,
        };
      }
      return {
        id: `batch-${Date.now()}-${idx}`,
        file,
        targetType: 'card',
        targetId: cards[0]?.id ?? '',
        slot: 'wordNormal',
      };
    });

    setPendingBatch(items);
    e.target.value = '';
  };

  const handleSaveBatch = async () => {
    if (pendingBatch.length === 0) return;
    setIsBatchSaving(true);
    try {
      await onBatchAttach(
        pendingBatch.map((item) => ({
          file: item.file,
          targetType: item.targetType,
          targetId: item.targetId,
          slot: item.targetType === 'card' ? item.slot : undefined,
        }))
      );
      setBatchMessage(`${pendingBatch.length} аудио файл амжилттай хадгалагдаж холбогдлоо.`);
      setPendingBatch([]);
    } finally {
      setIsBatchSaving(false);
    }
  };

  const handleExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      cards,
      dialogues,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ahoj-cesko-lessons-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Mobile Section Switcher (iOS Segmented Control) */}
      <div className="lg:hidden grid grid-cols-4 gap-1 p-1 bg-[#E5E5EA]/90 dark:bg-[#1C1C1E] rounded-xl">
        {(
          [
            { id: 'drive', label: 'Drive' },
            { id: 'add', label: 'Шинэ карт' },
            { id: 'batch', label: 'Олон файл' },
            { id: 'list', label: 'Бүх карт' },
          ] as const
        ).map((tab) => {
          const active = mobileSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileSection(tab.id)}
              className={`relative min-h-[36px] px-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                active
                  ? 'text-[#1C1C1E] dark:text-white'
                  : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="library-subtab-pill"
                  transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                  className="absolute inset-0 rounded-lg bg-white dark:bg-[#2C2C2E] shadow-xs"
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Read-Only Google Drive Project Folder Explorer */}
      <div className={mobileSection === 'drive' ? 'block' : 'hidden lg:block'}>
        <GoogleDriveProjectPanel
          onImportDriveCurriculum={onImportDriveCurriculum}
          onImportDriveAudioFiles={onImportDriveAudioFiles}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Form: Add New Word & Sentence with AI Helper + 4 Audio Slots */}
        <form
          onSubmit={(e) => void handleCreateCard(e)}
          className={`${
            mobileSection === 'add' ? 'block' : 'hidden lg:block'
          } lg:col-span-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-6 space-y-4`}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#1C1C1E] dark:text-white tracking-tight">
                Шинэ үг ба өгүүлбэр нэмэх
              </h2>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                Үгийн энгийн/удаан болон жишээ өгүүлбэрийн энгийн/удаан аудиог хамт оруулж болно.
              </p>
            </div>
          </div>

          {/* Smart AI Flashcard Filler */}
          <div className="rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E]/80 border border-black/[0.05] dark:border-white/[0.08] p-3.5 space-y-2">
            <label htmlFor="ai-card-prompt" className="block text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">
              AI-аар карт бэлдэх (Монгол эсвэл Чехээр бичнэ үү)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="ai-card-prompt"
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Жишээ: Эмийн санд ханиадны эм авах"
                className="flex-1 min-w-0 min-h-[42px] rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] px-3 text-xs sm:text-sm text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
              />
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                disabled={isGeneratingCard || !aiPrompt.trim()}
                onClick={() => void handleGenerateCardWithAI()}
                className="min-h-[42px] px-3.5 rounded-xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-90 disabled:opacity-40 shrink-0 cursor-pointer"
              >
                {isGeneratingCard ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{isGeneratingCard ? 'Бэлдэж...' : 'Бөглөх'}</span>
              </motion.button>
            </div>
            {aiError && <p className="text-xs font-medium text-[#FF3B30]">{aiError}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="card-czech-word" className="block text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] mb-1">
                Чех үг эсвэл хэллэг *
              </label>
              <input
                id="card-czech-word"
                type="text"
                value={czechWord}
                onChange={(e) => setCzechWord(e.target.value)}
                placeholder="Жишээ: Na shledanou"
                className="w-full min-h-[44px] rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#F2F2F7]/70 dark:bg-[#2C2C2E] px-3 text-sm text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
              />
            </div>

            <div>
              <label htmlFor="card-mongolian-word" className="block text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] mb-1">
                Монгол утга *
              </label>
              <input
                id="card-mongolian-word"
                type="text"
                value={mongolianWord}
                onChange={(e) => setMongolianWord(e.target.value)}
                placeholder="Жишээ: Баяртай (албан ёсны)"
                className="w-full min-h-[44px] rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#F2F2F7]/70 dark:bg-[#2C2C2E] px-3 text-sm text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="card-phonetic" className="block text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] mb-1">
                Монголоор дуудах галиг
              </label>
              <input
                id="card-phonetic"
                type="text"
                value={phoneticHint}
                onChange={(e) => setPhoneticHint(e.target.value)}
                placeholder="Жишээ: На схлэданоу"
                className="w-full min-h-[44px] rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#F2F2F7]/70 dark:bg-[#2C2C2E] px-3 text-sm text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
              />
            </div>

            <div>
              <label htmlFor="card-topic" className="block text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] mb-1">
                Сэдэв
              </label>
              <select
                id="card-topic"
                value={topicId}
                onChange={(e) => setTopicId(e.target.value as TopicId)}
                className="w-full min-h-[44px] rounded-xl border border-black/[0.08] dark:border-white/[0.1] px-3 text-sm bg-[#F2F2F7]/70 dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
              >
                {TOPICS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameMn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="card-czech-sentence" className="block text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] mb-1">
              Жишээ өгүүлбэр (Чех)
            </label>
            <input
              id="card-czech-sentence"
              type="text"
              value={czechSentence}
              onChange={(e) => setCzechSentence(e.target.value)}
              placeholder="Жишээ: Děkuji za nákup, na shledanou!"
              className="w-full min-h-[44px] rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#F2F2F7]/70 dark:bg-[#2C2C2E] px-3 text-sm text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
            />
          </div>

          <div>
            <label htmlFor="card-mn-sentence" className="block text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] mb-1">
              Жишээ өгүүлбэрийн орчуулга (Монгол)
            </label>
            <input
              id="card-mn-sentence"
              type="text"
              value={mongolianSentence}
              onChange={(e) => setMongolianSentence(e.target.value)}
              placeholder="Жишээ: Худалдан авалт хийсэнд баярлалаа, баяртай!"
              className="w-full min-h-[44px] rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#F2F2F7]/70 dark:bg-[#2C2C2E] px-3 text-sm text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
            />
          </div>

          {/* 4 Audio File Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {(['wordNormal', 'wordSlow', 'sentenceNormal', 'sentenceSlow'] as AudioSlotType[]).map(
              (slot) => {
                const picked = newFiles[slot];
                return (
                  <label
                    key={slot}
                    className="min-h-[48px] px-3 py-2 rounded-2xl border border-dashed border-black/[0.12] dark:border-white/[0.14] bg-[#F2F2F7]/70 dark:bg-[#2C2C2E]/70 hover:bg-[#E5E5EA]/70 dark:hover:bg-[#2C2C2E] flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">
                        {SLOT_SHORT_LABELS[slot]}
                      </p>
                      <p className="text-[11px] text-[#8E8E93] truncate">
                        {picked ? picked.name : 'Аудио сонгох'}
                      </p>
                    </div>
                    <Upload className="w-4 h-4 text-[#007AFF] dark:text-[#0A84FF] shrink-0" />
                    <input
                      type="file"
                      accept="audio/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setNewFiles((prev) => ({ ...prev, [slot]: file }));
                      }}
                    />
                  </label>
                );
              }
            )}
          </div>

          <AnimatePresence>
            {formError && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs font-semibold text-[#FF3B30]"
              >
                {formError}
              </motion.p>
            )}
            {formSuccess && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs font-semibold text-[#34C759] dark:text-[#30D158]"
              >
                {formSuccess}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSavingCard}
            className="w-full min-h-[48px] rounded-2xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-sm font-semibold hover:opacity-90 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            <span>{isSavingCard ? 'Хадгалж байна...' : 'Шинэ карт хадгалах'}</span>
          </motion.button>
        </form>

        {/* Batch Multi-File Auto-Matcher + Backup */}
        <div
          className={`${
            mobileSection === 'batch' ? 'block' : 'hidden lg:block'
          } lg:col-span-6 space-y-5`}
        >
          <div className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#1C1C1E] dark:text-white tracking-tight">
                Олон аудио файл нэг дор оруулах
              </h2>
              <p className="text-xs text-[#8E8E93] mt-1">
                Танд бэлэн байгаа аудио файлуудыг (жишээ нь <span className="font-mono">dobry_den_slow.mp3</span>,{' '}
                <span className="font-mono">dekuji_sentence.m4a</span>, <span className="font-mono">kavarna_dialogue.mp3</span>)
                бөөнөөр нь сонговол нэрээр нь автоматаар карт руу тааруулна.
              </p>
            </div>

            <label className="w-full min-h-[56px] rounded-2xl border-2 border-dashed border-[#007AFF]/30 dark:border-[#0A84FF]/35 bg-[#007AFF]/[0.06] dark:bg-[#0A84FF]/15 hover:bg-[#007AFF]/10 dark:hover:bg-[#0A84FF]/20 px-4 py-3 flex items-center justify-center gap-2.5 text-sm font-semibold text-[#007AFF] dark:text-[#64D2FF] cursor-pointer">
              <FolderUp className="w-5 h-5" />
              <span>Аудио файлууд сонгох (MP3, M4A, WAV)</span>
              <input
                type="file"
                multiple
                accept="audio/*"
                className="sr-only"
                onChange={handleBatchFilesSelected}
              />
            </label>

            <AnimatePresence>
              {pendingBatch.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-3 pt-2"
                >
                  <div className="max-h-72 overflow-y-auto divide-y divide-black/[0.05] dark:divide-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-2">
                    {pendingBatch.map((item) => (
                      <div key={item.id} className="py-2.5 px-2 space-y-2">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] truncate">
                            {item.file.name}
                          </span>
                          <span className="font-mono text-[#8E8E93] shrink-0">
                            {formatBytes(item.file.size)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <select
                            aria-label="Төрөл"
                            value={item.targetType}
                            onChange={(e) => {
                              const nextType = e.target.value as 'card' | 'dialogue';
                              setPendingBatch((prev) =>
                                prev.map((p) =>
                                  p.id === item.id
                                    ? {
                                        ...p,
                                        targetType: nextType,
                                        targetId:
                                          nextType === 'card' ? cards[0]?.id ?? '' : dialogues[0]?.id ?? '',
                                      }
                                    : p
                                )
                              );
                            }}
                            className="min-h-[38px] rounded-xl border border-black/[0.08] dark:border-white/[0.1] px-2 text-xs bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white"
                          >
                            <option value="card">Үг / Өгүүлбэр</option>
                            <option value="dialogue">Харилцан яриа</option>
                          </select>

                          <select
                            aria-label="Карт эсвэл яриа сонгох"
                            value={item.targetId}
                            onChange={(e) => {
                              const nextId = e.target.value;
                              setPendingBatch((prev) =>
                                prev.map((p) => (p.id === item.id ? { ...p, targetId: nextId } : p))
                              );
                            }}
                            className="min-h-[38px] rounded-xl border border-black/[0.08] dark:border-white/[0.1] px-2 text-xs bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white"
                          >
                            {item.targetType === 'card'
                              ? cards.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.czechWord}
                                  </option>
                                ))
                              : dialogues.map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.titleMn}
                                  </option>
                                ))}
                          </select>

                          {item.targetType === 'card' && (
                            <select
                              aria-label="Аудио төрөл"
                              value={item.slot}
                              onChange={(e) => {
                                const nextSlot = e.target.value as AudioSlotType;
                                setPendingBatch((prev) =>
                                  prev.map((p) => (p.id === item.id ? { ...p, slot: nextSlot } : p))
                                );
                              }}
                              className="min-h-[38px] rounded-xl border border-black/[0.08] dark:border-white/[0.1] px-2 text-xs bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white"
                            >
                              {(['wordNormal', 'wordSlow', 'sentenceNormal', 'sentenceSlow'] as AudioSlotType[]).map(
                                (s) => (
                                  <option key={s} value={s}>
                                    {SLOT_SHORT_LABELS[s]}
                                  </option>
                                )
                              )}
                            </select>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPendingBatch([])}
                      className="min-h-[44px] px-4 rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-xs font-semibold text-[#1C1C1E] dark:text-white cursor-pointer"
                    >
                      Цэвэрлэх
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      disabled={isBatchSaving}
                      onClick={() => void handleSaveBatch()}
                      className="flex-1 min-h-[44px] px-4 rounded-2xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isBatchSaving ? 'Хадгалж байна...' : 'Бүгдийг хадгалж холбох'}</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {batchMessage && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-semibold text-[#34C759] dark:text-[#30D158]"
                >
                  {batchMessage}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#1C1C1E] dark:text-white">Хичээлийн нөөцлөлт</h3>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                Хадгалсан аудио файл: <span className="font-mono tabular-nums">{audioMetaList.length}</span> ширхэг
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="min-h-[40px] px-3.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-xs font-semibold text-[#1C1C1E] dark:text-white hover:opacity-85 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON татах</span>
              </button>
              <label className="min-h-[40px] px-3.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-xs font-semibold text-[#1C1C1E] dark:text-white hover:opacity-85 inline-flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>JSON оруулах</span>
                <input
                  type="file"
                  accept="application/json,.json"
                  aria-label="JSON нөөцлөлт оруулах"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const text = await file.text();
                      const parsed = JSON.parse(text) as { cards?: VocabCard[]; dialogues?: Dialogue[] };
                      onImportBackup(parsed);
                      setBatchMessage('JSON хичээлийн сан амжилттай сэргээгдлээ.');
                    } catch {
                      setBatchMessage('JSON файл буруу форматтай байна.');
                    }
                    e.target.value = '';
                  }}
                />
              </label>
              <button
                type="button"
                onClick={onResetCurriculum}
                className="min-h-[40px] px-3.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-xs font-semibold text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white cursor-pointer"
              >
                Анхны төлөвт оруулах
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Audio Slot Matrix */}
      <section
        className={`${
          mobileSection === 'list' ? 'block' : 'hidden lg:block'
        } rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-6 space-y-4`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#1C1C1E] dark:text-white tracking-tight">
              Бүх картын аудио удирдлага
            </h2>
            <p className="text-xs text-[#8E8E93]">
              Карт бүрийн 4 аудио сувгийг шууд сонсох, солих, устгах боломжтой.
            </p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Карт хайх..."
              aria-label="Карт хайх"
              className="w-full sm:w-64 min-h-[42px] pl-9 pr-3 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#F2F2F7] dark:bg-[#2C2C2E] text-sm text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
            />
          </div>
        </div>

        <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
          {filteredCards.map((card) => (
            <div key={card.id} className="py-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#1C1C1E] dark:text-white">
                    {card.czechWord}{' '}
                    <span className="font-normal text-[#8E8E93]">— {card.mongolianWord}</span>
                  </p>
                  <p className="text-xs text-[#8E8E93] mt-0.5">{card.czechSentence}</p>
                </div>
                {card.id.startsWith('custom-') && (
                  <button
                    type="button"
                    onClick={() => onDeleteCard(card.id)}
                    aria-label={`Карт устгах: ${card.czechWord}`}
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-[#8E8E93] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {(['wordNormal', 'wordSlow', 'sentenceNormal', 'sentenceSlow'] as AudioSlotType[]).map(
                  (slot) => {
                    const audioId = card.audioIds[slot];
                    const meta = audioId ? audioNameMap.get(audioId) : undefined;
                    const isWord = slot === 'wordNormal' || slot === 'wordSlow';
                    const isSlow = slot === 'wordSlow' || slot === 'sentenceSlow';

                    return (
                      <div
                        key={slot}
                        className="rounded-2xl border border-black/[0.05] dark:border-white/[0.08] bg-[#F2F2F7]/75 dark:bg-[#2C2C2E]/70 p-2.5 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">
                            {SLOT_SHORT_LABELS[slot]}
                          </p>
                          <p className="text-[11px] text-[#8E8E93] truncate flex items-center gap-1">
                            {audioId ? (
                              <>
                                <FileAudio className="w-3 h-3 text-[#007AFF] dark:text-[#64D2FF] shrink-0" />
                                <span className="truncate">{meta?.fileName ?? 'Холбогдсон'}</span>
                              </>
                            ) : (
                              <span>Натурал AI дуу</span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              void playCzechAudio({
                                audioId,
                                text: isWord ? card.czechWord : card.czechSentence,
                                rate: isSlow ? 0.65 : 1.0,
                              })
                            }
                            aria-label={`${card.czechWord} ${SLOT_SHORT_LABELS[slot]} сонсох`}
                            className="min-h-[34px] min-w-[34px] rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-[#1C1C1E] dark:text-white hover:opacity-80 cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <label
                            aria-label={`${card.czechWord} ${SLOT_SHORT_LABELS[slot]} файл оруулах`}
                            className="min-h-[34px] min-w-[34px] rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-[#007AFF] dark:text-[#64D2FF] hover:opacity-80 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <input
                              type="file"
                              accept="audio/*"
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void onAttachAudio(card.id, slot, file);
                                e.target.value = '';
                              }}
                            />
                          </label>
                          {audioId && (
                            <button
                              type="button"
                              onClick={() => void onRemoveCardAudio(card.id, slot)}
                              aria-label={`${card.czechWord} ${SLOT_SHORT_LABELS[slot]} файл салгах`}
                              className="min-h-[34px] min-w-[34px] rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-[#8E8E93] hover:text-[#FF3B30] cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
