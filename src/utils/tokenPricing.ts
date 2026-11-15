export interface TokenUsageMetrics {
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
  cachedTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  usedModel?: string;
  ttsModel?: string;
  ttsGenerated?: boolean;
  cacheHit?: boolean;
  durationMs?: number;
}

export interface GeminiRawUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  thoughtsTokenCount?: number;
  cachedContentTokenCount?: number;
  totalTokenCount?: number;
}

// Estimated pay-as-you-go API reference rates (USD per 1,000,000 tokens)
// for low-cost Gemini Flash-Lite & Flash-Lite-TTS models.
// IMPORTANT: When running on AI Studio Free Tier within quota, actual billed cost is $0.00.
// This is an estimated cost monitor only — NOT an actual billing statement.
export const GEMINI_MODEL_RATES_PER_MILLION: Record<
  string,
  { textInput: number; audioInput: number; cachedInput: number; output: number }
> = {
  'gemini-3.1-flash-lite': {
    textInput: 0.075,
    audioInput: 0.3,
    cachedInput: 0.0075,
    output: 0.3,
  },
  'gemini-2.5-flash-lite': {
    textInput: 0.1,
    audioInput: 0.3,
    cachedInput: 0.01,
    output: 0.4,
  },
  'gemini-3.5-flash-lite': {
    textInput: 0.075,
    audioInput: 0.3,
    cachedInput: 0.0075,
    output: 0.3,
  },
  'gemini-3.8-flash-lite-tts': {
    textInput: 0.25,
    audioInput: 0.25,
    cachedInput: 0.025,
    output: 5.0,
  },
};

const DEFAULT_TEXT_RATE = GEMINI_MODEL_RATES_PER_MILLION['gemini-3.1-flash-lite'];
const DEFAULT_TTS_RATE = GEMINI_MODEL_RATES_PER_MILLION['gemini-3.8-flash-lite-tts'];

export function extractUsageCounts(usage?: GeminiRawUsageMetadata | null): {
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
  cachedTokens: number;
  totalTokens: number;
} {
  if (!usage) {
    return {
      inputTokens: 0,
      outputTokens: 0,
      thinkingTokens: 0,
      cachedTokens: 0,
      totalTokens: 0,
    };
  }
  const inputTokens = Math.max(0, Math.round(usage.promptTokenCount ?? 0));
  const candidates = Math.max(0, Math.round(usage.candidatesTokenCount ?? 0));
  const thinkingTokens = Math.max(0, Math.round(usage.thoughtsTokenCount ?? 0));
  const cachedTokens = Math.max(0, Math.round(usage.cachedContentTokenCount ?? 0));
  const computedOutput = candidates + thinkingTokens;
  const rawTotal = Math.max(0, Math.round(usage.totalTokenCount ?? inputTokens + computedOutput));
  const outputTokens = computedOutput > 0 ? computedOutput : Math.max(0, rawTotal - inputTokens);
  const totalTokens = rawTotal > 0 ? rawTotal : inputTokens + outputTokens;

  return { inputTokens, outputTokens, thinkingTokens, cachedTokens, totalTokens };
}

export function calculateTurnCostUsd(params: {
  chatModel?: string;
  chatInputTokens: number;
  chatCachedTokens?: number;
  chatOutputTokens: number;
  ttsModel?: string;
  ttsInputTokens?: number;
  ttsOutputTokens?: number;
  hasAudioInput?: boolean;
}): number {
  const textRate =
    (params.chatModel && GEMINI_MODEL_RATES_PER_MILLION[params.chatModel]) || DEFAULT_TEXT_RATE;
  const ttsRate =
    (params.ttsModel && GEMINI_MODEL_RATES_PER_MILLION[params.ttsModel]) || DEFAULT_TTS_RATE;

  const cachedTokens = Math.min(
    Math.max(0, params.chatCachedTokens ?? 0),
    Math.max(0, params.chatInputTokens)
  );
  const uncachedInput = Math.max(0, params.chatInputTokens - cachedTokens);
  const chatInRate = params.hasAudioInput ? textRate.audioInput : textRate.textInput;

  const chatCost =
    (uncachedInput / 1_000_000) * chatInRate +
    (cachedTokens / 1_000_000) * textRate.cachedInput +
    (Math.max(0, params.chatOutputTokens) / 1_000_000) * textRate.output;

  const ttsCost =
    (Math.max(0, params.ttsInputTokens ?? 0) / 1_000_000) * ttsRate.textInput +
    (Math.max(0, params.ttsOutputTokens ?? 0) / 1_000_000) * ttsRate.output;

  return Number((chatCost + ttsCost).toFixed(7));
}

export function buildTokenUsageMetrics(params: {
  chatUsage?: GeminiRawUsageMetadata | null;
  ttsUsages?: Array<GeminiRawUsageMetadata | null | undefined>;
  hasAudioInput?: boolean;
  usedModel?: string;
  ttsModel?: string;
  ttsGenerated?: boolean;
  cacheHit?: boolean;
  durationMs?: number;
}): TokenUsageMetrics {
  const chat = extractUsageCounts(params.chatUsage);
  let ttsInput = 0;
  let ttsOutput = 0;
  let ttsThinking = 0;
  let ttsCached = 0;
  let ttsTotal = 0;

  for (const u of params.ttsUsages ?? []) {
    const counts = extractUsageCounts(u);
    ttsInput += counts.inputTokens;
    ttsOutput += counts.outputTokens;
    ttsThinking += counts.thinkingTokens;
    ttsCached += counts.cachedTokens;
    ttsTotal += counts.totalTokens;
  }

  return {
    inputTokens: chat.inputTokens + ttsInput,
    outputTokens: chat.outputTokens + ttsOutput,
    thinkingTokens: chat.thinkingTokens + ttsThinking,
    cachedTokens: chat.cachedTokens + ttsCached,
    totalTokens: chat.totalTokens + ttsTotal,
    estimatedCostUsd: calculateTurnCostUsd({
      chatModel: params.usedModel,
      chatInputTokens: chat.inputTokens,
      chatCachedTokens: chat.cachedTokens,
      chatOutputTokens: chat.outputTokens,
      ttsModel: params.ttsModel,
      ttsInputTokens: ttsInput,
      ttsOutputTokens: ttsOutput,
      hasAudioInput: params.hasAudioInput,
    }),
    usedModel: params.usedModel,
    ttsModel: params.ttsModel,
    ttsGenerated: params.ttsGenerated ?? ttsTotal > 0,
    cacheHit: params.cacheHit ?? false,
    durationMs: params.durationMs,
  };
}

export function sumTokenUsage(a: TokenUsageMetrics, b?: TokenUsageMetrics | null): TokenUsageMetrics {
  if (!b) return a;
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    thinkingTokens: (a.thinkingTokens ?? 0) + (b.thinkingTokens ?? 0),
    cachedTokens: (a.cachedTokens ?? 0) + (b.cachedTokens ?? 0),
    totalTokens: a.totalTokens + b.totalTokens,
    estimatedCostUsd: Number((a.estimatedCostUsd + b.estimatedCostUsd).toFixed(7)),
    usedModel: b.usedModel ?? a.usedModel,
    ttsModel: b.ttsModel ?? a.ttsModel,
    ttsGenerated: Boolean(a.ttsGenerated || b.ttsGenerated),
    cacheHit: b.cacheHit,
    durationMs: b.durationMs,
  };
}

export function formatUsdCost(usd: number): string {
  if (!Number.isFinite(usd) || usd <= 0) return '$0.0000';
  if (usd < 0.0001) return `$${usd.toFixed(6)}`;
  if (usd < 0.01) return `$${usd.toFixed(5)}`;
  return `$${usd.toFixed(4)}`;
}

export function formatTokenCount(count: number): string {
  if (!Number.isFinite(count) || count <= 0) return '0';
  return Math.round(count).toLocaleString('en-US');
}
