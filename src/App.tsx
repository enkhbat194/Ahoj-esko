import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { BookOpen, Compass, GraduationCap, Layers, Moon, Sun, User } from 'lucide-react';
import type {
  ActiveTab,
  AudioSlotType,
  Dialogue,
  LearnerSelfForm,
  LearnSubTab,
  SrsGrade,
  StoredAudioMeta,
  StoryProgressState,
  TopicId,
  TutorMode,
  VocabCard,
} from './types/lesson';
import { STARTER_CARDS, STARTER_DIALOGUES } from './data/starterCurriculum';
import { KLIC17_GLOSSARY } from './data/klic17Story';
import { deleteAudioBlob, listAudioMetadata, saveAudioFile } from './utils/audioStorage';
import type { ParsedDriveCard } from './utils/driveCurriculumParser';
import { loadStoredLearnerGender, saveStoredLearnerGender } from './utils/learnerProfile';
import {
  appendIdempotentReviewEvent,
  applySiblingBury,
  loadReviewEvents,
  saveReviewEvents,
  scheduleNextSrsState,
  type ReviewEventRecord,
} from './utils/srsScheduler';
import { loadStoryProgress, lookupGlossaryEntry } from './utils/storyReaderLogic';
import { selectCanonicalCardsToAdd } from './utils/canonicalDeck';
import { TodayDashboardView } from './components/TodayDashboardView';
import { LearnHubView } from './components/LearnHubView';
import { StoryReaderView } from './components/StoryReaderView';
import { PracticeView } from './components/PracticeView';
import { ProfileView } from './components/ProfileView';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallModal';

const CARDS_STORAGE_KEY = 'ahoj_cesko_cards_v1';
const DIALOGUES_STORAGE_KEY = 'ahoj_cesko_dialogues_v1';
const THEME_STORAGE_KEY = 'ahoj_cesko_theme_v1';

const STARTER_CARD_MAP = new Map(STARTER_CARDS.map((card) => [card.id, card]));

function enrichCardMetadata(card: VocabCard): VocabCard {
  const starterMatch = STARTER_CARD_MAP.get(card.id);
  const glossaryMatch = !card.nounGender ? lookupGlossaryEntry(card.czechWord, KLIC17_GLOSSARY) : null;
  const nounGender = card.nounGender ?? starterMatch?.nounGender ?? glossaryMatch?.nounGender;
  const lemmaGroup = card.lemmaGroup ?? starterMatch?.lemmaGroup ?? glossaryMatch?.lemmaGroup;
  const qaStatus = card.qaStatus ?? starterMatch?.qaStatus ?? glossaryMatch?.qaStatus;

  if (
    nounGender === card.nounGender &&
    lemmaGroup === card.lemmaGroup &&
    qaStatus === card.qaStatus
  ) {
    return card;
  }
  return {
    ...card,
    ...(nounGender ? { nounGender } : {}),
    ...(lemmaGroup ? { lemmaGroup } : {}),
    ...(qaStatus ? { qaStatus } : {}),
  };
}

function loadStoredTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Ignore storage access errors
  }
  return 'light';
}

function loadStoredCards(): VocabCard[] {
  try {
    const raw = localStorage.getItem(CARDS_STORAGE_KEY);
    if (!raw) return STARTER_CARDS;
    const parsed = JSON.parse(raw) as VocabCard[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed.map(enrichCardMetadata)
      : STARTER_CARDS;
  } catch {
    return STARTER_CARDS;
  }
}

function loadStoredDialogues(): Dialogue[] {
  try {
    const raw = localStorage.getItem(DIALOGUES_STORAGE_KEY);
    if (!raw) return STARTER_DIALOGUES;
    const parsed = JSON.parse(raw) as Dialogue[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : STARTER_DIALOGUES;
  } catch {
    return STARTER_DIALOGUES;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [learnSubTab, setLearnSubTab] = useState<LearnSubTab>('mission');
  const [profileSection, setProfileSection] = useState<'general' | 'library'>('general');
  const [selectedTopic, setSelectedTopic] = useState<TopicId | 'all'>('all');
  const [theme, setTheme] = useState<'light' | 'dark'>(loadStoredTheme);
  const [learnerGender, setLearnerGender] = useState<LearnerSelfForm>(loadStoredLearnerGender);
  const [storyProgress, setStoryProgress] = useState<StoryProgressState>(loadStoryProgress);
  const [cards, setCards] = useState<VocabCard[]>(loadStoredCards);
  const [dialogues, setDialogues] = useState<Dialogue[]>(loadStoredDialogues);
  const [reviewEvents, setReviewEvents] = useState<ReviewEventRecord[]>(loadReviewEvents);
  const [audioMetaList, setAudioMetaList] = useState<StoredAudioMeta[]>([]);
  const [librarySection, setLibrarySection] = useState<'drive' | 'add' | 'batch' | 'list'>('drive');
  const [missionLaunch, setMissionLaunch] = useState<{
    scenarioId: string;
    mode: TutorMode;
    nonce: number;
  } | null>(null);

  const cardsRef = useRef(cards);
  const reviewEventsRef = useRef(reviewEvents);

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    reviewEventsRef.current = reviewEvents;
  }, [reviewEvents]);

  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', isDark ? '#000000' : '#F2F2F7');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage quota errors
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
    } catch {
      // Ignore storage quota errors
    }
  }, [cards]);

  useEffect(() => {
    try {
      localStorage.setItem(DIALOGUES_STORAGE_KEY, JSON.stringify(dialogues));
    } catch {
      // Ignore storage quota errors
    }
  }, [dialogues]);

  useEffect(() => {
    saveStoredLearnerGender(learnerGender);
  }, [learnerGender]);

  useEffect(() => {
    saveReviewEvents(reviewEvents);
  }, [reviewEvents]);

  const refreshAudioMeta = useCallback(async () => {
    const list = await listAudioMetadata();
    setAudioMetaList(list);
  }, []);

  useEffect(() => {
    void refreshAudioMeta();
  }, [refreshAudioMeta]);

  const handleToggleMastered = useCallback((cardId: string) => {
    setCards((prev) =>
      prev.map((card) => (card.id === cardId ? { ...card, mastered: !card.mastered } : card))
    );
  }, []);

  const handleRecordPractice = useCallback((cardId: string) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? { ...card, practiceCount: card.practiceCount + 1, lastPracticedAt: Date.now() }
          : card
      )
    );
  }, []);

  const handleReviewSrsCard = useCallback(
    (cardId: string, grade: SrsGrade, eventId: string) => {
      if (reviewEventsRef.current.some((e) => e.eventId === eventId)) {
        return;
      }
      const target = cardsRef.current.find((c) => c.id === cardId);
      if (!target) return;

      const now = Date.now();
      const nextSrs = scheduleNextSrsState(target.srs, grade, now);

      const { events: nextEvents } = appendIdempotentReviewEvent(reviewEventsRef.current, {
        eventId,
        cardId,
        lemmaGroup: target.lemmaGroup,
        grade,
        reviewedAtUtc: now,
        intervalDays: nextSrs.intervalDays,
        dueAtUtc: nextSrs.dueAt,
      });
      reviewEventsRef.current = nextEvents;
      setReviewEvents(nextEvents);

      const updated = cardsRef.current.map((card) =>
        card.id === cardId
          ? {
              ...card,
              srs: nextSrs,
              practiceCount: card.practiceCount + 1,
              lastPracticedAt: now,
              mastered:
                grade === 'again'
                  ? false
                  : grade === 'easy' && nextSrs.repetitions >= 3
                    ? true
                    : card.mastered,
            }
          : card
      );
      const buriedUpdated = applySiblingBury(updated, cardId, now);
      cardsRef.current = buriedUpdated;
      setCards(buriedUpdated);
    },
    []
  );

  const handleAddCanonicalPhrasesToDeck = useCallback(
    (incoming: Omit<VocabCard, 'id' | 'audioIds' | 'mastered' | 'practiceCount'>[]): number => {
      const { additions, conflictingIds } = selectCanonicalCardsToAdd(
        cardsRef.current,
        incoming,
        Date.now(),
      );
      if (conflictingIds.length > 0) {
        // Existing SRS/audio progress must never be reused for another phrase.
        console.warn('Canonical ID collisions blocked:', conflictingIds);
        window.alert(`Агуулгын ID зөрчил илэрсэн тул ${conflictingIds.length} картыг нэмсэнгүй. Хуучин ахиц/аудиог хамгаалсан.`);
      }
      if (additions.length > 0) {
        const nextCards = [...additions, ...cardsRef.current];
        cardsRef.current = nextCards;
        setCards(nextCards);
      }
      return additions.length;
    },
    []
  );

  const handleLaunchMissionRoleplay = useCallback((mode: TutorMode) => {
    setMissionLaunch({
      scenarioId: 'a0-m01-l01',
      mode,
      nonce: Date.now(),
    });
    setLearnSubTab('ai');
    setActiveTab('learn');
  }, []);

  const handleAttachAudio = useCallback(
    async (cardId: string, slot: AudioSlotType, file: File) => {
      const meta = await saveAudioFile(file);
      setCards((prev) =>
        prev.map((card) =>
          card.id === cardId
            ? { ...card, audioIds: { ...card.audioIds, [slot]: meta.id } }
            : card
        )
      );
      await refreshAudioMeta();
    },
    [refreshAudioMeta]
  );

  const handleRemoveCardAudio = useCallback(
    async (cardId: string, slot: AudioSlotType) => {
      const targetCard = cards.find((c) => c.id === cardId);
      const existingId = targetCard?.audioIds[slot];
      if (existingId) {
        await deleteAudioBlob(existingId);
      }
      setCards((prev) =>
        prev.map((card) => {
          if (card.id !== cardId) return card;
          const nextIds = { ...card.audioIds };
          delete nextIds[slot];
          return { ...card, audioIds: nextIds };
        })
      );
      await refreshAudioMeta();
    },
    [cards, refreshAudioMeta]
  );

  const handleAddCard = useCallback(
    async (
      cardData: Omit<VocabCard, 'id' | 'audioIds' | 'mastered' | 'practiceCount'>,
      files: Partial<Record<AudioSlotType, File>>
    ) => {
      const audioIds: Partial<Record<AudioSlotType, string>> = {};
      for (const slot of ['wordNormal', 'wordSlow', 'sentenceNormal', 'sentenceSlow'] as AudioSlotType[]) {
        const file = files[slot];
        if (file) {
          const meta = await saveAudioFile(file);
          audioIds[slot] = meta.id;
        }
      }

      const newCard: VocabCard = {
        ...cardData,
        id: `custom-${Date.now()}`,
        audioIds,
        mastered: false,
        practiceCount: 0,
      };
      setCards((prev) => [newCard, ...prev]);
      await refreshAudioMeta();
    },
    [refreshAudioMeta]
  );

  const handleDeleteCard = useCallback((cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  }, []);

  const handleAttachDialogueAudio = useCallback(
    async (dialogueId: string, file: File) => {
      const meta = await saveAudioFile(file);
      setDialogues((prev) =>
        prev.map((d) => (d.id === dialogueId ? { ...d, fullAudioId: meta.id } : d))
      );
      await refreshAudioMeta();
    },
    [refreshAudioMeta]
  );

  const handleAddDialogue = useCallback((dialogueData: Omit<Dialogue, 'id'>) => {
    const next: Dialogue = {
      ...dialogueData,
      id: `custom-dlg-${Date.now()}`,
    };
    setDialogues((prev) => [next, ...prev]);
  }, []);

  const handleBatchAttach = useCallback(
    async (
      assignments: Array<{
        file: File;
        targetType: 'card' | 'dialogue';
        targetId: string;
        slot?: AudioSlotType;
      }>
    ) => {
      const cardUpdates = new Map<string, Partial<Record<AudioSlotType, string>>>();
      const dialogueUpdates = new Map<string, string>();

      for (const item of assignments) {
        if (!item.targetId) continue;
        const meta = await saveAudioFile(item.file);
        if (item.targetType === 'card' && item.slot) {
          const prev = cardUpdates.get(item.targetId) ?? {};
          prev[item.slot] = meta.id;
          cardUpdates.set(item.targetId, prev);
        } else if (item.targetType === 'dialogue') {
          dialogueUpdates.set(item.targetId, meta.id);
        }
      }

      if (cardUpdates.size > 0) {
        setCards((prev) =>
          prev.map((card) => {
            const patch = cardUpdates.get(card.id);
            return patch ? { ...card, audioIds: { ...card.audioIds, ...patch } } : card;
          })
        );
      }

      if (dialogueUpdates.size > 0) {
        setDialogues((prev) =>
          prev.map((dlg) => {
            const audioId = dialogueUpdates.get(dlg.id);
            return audioId ? { ...dlg, fullAudioId: audioId } : dlg;
          })
        );
      }

      await refreshAudioMeta();
    },
    [refreshAudioMeta]
  );

  const handleImportBackup = useCallback(
    (data: { cards?: VocabCard[]; dialogues?: Dialogue[] }) => {
      if (Array.isArray(data.cards) && data.cards.length > 0) {
        setCards(data.cards);
      }
      if (Array.isArray(data.dialogues) && data.dialogues.length > 0) {
        setDialogues(data.dialogues);
      }
    },
    []
  );

  const handleResetCurriculum = useCallback(() => {
    setCards(STARTER_CARDS);
    setDialogues(STARTER_DIALOGUES);
    setSelectedTopic('all');
  }, []);

  const handleImportDriveCurriculum = useCallback(
    (incomingCards: ParsedDriveCard[], incomingDialogues: Omit<Dialogue, 'id'>[]) => {
      const now = Date.now();
      if (incomingCards.length > 0) {
        // Route Drive imports through the same ID/meaning collision guard as canonical lessons.
        // Word-only deduplication silently discarded distinct Czech/Mongolian meanings.
        handleAddCanonicalPhrasesToDeck(incomingCards);
      }
      if (incomingDialogues.length > 0) {
        setDialogues((prev) => {
          const existingTitles = new Set(prev.map((d) => d.titleCz.trim().toLowerCase()));
          const additions: Dialogue[] = incomingDialogues
            .filter((d) => !existingTitles.has(d.titleCz.trim().toLowerCase()))
            .map((d, idx) => ({
              ...d,
              id: `custom-drive-dlg-${now}-${idx}`,
            }));
          return [...additions, ...prev];
        });
      }
    },
    [handleAddCanonicalPhrasesToDeck]
  );

  const handleImportDriveAudioFiles = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        await saveAudioFile(file);
      }
      await refreshAudioMeta();
    },
    [refreshAudioMeta]
  );

  const navItems: Array<{ id: ActiveTab; label: string; icon: typeof Compass }> = [
    { id: 'today', label: 'Өнөөдөр', icon: Compass },
    { id: 'learn', label: 'Сургалт', icon: GraduationCap },
    { id: 'story', label: 'Зохиол', icon: BookOpen },
    { id: 'review', label: 'Давтлага', icon: Layers },
    { id: 'profile', label: 'Профайл', icon: User },
  ];

  const isChatView = activeTab === 'learn' && learnSubTab === 'ai';

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={`${
          isChatView ? 'h-dvh overflow-hidden' : 'min-h-screen'
        } bg-[#F2F2F7] dark:bg-black text-[#1C1C1E] dark:text-[#F2F2F7] flex flex-col`}
      >
        {/* Classic iOS Translucent Top Navigation Bar */}
        <header className="sticky top-0 z-30 shrink-0 bg-[#F2F2F7]/85 dark:bg-black/80 backdrop-blur-xl border-b border-black/[0.08] dark:border-white/[0.1] pt-safe">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-12 lg:h-14 flex items-center justify-between gap-3 lg:gap-8">
            <a
              href="#today"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('today');
              }}
              className="text-[17px] font-bold tracking-tight text-[#1C1C1E] dark:text-white whitespace-nowrap shrink-0"
            >
              Ahoj Česko
            </a>

            <nav aria-label="Үндсэн цэс" className="hidden lg:flex items-center gap-6">
              {navItems.map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`relative py-2.5 text-[14px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'text-[#007AFF] dark:text-[#0A84FF]'
                        : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                    {active && (
                      <motion.span
                        layoutId="desktop-nav-underline"
                        transition={{ type: 'spring', stiffness: 450, damping: 36 }}
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#007AFF] dark:bg-[#0A84FF] rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              <motion.button
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
                aria-label={theme === 'light' ? 'Шөнийн горим асаах' : 'Өдрийн горим асаах'}
                className="min-h-[36px] min-w-[36px] rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08] flex items-center justify-center cursor-pointer"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </motion.button>
              <PWAInstallButton compact />
            </div>
          </div>
        </header>

        {/* Main Content: Locked Flex Viewport on AI Chat Tab, Normal Flow Elsewhere */}
        <main
          className={
            isChatView
              ? 'flex-1 min-h-0 max-w-6xl w-full mx-auto px-0 sm:px-6 lg:px-8 pt-0 sm:pt-4 pb-[calc(56px+max(0.5rem,env(safe-area-inset-bottom)))] lg:pb-4 overflow-hidden flex flex-col'
              : 'flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24 lg:pb-12'
          }
        >
          {isChatView ? (
            <LearnHubView
              subTab={learnSubTab}
              onChangeSubTab={setLearnSubTab}
              learnerGender={learnerGender}
              onChangeLearnerGender={setLearnerGender}
              cards={cards}
              dialogues={dialogues}
              onAddCanonicalPhrasesToDeck={handleAddCanonicalPhrasesToDeck}
              onLaunchMissionRoleplay={handleLaunchMissionRoleplay}
              missionLaunch={missionLaunch}
              onAttachDialogueAudio={handleAttachDialogueAudio}
              onAddDialogue={handleAddDialogue}
              onStartTopicPractice={(topicId) => {
                setSelectedTopic(topicId);
                setActiveTab('review');
              }}
              onOpenDriveImport={() => {
                setLibrarySection('drive');
                setProfileSection('library');
                setActiveTab('profile');
              }}
            />
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              >
                {activeTab === 'today' && (
                  <TodayDashboardView
                    cards={cards}
                    reviewEvents={reviewEvents}
                    storyProgress={storyProgress}
                    audioMetaList={audioMetaList}
                    learnerGender={learnerGender}
                    onChangeLearnerGender={setLearnerGender}
                    onStartMission={() => {
                      setLearnSubTab('mission');
                      setActiveTab('learn');
                    }}
                    onLaunchRoleplay={handleLaunchMissionRoleplay}
                    onOpenReview={() => setActiveTab('review')}
                    onOpenStory={() => setActiveTab('story')}
                    onOpenProfile={(sec = 'general') => {
                      setProfileSection(sec);
                      if (sec === 'library') setLibrarySection('drive');
                      setActiveTab('profile');
                    }}
                  />
                )}

                {activeTab === 'learn' && (
                  <LearnHubView
                    subTab={learnSubTab}
                    onChangeSubTab={setLearnSubTab}
                    learnerGender={learnerGender}
                    onChangeLearnerGender={setLearnerGender}
                    cards={cards}
                    dialogues={dialogues}
                    onAddCanonicalPhrasesToDeck={handleAddCanonicalPhrasesToDeck}
                    onLaunchMissionRoleplay={handleLaunchMissionRoleplay}
                    missionLaunch={missionLaunch}
                    onAttachDialogueAudio={handleAttachDialogueAudio}
                    onAddDialogue={handleAddDialogue}
                    onStartTopicPractice={(topicId) => {
                      setSelectedTopic(topicId);
                      setActiveTab('review');
                    }}
                    onOpenDriveImport={() => {
                      setLibrarySection('drive');
                      setProfileSection('library');
                      setActiveTab('profile');
                    }}
                  />
                )}

                {activeTab === 'story' && (
                  <StoryReaderView
                    cards={cards}
                    onAddStoryCardsToSrs={handleAddCanonicalPhrasesToDeck}
                    onOpenSrsPractice={() => {
                      setSelectedTopic('all');
                      setActiveTab('review');
                    }}
                    onLaunchStoryRoleplay={() => handleLaunchMissionRoleplay('conversation')}
                    onProgressUpdate={setStoryProgress}
                  />
                )}

                {activeTab === 'review' && (
                  <PracticeView
                    cards={cards}
                    selectedTopic={selectedTopic}
                    onSelectTopic={setSelectedTopic}
                    onToggleMastered={handleToggleMastered}
                    onRecordPractice={handleRecordPractice}
                    onAttachAudio={handleAttachAudio}
                    learnerGender={learnerGender}
                    onChangeLearnerGender={setLearnerGender}
                    onReviewSrsCard={handleReviewSrsCard}
                  />
                )}

                {activeTab === 'profile' && (
                  <ProfileView
                    key={`${profileSection}-${librarySection}`}
                    initialSection={profileSection}
                    initialLibrarySection={librarySection}
                    theme={theme}
                    onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
                    learnerGender={learnerGender}
                    onChangeLearnerGender={setLearnerGender}
                    cards={cards}
                    dialogues={dialogues}
                    reviewEvents={reviewEvents}
                    storyProgress={storyProgress}
                    audioMetaList={audioMetaList}
                    onAddCard={handleAddCard}
                    onAttachAudio={handleAttachAudio}
                    onRemoveCardAudio={handleRemoveCardAudio}
                    onDeleteCard={handleDeleteCard}
                    onBatchAttach={handleBatchAttach}
                    onImportBackup={handleImportBackup}
                    onResetCurriculum={handleResetCurriculum}
                    onImportDriveCurriculum={handleImportDriveCurriculum}
                    onImportDriveAudioFiles={handleImportDriveAudioFiles}
                    onOpenGenderFilteredVocab={() => {
                      setLearnSubTab('topics');
                      setActiveTab('learn');
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        {/* Classic iPhone Translucent Bottom Tab Bar */}
        <nav
          aria-label="Гар утасны доод цэс"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F2F2F7]/90 dark:bg-black/85 backdrop-blur-xl border-t border-black/[0.08] dark:border-white/[0.12] pb-safe"
        >
          <div className="grid grid-cols-5 h-[56px]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex flex-col items-center justify-center gap-0.5 min-h-[44px] px-0.5 transition-colors cursor-pointer ${
                    active
                      ? 'text-[#007AFF] dark:text-[#0A84FF]'
                      : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="mobile-nav-indicator"
                      transition={{ type: 'spring', stiffness: 450, damping: 36 }}
                      className="absolute top-0 left-4 right-4 h-[2px] bg-[#007AFF] dark:bg-[#0A84FF] rounded-b-full"
                    />
                  )}
                  <Icon className="w-[21px] h-[21px]" strokeWidth={active ? 2.2 : 1.75} aria-hidden="true" />
                  <span className="text-[10px] font-medium tracking-tight whitespace-nowrap">
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </nav>

        <OfflineIndicator />
      </div>
    </MotionConfig>
  );
}
