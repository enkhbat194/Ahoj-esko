import React from 'react';
import { BookOpen, Bot, Compass, MessageSquare } from 'lucide-react';
import type {
  Dialogue,
  LearnerSelfForm,
  LearnSubTab,
  TopicId,
  TutorMode,
  VocabCard,
} from '../types/lesson';
import { CanonicalCourseView } from './CanonicalCourseView';
import { DialogueView } from './DialogueView';
import { AITutorView } from './AITutorView';
import { TopicsView } from './TopicsView';

interface LearnHubViewProps {
  subTab: LearnSubTab;
  onChangeSubTab: (sub: LearnSubTab) => void;
  learnerGender: LearnerSelfForm;
  onChangeLearnerGender: (gender: LearnerSelfForm) => void;
  cards: VocabCard[];
  dialogues: Dialogue[];
  onAddCanonicalPhrasesToDeck: (
    cards: Omit<VocabCard, 'id' | 'audioIds' | 'mastered' | 'practiceCount'>[]
  ) => number;
  onLaunchMissionRoleplay: (mode: TutorMode) => void;
  missionLaunch: { scenarioId: string; mode: TutorMode; nonce: number } | null;
  onAttachDialogueAudio: (dialogueId: string, file: File) => Promise<void>;
  onAddDialogue: (dialogue: Omit<Dialogue, 'id'>) => void;
  onStartTopicPractice: (topicId: TopicId | 'all') => void;
  onOpenDriveImport: () => void;
}

const SUB_TABS: Array<{ id: LearnSubTab; label: string; icon: typeof Compass }> = [
  { id: 'mission', label: 'Хичээлүүд', icon: Compass },
  { id: 'dialogues', label: 'Харилцан яриа', icon: MessageSquare },
  { id: 'ai', label: 'AI Роль тоглох', icon: Bot },
  { id: 'topics', label: 'Сэдэв & Үгс', icon: BookOpen },
];

export const LearnHubView: React.FC<LearnHubViewProps> = ({
  subTab,
  onChangeSubTab,
  learnerGender,
  onChangeLearnerGender,
  cards,
  dialogues,
  onAddCanonicalPhrasesToDeck,
  onLaunchMissionRoleplay,
  missionLaunch,
  onAttachDialogueAudio,
  onAddDialogue,
  onStartTopicPractice,
  onOpenDriveImport,
}) => {
  const isAiChat = subTab === 'ai';

  return (
    <div
      className={
        isAiChat
          ? 'flex-1 min-h-0 flex flex-col gap-3'
          : 'space-y-4 sm:space-y-5'
      }
    >
      {/* Clean 4-item Segmented Sub-Navigation */}
      <div className={isAiChat ? 'px-4 pt-2 sm:px-0 sm:pt-0 shrink-0' : ''}>
        <div
          role="tablist"
          aria-label="Сургалтын хэсгүүд"
          className="flex items-center gap-1 p-1 rounded-2xl bg-[#E5E5EA] dark:bg-[#1C1C1E] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {SUB_TABS.map((item) => {
            const Icon = item.icon;
            const active = subTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChangeSubTab(item.id)}
                className={`min-h-[38px] px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 flex-1 sm:flex-initial transition-colors cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-[#3A3A3C] text-[#007AFF] dark:text-[#64D2FF] shadow-2xs'
                    : 'text-[#636366] dark:text-[#AEAEB2] hover:text-[#1C1C1E] dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {subTab === 'mission' && (
        <CanonicalCourseView onAddCards={onAddCanonicalPhrasesToDeck} onLaunchMissionRoleplay={onLaunchMissionRoleplay} />
      )}

      {subTab === 'dialogues' && (
        <DialogueView
          dialogues={dialogues}
          onAttachDialogueAudio={onAttachDialogueAudio}
          onAddDialogue={onAddDialogue}
        />
      )}

      {subTab === 'ai' && (
        <div className="flex-1 min-h-0 flex flex-col">
          <AITutorView
            learnerGender={learnerGender}
            onChangeLearnerGender={onChangeLearnerGender}
            missionLaunch={missionLaunch}
          />
        </div>
      )}

      {subTab === 'topics' && (
        <TopicsView
          cards={cards}
          dialogueCount={dialogues.length}
          onStartTopicPractice={onStartTopicPractice}
          onOpenDriveImport={onOpenDriveImport}
        />
      )}
    </div>
  );
};
