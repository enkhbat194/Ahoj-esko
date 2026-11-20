export type TopicId = 'greetings' | 'cafe' | 'transport' | 'work' | 'custom';

export type AudioSlotType = 'wordNormal' | 'wordSlow' | 'sentenceNormal' | 'sentenceSlow';

export type LearnerSelfForm = 'masculine' | 'feminine';

export type ContentQaStatus = 'draft_ai' | 'qa_review' | 'native_approved';

export type CzechNounGender =
  | 'masculine_animate'
  | 'masculine_inanimate'
  | 'feminine'
  | 'neuter';

export type TutorMode = 'coach' | 'conversation' | 'exam';

export type SrsGrade = 'again' | 'hard' | 'good' | 'easy';

export interface SrsCardState {
  intervalDays: number;
  dueAt: number;
  lastReviewedAt?: number;
  repetitions: number;
  lapses: number;
  lastGrade?: SrsGrade;
  buriedUntilDay?: string;
}

export interface TopicInfo {
  id: TopicId;
  nameMn: string;
  nameCz: string;
  descriptionMn: string;
}

export interface VocabCard {
  id: string;
  topicId: TopicId;
  czechWord: string;
  phoneticHint: string;
  mongolianWord: string;
  czechSentence: string;
  mongolianSentence: string;
  audioIds: Partial<Record<AudioSlotType, string>>;
  mastered: boolean;
  practiceCount: number;
  lastPracticedAt?: number;
  canonicalId?: string;
  lessonId?: string;
  curriculumSha256?: string;
  lemmaGroup?: string;
  qaStatus?: ContentQaStatus;
  nounGender?: CzechNounGender;
  selfFormVariants?: {
    masculine: string;
    feminine: string;
  };
  srs?: SrsCardState;
}

export interface DialogueLine {
  id: string;
  speaker: 'A' | 'B';
  speakerName: string;
  czech: string;
  phonetic: string;
  mongolian: string;
  audioId?: string;
  personaGender?: LearnerSelfForm;
  qaStatus?: ContentQaStatus;
}

export interface Dialogue {
  id: string;
  topicId: TopicId;
  titleMn: string;
  titleCz: string;
  situationMn: string;
  fullAudioId?: string;
  canonicalId?: string;
  lessonId?: string;
  qaStatus?: ContentQaStatus;
  lines: DialogueLine[];
}

export interface StoredAudioMeta {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: number;
}

export type ActiveTab = 'today' | 'learn' | 'story' | 'review' | 'profile';

export type LearnSubTab = 'mission' | 'dialogues' | 'ai' | 'topics';

export interface StoryGlossaryEntry {
  lemma: string;
  lemmaGroup: string;
  mn: string;
  phonetic: string;
  grammar: string;
  note: string;
  nounGender?: CzechNounGender;
  topicId?: TopicId;
  qaStatus: ContentQaStatus;
}

export interface StorySentence {
  id: string;
  cs: string;
  mn: string;
  speaker: string;
  delivery: 'spoken' | 'practice' | string;
  lessonIds: string[];
  reviewNote?: string;
}

export interface StoryChapter {
  chapter: number;
  titleCs: string;
  band: string;
  sentences: StorySentence[];
}

export interface StoryProgressState {
  readSentenceIds: string[];
  knownWords: string[];
  lastChapter: number;
}

