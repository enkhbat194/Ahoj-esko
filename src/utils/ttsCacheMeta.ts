export type AudioCacheQualityStatus = 'generated' | 'verified' | 'fallback';

export interface TtsAudioCacheMetadata {
  audioId: string;
  czechText: string;
  language: 'cs' | 'mn';
  voiceId: string;
  modelId: string;
  slow: boolean;
  audioFormat: string;
  storagePath: string;
  isPersistentStorage: boolean;
  createdTimestamp: number;
  sourceConversationId?: string;
  qualityStatus: AudioCacheQualityStatus;
}

export const PRIMARY_TTS_MODEL_ID = 'gemini-3.8-flash-lite-tts';

export function hashTtsKey(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

export function buildTtsCacheId(params: {
  text: string;
  language?: 'cs' | 'mn';
  voiceId?: string;
  modelId?: string;
  slow?: boolean;
}): string {
  const normalizedText = params.text.trim();
  const language = params.language ?? 'cs';
  const voiceId = params.voiceId ?? 'Zephyr';
  const modelId = params.modelId ?? PRIMARY_TTS_MODEL_ID;
  const speed = params.slow ? 'slow' : 'norm';
  const keyPayload = `${modelId}|${language}|${voiceId}|${speed}|${normalizedText}`;
  return `ai_tts_${voiceId}_${speed}_${hashTtsKey(keyPayload)}`;
}
