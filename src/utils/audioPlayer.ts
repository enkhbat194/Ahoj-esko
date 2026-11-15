import { getAudioBlob, saveAudioBlob } from './audioStorage';
import type { TokenUsageMetrics } from './tokenPricing';
import {
  buildTtsCacheId,
  PRIMARY_TTS_MODEL_ID,
  type TtsAudioCacheMetadata,
} from './ttsCacheMeta';

let sharedAudioEl: HTMLAudioElement | null = null;
let activeObjectUrl: string | null = null;
let loopTimer: number | null = null;
let playbackEpoch = 0;

// Minimal 44-byte silent WAV data URI used solely to unlock WebKit audio during a tap gesture
const SILENT_WAV_DATA_URI =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

function getUnlockedAudioElement(): HTMLAudioElement {
  if (!sharedAudioEl) {
    sharedAudioEl = new Audio();
    sharedAudioEl.setAttribute('playsinline', 'true');
  }
  return sharedAudioEl;
}

export function unlockIOSAudio() {
  try {
    const audio = getUnlockedAudioElement();
    audio.src = SILENT_WAV_DATA_URI;
    audio.muted = true;
    const p = audio.play();
    if (p && typeof p.then === 'function') {
      void p
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;
        })
        .catch(() => {
          audio.muted = false;
        });
    } else {
      audio.muted = false;
    }
  } catch {
    // Ignore unlock failures on restricted environments
  }
}

export function stopAllPlayback() {
  playbackEpoch += 1;
  if (loopTimer !== null) {
    window.clearTimeout(loopTimer);
    loopTimer = null;
  }
  if (sharedAudioEl) {
    sharedAudioEl.pause();
    sharedAudioEl.currentTime = 0;
    sharedAudioEl.onended = null;
    sharedAudioEl.onerror = null;
  }
  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to encode audio'));
        return;
      }
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

export async function playBlobAudio(
  blob: Blob,
  playbackRate = 1.0,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  stopAllPlayback();
  const audio = getUnlockedAudioElement();
  const url = URL.createObjectURL(blob);
  activeObjectUrl = url;
  audio.muted = false;
  audio.src = url;
  audio.playbackRate = playbackRate;
  onStart?.();
  return new Promise<void>((resolve) => {
    const done = () => {
      stopAllPlayback();
      onEnd?.();
      resolve();
    };
    audio.onended = done;
    audio.onerror = done;
    audio.play().catch(done);
  });
}

export async function playBase64Sequence(
  clips: Array<{ base64: string; mimeType?: string; rate?: number }>,
  shouldAbort?: () => boolean
): Promise<void> {
  for (const clip of clips) {
    if (shouldAbort?.()) break;
    if (!clip.base64) continue;
    const blob = base64ToBlob(clip.base64, clip.mimeType || 'audio/wav');
    await playBlobAudio(blob, clip.rate ?? 1.0);
  }
}

async function playStoredOrFetchedBlob(
  blob: Blob,
  playbackRate: number,
  options: { loop?: boolean; onStart?: () => void; onEnd?: () => void; replayFn: () => void },
  epoch: number
): Promise<void> {
  if (epoch !== playbackEpoch) return;
  const audio = getUnlockedAudioElement();
  const url = URL.createObjectURL(blob);
  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
  }
  activeObjectUrl = url;
  audio.muted = false;
  audio.src = url;
  audio.playbackRate = playbackRate;
  options.onStart?.();
  return new Promise<void>((resolve) => {
    audio.onended = () => {
      if (epoch !== playbackEpoch) {
        resolve();
        return;
      }
      if (options.loop) {
        loopTimer = window.setTimeout(() => {
          options.replayFn();
        }, 650);
      } else {
        stopAllPlayback();
        options.onEnd?.();
      }
      resolve();
    };
    audio.onerror = () => {
      if (epoch === playbackEpoch) {
        stopAllPlayback();
        options.onEnd?.();
      }
      resolve();
    };
    audio.play().catch(() => {
      if (epoch === playbackEpoch) {
        stopAllPlayback();
        options.onEnd?.();
      }
      resolve();
    });
  });
}

export interface PlayCzechAudioOptions {
  audioId?: string;
  fallbackAudioId?: string;
  text: string;
  rate: number;
  loop?: boolean;
  voiceName?: string;
  language?: 'cs' | 'mn';
  sourceConversationId?: string;
  useNaturalAI?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface PlayCzechAudioTelemetry {
  source: 'file' | 'ai-cache' | 'ai-tts' | 'tts' | 'visual';
  cacheHit: boolean;
  audioId?: string;
  usage?: TokenUsageMetrics;
}

export async function playCzechAudioWithTelemetry(
  options: PlayCzechAudioOptions
): Promise<PlayCzechAudioTelemetry> {
  stopAllPlayback();
  const epoch = playbackEpoch;
  const {
    audioId,
    fallbackAudioId,
    text,
    rate,
    loop = false,
    voiceName = 'Zephyr',
    language = 'cs',
    sourceConversationId,
    useNaturalAI = true,
    onStart,
    onEnd,
  } = options;

  // Prime audio element synchronously inside tap gesture for iOS Safari
  getUnlockedAudioElement();
  const targetId = audioId || fallbackAudioId;
  const effectiveRate = audioId ? 1.0 : rate;
  const isSlow = rate < 0.85;

  // 1. User-attached custom audio file
  if (targetId) {
    try {
      const blob = await getAudioBlob(targetId);
      if (blob && epoch === playbackEpoch) {
        await playStoredOrFetchedBlob(
          blob,
          effectiveRate,
          { loop, onStart, onEnd, replayFn: () => void playCzechAudio(options) },
          epoch
        );
        return { source: 'file', cacheHit: true, audioId: targetId };
      }
    } catch {
      // Fallback below
    }
  }

  // 2. Cached or fresh natural Gemini 3.8 Flash-Lite TTS voice
  if (useNaturalAI && text.trim()) {
    const cacheId = buildTtsCacheId({
      text,
      language,
      voiceId: voiceName,
      modelId: PRIMARY_TTS_MODEL_ID,
      slow: isSlow,
    });
    try {
      const cached = await getAudioBlob(cacheId);
      if (cached && epoch === playbackEpoch) {
        await playStoredOrFetchedBlob(
          cached,
          1.0,
          { loop, onStart, onEnd, replayFn: () => void playCzechAudio(options) },
          epoch
        );
        return {
          source: 'ai-cache',
          cacheHit: true,
          audioId: cacheId,
          usage: {
            inputTokens: 0,
            outputTokens: 0,
            thinkingTokens: 0,
            cachedTokens: 0,
            totalTokens: 0,
            estimatedCostUsd: 0,
            ttsModel: PRIMARY_TTS_MODEL_ID,
            ttsGenerated: false,
            cacheHit: true,
            durationMs: 0,
          },
        };
      }
    } catch {
      // Ignore IndexedDB lookup errors
    }

    if (typeof navigator === 'undefined' || navigator.onLine !== false) {
      try {
        onStart?.();
        const res = await fetch('/api/ai/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            slow: isSlow,
            voiceName,
            language,
            sourceConversationId,
          }),
        });
        if (epoch !== playbackEpoch) {
          return { source: 'ai-tts', cacheHit: false, audioId: cacheId };
        }
        if (res.ok) {
          const data = (await res.json()) as {
            audioBase64?: string;
            mimeType?: string;
            cacheHit?: boolean;
            audioId?: string;
            cacheMeta?: TtsAudioCacheMetadata;
            usage?: TokenUsageMetrics;
          };
          if (data.audioBase64 && epoch === playbackEpoch) {
            const mimeType = data.mimeType || 'audio/wav';
            const blob = base64ToBlob(data.audioBase64, mimeType);
            const persistedMeta: TtsAudioCacheMetadata = {
              audioId: cacheId,
              czechText: text.trim(),
              language,
              voiceId: voiceName,
              modelId: data.cacheMeta?.modelId || PRIMARY_TTS_MODEL_ID,
              slow: isSlow,
              audioFormat: mimeType,
              storagePath: `indexeddb://ahoj_cesko_audio_db/${cacheId}`,
              isPersistentStorage: true,
              createdTimestamp: Date.now(),
              sourceConversationId,
              qualityStatus: 'generated',
            };
            void saveAudioBlob(cacheId, blob, `${cacheId}.wav`, mimeType, persistedMeta).catch(
              () => {}
            );
            await playStoredOrFetchedBlob(
              blob,
              1.0,
              { loop, onStart: undefined, onEnd, replayFn: () => void playCzechAudio(options) },
              epoch
            );
            return {
              source: 'ai-tts',
              cacheHit: Boolean(data.cacheHit),
              audioId: cacheId,
              usage: data.usage,
            };
          }
        }
      } catch {
        // Fall back smoothly to device SpeechSynthesis if offline/error
      }
    }
  }

  if (epoch !== playbackEpoch) return { source: 'visual', cacheHit: false };

  // 3. Offline fallback: Browser SpeechSynthesis (cs-CZ)
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'cs-CZ';
      utterance.rate = rate;
      const voices = window.speechSynthesis.getVoices();
      const czechVoice = voices.find((v) => v.lang.toLowerCase().startsWith('cs'));
      if (czechVoice) {
        utterance.voice = czechVoice;
      }

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        if (loop && epoch === playbackEpoch) {
          loopTimer = window.setTimeout(() => {
            void playCzechAudio(options);
          }, 700);
        } else {
          onEnd?.();
        }
      };

      utterance.onend = finish;
      utterance.onerror = finish;
      onStart?.();
      window.speechSynthesis.speak(utterance);

      const estimatedMs = Math.max(900, Math.min(4500, Math.round((text.length * 75) / rate)));
      window.setTimeout(() => {
        if (!finished && !window.speechSynthesis.speaking) {
          finish();
        }
      }, estimatedMs);

      return { source: 'tts', cacheHit: false };
    } catch {
      // Fall through to timed visual indicator
    }
  }

  onStart?.();
  const durationMs = Math.max(850, Math.round((text.length * 70) / rate));
  loopTimer = window.setTimeout(() => {
    if (loop && epoch === playbackEpoch) {
      void playCzechAudio(options);
    } else {
      onEnd?.();
    }
  }, durationMs);
  return { source: 'visual', cacheHit: false };
}

export async function playCzechAudio(
  options: PlayCzechAudioOptions
): Promise<'file' | 'ai-cache' | 'ai-tts' | 'tts' | 'visual'> {
  const res = await playCzechAudioWithTelemetry(options);
  return res.source;
}
