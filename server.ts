import 'dotenv/config';
import { createServer } from 'http';
import express from 'express';
import path from 'path';
import {
  GoogleGenAI,
  ThinkingLevel,
  Type,
  type GenerateContentParameters,
  type GenerateContentResponse,
} from '@google/genai';
import {
  buildTokenUsageMetrics,
  extractUsageCounts,
  type GeminiRawUsageMetadata,
  type TokenUsageMetrics,
} from './src/utils/tokenPricing.ts';
import {
  buildTtsCacheId,
  PRIMARY_TTS_MODEL_ID,
  type TtsAudioCacheMetadata,
} from './src/utils/ttsCacheMeta.ts';
import {
  aggregateUsageTotals,
  checkUsageLimits,
  DEFAULT_USAGE_LIMITS,
  getDayKey,
  getMonthKey,
  type UsageLimitConfig,
  type UsageLogEntry,
  type UsageSummaryResponse,
} from './src/utils/usageMonitor.ts';

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

// Low-cost model policy: Gemini 4 Hydrogen is excluded from all defaults and fallbacks.
const PRIMARY_TEXT_MODEL = 'gemini-3.1-flash-lite';
const PREFERRED_FALLBACK_TEXT_MODEL = 'gemini-2.5-flash-lite';
const SECONDARY_FALLBACK_TEXT_MODEL = 'gemini-3.5-flash-lite';
const PRIMARY_TTS_MODEL = PRIMARY_TTS_MODEL_ID; // 'gemini-3.8-flash-lite-tts'

let cachedFallbackTextModel: string | null = null;

function getAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY тохируулаагүй байна. Settings > Secrets хэсгээс шалгана уу.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isQuotaOrTransientError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('503') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('404') ||
    msg.includes('NOT_FOUND')
  );
}

async function resolveFallbackTextModel(ai: GoogleGenAI): Promise<string> {
  if (cachedFallbackTextModel) return cachedFallbackTextModel;
  try {
    await ai.models.get({ model: PREFERRED_FALLBACK_TEXT_MODEL });
    cachedFallbackTextModel = PREFERRED_FALLBACK_TEXT_MODEL;
  } catch {
    cachedFallbackTextModel = SECONDARY_FALLBACK_TEXT_MODEL;
  }
  return cachedFallbackTextModel;
}

async function generateLowCostContent(
  ai: GoogleGenAI,
  params: Omit<GenerateContentParameters, 'model'> & { maxOutputTokens: number }
): Promise<{ response: GenerateContentResponse; usedModel: string }> {
  const tryModel = async (
    model: string,
    useMinimalThinking: boolean
  ): Promise<GenerateContentResponse> => {
    const config = {
      ...params.config,
      maxOutputTokens: params.maxOutputTokens,
      ...(useMinimalThinking
        ? { thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL } }
        : {}),
    };
    return ai.models.generateContent({
      model,
      contents: params.contents,
      config,
    });
  };

  try {
    const response = await tryModel(PRIMARY_TEXT_MODEL, true);
    return { response, usedModel: PRIMARY_TEXT_MODEL };
  } catch (primaryErr) {
    if (!isQuotaOrTransientError(primaryErr)) {
      throw primaryErr;
    }
    const fallbackModel = await resolveFallbackTextModel(ai);
    const useMinimal = fallbackModel !== 'gemini-2.5-flash-lite';
    try {
      const response = await tryModel(fallbackModel, useMinimal);
      return { response, usedModel: fallbackModel };
    } catch (fallbackErr) {
      if (!isQuotaOrTransientError(fallbackErr)) {
        throw fallbackErr;
      }
      await new Promise((resolve) => setTimeout(resolve, 900));
      const response = await tryModel(fallbackModel, useMinimal);
      return { response, usedModel: fallbackModel };
    }
  }
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const msg = err instanceof Error ? err.message : 'AI хүсэлт амжилтгүй боллоо.';
  if (msg.includes('403') || msg.includes('PERMISSION_DENIED') || msg.includes('API_KEY')) {
    return {
      status: 403,
      message: 'Gemini API түлхүүр хүчингүй эсвэл тохируулаагүй байна. Settings > Secrets хэсгийг шалгана уу.',
    };
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: 'Минутын үнэгүй квот түр дүүрсэн байна. Хэдхэн секунд хүлээгээд дахин оролдоно уу (хадгалсан карт болон аудио офлайнаар ажиллана).',
    };
  }
  return { status: 500, message: msg };
}

// Temporary bounded in-memory TTS cache (non-persistent across server restarts; browser IndexedDB provides persistent device cache)
interface MemoryTtsCacheEntry {
  base64Audio: string;
  meta: TtsAudioCacheMetadata;
}
const MAX_MEMORY_TTS_CACHE = 200;
const memoryTtsCache = new Map<string, MemoryTtsCacheEntry>();

function getMemoryTtsCache(audioId: string): MemoryTtsCacheEntry | undefined {
  const hit = memoryTtsCache.get(audioId);
  if (hit) {
    memoryTtsCache.delete(audioId);
    memoryTtsCache.set(audioId, hit);
  }
  return hit;
}

function setMemoryTtsCache(audioId: string, entry: MemoryTtsCacheEntry): void {
  if (memoryTtsCache.size >= MAX_MEMORY_TTS_CACHE) {
    const oldestKey = memoryTtsCache.keys().next().value;
    if (oldestKey) memoryTtsCache.delete(oldestKey);
  }
  memoryTtsCache.set(audioId, entry);
}

// Server session-memory Usage Monitor & Configurable Budget Limits
const usageLogs: UsageLogEntry[] = [];
const usageLimits: UsageLimitConfig = {
  dailyCostLimitUsd: Number(process.env.DAILY_COST_LIMIT_USD) || DEFAULT_USAGE_LIMITS.dailyCostLimitUsd,
  monthlyCostLimitUsd:
    Number(process.env.MONTHLY_COST_LIMIT_USD) || DEFAULT_USAGE_LIMITS.monthlyCostLimitUsd,
  dailyTokenLimit: Number(process.env.DAILY_TOKEN_LIMIT) || DEFAULT_USAGE_LIMITS.dailyTokenLimit,
  monthlyTokenLimit: Number(process.env.MONTHLY_TOKEN_LIMIT) || DEFAULT_USAGE_LIMITS.monthlyTokenLimit,
};

function getUsageSummary(): UsageSummaryResponse {
  const now = Date.now();
  const todayKey = getDayKey(now);
  const monthKey = getMonthKey(now);
  const today = aggregateUsageTotals(usageLogs, (e) => getDayKey(e.timestamp) === todayKey);
  const month = aggregateUsageTotals(usageLogs, (e) => getMonthKey(e.timestamp) === monthKey);
  const status = checkUsageLimits(today, month, usageLimits);

  return {
    today,
    month,
    limits: { ...usageLimits },
    limitReached: !status.allowed,
    limitReason: status.reason,
    storageType: 'session-memory',
    isFreeTierEstimate: true,
    recentLogs: usageLogs.slice(0, 40),
  };
}

function recordUsageEntry(entry: Omit<UsageLogEntry, 'id' | 'timestamp'>): void {
  usageLogs.unshift({
    ...entry,
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
  });
  if (usageLogs.length > 1000) {
    usageLogs.length = 1000;
  }
}

function enforceBudgetLimit(endpoint: string, res: express.Response): boolean {
  const summary = getUsageSummary();
  if (summary.limitReached) {
    const reason = summary.limitReason || 'AI зардлын хязгаарт хүрлээ.';
    recordUsageEntry({
      endpoint,
      usedModel: 'budget-guard',
      inputTokens: 0,
      outputTokens: 0,
      thinkingTokens: 0,
      cachedTokens: 0,
      totalTokens: 0,
      ttsAudioGenerated: false,
      requestDurationMs: 0,
      cacheHit: false,
      estimatedCostUsd: 0,
      apiError: reason,
    });
    res.status(429).json({ error: reason, limitReached: true });
    return false;
  }
  return true;
}

const ALLOWED_VOICES = new Set(['Zephyr', 'Kore', 'Puck', 'Charon', 'Fenrir']);

async function generateLowCostSpeech(params: {
  text: string;
  slow?: boolean;
  language?: 'cs' | 'mn';
  voiceName?: string;
  sourceConversationId?: string;
}): Promise<{
  audioId: string;
  base64Audio: string;
  mimeType: string;
  cacheHit: boolean;
  cacheMeta: TtsAudioCacheMetadata;
  usageMetadata?: GeminiRawUsageMetadata;
}> {
  const cleanText = params.text.trim();
  const language = params.language ?? 'cs';
  const slow = Boolean(params.slow);
  const chosenVoice =
    params.voiceName && ALLOWED_VOICES.has(params.voiceName) ? params.voiceName : 'Zephyr';

  const audioId = buildTtsCacheId({
    text: cleanText,
    language,
    voiceId: chosenVoice,
    modelId: PRIMARY_TTS_MODEL,
    slow,
  });

  // Check temporary server cache before calling TTS API
  const cached = getMemoryTtsCache(audioId);
  if (cached) {
    return {
      audioId,
      base64Audio: cached.base64Audio,
      mimeType: cached.meta.audioFormat,
      cacheHit: true,
      cacheMeta: cached.meta,
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY тохируулаагүй байна.');
  }

  const style =
    language === 'mn'
      ? 'Warm, gentle, natural native Mongolian speaker from Ulaanbaatar'
      : slow
        ? 'Warm, patient Prague Czech speaker, slow and clear articulation'
        : 'Warm, relaxed Prague Czech speaker in natural everyday conversation';

  let base64Audio: string | undefined;
  let usageMetadata: GeminiRawUsageMetadata | undefined;
  let lastErr: unknown;

  // Attempt 1: Official low-cost gemini-3.8-flash-lite-tts via v1alpha with speechMetadata
  try {
    const aiAlpha = new GoogleGenAI({
      apiKey,
      apiVersion: 'v1alpha',
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
    const response = await aiAlpha.models.generateContent({
      model: PRIMARY_TTS_MODEL,
      contents: [
        {
          role: 'user',
          parts: [{ text: cleanText, speechMetadata: { style } }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice },
          },
        },
      },
    });
    base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    usageMetadata = response.usageMetadata as GeminiRawUsageMetadata | undefined;
  } catch (err) {
    lastErr = err;
  }

  // Attempt 2: Plain v1beta on the same low-cost gemini-3.8-flash-lite-tts (no upgrade to expensive model)
  if (!base64Audio) {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: PRIMARY_TTS_MODEL,
        contents: cleanText,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: chosenVoice },
            },
          },
        },
      });
      base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      usageMetadata = response.usageMetadata as GeminiRawUsageMetadata | undefined;
    } catch (err) {
      lastErr = err;
    }
  }

  if (!base64Audio) {
    throw lastErr ?? new Error('Аудио үүсгэж чадсангүй.');
  }

  const meta: TtsAudioCacheMetadata = {
    audioId,
    czechText: cleanText,
    language,
    voiceId: chosenVoice,
    modelId: PRIMARY_TTS_MODEL,
    slow,
    audioFormat: 'audio/wav',
    storagePath: `memory://tts-cache/${audioId}`,
    isPersistentStorage: false,
    createdTimestamp: Date.now(),
    sourceConversationId: params.sourceConversationId,
    qualityStatus: 'generated',
  };
  setMemoryTtsCache(audioId, { base64Audio, meta });

  return {
    audioId,
    base64Audio,
    mimeType: 'audio/wav',
    cacheHit: false,
    cacheMeta: meta,
    usageMetadata,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
      primaryTextModel: PRIMARY_TEXT_MODEL,
      fallbackTextModel: cachedFallbackTextModel ?? PREFERRED_FALLBACK_TEXT_MODEL,
      primaryTtsModel: PRIMARY_TTS_MODEL,
    });
  });

  // Usage Monitor & Limit Config Endpoints
  app.get('/api/ai/usage', (_req, res) => {
    res.json(getUsageSummary());
  });

  app.post('/api/ai/usage/limits', (req, res) => {
    const body = req.body as Partial<UsageLimitConfig>;
    if (typeof body.dailyCostLimitUsd === 'number' && body.dailyCostLimitUsd >= 0) {
      usageLimits.dailyCostLimitUsd = body.dailyCostLimitUsd;
    }
    if (typeof body.monthlyCostLimitUsd === 'number' && body.monthlyCostLimitUsd >= 0) {
      usageLimits.monthlyCostLimitUsd = body.monthlyCostLimitUsd;
    }
    if (typeof body.dailyTokenLimit === 'number' && body.dailyTokenLimit >= 0) {
      usageLimits.dailyTokenLimit = Math.round(body.dailyTokenLimit);
    }
    if (typeof body.monthlyTokenLimit === 'number' && body.monthlyTokenLimit >= 0) {
      usageLimits.monthlyTokenLimit = Math.round(body.monthlyTokenLimit);
    }
    res.json(getUsageSummary());
  });

  // 1. Token-Optimized Czech-Mongolian AI Tutor
  app.post('/api/ai/tutor', async (req, res) => {
    const startedAt = Date.now();
    if (!enforceBudgetLimit('/api/ai/tutor', res)) return;

    try {
      const { scenario, history, userMessage } = req.body as {
        scenario?: string;
        history?: Array<{ role: 'user' | 'assistant'; czech: string }>;
        userMessage?: string;
      };

      if (!userMessage || !userMessage.trim()) {
        res.status(400).json({ error: 'Мессеж хоосон байна.' });
        return;
      }

      const ai = getAIClient();
      // Only send last 4 compact turns (Czech text only) to cut context tokens cleanly
      const compactHistory = (history ?? [])
        .slice(-4)
        .map((m) => `${m.role === 'user' ? 'S' : 'T'}: ${m.czech.trim()}`)
        .join('\n');

      const prompt = [
        `Сэдэв: ${scenario || 'Прага яриа'}`,
        compactHistory || '',
        `Сурагч: ${userMessage.trim()}`,
      ]
        .filter(Boolean)
        .join('\n');

      const { response, usedModel } = await generateLowCostContent(ai, {
        contents: prompt,
        maxOutputTokens: 320,
        config: {
          systemInstruction:
            'You are a Prague Czech roleplay partner & Czech coach for a Mongolian learner. Stay in character: replyCzech must be 1 natural Czech scenario reply (never talk about Mongolian grammar in replyCzech). replyPhonetic = Mongolian Cyrillic sound guide. replyMongolian = Mongolian translation. coachingTipMn = 1 concise tip strictly in Mongolian Cyrillic explaining any Czech grammar/case mistake (e.g., jednu kávu). suggestedReplyCzech + suggestedReplyMn = next natural Czech reply + Mongolian.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              replyCzech: { type: Type.STRING },
              replyPhonetic: { type: Type.STRING },
              replyMongolian: { type: Type.STRING },
              hasError: { type: Type.BOOLEAN },
              coachingTipMn: { type: Type.STRING },
              suggestedReplyCzech: { type: Type.STRING },
              suggestedReplyMn: { type: Type.STRING },
            },
            required: [
              'replyCzech',
              'replyPhonetic',
              'replyMongolian',
              'hasError',
              'coachingTipMn',
              'suggestedReplyCzech',
              'suggestedReplyMn',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      const durationMs = Date.now() - startedAt;
      const usage = buildTokenUsageMetrics({
        chatUsage: response.usageMetadata as GeminiRawUsageMetadata | undefined,
        hasAudioInput: false,
        usedModel,
        ttsGenerated: false,
        cacheHit: false,
        durationMs,
      });

      recordUsageEntry({
        endpoint: '/api/ai/tutor',
        usedModel,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        thinkingTokens: usage.thinkingTokens,
        cachedTokens: usage.cachedTokens,
        totalTokens: usage.totalTokens,
        ttsAudioGenerated: false,
        requestDurationMs: durationMs,
        cacheHit: false,
        estimatedCostUsd: usage.estimatedCostUsd,
      });

      res.json({ ...parsed, usage });
    } catch (err) {
      const { status, message } = formatGeminiError(err);
      recordUsageEntry({
        endpoint: '/api/ai/tutor',
        usedModel: PRIMARY_TEXT_MODEL,
        inputTokens: 0,
        outputTokens: 0,
        thinkingTokens: 0,
        cachedTokens: 0,
        totalTokens: 0,
        ttsAudioGenerated: false,
        requestDurationMs: Date.now() - startedAt,
        cacheHit: false,
        estimatedCostUsd: 0,
        apiError: message,
      });
      res.status(status).json({ error: message });
    }
  });

  // 2. Generate New Czech-Mongolian Flashcard
  app.post('/api/ai/generate-card', async (req, res) => {
    const startedAt = Date.now();
    if (!enforceBudgetLimit('/api/ai/generate-card', res)) return;

    try {
      const { promptText } = req.body as { promptText?: string };
      if (!promptText || !promptText.trim()) {
        res.status(400).json({ error: 'Үг эсвэл сэдэв оруулна уу.' });
        return;
      }

      const ai = getAIClient();
      const { response, usedModel } = await generateLowCostContent(ai, {
        contents: `Сэдэв: "${promptText.trim()}"`,
        maxOutputTokens: 260,
        config: {
          systemInstruction:
            'Create 1 everyday Czech-Mongolian flashcard as JSON: czechWord, phoneticHint (Mongolian Cyrillic), mongolianWord, czechSentence, mongolianSentence.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              czechWord: { type: Type.STRING },
              phoneticHint: { type: Type.STRING },
              mongolianWord: { type: Type.STRING },
              czechSentence: { type: Type.STRING },
              mongolianSentence: { type: Type.STRING },
            },
            required: [
              'czechWord',
              'phoneticHint',
              'mongolianWord',
              'czechSentence',
              'mongolianSentence',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      const durationMs = Date.now() - startedAt;
      const usage = buildTokenUsageMetrics({
        chatUsage: response.usageMetadata as GeminiRawUsageMetadata | undefined,
        usedModel,
        durationMs,
      });

      recordUsageEntry({
        endpoint: '/api/ai/generate-card',
        usedModel,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        thinkingTokens: usage.thinkingTokens,
        cachedTokens: usage.cachedTokens,
        totalTokens: usage.totalTokens,
        ttsAudioGenerated: false,
        requestDurationMs: durationMs,
        cacheHit: false,
        estimatedCostUsd: usage.estimatedCostUsd,
      });

      res.json({ ...parsed, usage });
    } catch (err) {
      const { status, message } = formatGeminiError(err);
      recordUsageEntry({
        endpoint: '/api/ai/generate-card',
        usedModel: PRIMARY_TEXT_MODEL,
        inputTokens: 0,
        outputTokens: 0,
        thinkingTokens: 0,
        cachedTokens: 0,
        totalTokens: 0,
        ttsAudioGenerated: false,
        requestDurationMs: Date.now() - startedAt,
        cacheHit: false,
        estimatedCostUsd: 0,
        apiError: message,
      });
      res.status(status).json({ error: message });
    }
  });

  // 3. Evaluate Pronunciation (Audio) OR Recheck Grammar Only (Edited Text — never fakes pronunciation score)
  app.post('/api/ai/evaluate-speech', async (req, res) => {
    const startedAt = Date.now();
    if (!enforceBudgetLimit('/api/ai/evaluate-speech', res)) return;

    try {
      const { audioBase64, mimeType, targetCzech, editedText, sttTranscript, mode } = req.body as {
        audioBase64?: string;
        mimeType?: string;
        targetCzech?: string;
        editedText?: string;
        sttTranscript?: string;
        mode?: 'audio' | 'text-recheck';
      };

      if (!targetCzech) {
        res.status(400).json({ error: 'Зорилтот чех өгүүлбэр шаардлагатай.' });
        return;
      }

      const ai = getAIClient();
      const isTextOnly = mode === 'text-recheck' || (!audioBase64 && Boolean(editedText));

      if (isTextOnly) {
        if (!editedText || !editedText.trim()) {
          res.status(400).json({ error: 'Шалгах текст хоосон байна.' });
          return;
        }

        const { response, usedModel } = await generateLowCostContent(ai, {
          contents: `Target: "${targetCzech}"\nStudent edited text: "${editedText.trim()}"`,
          maxOutputTokens: 240,
          config: {
            systemInstruction:
              'Check Czech grammar/case/spelling ONLY between student editedText and targetCzech. Never invent pronunciation scores. Write feedbackMn strictly in Mongolian Cyrillic (Mongolian language). Return JSON.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                grammarIssue: { type: Type.BOOLEAN },
                feedbackMn: { type: Type.STRING },
              },
              required: ['grammarIssue', 'feedbackMn'],
            },
          },
        });

        const parsed = JSON.parse((response.text ?? '{}').trim()) as {
          grammarIssue?: boolean;
          feedbackMn?: string;
        };
        const durationMs = Date.now() - startedAt;
        const usage = buildTokenUsageMetrics({
          chatUsage: response.usageMetadata as GeminiRawUsageMetadata | undefined,
          hasAudioInput: false,
          usedModel,
          durationMs,
        });

        recordUsageEntry({
          endpoint: '/api/ai/evaluate-speech',
          usedModel,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          thinkingTokens: usage.thinkingTokens,
          cachedTokens: usage.cachedTokens,
          totalTokens: usage.totalTokens,
          ttsAudioGenerated: false,
          requestDurationMs: durationMs,
          cacheHit: false,
          estimatedCostUsd: usage.estimatedCostUsd,
        });

        res.json({
          pronunciationScore: null,
          score: null,
          heardText: editedText.trim(),
          sttTranscript: editedText.trim(),
          grammarIssue: Boolean(parsed.grammarIssue),
          pronunciationIssue: false,
          recognitionUncertainty: false,
          feedbackMn: parsed.feedbackMn ?? '',
          usage,
        });
        return;
      }

      if (!audioBase64) {
        res.status(400).json({ error: 'Аудио бичлэг шаардлагатай.' });
        return;
      }

      const sttHint = sttTranscript ? ` STT transcript: "${sttTranscript}".` : '';
      const { response, usedModel } = await generateLowCostContent(ai, {
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'audio/webm',
                data: audioBase64,
              },
            },
            {
              text: `Target Czech: "${targetCzech}".${sttHint} Listen carefully to the actual audio. Distinguish acoustic pronunciation vs grammar vs STT recognition uncertainty (e.g., if user actually said "${targetCzech}" or "kávu" acoustically even if STT misheard "káva", set recognitionUncertainty=true and do NOT penalize pronunciation). Give brief Mongolian feedbackMn.`,
            },
          ],
        },
        maxOutputTokens: 320,
        config: {
          systemInstruction:
            'Czech pronunciation coach evaluating learner audio for a Mongolian speaker. Separate pronunciationIssue, grammarIssue, and recognitionUncertainty. Never confuse STT misrecognition with pronunciation error. Write feedbackMn strictly in Mongolian Cyrillic. Return JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pronunciationScore: { type: Type.INTEGER },
              heardText: { type: Type.STRING },
              grammarIssue: { type: Type.BOOLEAN },
              pronunciationIssue: { type: Type.BOOLEAN },
              recognitionUncertainty: { type: Type.BOOLEAN },
              feedbackMn: { type: Type.STRING },
            },
            required: [
              'pronunciationScore',
              'heardText',
              'grammarIssue',
              'pronunciationIssue',
              'recognitionUncertainty',
              'feedbackMn',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        pronunciationScore?: number;
        heardText?: string;
        grammarIssue?: boolean;
        pronunciationIssue?: boolean;
        recognitionUncertainty?: boolean;
        feedbackMn?: string;
      };
      const durationMs = Date.now() - startedAt;
      const usage = buildTokenUsageMetrics({
        chatUsage: response.usageMetadata as GeminiRawUsageMetadata | undefined,
        hasAudioInput: true,
        usedModel,
        durationMs,
      });

      recordUsageEntry({
        endpoint: '/api/ai/evaluate-speech',
        usedModel,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        thinkingTokens: usage.thinkingTokens,
        cachedTokens: usage.cachedTokens,
        totalTokens: usage.totalTokens,
        ttsAudioGenerated: false,
        requestDurationMs: durationMs,
        cacheHit: false,
        estimatedCostUsd: usage.estimatedCostUsd,
      });

      res.json({
        pronunciationScore: parsed.pronunciationScore ?? 0,
        score: parsed.pronunciationScore ?? 0,
        heardText: parsed.heardText ?? '',
        sttTranscript: sttTranscript ?? parsed.heardText ?? '',
        grammarIssue: Boolean(parsed.grammarIssue),
        pronunciationIssue: Boolean(parsed.pronunciationIssue),
        recognitionUncertainty: Boolean(parsed.recognitionUncertainty),
        feedbackMn: parsed.feedbackMn ?? '',
        usage,
      });
    } catch (err) {
      const { status, message } = formatGeminiError(err);
      recordUsageEntry({
        endpoint: '/api/ai/evaluate-speech',
        usedModel: PRIMARY_TEXT_MODEL,
        inputTokens: 0,
        outputTokens: 0,
        thinkingTokens: 0,
        cachedTokens: 0,
        totalTokens: 0,
        ttsAudioGenerated: false,
        requestDurationMs: Date.now() - startedAt,
        cacheHit: false,
        estimatedCostUsd: 0,
        apiError: message,
      });
      res.status(status).json({ error: message });
    }
  });

  // 4. Low-Cost Cached Czech/Mongolian TTS Endpoint (gemini-3.8-flash-lite-tts)
  app.post('/api/ai/tts', async (req, res) => {
    const startedAt = Date.now();
    try {
      const { text, slow, voiceName, language, sourceConversationId } = req.body as {
        text?: string;
        slow?: boolean;
        voiceName?: string;
        language?: 'cs' | 'mn';
        sourceConversationId?: string;
      };
      if (!text || !text.trim()) {
        res.status(400).json({ error: 'Унших текст хоосон байна.' });
        return;
      }

      // Allow cache hits even if budget limit was reached; only enforce budget when generating fresh TTS!
      const previewCacheId = buildTtsCacheId({
        text: text.trim(),
        language: language ?? 'cs',
        voiceId: voiceName && ALLOWED_VOICES.has(voiceName) ? voiceName : 'Zephyr',
        modelId: PRIMARY_TTS_MODEL,
        slow: Boolean(slow),
      });
      if (!getMemoryTtsCache(previewCacheId)) {
        if (!enforceBudgetLimit('/api/ai/tts', res)) return;
      }

      const result = await generateLowCostSpeech({
        text,
        slow,
        language,
        voiceName,
        sourceConversationId,
      });
      const durationMs = Date.now() - startedAt;
      const usage = buildTokenUsageMetrics({
        ttsUsages: result.usageMetadata ? [result.usageMetadata] : [],
        ttsModel: PRIMARY_TTS_MODEL,
        ttsGenerated: !result.cacheHit,
        cacheHit: result.cacheHit,
        durationMs,
      });

      recordUsageEntry({
        endpoint: '/api/ai/tts',
        usedModel: PRIMARY_TTS_MODEL,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        thinkingTokens: usage.thinkingTokens,
        cachedTokens: usage.cachedTokens,
        totalTokens: usage.totalTokens,
        ttsAudioGenerated: !result.cacheHit,
        requestDurationMs: durationMs,
        cacheHit: result.cacheHit,
        estimatedCostUsd: usage.estimatedCostUsd,
      });

      res.json({
        audioBase64: result.base64Audio,
        mimeType: result.mimeType,
        audioId: result.audioId,
        cacheHit: result.cacheHit,
        cacheMeta: result.cacheMeta,
        usage,
      });
    } catch (err) {
      const { status, message } = formatGeminiError(err);
      recordUsageEntry({
        endpoint: '/api/ai/tts',
        usedModel: PRIMARY_TTS_MODEL,
        inputTokens: 0,
        outputTokens: 0,
        thinkingTokens: 0,
        cachedTokens: 0,
        totalTokens: 0,
        ttsAudioGenerated: false,
        requestDurationMs: Date.now() - startedAt,
        cacheHit: false,
        estimatedCostUsd: 0,
        apiError: message,
      });
      res.status(status).json({ error: message });
    }
  });

  // 5. Hands-Free Voice-to-Voice AI Czech Tutor (audio in -> recognition + grammar separation -> cached lite TTS)
  app.post('/api/ai/voice-tutor', async (req, res) => {
    const startedAt = Date.now();
    if (!enforceBudgetLimit('/api/ai/voice-tutor', res)) return;

    try {
      const {
        audioBase64,
        mimeType,
        scenario,
        history,
        speakCoaching,
        voiceName,
        conversationId,
      } = req.body as {
        audioBase64?: string;
        mimeType?: string;
        scenario?: string;
        history?: Array<{ role: 'user' | 'assistant'; czech: string }>;
        speakCoaching?: boolean;
        voiceName?: string;
        conversationId?: string;
      };

      if (!audioBase64) {
        res.status(400).json({ error: 'Аудио бичлэг хоосон байна.' });
        return;
      }

      const ai = getAIClient();
      const compactHistory = (history ?? [])
        .slice(-4)
        .map((m) => `${m.role === 'user' ? 'S' : 'T'}: ${m.czech.trim()}`)
        .join('\n');

      const prompt = [
        `Сэдэв: ${scenario || 'Прага яриа'}`,
        compactHistory || '',
        'Listen to student audio. Transcribe exact spoken Czech/Mongolian in studentTranscript. Set recognitionUncertainty=true if audio is ambiguous. Set hasError=true only for real grammar/pronunciation mistakes (explain concisely in Mongolian Cyrillic coachingTipMn). Reply naturally in 1 Czech sentence (replyCzech + replyPhonetic + replyMongolian + suggestedReplyCzech + suggestedReplyMn).',
      ]
        .filter(Boolean)
        .join('\n');

      const { response, usedModel } = await generateLowCostContent(ai, {
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'audio/webm',
                data: audioBase64,
              },
            },
            { text: prompt },
          ],
        },
        maxOutputTokens: 360,
        config: {
          systemInstruction:
            'Prague Czech roleplay partner & Czech coach for a Mongolian speaker. Transcribe studentTranscript accurately, separate recognitionUncertainty from real Czech errors. replyCzech = 1 natural Czech scenario reply. replyMongolian and coachingTipMn MUST be in Mongolian Cyrillic. Return JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              studentTranscript: { type: Type.STRING },
              hasError: { type: Type.BOOLEAN },
              recognitionUncertainty: { type: Type.BOOLEAN },
              coachingTipMn: { type: Type.STRING },
              replyCzech: { type: Type.STRING },
              replyPhonetic: { type: Type.STRING },
              replyMongolian: { type: Type.STRING },
              suggestedReplyCzech: { type: Type.STRING },
              suggestedReplyMn: { type: Type.STRING },
            },
            required: [
              'studentTranscript',
              'hasError',
              'recognitionUncertainty',
              'coachingTipMn',
              'replyCzech',
              'replyPhonetic',
              'replyMongolian',
              'suggestedReplyCzech',
              'suggestedReplyMn',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        studentTranscript?: string;
        hasError?: boolean;
        recognitionUncertainty?: boolean;
        coachingTipMn?: string;
        replyCzech?: string;
        replyPhonetic?: string;
        replyMongolian?: string;
        suggestedReplyCzech?: string;
        suggestedReplyMn?: string;
      };

      const replyCzech = (parsed.replyCzech || '').trim() || 'Můžete to prosím zopakovat?';
      const coachingText = (parsed.coachingTipMn || '').trim();
      const shouldSpeakCoaching = Boolean(speakCoaching && parsed.hasError && coachingText);

      const [replyAudioRes, coachingAudioRes] = await Promise.allSettled([
        generateLowCostSpeech({
          text: replyCzech,
          slow: false,
          language: 'cs',
          voiceName,
          sourceConversationId: conversationId,
        }),
        shouldSpeakCoaching
          ? generateLowCostSpeech({
              text: coachingText,
              slow: false,
              language: 'mn',
              voiceName,
              sourceConversationId: conversationId,
            })
          : Promise.resolve(null),
      ]);

      const ttsUsages: Array<GeminiRawUsageMetadata | undefined> = [];
      let ttsGenerated = false;
      let anyCacheHit = false;
      let replyAudioId: string | undefined;

      if (replyAudioRes.status === 'fulfilled') {
        replyAudioId = replyAudioRes.value.audioId;
        if (replyAudioRes.value.cacheHit) anyCacheHit = true;
        else ttsGenerated = true;
        if (replyAudioRes.value.usageMetadata) {
          ttsUsages.push(replyAudioRes.value.usageMetadata);
        }
      }
      if (coachingAudioRes.status === 'fulfilled' && coachingAudioRes.value) {
        if (coachingAudioRes.value.cacheHit) anyCacheHit = true;
        else ttsGenerated = true;
        if (coachingAudioRes.value.usageMetadata) {
          ttsUsages.push(coachingAudioRes.value.usageMetadata);
        }
      }

      const durationMs = Date.now() - startedAt;
      const usage = buildTokenUsageMetrics({
        chatUsage: response.usageMetadata as GeminiRawUsageMetadata | undefined,
        ttsUsages,
        hasAudioInput: true,
        usedModel,
        ttsModel: PRIMARY_TTS_MODEL,
        ttsGenerated,
        cacheHit: anyCacheHit && !ttsGenerated,
        durationMs,
      });

      const chatCounts = extractUsageCounts(
        response.usageMetadata as GeminiRawUsageMetadata | undefined
      );

      recordUsageEntry({
        endpoint: '/api/ai/voice-tutor',
        usedModel: ttsGenerated ? `${usedModel}+${PRIMARY_TTS_MODEL}` : usedModel,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        thinkingTokens: chatCounts.thinkingTokens,
        cachedTokens: chatCounts.cachedTokens,
        totalTokens: usage.totalTokens,
        ttsAudioGenerated: ttsGenerated,
        requestDurationMs: durationMs,
        cacheHit: anyCacheHit && !ttsGenerated,
        estimatedCostUsd: usage.estimatedCostUsd,
      });

      res.json({
        ...parsed,
        replyCzech,
        replyAudioId,
        replyAudioBase64:
          replyAudioRes.status === 'fulfilled' ? replyAudioRes.value.base64Audio : undefined,
        coachingAudioBase64:
          coachingAudioRes.status === 'fulfilled' && coachingAudioRes.value
            ? coachingAudioRes.value.base64Audio
            : undefined,
        audioMimeType: 'audio/wav',
        usage,
      });
    } catch (err) {
      const { status, message } = formatGeminiError(err);
      recordUsageEntry({
        endpoint: '/api/ai/voice-tutor',
        usedModel: PRIMARY_TEXT_MODEL,
        inputTokens: 0,
        outputTokens: 0,
        thinkingTokens: 0,
        cachedTokens: 0,
        totalTokens: 0,
        ttsAudioGenerated: false,
        requestDurationMs: Date.now() - startedAt,
        cacheHit: false,
        estimatedCostUsd: 0,
        apiError: message,
      });
      res.status(status).json({ error: message });
    }
  });

  const httpServer = createServer(app);

  if (isProduction) {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Ahoj Česko server listening on http://localhost:${PORT}`);
  });
}

void startServer();
