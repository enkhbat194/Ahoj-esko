export interface UsageLogEntry {
  id: string;
  timestamp: number;
  endpoint: string;
  usedModel: string;
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
  cachedTokens: number;
  totalTokens: number;
  ttsAudioGenerated: boolean;
  requestDurationMs: number;
  cacheHit: boolean;
  estimatedCostUsd: number;
  apiError?: string;
}

export interface UsageTotals {
  requests: number;
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
  cachedTokens: number;
  totalTokens: number;
  ttsGenerations: number;
  cacheHits: number;
  estimatedCostUsd: number;
  errors: number;
}

export interface UsageLimitConfig {
  dailyCostLimitUsd: number;
  monthlyCostLimitUsd: number;
  dailyTokenLimit: number;
  monthlyTokenLimit: number;
}

export interface UsageSummaryResponse {
  today: UsageTotals;
  month: UsageTotals;
  limits: UsageLimitConfig;
  limitReached: boolean;
  limitReason?: string;
  storageType: 'session-memory';
  isFreeTierEstimate: boolean;
  recentLogs: UsageLogEntry[];
}

export const DEFAULT_USAGE_LIMITS: UsageLimitConfig = {
  dailyCostLimitUsd: 0.25,
  monthlyCostLimitUsd: 3.0,
  dailyTokenLimit: 500_000,
  monthlyTokenLimit: 5_000_000,
};

export function getDayKey(ts = Date.now()): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getMonthKey(ts = Date.now()): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function aggregateUsageTotals(
  entries: UsageLogEntry[],
  predicate: (entry: UsageLogEntry) => boolean
): UsageTotals {
  const totals: UsageTotals = {
    requests: 0,
    inputTokens: 0,
    outputTokens: 0,
    thinkingTokens: 0,
    cachedTokens: 0,
    totalTokens: 0,
    ttsGenerations: 0,
    cacheHits: 0,
    estimatedCostUsd: 0,
    errors: 0,
  };

  for (const entry of entries) {
    if (!predicate(entry)) continue;
    totals.requests += 1;
    totals.inputTokens += entry.inputTokens;
    totals.outputTokens += entry.outputTokens;
    totals.thinkingTokens += entry.thinkingTokens;
    totals.cachedTokens += entry.cachedTokens;
    totals.totalTokens += entry.totalTokens;
    if (entry.ttsAudioGenerated) totals.ttsGenerations += 1;
    if (entry.cacheHit) totals.cacheHits += 1;
    if (entry.apiError) totals.errors += 1;
    totals.estimatedCostUsd = Number((totals.estimatedCostUsd + entry.estimatedCostUsd).toFixed(7));
  }

  return totals;
}

export function checkUsageLimits(
  today: UsageTotals,
  month: UsageTotals,
  limits: UsageLimitConfig
): { allowed: boolean; reason?: string } {
  if (limits.dailyCostLimitUsd > 0 && today.estimatedCostUsd >= limits.dailyCostLimitUsd) {
    return {
      allowed: false,
      reason: `Өдрийн тооцоолсон зардлын хязгаарт ($${limits.dailyCostLimitUsd.toFixed(2)}) хүрлээ. Хадгалсан карт болон аудиог үнэгүй үргэлжлүүлэн ашиглах боломжтой.`,
    };
  }
  if (limits.monthlyCostLimitUsd > 0 && month.estimatedCostUsd >= limits.monthlyCostLimitUsd) {
    return {
      allowed: false,
      reason: `Сарын тооцоолсон зардлын хязгаарт ($${limits.monthlyCostLimitUsd.toFixed(2)}) хүрлээ. Хадгалсан карт болон аудиог үргэлжлүүлэн ашиглана уу.`,
    };
  }
  if (limits.dailyTokenLimit > 0 && today.totalTokens >= limits.dailyTokenLimit) {
    return {
      allowed: false,
      reason: `Өдрийн токены хязгаарт (${limits.dailyTokenLimit.toLocaleString('en-US')}) хүрлээ. Маргааш дахин нээгдэх ба хадгалсан хичээлүүд хэвийн ажиллана.`,
    };
  }
  if (limits.monthlyTokenLimit > 0 && month.totalTokens >= limits.monthlyTokenLimit) {
    return {
      allowed: false,
      reason: `Сарын токены хязгаарт (${limits.monthlyTokenLimit.toLocaleString('en-US')}) хүрлээ. Хадгалсан хичээлүүд хэвийн ажиллана.`,
    };
  }
  return { allowed: true };
}

// Client-side device-local persistent log (localStorage) for user visibility across reloads
const CLIENT_USAGE_LOG_KEY = 'ahoj_cesko_usage_logs_v1';

export function loadClientUsageLogs(): UsageLogEntry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CLIENT_USAGE_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UsageLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendClientUsageLog(entry: UsageLogEntry): UsageLogEntry[] {
  const existing = loadClientUsageLogs();
  const next = [entry, ...existing].slice(0, 500);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(CLIENT_USAGE_LOG_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  }
  return next;
}
