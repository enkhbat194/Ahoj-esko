import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Eye,
  EyeOff,
  Pause,
  Play,
  Plus,
  Upload,
  UserCheck,
  Volume2,
} from 'lucide-react';
import type { Dialogue, DialogueLine, TopicId } from '../types/lesson';
import { TOPICS } from '../data/starterCurriculum';
import { getAudioBlob } from '../utils/audioStorage';
import { playCzechAudio, stopAllPlayback } from '../utils/audioPlayer';
import { formatDuration } from '../utils/studyLogic';

interface DialogueViewProps {
  dialogues: Dialogue[];
  onAttachDialogueAudio: (dialogueId: string, file: File) => Promise<void>;
  onAddDialogue: (dialogue: Omit<Dialogue, 'id'>) => void;
}

const DialogueWaveBars: React.FC = () => (
  <span className="inline-flex items-end gap-0.5 h-3.5 shrink-0" aria-hidden="true">
    {[0, 1, 2, 3].map((idx) => (
      <motion.span
        key={idx}
        className="w-0.5 rounded-full bg-white origin-bottom h-full"
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

export const DialogueView: React.FC<DialogueViewProps> = ({
  dialogues,
  onAttachDialogueAudio,
  onAddDialogue,
}) => {
  const [selectedId, setSelectedId] = useState<string>(dialogues[0]?.id ?? '');
  const [hideTranslation, setHideTranslation] = useState(false);
  const [roleplaySpeakerB, setRoleplaySpeakerB] = useState(false);
  const [playingLineId, setPlayingLineId] = useState<string | null>(null);
  const [sequenceRunning, setSequenceRunning] = useState(false);
  const sequenceCancelRef = useRef(false);

  // Full conversation audio file player state
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingFull, setIsPlayingFull] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<1 | 0.75>(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const fullAudioRef = useRef<HTMLAudioElement | null>(null);

  // New dialogue form toggle
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitleMn, setNewTitleMn] = useState('');
  const [newTitleCz, setNewTitleCz] = useState('');
  const [newSituation, setNewSituation] = useState('');
  const [newTopicId, setNewTopicId] = useState<TopicId>('custom');
  const [newLinesText, setNewLinesText] = useState(
    'Dobrý den, jak se máte? | Сайн байна уу, та ямар байна вэ?\nDobře, děkuji. | Сайн, баярлалаа.'
  );
  const [formError, setFormError] = useState<string | null>(null);

  const selectedDialogue = dialogues.find((d) => d.id === selectedId) ?? dialogues[0] ?? null;

  useEffect(() => {
    let revokedUrl: string | null = null;
    setIsPlayingFull(false);
    setCurrentTime(0);
    setDuration(0);
    setAudioUrl(null);

    if (!selectedDialogue?.fullAudioId) return;

    void (async () => {
      const blob = await getAudioBlob(selectedDialogue.fullAudioId!);
      if (blob) {
        revokedUrl = URL.createObjectURL(blob);
        setAudioUrl(revokedUrl);
      }
    })();

    return () => {
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [selectedDialogue?.id, selectedDialogue?.fullAudioId]);

  useEffect(() => {
    return () => {
      sequenceCancelRef.current = true;
      stopAllPlayback();
    };
  }, []);

  const handleToggleFullAudio = () => {
    const el = fullAudioRef.current;
    if (!el) return;
    if (isPlayingFull) {
      el.pause();
      setIsPlayingFull(false);
    } else {
      el.playbackRate = playbackRate;
      void el.play();
      setIsPlayingFull(true);
    }
  };

  const handleToggleSpeed = () => {
    const next: 1 | 0.75 = playbackRate === 1 ? 0.75 : 1;
    setPlaybackRate(next);
    if (fullAudioRef.current) {
      fullAudioRef.current.playbackRate = next;
    }
  };

  const handlePlayLine = async (line: DialogueLine, speed: number) => {
    sequenceCancelRef.current = true;
    setSequenceRunning(false);
    if (playingLineId === line.id) {
      stopAllPlayback();
      setPlayingLineId(null);
      return;
    }
    await playCzechAudio({
      audioId: line.audioId,
      text: line.czech,
      rate: speed,
      voiceName: line.speaker === 'A' ? 'Charon' : 'Zephyr',
      onStart: () => setPlayingLineId(line.id),
      onEnd: () => setPlayingLineId(null),
    });
  };

  const handlePlayAllLines = async () => {
    if (!selectedDialogue) return;
    if (sequenceRunning) {
      sequenceCancelRef.current = true;
      setSequenceRunning(false);
      stopAllPlayback();
      setPlayingLineId(null);
      return;
    }

    sequenceCancelRef.current = false;
    setSequenceRunning(true);

    for (const line of selectedDialogue.lines) {
      if (sequenceCancelRef.current) break;
      if (roleplaySpeakerB && line.speaker === 'B') {
        setPlayingLineId(line.id);
        await new Promise((r) => window.setTimeout(r, 2200));
        continue;
      }
      await new Promise<void>((resolve) => {
        void playCzechAudio({
          audioId: line.audioId,
          text: line.czech,
          rate: playbackRate === 0.75 ? 0.72 : 1.0,
          voiceName: line.speaker === 'A' ? 'Charon' : 'Zephyr',
          onStart: () => setPlayingLineId(line.id),
          onEnd: () => resolve(),
        });
      });
    }

    setSequenceRunning(false);
    setPlayingLineId(null);
  };

  const handleCreateDialogue = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newTitleMn.trim() || !newTitleCz.trim()) {
      setFormError('Монгол болон Чех гарчгийг оруулна уу.');
      return;
    }
    const rawLines = newLinesText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (rawLines.length === 0) {
      setFormError('Ярианы мөрүүдийг оруулна уу.');
      return;
    }

    const parsedLines: DialogueLine[] = rawLines.map((row, idx) => {
      const [czechPart, mnPart] = row.split('|').map((s) => s.trim());
      const speaker: 'A' | 'B' = idx % 2 === 0 ? 'A' : 'B';
      return {
        id: `custom-line-${Date.now()}-${idx}`,
        speaker,
        speakerName: speaker === 'A' ? 'Хүн А' : 'Та',
        czech: czechPart || row,
        phonetic: czechPart || row,
        mongolian: mnPart || '',
      };
    });

    onAddDialogue({
      topicId: newTopicId,
      titleMn: newTitleMn.trim(),
      titleCz: newTitleCz.trim(),
      situationMn: newSituation.trim() || 'Өдөр тутмын харилцан яриа',
      lines: parsedLines,
    });
    setShowCreateForm(false);
    setNewTitleMn('');
    setNewTitleCz('');
    setNewSituation('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
      {/* Mobile Compact Dialogue Selector */}
      <div className="lg:hidden flex items-center gap-2">
        <label htmlFor="mobile-dialogue-select" className="sr-only">
          Харилцан яриа сонгох
        </label>
        <select
          id="mobile-dialogue-select"
          value={selectedDialogue?.id ?? ''}
          onChange={(e) => {
            sequenceCancelRef.current = true;
            setSequenceRunning(false);
            stopAllPlayback();
            setSelectedId(e.target.value);
          }}
          className="flex-1 min-w-0 min-h-[44px] rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] px-3 text-sm font-semibold text-[#1C1C1E] dark:text-white truncate"
        >
          {dialogues.map((dlg) => (
            <option key={dlg.id} value={dlg.id}>
              {dlg.titleMn} ({dlg.lines.length} мөр)
            </option>
          ))}
        </select>
        <motion.button
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="min-h-[44px] px-3.5 rounded-xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Шинэ</span>
        </motion.button>
      </div>

      {/* Desktop Dialogue List */}
      <aside className="hidden lg:block lg:col-span-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1C1C1E] dark:text-white">Харилцан ярианууд</h2>
          <motion.button
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            className="min-h-[40px] px-3 py-1.5 rounded-full bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Шинэ яриа</span>
          </motion.button>
        </div>

        <div className="space-y-2">
          {dialogues.map((dlg) => {
            const active = selectedDialogue?.id === dlg.id;
            return (
              <motion.button
                whileTap={{ scale: 0.985 }}
                key={dlg.id}
                type="button"
                onClick={() => {
                  sequenceCancelRef.current = true;
                  setSequenceRunning(false);
                  stopAllPlayback();
                  setSelectedId(dlg.id);
                }}
                className={`w-full text-left rounded-2xl p-4 border transition-colors cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-[#1C1C1E] border-[#007AFF] dark:border-[#0A84FF] ring-1 ring-[#007AFF] dark:ring-[#0A84FF]'
                    : 'bg-white dark:bg-[#1C1C1E] border-black/[0.06] dark:border-white/[0.08] hover:border-black/15 dark:hover:border-white/20'
                }`}
              >
                <p className="text-sm font-bold text-[#1C1C1E] dark:text-white">{dlg.titleMn}</p>
                <p className="text-xs text-[#007AFF] dark:text-[#64D2FF] font-medium mt-0.5">{dlg.titleCz}</p>
                <p className="text-xs text-[#8E8E93] mt-2">
                  {dlg.lines.length} мөр · {dlg.fullAudioId ? 'Аудио файлтай' : 'Натурал AI дуу'}
                </p>
              </motion.button>
            );
          })}
        </div>
      </aside>

      {/* Active Dialogue Stage */}
      <section className="lg:col-span-8 space-y-5">
        <AnimatePresence>
          {showCreateForm && (
            <motion.form
              initial={{ opacity: 0, y: -8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.99 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              onSubmit={handleCreateDialogue}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Шинэ харилцан яриа нэмэх
              </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="dlg-title-mn" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Монгол гарчиг
                </label>
                <input
                  id="dlg-title-mn"
                  type="text"
                  value={newTitleMn}
                  onChange={(e) => setNewTitleMn(e.target.value)}
                  placeholder="Жишээ: Эмийн санд эм авах"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label htmlFor="dlg-title-cz" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Чех гарчиг
                </label>
                <input
                  id="dlg-title-cz"
                  type="text"
                  value={newTitleCz}
                  onChange={(e) => setNewTitleCz(e.target.value)}
                  placeholder="Жишээ: V lékárně"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="dlg-topic" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Сэдэв
                </label>
                <select
                  id="dlg-topic"
                  value={newTopicId}
                  onChange={(e) => setNewTopicId(e.target.value as TopicId)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 px-3 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  {TOPICS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nameMn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="dlg-situation" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Нөхцөл байдал
                </label>
                <input
                  id="dlg-situation"
                  type="text"
                  value={newSituation}
                  onChange={(e) => setNewSituation(e.target.value)}
                  placeholder="Богино тайлбар"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="dlg-lines" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Ярианы мөрүүд (Мөр бүрт: Чех өгүүлбэр | Монгол орчуулга)
              </label>
              <textarea
                id="dlg-lines"
                rows={4}
                value={newLinesText}
                onChange={(e) => setNewLinesText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            {formError && <p className="text-xs font-semibold text-[#C81E2B]">{formError}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Болих
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                className="min-h-[44px] px-5 rounded-xl bg-[#11457E] text-white text-sm font-semibold cursor-pointer"
              >
                Хадгалах
              </motion.button>
            </div>
            </motion.form>
          )}
        </AnimatePresence>

        {selectedDialogue && (
          <motion.div
            key={selectedDialogue.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-6 space-y-4 sm:space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[#8E8E93]">
                  {TOPICS.find((t) => t.id === selectedDialogue.topicId)?.nameMn} · {selectedDialogue.titleCz}
                </p>
                <h1 className="text-2xl font-bold text-[#1C1C1E] dark:text-white mt-1">
                  {selectedDialogue.titleMn}
                </h1>
                <p className="text-sm text-[#636366] dark:text-[#AEAEB2] mt-1">
                  {selectedDialogue.situationMn}
                </p>
              </div>

              <label className="min-h-[44px] px-4 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:opacity-85 text-xs font-semibold text-[#1C1C1E] dark:text-white inline-flex items-center gap-2 cursor-pointer shrink-0 self-start">
                <Upload className="w-4 h-4 text-[#007AFF] dark:text-[#0A84FF]" aria-hidden="true" />
                <span>{selectedDialogue.fullAudioId ? 'Аудио солих' : 'Ярианы аудио оруулах'}</span>
                <input
                  type="file"
                  accept="audio/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onAttachDialogueAudio(selectedDialogue.id, file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            {/* Full Audio File Player OR Sequential TTS Player */}
            <div className="rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] p-4 space-y-3">
              {audioUrl ? (
                <>
                  <audio
                    ref={fullAudioRef}
                    src={audioUrl}
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                    onEnded={() => setIsPlayingFull(false)}
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleToggleFullAudio}
                      aria-label={isPlayingFull ? 'Аудио зогсоох' : 'Ярианы аудио тоглуулах'}
                      className="min-h-[44px] min-w-[44px] rounded-full bg-[#007AFF] dark:bg-[#0A84FF] text-white flex items-center justify-center cursor-pointer shrink-0"
                    >
                      {isPlayingFull ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <input
                        type="range"
                        aria-label="Аудио гүйлгэх"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={(e) => {
                          const next = Number(e.target.value);
                          setCurrentTime(next);
                          if (fullAudioRef.current) fullAudioRef.current.currentTime = next;
                        }}
                        className="w-full accent-[#007AFF]"
                      />
                      <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-[#8E8E93] mt-0.5">
                        <span>{formatDuration(currentTime)}</span>
                        <span>Таны харилцан ярианы файл</span>
                        <span>{formatDuration(duration)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleSpeed}
                      className="min-h-[40px] px-3 rounded-xl bg-white dark:bg-[#3A3A3C] text-xs font-mono font-semibold text-[#1C1C1E] dark:text-white cursor-pointer shrink-0"
                    >
                      {playbackRate === 1 ? '1.0x' : '0.75x'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => void handlePlayAllLines()}
                    className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2 rounded-full bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {sequenceRunning ? <DialogueWaveBars /> : <Volume2 className="w-4 h-4 shrink-0" />}
                    <span className="truncate">{sequenceRunning ? 'Зогсоох' : 'Бүгдийг сонсох'}</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={handleToggleSpeed}
                    className="min-h-[44px] px-3.5 rounded-full bg-white dark:bg-[#3A3A3C] text-xs font-mono font-semibold text-[#1C1C1E] dark:text-white shrink-0 cursor-pointer"
                  >
                    {playbackRate === 1 ? '1.0x' : '0.75x'}
                  </motion.button>
                </div>
              )}

              {/* Practice Mode Toggles */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-0.5">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setHideTranslation((v) => !v)}
                  aria-pressed={hideTranslation}
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                    hideTranslation
                      ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E]'
                      : 'bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-white'
                  }`}
                >
                  {hideTranslation ? <Eye className="w-3.5 h-3.5 shrink-0" /> : <EyeOff className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{hideTranslation ? 'Орчуулга' : 'Орчуулга нуух'}</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setRoleplaySpeakerB((v) => !v)}
                  aria-pressed={roleplaySpeakerB}
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                    roleplaySpeakerB
                      ? 'bg-[#007AFF] dark:bg-[#0A84FF] text-white'
                      : 'bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Дүрд тоглох</span>
                </motion.button>
              </div>
            </div>

            {/* Transcript Lines */}
            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
              {selectedDialogue.lines.map((line) => {
                const isUserRole = roleplaySpeakerB && line.speaker === 'B';
                const isActive = playingLineId === line.id;
                return (
                  <div
                    key={line.id}
                    className={`py-4 px-3 rounded-2xl transition-colors ${
                      isActive
                        ? 'bg-[#007AFF]/10 dark:bg-[#0A84FF]/15'
                        : isUserRole
                        ? 'bg-[#FF9500]/10 dark:bg-[#FF9F0A]/15'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-[#8E8E93]">
                          <span className="font-semibold text-[#1C1C1E] dark:text-white">{line.speakerName}</span>
                          {isUserRole && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-[#C97100] dark:text-[#FFD60A]">Таны ярих хэсэг</span>
                            </>
                          )}
                        </div>
                        <p className="text-base sm:text-lg font-semibold text-[#1C1C1E] dark:text-white">
                          {line.czech}
                        </p>
                        <p className="text-xs font-mono text-[#007AFF] dark:text-[#64D2FF]">[{line.phonetic}]</p>
                        {!hideTranslation && line.mongolian && (
                          <p className="text-sm text-[#636366] dark:text-[#AEAEB2]">{line.mongolian}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          type="button"
                          onClick={() => void handlePlayLine(line, 1.0)}
                          aria-label={`Энгийнээр сонсох: ${line.czech}`}
                          className={`min-h-[44px] min-w-[44px] px-3 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer ${
                            isActive
                              ? 'bg-[#007AFF] dark:bg-[#0A84FF] text-white'
                              : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white'
                          }`}
                        >
                          {isActive ? <DialogueWaveBars /> : <Volume2 className="w-4 h-4" />}
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          type="button"
                          onClick={() => void handlePlayLine(line, 0.65)}
                          aria-label={`Удаанаар сонсох: ${line.czech}`}
                          className="min-h-[44px] px-2.5 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] text-xs font-mono font-semibold text-[#1C1C1E] dark:text-white cursor-pointer"
                        >
                          0.6x
                        </motion.button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </section>
    </div>
  );
};
