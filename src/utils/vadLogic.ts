export interface VadTrackerState {
  speechStarted: boolean;
  speechStartedAtMs: number | null;
  lastVoiceAtMs: number | null;
}

export interface VadDecision {
  nextState: VadTrackerState;
  shouldStop: boolean;
}

export function computeNormalizedRms(samples: ArrayLike<number>): number {
  if (samples.length === 0) return 0;
  let sumSquares = 0;
  for (let i = 0; i < samples.length; i++) {
    const centered = (samples[i] - 128) / 128;
    sumSquares += centered * centered;
  }
  return Math.sqrt(sumSquares / samples.length);
}

export function stepVadTracker(
  state: VadTrackerState,
  rmsLevel: number,
  nowMs: number,
  options?: {
    voiceThreshold?: number;
    silenceDurationMs?: number;
    minSpeechDurationMs?: number;
    maxTurnDurationMs?: number;
    recordingStartedAtMs?: number;
  }
): VadDecision {
  const voiceThreshold = options?.voiceThreshold ?? 0.035;
  const silenceDurationMs = options?.silenceDurationMs ?? 1450;
  const minSpeechDurationMs = options?.minSpeechDurationMs ?? 550;
  const maxTurnDurationMs = options?.maxTurnDurationMs ?? 15000;

  if (
    options?.recordingStartedAtMs !== undefined &&
    nowMs - options.recordingStartedAtMs >= maxTurnDurationMs
  ) {
    return { nextState: state, shouldStop: state.speechStarted };
  }

  if (rmsLevel >= voiceThreshold) {
    return {
      nextState: {
        speechStarted: true,
        speechStartedAtMs: state.speechStartedAtMs ?? nowMs,
        lastVoiceAtMs: nowMs,
      },
      shouldStop: false,
    };
  }

  if (
    state.speechStarted &&
    state.speechStartedAtMs !== null &&
    state.lastVoiceAtMs !== null &&
    nowMs - state.speechStartedAtMs >= minSpeechDurationMs &&
    nowMs - state.lastVoiceAtMs >= silenceDurationMs
  ) {
    return { nextState: state, shouldStop: true };
  }

  return { nextState: state, shouldStop: false };
}
