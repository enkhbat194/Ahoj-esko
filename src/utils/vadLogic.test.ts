import test from 'node:test';
import assert from 'node:assert/strict';
import { computeNormalizedRms, stepVadTracker, type VadTrackerState } from './vadLogic.ts';

test('computeNormalizedRms returns 0 for flat 128 silence and positive value for speech', () => {
  assert.equal(computeNormalizedRms([128, 128, 128, 128]), 0);
  const loud = computeNormalizedRms([128, 200, 56, 200]);
  assert.ok(loud > 0.3);
});

test('stepVadTracker waits for speech then auto-stops after trailing silence', () => {
  let state: VadTrackerState = {
    speechStarted: false,
    speechStartedAtMs: null,
    lastVoiceAtMs: null,
  };

  // Initial ambient silence should not trigger stop
  let step = stepVadTracker(state, 0.005, 1000);
  state = step.nextState;
  assert.equal(step.shouldStop, false);
  assert.equal(state.speechStarted, false);

  // User starts speaking
  step = stepVadTracker(state, 0.12, 1200);
  state = step.nextState;
  assert.equal(state.speechStarted, true);
  assert.equal(step.shouldStop, false);

  // Continues speaking
  step = stepVadTracker(state, 0.09, 2000);
  state = step.nextState;
  assert.equal(step.shouldStop, false);

  // Brief pause (500ms) should NOT stop yet
  step = stepVadTracker(state, 0.008, 2500);
  state = step.nextState;
  assert.equal(step.shouldStop, false);

  // Longer silence (>= 1450ms) after enough speech triggers auto-stop
  step = stepVadTracker(state, 0.008, 3500);
  assert.equal(step.shouldStop, true);
});
