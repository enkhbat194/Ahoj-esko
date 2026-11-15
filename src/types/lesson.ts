export type TopicId = 'greetings' | 'cafe' | 'transport' | 'work' | 'custom';

export type AudioSlotType = 'wordNormal' | 'wordSlow' | 'sentenceNormal' | 'sentenceSlow';

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
}

export interface DialogueLine {
  id: string;
  speaker: 'A' | 'B';
  speakerName: string;
  czech: string;
  phonetic: string;
  mongolian: string;
  audioId?: string;
}

export interface Dialogue {
  id: string;
  topicId: TopicId;
  titleMn: string;
  titleCz: string;
  situationMn: string;
  fullAudioId?: string;
  lines: DialogueLine[];
}

export interface StoredAudioMeta {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: number;
}

export type ActiveTab = 'practice' | 'dialogues' | 'ai' | 'topics' | 'library';
