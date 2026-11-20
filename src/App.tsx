import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { Menu } from 'lucide-react';
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
import { PremiumHomeView } from './components/PremiumHomeView';
import { PremiumBottomNav } from './components/PremiumBottomNav';
import { premiumNavSelected, premiumNavTarget, type PremiumNavId } from './utils/premiumNavigation';
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
  return 'dark';
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
    const isDark = theme === 'dark' || activeTab === 'today';
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
  }, [theme, activeTab]);

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
    (incoming: Omit<VocabCard, 'id' | 'audioIds' | 'mastered' | 'practiceCount'>[], preserveDistinctCanonicalIds = false): number => {
      const { additions, conflictingIds } = selectCanonicalCardsToAdd(
        cardsRef.current,
        incoming,
        Date.now(),
        { preserveDistinctCanonicalIds },
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
        handleAddCanonicalPhrasesToDeck(incomingCards, incomingCards.some((card) => Boolean(card.lessonId)));
      }
      if (incomingDialogues.length > 0) {
        setDialogues((prev) => {
          const existingIds = new Set(prev.map((d) => d.canonicalId).filter(Boolean));
          const existingTitles = new Set(prev.filter((d) => !d.canonicalId).map((d) => d.titleCz.trim().toLowerCase()));
          const additions: Dialogue[] = incomingDialogues
            .filter((d) => {
              if (d.canonicalId) {
                if (existingIds.has(d.canonicalId)) return false;
                existingIds.add(d.canonicalId);
                return true;
              }
              const title = d.titleCz.trim().toLowerCase();
              if (existingTitles.has(title)) return false;
              existingTitles.add(title);
              return true;
            })
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

  const handlePremiumNavigate = (id: PremiumNavId) => {
    const target = premiumNavTarget(id);
    if (target.learnSubTab) setLearnSubTab(target.learnSubTab);
    setActiveTab(target.activeTab);
  };

  const isChatView = activeTab === 'learn' && learnSubTab === 'ai';

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={`${
          isChatView ? 'h-dvh overflow-hidden' : 'min-h-screen'
        } ${activeTab === 'today' ? 'premium-app-surface' : 'bg-[#F2F2F7] dark:bg-black'} text-[#1C1C1E] dark:text-[#F2F2F7] flex flex-col`}
      >
        {/* Calm top bar: only the menu, as requested. Theme/install live in Settings. */}
        <header className="premium-minimal-header shrink-0" aria-label="Дээд удирдлага">
          <button
            type="button"
            className="premium-menu-trigger"
            aria-label="Цэс нээх"
            onClick={() => setActiveTab('profile')}
          >
            <Menu size={22} strokeWidth={1.85} aria-hidden="true" />
          </button>
        </header>

        {/* Main Content: Locked Flex Viewport on AI Chat Tab, Normal Flow Elsewhere */}
        <main
          className={
            isChatView
              ? 'flex-1 min-h-0 max-w-6xl w-full mx-auto px-0 sm:px-6 lg:px-8 pt-0 sm:pt-4 pb-[calc(95px+env(safe-area-inset-bottom))] overflow-hidden flex flex-col'
              : activeTab === 'today'
                ? 'flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-0 pb-[calc(104px+env(safe-area-inset-bottom))]'
                : 'flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-[calc(106px+env(safe-area-inset-bottom))]'
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
                  <PremiumHomeView
                    onStartMission={() => {
                      setLearnSubTab('mission');
                      setActiveTab('learn');
                    }}
                    onLaunchRoleplay={handleLaunchMissionRoleplay}
                    onOpenStory={() => setActiveTab('story')}
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
                  <div className="flex justify-end mb-3">
                    <PWAInstallButton compact />
                  </div>
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

        <PremiumBottomNav
          selected={premiumNavSelected(activeTab, learnSubTab)}
          onNavigate={handlePremiumNavigate}
        />

        <OfflineIndicator />
      </div>
    </MotionConfig>
  );
}
