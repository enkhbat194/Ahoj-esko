import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTokenUsageMetrics,
  calculateTurnCostUsd,
  extractUsageCounts,
  formatTokenCount,
  formatUsdCost,
  sumTokenUsage,
} from './tokenPricing';

test('extractUsageCounts sums candidates, thinking, and cached tokens cleanly', () => {
  const counts = extractUsageCounts({
    promptTokenCount: 400,
    candidatesTokenCount: 120,
    thoughtsTokenCount: 30,
    cachedContentTokenCount: 100,
    totalTokenCount: 550,
  });
  assert.deepEqual(counts, {
    inputTokens: 400,
    outputTokens: 150,
    thinkingTokens: 30,
    cachedTokens: 100,
    totalTokens: 550,
  });
});

test('buildTokenUsageMetrics calculates low-cost gemini-3.1-flash-lite and gemini-3.8-flash-lite-tts cost accurately', () => {
  const usage = buildTokenUsageMetrics({
    chatUsage: {
      promptTokenCount: 1000,
      candidatesTokenCount: 200,
      thoughtsTokenCount: 10,
      cachedContentTokenCount: 0,
      totalTokenCount: 1210,
    },
    ttsUsages: [
      {
        promptTokenCount: 20,
        candidatesTokenCount: 300,
        totalTokenCount: 320,
      },
    ],
    hasAudioInput: true,
    usedModel: 'gemini-3.1-flash-lite',
    ttsModel: 'gemini-3.8-flash-lite-tts',
    ttsGenerated: true,
    cacheHit: false,
    durationMs: 420,
  });

  assert.equal(usage.inputTokens, 1020);
  assert.equal(usage.outputTokens, 510);
  assert.equal(usage.thinkingTokens, 10);
  assert.equal(usage.totalTokens, 1530);
  assert.equal(usage.usedModel, 'gemini-3.1-flash-lite');
  assert.equal(usage.ttsModel, 'gemini-3.8-flash-lite-tts');
  assert.equal(usage.ttsGenerated, true);
  assert.equal(usage.cacheHit, false);
  // chatIn(audio): 1000*0.3/1M = 0.0003; chatOut: 210*0.3/1M = 0.000063
  // ttsIn: 20*0.25/1M = 0.000005; ttsOut: 300*5.0/1M = 0.0015 -> total = 0.001868
  assert.equal(usage.estimatedCostUsd, 0.001868);
});

test('sumTokenUsage and formatters handle zero cache hits and aggregate totals cleanly', () => {
  const sum = sumTokenUsage(
    {
      inputTokens: 300,
      outputTokens: 120,
      thinkingTokens: 0,
      cachedTokens: 0,
      totalTokens: 420,
      estimatedCostUsd: 0.0000585,
    },
    {
      inputTokens: 200,
      outputTokens: 100,
      thinkingTokens: 5,
      cachedTokens: 50,
      totalTokens: 300,
      estimatedCostUsd: 0.000045,
    }
  );
  assert.equal(sum.totalTokens, 720);
  assert.equal(sum.thinkingTokens, 5);
  assert.equal(sum.cachedTokens, 50);
  assert.equal(sum.estimatedCostUsd, 0.0001035);
  assert.equal(formatUsdCost(0), '$0.0000');
  assert.equal(formatUsdCost(0.00045), '$0.00045');
  assert.equal(formatTokenCount(1520), '1,520');
  assert.equal(calculateTurnCostUsd({ chatInputTokens: 0, chatOutputTokens: 0 }), 0);
});
