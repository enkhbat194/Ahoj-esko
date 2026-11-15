import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateUsageTotals,
  checkUsageLimits,
  DEFAULT_USAGE_LIMITS,
  type UsageLogEntry,
} from './usageMonitor';
import { buildTtsCacheId } from './ttsCacheMeta';

test('aggregateUsageTotals sums tokens, cache hits, errors, and estimated cost', () => {
  const entries: UsageLogEntry[] = [
    {
      id: '1',
      timestamp: 1000,
      endpoint: '/api/ai/tutor',
      usedModel: 'gemini-3.1-flash-lite',
      inputTokens: 300,
      outputTokens: 120,
      thinkingTokens: 10,
      cachedTokens: 0,
      totalTokens: 420,
      ttsAudioGenerated: false,
      requestDurationMs: 250,
      cacheHit: false,
      estimatedCostUsd: 0.0000585,
    },
    {
      id: '2',
      timestamp: 2000,
      endpoint: '/api/ai/tts',
      usedModel: 'gemini-3.8-flash-lite-tts',
      inputTokens: 0,
      outputTokens: 0,
      thinkingTokens: 0,
      cachedTokens: 0,
      totalTokens: 0,
      ttsAudioGenerated: false,
      requestDurationMs: 2,
      cacheHit: true,
      estimatedCostUsd: 0,
    },
  ];

  const totals = aggregateUsageTotals(entries, () => true);
  assert.equal(totals.requests, 2);
  assert.equal(totals.totalTokens, 420);
  assert.equal(totals.thinkingTokens, 10);
  assert.equal(totals.cacheHits, 1);
  assert.equal(totals.estimatedCostUsd, 0.0000585);
});

test('checkUsageLimits blocks when daily or monthly cost/token limits are reached', () => {
  const okTotals = aggregateUsageTotals([], () => true);
  assert.equal(checkUsageLimits(okTotals, okTotals, DEFAULT_USAGE_LIMITS).allowed, true);

  const highDaily = { ...okTotals, estimatedCostUsd: 0.3 };
  const dailyBlocked = checkUsageLimits(highDaily, highDaily, {
    ...DEFAULT_USAGE_LIMITS,
    dailyCostLimitUsd: 0.25,
  });
  assert.equal(dailyBlocked.allowed, false);
  assert.ok(dailyBlocked.reason?.includes('0.25'));
});

test('buildTtsCacheId is deterministic and separates voice, speed, language, and model', () => {
  const a = buildTtsCacheId({ text: ' Dobrý den ', voiceId: 'Zephyr', slow: false });
  const b = buildTtsCacheId({ text: 'Dobrý den', voiceId: 'Zephyr', slow: false });
  const c = buildTtsCacheId({ text: 'Dobrý den', voiceId: 'Charon', slow: false });
  const d = buildTtsCacheId({ text: 'Dobrý den', voiceId: 'Zephyr', slow: true });

  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.notEqual(a, d);
});
