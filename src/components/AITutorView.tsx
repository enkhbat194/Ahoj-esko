import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  ArrowUp,
  BarChart3,
  BookMarked,
  Check,
  CheckCircle2,
  Lock,
  Mic,
  MicOff,
  Pencil,
  PhoneCall,
  PhoneOff,
  RotateCcw,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  blobToBase64,
  playBase64Sequence,
  playCzechAudioWithTelemetry,
  stopAllPlayback,
  unlockIOSAudio,
} from '../utils/audioPlayer';
import {
  extractMemoryFromTurn,
  loadLearningMemory,
  saveLearningMemory,
  transitionMemoryStatus,
  type LearningMemoryItem,
  type LearningMemoryStatus,
} from '../utils/learningMemory';
import {
  formatTokenCount,
  formatUsdCost,
  sumTokenUsage,
  type TokenUsageMetrics,
} from '../utils/tokenPricing';
import {
  aggregateUsageTotals,
  appendClientUsageLog,
  checkUsageLimits,
  DEFAULT_USAGE_LIMITS,
  getDayKey,
  getMonthKey,
  loadClientUsageLogs,
  type UsageLimitConfig,
  type UsageLogEntry,
  type UsageSummaryResponse,
} from '../utils/usageMonitor';
import { computeNormalizedRms, stepVadTracker, type VadTrackerState } from '../utils/vadLogic';

interface TutorTurn {
  id: string;
  role: 'user' | 'assistant';
  czech: string;
  phonetic?: string;
  mongolian?: string;
  coachingTipMn?: string;
  hasError?: boolean;
  recognitionUncertainty?: boolean;
  suggestedReplyCzech?: string;
  suggestedReplyMn?: string;
  usage?: TokenUsageMetrics;
}

type VoicePhase = 'idle' | 'listening' | 'thinking' | 'speaking';
type VoicePersona = 'Zephyr' | 'Charon';
type MonitorTab = 'usage' | 'memory';

const SCENARIOS = [
  {
    id: 'cafe',
    label: 'Кафе дотор',
    starterCz: 'Dobrý den! Co si dnes dáte?',
    starterPhon: 'Добрий дэн! Цо си днэс даатэ?',
    starterMn: 'Сайн байна уу! Та өнөөдөр юу захиалах вэ?',
    suggestedCz: 'Dobrý den, dám si jednu kávu, prosím.',
    suggestedMn: 'Сайн байна уу, би нэг кофе авъя.',
  },
  {
    id: 'shop',
    label: 'Дэлгүүрт',
    starterCz: 'Dobrý den, hledáte něco konkrétního?',
    starterPhon: 'Добрий дэн, хлэдаатэ нэцо конкрээтниихо?',
    starterMn: 'Сайн байна уу, та ямар нэг тодорхой зүйл хайж байна уу?',
    suggestedCz: 'Hledám čerstvý chléb a mléko.',
    suggestedMn: 'Би шинэ талх болон сүү хайж байна.',
  },
  {
    id: 'pharmacy',
    label: 'Эмийн санд',
    starterCz: 'Dobrý den, jak vám mohu pomoci?',
    starterPhon: 'Добрий дэн, як ваам могу помоци?',
    starterMn: 'Сайн байна уу, танд юугаар туслах вэ?',
    suggestedCz: 'Máte prosím něco na bolest hlavy?',
    suggestedMn: 'Танд толгойны өвчин намдаах эм бий юу?',
  },
  {
    id: 'work',
    label: 'Ажлын ярилцлага',
    starterCz: 'Dobrý den, povězte mi prosím něco o sobě.',
    starterPhon: 'Добрий дэн, повэзтэ ми просиим нэцо о собе.',
    starterMn: 'Сайн байна уу, өөрийнхөө тухай товч ярина уу.',
    suggestedCz: 'Pracuji jako technik a učím se česky.',
    suggestedMn: 'Би техникчээр ажилладаг бөгөөд чех хэл сурч байна.',
  },
  {
    id: 'transport',
    label: 'Трамвай, метро',
    starterCz: 'Kam potřebujete dnes jet?',
    starterPhon: 'Кам потршэбуетэ днэс ет?',
    starterMn: 'Та өнөөдөр хаашаа явах хэрэгтэй вэ?',
    suggestedCz: 'Potřebuji se dostat na hlavní nádraží.',
    suggestedMn: 'Би төв галт тэрэгний буудал руу очих хэрэгтэй байна.',
  },
];

const ZERO_USAGE: TokenUsageMetrics = {
  inputTokens: 0,
  outputTokens: 0,
  thinkingTokens: 0,
  cachedTokens: 0,
  totalTokens: 0,
  estimatedCostUsd: 0,
};

function createStarterTurn(sc: (typeof SCENARIOS)[number]): TutorTurn {
  return {
    id: `init-${sc.id}-${Date.now()}`,
    role: 'assistant',
    czech: sc.starterCz,
    phonetic: sc.starterPhon,
    mongolian: sc.starterMn,
    coachingTipMn:
      '«Ярилцах» товчийг дараад шууд ярих эсвэл доор бичиж хариулаарай — алдаа гаргавал Монголоор тайлбарлана.',
    suggestedReplyCzech: sc.suggestedCz,
    suggestedReplyMn: sc.suggestedMn,
  };
}

function logUsageToDevice(endpoint: string, usage?: TokenUsageMetrics | null, apiError?: string) {
  if (!usage && !apiError) return;
  const entry: UsageLogEntry = {
    id: `cli_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    endpoint,
    usedModel:
      usage?.ttsGenerated && usage?.usedModel && usage?.ttsModel
        ? `${usage.usedModel}+${usage.ttsModel}`
        : usage?.usedModel || usage?.ttsModel || 'gemini-3.1-flash-lite',
    inputTokens: usage?.inputTokens ?? 0,
    outputTokens: usage?.outputTokens ?? 0,
    thinkingTokens: usage?.thinkingTokens ?? 0,
    cachedTokens: usage?.cachedTokens ?? 0,
    totalTokens: usage?.totalTokens ?? 0,
    ttsAudioGenerated: Boolean(usage?.ttsGenerated),
    requestDurationMs: usage?.durationMs ?? 0,
    cacheHit: Boolean(usage?.cacheHit),
    estimatedCostUsd: usage?.estimatedCostUsd ?? 0,
    apiError,
  };
  appendClientUsageLog(entry);
}

const MEMORY_STATUS_LABELS: Record<LearningMemoryStatus, string> = {
  Raw: 'Түүхий',
  Extracted: 'Ялгасан',
  Validated: 'Шалгасан',
  Approved: 'Батлагдсан',
};

export const AITutorView: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [conversationId, setConversationId] = useState(() => `conv_${Date.now()}`);
  const [turns, setTurns] = useState<TutorTurn[]>(() => [createStarterTurn(SCENARIOS[0])]);
  const [sessionUsage, setSessionUsage] = useState<TokenUsageMetrics>(ZERO_USAGE);
  const [inputText, setInputText] = useState('');
  const [sttNotice, setSttNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [voiceName, setVoiceName] = useState<VoicePersona>('Zephyr');

  // Hands-free voice conversation state
  const [handsFreeActive, setHandsFreeActive] = useState(false);
  const [voicePhase, setVoicePhase] = useState<VoicePhase>('idle');
  const [speakCoaching, setSpeakCoaching] = useState(true);
  const [micLevel, setMicLevel] = useState(0);

  // Usage Monitor & Learning Memory Drawer
  const [monitorOpen, setMonitorOpen] = useState(false);
  const [monitorTab, setMonitorTab] = useState<MonitorTab>('usage');
  const [serverSummary, setServerSummary] = useState<UsageSummaryResponse | null>(null);
  const [clientLogs, setClientLogs] = useState<UsageLogEntry[]>(() => loadClientUsageLogs());
  const [limitDraft, setLimitDraft] = useState<UsageLimitConfig>(DEFAULT_USAGE_LIMITS);
  const [savingLimits, setSavingLimits] = useState(false);
  const [limitSavedMsg, setLimitSavedMsg] = useState<string | null>(null);
  const [memoryItems, setMemoryItems] = useState<LearningMemoryItem[]>(() => loadLearningMemory());

  const messagesListRef = useRef<HTMLDivElement | null>(null);
  const handsFreeRef = useRef(false);
  const speakCoachingRef = useRef(speakCoaching);
  const voiceNameRef = useRef(voiceName);
  const selectedScenarioRef = useRef(selectedScenario);
  const conversationIdRef = useRef(conversationId);
  const turnsRef = useRef(turns);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const vadTimerRef = useRef<number | null>(null);

  useEffect(() => {
    speakCoachingRef.current = speakCoaching;
  }, [speakCoaching]);

  useEffect(() => {
    voiceNameRef.current = voiceName;
  }, [voiceName]);

  useEffect(() => {
    selectedScenarioRef.current = selectedScenario;
  }, [selectedScenario]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    turnsRef.current = turns;
    const el = messagesListRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [turns, isLoading, voicePhase]);

  const refreshUsageSummary = useCallback(async () => {
    setClientLogs(loadClientUsageLogs());
    try {
      const res = await fetch('/api/ai/usage');
      if (res.ok) {
        const data = (await res.json()) as UsageSummaryResponse;
        setServerSummary(data);
        setLimitDraft(data.limits);
      }
    } catch {
      // Fall back to local logs cleanly when offline
    }
  }, []);

  useEffect(() => {
    if (monitorOpen) {
      void refreshUsageSummary();
    }
  }, [monitorOpen, refreshUsageSummary]);

  const addUsage = useCallback(
    (endpoint: string, usage?: TokenUsageMetrics | null, apiError?: string) => {
      if (usage) {
        setSessionUsage((prev) => sumTokenUsage(prev, usage));
      }
      logUsageToDevice(endpoint, usage, apiError);
      setClientLogs(loadClientUsageLogs());
    },
    []
  );

  const recordLearningTurn = useCallback(
    (params: {
      studentCzech?: string;
      replyCzech: string;
      replyMongolian?: string;
      suggestedReplyCzech?: string;
      coachingTipMn?: string;
      hasError?: boolean;
      speechUncertainty?: boolean;
      audioCacheId?: string;
    }) => {
      const item = extractMemoryFromTurn({
        conversationId: conversationIdRef.current,
        ...params,
      });
      setMemoryItems((prev) => {
        const next = [item, ...prev].slice(0, 300);
        saveLearningMemory(next);
        return next;
      });
    },
    []
  );

  const stopHandsFree = useCallback(() => {
    handsFreeRef.current = false;
    setHandsFreeActive(false);
    setVoicePhase('idle');
    setMicLevel(0);

    if (vadTimerRef.current !== null) {
      window.clearInterval(vadTimerRef.current);
      vadTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore stop errors
      }
    }
    mediaRecorderRef.current = null;

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    stopAllPlayback();
  }, []);

  useEffect(() => {
    return () => {
      stopHandsFree();
    };
  }, [stopHandsFree]);

  const handleVoiceBlobSubmitted = useCallback(
    async (blob: Blob) => {
      if (!handsFreeRef.current) return;
      setVoicePhase('thinking');
      setMicLevel(0);
      setErrorMsg(null);

      try {
        const audioBase64 = await blobToBase64(blob);
        if (!handsFreeRef.current) return;

        const res = await fetch('/api/ai/voice-tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64,
            mimeType: blob.type || 'audio/webm',
            scenario: selectedScenarioRef.current.label,
            history: turnsRef.current.slice(-4).map((t) => ({
              role: t.role,
              czech: t.czech,
            })),
            speakCoaching: speakCoachingRef.current,
            voiceName: voiceNameRef.current,
            conversationId: conversationIdRef.current,
          }),
        });

        const data = (await res.json()) as {
          error?: string;
          studentTranscript?: string;
          hasError?: boolean;
          recognitionUncertainty?: boolean;
          coachingTipMn?: string;
          replyCzech?: string;
          replyPhonetic?: string;
          replyMongolian?: string;
          suggestedReplyCzech?: string;
          suggestedReplyMn?: string;
          replyAudioId?: string;
          replyAudioBase64?: string;
          coachingAudioBase64?: string;
          audioMimeType?: string;
          usage?: TokenUsageMetrics;
        };

        if (!handsFreeRef.current) return;

        if (!res.ok || data.error) {
          addUsage('/api/ai/voice-tutor', data.usage, data.error);
          setErrorMsg(data.error || 'Дуу боловсруулахад алдаа гарлаа.');
          stopHandsFree();
          return;
        }

        addUsage('/api/ai/voice-tutor', data.usage);

        const transcriptText = (data.studentTranscript || '').trim() || '(Дуут хариулт)';
        const userTurn: TutorTurn = {
          id: `user-${Date.now()}`,
          role: 'user',
          czech: transcriptText,
          recognitionUncertainty: Boolean(data.recognitionUncertainty),
        };
        const aiTurn: TutorTurn = {
          id: `ai-${Date.now() + 1}`,
          role: 'assistant',
          czech: data.replyCzech ?? '',
          phonetic: data.replyPhonetic,
          mongolian: data.replyMongolian,
          coachingTipMn: data.coachingTipMn,
          hasError: data.hasError,
          recognitionUncertainty: Boolean(data.recognitionUncertainty),
          suggestedReplyCzech: data.suggestedReplyCzech,
          suggestedReplyMn: data.suggestedReplyMn,
          usage: data.usage,
        };

        setTurns((prev) => [...prev, userTurn, aiTurn]);
        recordLearningTurn({
          studentCzech: transcriptText,
          replyCzech: aiTurn.czech,
          replyMongolian: aiTurn.mongolian,
          suggestedReplyCzech: aiTurn.suggestedReplyCzech,
          coachingTipMn: aiTurn.coachingTipMn,
          hasError: aiTurn.hasError,
          speechUncertainty: Boolean(data.recognitionUncertainty),
          audioCacheId: data.replyAudioId,
        });

        setVoicePhase('speaking');
        const clips: Array<{ base64: string; mimeType?: string }> = [];
        if (data.coachingAudioBase64 && speakCoachingRef.current) {
          clips.push({
            base64: data.coachingAudioBase64,
            mimeType: data.audioMimeType || 'audio/wav',
          });
        }
        if (data.replyAudioBase64) {
          clips.push({
            base64: data.replyAudioBase64,
            mimeType: data.audioMimeType || 'audio/wav',
          });
        }

        if (clips.length > 0) {
          await playBase64Sequence(clips, () => !handsFreeRef.current);
        } else if (data.replyCzech) {
          const ttsTelemetry = await playCzechAudioWithTelemetry({
            text: data.replyCzech,
            rate: 1.0,
            voiceName: voiceNameRef.current,
            sourceConversationId: conversationIdRef.current,
          });
          if (ttsTelemetry.usage) {
            addUsage('/api/ai/tts', ttsTelemetry.usage);
          }
        }
      } catch {
        setErrorMsg('Сүлжээний алдаа гарлаа. Дуут горим зогслоо.');
        stopHandsFree();
        return;
      }

      if (handsFreeRef.current) {
        startListeningTurnRef.current();
      }
    },
    [addUsage, recordLearningTurn, stopHandsFree]
  );

  const startListeningTurn = useCallback(() => {
    const stream = micStreamRef.current;
    const analyser = analyserRef.current;
    if (!handsFreeRef.current || !stream || !analyser) return;

    if (vadTimerRef.current !== null) {
      window.clearInterval(vadTimerRef.current);
      vadTimerRef.current = null;
    }

    setVoicePhase('listening');
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      if (vadTimerRef.current !== null) {
        window.clearInterval(vadTimerRef.current);
        vadTimerRef.current = null;
      }
      if (!handsFreeRef.current) return;
      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
      void handleVoiceBlobSubmitted(blob);
    };

    recorder.start();

    const buffer = new Uint8Array(analyser.fftSize);
    const recordingStartedAtMs = Date.now();
    let vadState: VadTrackerState = {
      speechStarted: false,
      speechStartedAtMs: null,
      lastVoiceAtMs: null,
    };

    vadTimerRef.current = window.setInterval(() => {
      if (!handsFreeRef.current || recorder.state !== 'recording') return;
      analyser.getByteTimeDomainData(buffer);
      const rms = computeNormalizedRms(buffer);
      setMicLevel(Math.min(100, Math.round(rms * 380)));

      const step = stepVadTracker(vadState, rms, Date.now(), {
        recordingStartedAtMs,
        voiceThreshold: 0.032,
        silenceDurationMs: 1450,
        minSpeechDurationMs: 550,
        maxTurnDurationMs: 15000,
      });
      vadState = step.nextState;

      if (step.shouldStop && recorder.state === 'recording') {
        recorder.stop();
      }
    }, 80);
  }, [handleVoiceBlobSubmitted]);

  const startListeningTurnRef = useRef(startListeningTurn);
  useEffect(() => {
    startListeningTurnRef.current = startListeningTurn;
  }, [startListeningTurn]);

  const handleToggleHandsFree = async () => {
    setErrorMsg(null);
    if (handsFreeActive) {
      stopHandsFree();
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg('Энэ хөтөч дээр микрофон ашиглах боломжгүй байна.');
      return;
    }

    unlockIOSAudio();

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      micStreamRef.current = stream;
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      handsFreeRef.current = true;
      setHandsFreeActive(true);

      startListeningTurn();
    } catch {
      setErrorMsg('Микрофоны зөвшөөрөл олгогдоогүй тул дуут горим эхэлсэнгүй.');
      stopHandsFree();
    }
  };

  const handleManualSendVoiceTurn = () => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state === 'recording') {
      rec.stop();
    }
  };

  const handleSelectScenario = (scenario: (typeof SCENARIOS)[number]) => {
    if (handsFreeActive) stopHandsFree();
    setSelectedScenario(scenario);
    setConversationId(`conv_${Date.now()}`);
    setErrorMsg(null);
    setTurns([createStarterTurn(scenario)]);
  };

  const handleResetChat = () => {
    if (handsFreeActive) stopHandsFree();
    setErrorMsg(null);
    setSttNotice(null);
    setConversationId(`conv_${Date.now()}`);
    setSessionUsage(ZERO_USAGE);
    setTurns([createStarterTurn(selectedScenario)]);
  };

  const handleSpeakText = async (turnId: string, text: string, slow: boolean) => {
    if (playingId === turnId) {
      stopAllPlayback();
      setPlayingId(null);
      return;
    }
    setPlayingId(turnId);
    const telemetry = await playCzechAudioWithTelemetry({
      text,
      rate: slow ? 0.65 : 1.0,
      voiceName,
      language: 'cs',
      sourceConversationId: conversationId,
      onEnd: () => setPlayingId(null),
    });

    if (telemetry.usage) {
      addUsage('/api/ai/tts', telemetry.usage);
    }
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText ?? inputText).trim();
    if (!textToSend || isLoading) return;

    setErrorMsg(null);
    setSttNotice(null);
    if (!overrideText) setInputText('');

    const userTurn: TutorTurn = {
      id: `user-${Date.now()}`,
      role: 'user',
      czech: textToSend,
    };

    const nextHistory = [...turns, userTurn];
    setTurns(nextHistory);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: selectedScenario.label,
          // Token optimization: send only last 4 compact Czech turns
          history: turns.slice(-4).map((t) => ({
            role: t.role,
            czech: t.czech,
          })),
          userMessage: textToSend,
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        replyCzech?: string;
        replyPhonetic?: string;
        replyMongolian?: string;
        hasError?: boolean;
        coachingTipMn?: string;
        suggestedReplyCzech?: string;
        suggestedReplyMn?: string;
        usage?: TokenUsageMetrics;
      };

      if (!res.ok || data.error) {
        addUsage('/api/ai/tutor', data.usage, data.error);
        setErrorMsg(data.error || 'AI багш хариу өгч чадсангүй.');
        return;
      }

      addUsage('/api/ai/tutor', data.usage);

      const aiTurn: TutorTurn = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        czech: data.replyCzech ?? '',
        phonetic: data.replyPhonetic,
        mongolian: data.replyMongolian,
        hasError: Boolean(data.hasError),
        coachingTipMn: data.coachingTipMn,
        suggestedReplyCzech: data.suggestedReplyCzech,
        suggestedReplyMn: data.suggestedReplyMn,
        usage: data.usage,
      };

      setTurns((prev) => [...prev, aiTurn]);
      recordLearningTurn({
        studentCzech: textToSend,
        replyCzech: aiTurn.czech,
        replyMongolian: aiTurn.mongolian,
        suggestedReplyCzech: aiTurn.suggestedReplyCzech,
        coachingTipMn: aiTurn.coachingTipMn,
        hasError: aiTurn.hasError,
      });
    } catch {
      setErrorMsg('Сүлжээний алдаа гарлаа. Интернэт холболтоо шалгана уу.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceDictation = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (!SpeechRec) {
      setErrorMsg('Шууд бичүүлэхийн оронд дээрх «Ярилцах» товчийг дарж шууд дуугаар ярина уу.');
      return;
    }

    const recognition = new SpeechRec() as {
      lang: string;
      interimResults: boolean;
      onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onerror: () => void;
      onend: () => void;
      start: () => void;
    };
    recognition.lang = 'cs-CZ';
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setSttNotice('Яриа танигдлаа — буруу үг байвал засаад илгээнэ үү (жишээ нь: káva → kávu).');
      }
    };
    recognition.onerror = () => {
      setIsDictating(false);
      setErrorMsg('Дуу танихад алдаа гарлаа.');
    };
    recognition.onend = () => setIsDictating(false);

    setIsDictating(true);
    recognition.start();
  };

  const handleSaveLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLimits(true);
    setLimitSavedMsg(null);
    try {
      const res = await fetch('/api/ai/usage/limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(limitDraft),
      });
      if (res.ok) {
        const updated = (await res.json()) as UsageSummaryResponse;
        setServerSummary(updated);
        setLimitDraft(updated.limits);
        setLimitSavedMsg('Хязгаар хадгалагдлаа');
      }
    } catch {
      setLimitSavedMsg('Хязгаар хадгалахад алдаа гарлаа');
    } finally {
      setSavingLimits(false);
    }
  };

  const handleAdvanceMemoryStatus = (id: string, nextStatus: LearningMemoryStatus) => {
    setMemoryItems((prev) => {
      const next = prev.map((item) =>
        item.id === id ? transitionMemoryStatus(item, nextStatus) : item
      );
      saveLearningMemory(next);
      return next;
    });
  };

  const handleDeleteMemoryItem = (id: string) => {
    setMemoryItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveLearningMemory(next);
      return next;
    });
  };

  const lastAiTurn = [...turns].reverse().find((t) => t.role === 'assistant');

  // Compute daily & monthly views cleanly (prefer server logs if populated, otherwise localStorage logs)
  const dayKey = getDayKey();
  const monthKey = getMonthKey();
  const localToday = aggregateUsageTotals(clientLogs, (e) => getDayKey(e.timestamp) === dayKey);
  const localMonth = aggregateUsageTotals(clientLogs, (e) => getMonthKey(e.timestamp) === monthKey);
  const displayToday =
    serverSummary && serverSummary.today.requests >= localToday.requests
      ? serverSummary.today
      : localToday;
  const displayMonth =
    serverSummary && serverSummary.month.requests >= localMonth.requests
      ? serverSummary.month
      : localMonth;
  const limitCheck = checkUsageLimits(displayToday, displayMonth, limitDraft);
  const recentLogs =
    serverSummary && serverSummary.recentLogs.length > 0 ? serverSummary.recentLogs : clientLogs.slice(0, 30);

  return (
    <div className="flex-1 min-h-0 h-full grid grid-cols-1 lg:grid-cols-12 lg:gap-5 overflow-hidden relative">
      {/* Desktop iOS Inset Grouped Sidebar */}
      <aside className="hidden lg:flex lg:col-span-4 flex-col justify-between gap-3 h-full min-h-0 overflow-y-auto">
        <div className="space-y-3">
          {/* Scenarios Grouped Inset List */}
          <div className="rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-black/[0.06] dark:border-white/[0.08]">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">
                Харилцан ярианы сэдэв
              </h2>
            </div>
            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
              {SCENARIOS.map((sc) => {
                const active = selectedScenario.id === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => handleSelectScenario(sc)}
                    className="w-full min-h-[44px] px-4 py-2.5 flex items-center justify-between gap-3 text-left text-[14px] font-medium hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    <span
                      className={
                        active
                          ? 'font-semibold text-[#007AFF] dark:text-[#0A84FF]'
                          : 'text-[#1C1C1E] dark:text-[#F2F2F7]'
                      }
                    >
                      {sc.label}
                    </span>
                    {active && <Check className="w-4 h-4 text-[#007AFF] dark:text-[#0A84FF] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice & Coaching iOS Settings Group */}
          <div className="rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] divide-y divide-black/[0.06] dark:divide-white/[0.08]">
            <div className="px-4 py-2.5 flex items-center justify-between gap-3">
              <span className="text-[13px] font-medium text-[#1C1C1E] dark:text-[#F2F2F7]">
                Багшийн хоолой
              </span>
              <div className="flex items-center p-0.5 rounded-lg bg-[#F2F2F7] dark:bg-[#2C2C2E]">
                {(
                  [
                    { id: 'Zephyr', label: 'Эм' },
                    { id: 'Charon', label: 'Эр' },
                  ] as const
                ).map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVoiceName(v.id)}
                    className={`min-h-[28px] px-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      voiceName === v.id
                        ? 'bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-white shadow-xs'
                        : 'text-[#8E8E93]'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSpeakCoaching((v) => !v)}
              aria-pressed={speakCoaching}
              className="w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left cursor-pointer"
            >
              <span className="text-[13px] font-medium text-[#1C1C1E] dark:text-[#F2F2F7]">
                Алдааг Монголоор унших
              </span>
              <span
                className={`w-10 h-6 rounded-full p-0.5 transition-colors flex items-center shrink-0 ${
                  speakCoaching ? 'bg-[#34C759]' : 'bg-[#E5E5EA] dark:bg-[#3A3A3C]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    speakCoaching ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </span>
            </button>
          </div>
        </div>

        {/* Desktop Token, Estimated Cost & Monitor Launcher */}
        <div className="rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">
              Токен ба тооцоолсон үнэ
            </h3>
            <button
              type="button"
              onClick={handleResetChat}
              className="text-xs font-medium text-[#007AFF] dark:text-[#0A84FF] hover:underline cursor-pointer"
            >
              Тэглэх
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] px-3 py-2">
              <p className="text-[11px] text-[#8E8E93]">Оролт / Гаралт</p>
              <p className="font-mono font-semibold tabular-nums text-[#1C1C1E] dark:text-white">
                {formatTokenCount(sessionUsage.inputTokens)} / {formatTokenCount(sessionUsage.outputTokens)}
              </p>
            </div>
            <div className="rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] px-3 py-2">
              <p className="text-[11px] text-[#8E8E93]">Нийт токен</p>
              <p className="font-mono font-semibold tabular-nums text-[#007AFF] dark:text-[#0A84FF]">
                {formatTokenCount(sessionUsage.totalTokens)}
              </p>
            </div>
            <div className="col-span-2 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] px-3 py-2 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#8E8E93]">Тооцоолсон үнэ (Free Tier $0)</p>
                <p className="font-mono font-semibold tabular-nums text-[#28A745] dark:text-[#30D158]">
                  {formatUsdCost(sessionUsage.estimatedCostUsd)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMonitorTab('usage');
                  setMonitorOpen(true);
                }}
                className="min-h-[32px] px-2.5 rounded-lg bg-white dark:bg-[#3A3A3C] text-[11px] font-semibold text-[#007AFF] dark:text-[#64D2FF] shadow-2xs cursor-pointer"
              >
                Хяналт
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Locked-Viewport Chat Container (Never shifts header or input bar) */}
      <section className="lg:col-span-8 flex-1 min-h-0 h-full flex flex-col bg-white dark:bg-[#1C1C1E] sm:rounded-2xl sm:border sm:border-black/[0.06] sm:dark:border-white/[0.08] overflow-hidden">
        {/* 1. Pinned Top Header Strip */}
        <div className="shrink-0 border-b border-black/[0.06] dark:border-white/[0.08] bg-white/95 dark:bg-[#1C1C1E]/95">
          <div className="px-3.5 sm:px-5 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <label htmlFor="chat-scenario-select" className="sr-only">
                Сэдэв сонгох
              </label>
              <select
                id="chat-scenario-select"
                value={selectedScenario.id}
                onChange={(e) => {
                  const found = SCENARIOS.find((s) => s.id === e.target.value);
                  if (found) handleSelectScenario(found);
                }}
                className="lg:hidden min-h-[36px] max-w-[165px] rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] px-2.5 text-xs font-semibold text-[#1C1C1E] dark:text-white border border-black/[0.06] dark:border-white/[0.08] truncate"
              >
                {SCENARIOS.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.label}
                  </option>
                ))}
              </select>

              <div className="hidden lg:block min-w-0">
                <h1 className="text-[15px] font-semibold text-[#1C1C1E] dark:text-white truncate">
                  {selectedScenario.label}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setMonitorTab('usage');
                  setMonitorOpen(true);
                }}
                aria-label="Хэрэглээ ба Санах ой"
                className="min-h-[36px] px-2.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[11px] font-semibold text-[#1C1C1E] dark:text-white inline-flex items-center gap-1 cursor-pointer"
              >
                <BarChart3 className="w-3.5 h-3.5 text-[#007AFF] dark:text-[#64D2FF]" />
                <span className="hidden sm:inline">Хяналт</span>
              </button>

              <button
                type="button"
                onClick={() => setVoiceName((v) => (v === 'Zephyr' ? 'Charon' : 'Zephyr'))}
                aria-label="Багшийн хоолой солих"
                className="lg:hidden min-h-[36px] px-2 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[11px] font-semibold text-[#1C1C1E] dark:text-white cursor-pointer"
              >
                {voiceName === 'Zephyr' ? 'Эм' : 'Эр'}
              </button>

              <button
                type="button"
                onClick={() => setSpeakCoaching((v) => !v)}
                aria-pressed={speakCoaching}
                aria-label={speakCoaching ? 'Монгол тайлбар дууг хаах' : 'Монгол тайлбар дууг асаах'}
                className={`min-h-[36px] min-w-[36px] px-2 rounded-xl flex items-center justify-center gap-1 text-xs font-semibold transition-colors cursor-pointer ${
                  speakCoaching
                    ? 'bg-[#007AFF]/10 dark:bg-[#0A84FF]/20 text-[#007AFF] dark:text-[#0A84FF]'
                    : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#8E8E93]'
                }`}
              >
                {speakCoaching ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => void handleToggleHandsFree()}
                className={`min-h-[36px] px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  handsFreeActive
                    ? 'bg-[#FF3B30] text-white'
                    : 'bg-[#007AFF] dark:bg-[#0A84FF] text-white'
                }`}
              >
                {handsFreeActive ? (
                  <>
                    <PhoneOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Дуусгах</span>
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Ярилцах</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Pinned Token & Estimated Cost Telemetry Strip */}
          <div className="px-3 sm:px-5 py-1.5 bg-[#F2F2F7]/75 dark:bg-black/40 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between gap-2 text-[10.5px] sm:text-[11px] font-mono tabular-nums">
            <button
              type="button"
              onClick={() => {
                setMonitorTab('usage');
                setMonitorOpen(true);
              }}
              className="flex flex-wrap items-center gap-x-1.5 sm:gap-x-2 gap-y-0.5 text-[#636366] dark:text-[#AEAEB2] min-w-0 text-left cursor-pointer"
            >
              <span>
                Оролт <strong className="text-[#1C1C1E] dark:text-white">{formatTokenCount(sessionUsage.inputTokens)}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Гаралт <strong className="text-[#1C1C1E] dark:text-white">{formatTokenCount(sessionUsage.outputTokens)}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Нийт <strong className="text-[#007AFF] dark:text-[#0A84FF]">{formatTokenCount(sessionUsage.totalTokens)}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <span className="hidden sm:inline">Тооцоо </span>
                <strong className="text-[#28A745] dark:text-[#30D158]">{formatUsdCost(sessionUsage.estimatedCostUsd)}</strong>
                <span className="hidden md:inline text-[#8E8E93]"> (Free Tier $0)</span>
              </span>
            </button>

            <button
              type="button"
              onClick={handleResetChat}
              aria-label="Шинээр эхлэх"
              className="p-1 rounded-md text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Live Hands-Free Acoustic Call Bar */}
          <AnimatePresence>
            {handsFreeActive && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16 }}
                className="px-3.5 sm:px-5 py-2 border-t border-black/[0.06] dark:border-white/[0.08] bg-[#007AFF]/[0.06] dark:bg-[#0A84FF]/[0.12] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <motion.div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      voicePhase === 'listening'
                        ? 'bg-[#007AFF] text-white'
                        : voicePhase === 'thinking'
                          ? 'bg-[#FF9500] text-white'
                          : 'bg-[#34C759] text-white'
                    }`}
                    animate={
                      voicePhase === 'listening'
                        ? { scale: 1 + Math.min(0.25, micLevel * 0.0028) }
                        : { scale: [1, 1.1, 1] }
                    }
                    transition={
                      voicePhase === 'listening'
                        ? { duration: 0.08 }
                        : { duration: 1.0, repeat: Infinity, ease: 'easeInOut' }
                    }
                  >
                    {voicePhase === 'listening' ? (
                      <Mic className="w-3 h-3" />
                    ) : (
                      <Volume2 className="w-3 h-3" />
                    )}
                  </motion.div>

                  <span className="text-xs font-semibold text-[#1C1C1E] dark:text-white truncate">
                    {voicePhase === 'listening' && 'Сонсож байна... Ярина уу'}
                    {voicePhase === 'thinking' && 'Шалгаж, хариу бэлдэж байна...'}
                    {voicePhase === 'speaking' && 'Багш ярьж байна...'}
                  </span>
                </div>

                {voicePhase === 'listening' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-0.5 h-3.5 w-14" aria-hidden="true">
                      {[0.4, 0.75, 1, 0.8, 0.55, 0.9, 0.6].map((w, idx) => (
                        <motion.span
                          key={idx}
                          className="flex-1 h-full rounded-full bg-[#007AFF] dark:bg-[#0A84FF] origin-bottom"
                          animate={{
                            scaleY: Math.max(0.2, Math.min(1, (micLevel / 100) * w * 1.4 + 0.14)),
                          }}
                          transition={{ duration: 0.08 }}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleManualSendVoiceTurn}
                      className="min-h-[28px] px-2.5 rounded-full bg-[#007AFF] text-white text-[11px] font-semibold cursor-pointer"
                    >
                      Илгээх
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. Scrollable Message Thread ONLY */}
        <div
          ref={messagesListRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 sm:px-5 py-3.5 space-y-3"
        >
          <AnimatePresence initial={false}>
            {turns.map((turn) => (
              <motion.div
                key={turn.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className={`flex flex-col ${turn.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[82%] px-3.5 py-2.5 sm:px-4 sm:py-3 space-y-1.5 ${
                    turn.role === 'user'
                      ? 'bg-[#007AFF] dark:bg-[#0A84FF] text-white rounded-[20px] rounded-br-[6px]'
                      : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-[#F2F2F7] rounded-[20px] rounded-bl-[6px]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <p className="text-[15px] font-semibold leading-snug">{turn.czech}</p>
                    {turn.role === 'assistant' ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <motion.button
                          whileTap={{ scale: 0.92 }}
                          type="button"
                          onClick={() => void handleSpeakText(turn.id, turn.czech, false)}
                          aria-label={`Энгийнээр сонсох: ${turn.czech}`}
                          className={`min-h-[32px] min-w-[32px] rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                            playingId === turn.id
                              ? 'bg-[#007AFF] text-white'
                              : 'bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-white shadow-2xs'
                          }`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.92 }}
                          type="button"
                          onClick={() => void handleSpeakText(turn.id, turn.czech, true)}
                          aria-label={`Удаанаар сонсох: ${turn.czech}`}
                          className="min-h-[32px] px-2 rounded-full bg-white dark:bg-[#3A3A3C] text-[11px] font-mono font-semibold text-[#1C1C1E] dark:text-white shadow-2xs cursor-pointer"
                        >
                          0.6x
                        </motion.button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setInputText(turn.czech);
                          setSttNotice('Өгүүлбэрийг доор засварлаад дахин илгээж болно.');
                        }}
                        aria-label="Засварлаж дахин илгээх"
                        className="p-1 rounded-full bg-white/15 hover:bg-white/25 text-white shrink-0 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {turn.role === 'user' && turn.recognitionUncertainty && (
                    <p className="text-[11px] text-white/90">
                      Дуу танилт эргэлзээтэй байсан тул буруу танигдсан бол засаж шалгана уу.
                    </p>
                  )}

                  {turn.phonetic && (
                    <p className="text-xs font-mono text-[#007AFF] dark:text-[#64D2FF]">
                      [{turn.phonetic}]
                    </p>
                  )}

                  {turn.mongolian && (
                    <p className="text-[13px] text-[#3C3C43] dark:text-[#EBEBF5]/80">
                      {turn.mongolian}
                    </p>
                  )}

                  {turn.coachingTipMn && (
                    <div
                      className={`text-xs pt-1.5 border-t flex items-start gap-1.5 ${
                        turn.hasError
                          ? 'border-[#FF9500]/30 text-[#9A5B00] dark:text-[#FFD60A]'
                          : 'border-black/[0.06] dark:border-white/[0.08] text-[#636366] dark:text-[#AEAEB2]'
                      }`}
                    >
                      {turn.hasError ? (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#FF9500]" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#34C759]" />
                      )}
                      <span>
                        <strong className="font-semibold">
                          {turn.hasError ? 'Залруулга:' : 'Зөвлөгөө:'}
                        </strong>{' '}
                        {turn.coachingTipMn}
                      </span>
                    </div>
                  )}
                </div>

                {/* Per-turn Token, Model & Cost Footer */}
                {turn.usage && (
                  <p className="mt-1 px-1.5 text-[10px] font-mono tabular-nums text-[#8E8E93]">
                    {turn.usage.usedModel ? `${turn.usage.usedModel} · ` : ''}
                    Оролт {formatTokenCount(turn.usage.inputTokens)} · Гаралт{' '}
                    {formatTokenCount(turn.usage.outputTokens)} · Нийт{' '}
                    {formatTokenCount(turn.usage.totalTokens)} ·{' '}
                    {turn.usage.cacheHit ? 'Кэш (0)' : formatUsdCost(turn.usage.estimatedCostUsd)}
                  </p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="inline-flex items-center gap-2 rounded-[20px] rounded-bl-[6px] bg-[#F2F2F7] dark:bg-[#2C2C2E] px-4 py-2.5 text-xs font-medium text-[#8E8E93]"
            >
              <span className="inline-flex gap-1" aria-hidden="true">
                {[0, 1, 2].map((dot) => (
                  <motion.span
                    key={dot}
                    className="w-1.5 h-1.5 rounded-full bg-[#8E8E93]"
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -2.5, 0] }}
                    transition={{ duration: 0.75, repeat: Infinity, delay: dot * 0.15 }}
                  />
                ))}
              </span>
              <span>Хариу бэлдэж байна...</span>
            </motion.div>
          )}
        </div>

        {/* 3. Pinned Bottom Composer Dock */}
        <div className="shrink-0 border-t border-black/[0.06] dark:border-white/[0.08] bg-white/95 dark:bg-[#1C1C1E]/95 px-3 sm:px-4 py-2 space-y-1.5">
          {lastAiTurn?.suggestedReplyCzech && !handsFreeActive && (
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-[11px] text-[#8E8E93] truncate min-w-0">
                Санал:{' '}
                <span className="font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">
                  {lastAiTurn.suggestedReplyCzech}
                </span>
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => void handleSend(lastAiTurn.suggestedReplyCzech)}
                className="min-h-[26px] px-2.5 rounded-full bg-[#007AFF]/10 dark:bg-[#0A84FF]/20 text-[#007AFF] dark:text-[#0A84FF] text-[11px] font-semibold shrink-0 cursor-pointer"
              >
                Үүнийг илгээх
              </motion.button>
            </div>
          )}

          {sttNotice && <p className="text-[11px] font-medium text-[#007AFF] dark:text-[#64D2FF] px-1">{sttNotice}</p>}
          {errorMsg && <p className="text-[11px] font-semibold text-[#FF3B30] px-1">{errorMsg}</p>}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="flex items-center gap-1.5 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] p-1"
          >
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={handleVoiceDictation}
              aria-label="Чехээр ярьж бичүүлэх"
              className={`min-h-[38px] min-w-[38px] rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                isDictating
                  ? 'bg-[#FF3B30] text-white'
                  : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
              }`}
            >
              {isDictating ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </motion.button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Чех эсвэл Монголоор бичих..."
              aria-label="AI багш руу мессеж бичих"
              className="flex-1 min-w-0 min-h-[38px] bg-transparent px-1.5 text-[14px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] focus:outline-none"
            />

            <motion.button
              whileTap={{ scale: 0.92 }}
              type="submit"
              disabled={isLoading || !inputText.trim()}
              aria-label="Илгээх"
              className="min-h-[38px] min-w-[38px] rounded-full bg-[#007AFF] dark:bg-[#0A84FF] text-white flex items-center justify-center disabled:opacity-35 shrink-0 cursor-pointer"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.4]" />
            </motion.button>
          </form>
        </div>
      </section>

      {/* Usage Monitor & Private Learning Memory Sheet Modal */}
      <AnimatePresence>
        {monitorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-xl max-h-[85dvh] rounded-t-3xl sm:rounded-3xl bg-[#F2F2F7] dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.1] flex flex-col overflow-hidden shadow-xl"
            >
              {/* Modal Header */}
              <div className="shrink-0 px-4 py-3 bg-white dark:bg-[#2C2C2E] border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3">
                <div className="flex items-center p-0.5 rounded-xl bg-[#F2F2F7] dark:bg-[#1C1C1E]">
                  <button
                    type="button"
                    onClick={() => setMonitorTab('usage')}
                    className={`min-h-[32px] px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                      monitorTab === 'usage'
                        ? 'bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-white shadow-2xs'
                        : 'text-[#8E8E93]'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Хэрэглээ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonitorTab('memory')}
                    className={`min-h-[32px] px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                      monitorTab === 'memory'
                        ? 'bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-white shadow-2xs'
                        : 'text-[#8E8E93]'
                    }`}
                  >
                    <BookMarked className="w-3.5 h-3.5" />
                    <span>Санах ой ({memoryItems.length})</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setMonitorOpen(false)}
                  aria-label="Хаах"
                  className="min-h-[34px] min-w-[34px] rounded-full bg-[#F2F2F7] dark:bg-[#3A3A3C] flex items-center justify-center text-[#1C1C1E] dark:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                {monitorTab === 'usage' ? (
                  <>
                    <div className="rounded-2xl bg-white dark:bg-[#2C2C2E] p-3.5 border border-black/[0.05] dark:border-white/[0.06] space-y-1">
                      <p className="text-xs font-semibold text-[#1C1C1E] dark:text-white">
                        Тооцоолсон үнэ vs Бодит төлбөр
                      </p>
                      <p className="text-[11px] text-[#636366] dark:text-[#AEAEB2] leading-relaxed">
                        Доорх дүн нь стандарт API тарифт тулгуурласан <strong>тооцоолсон үнэ</strong> юм.
                        Та AI Studio <strong>Free Tier</strong> квот дотор ашиглаж байгаа бол бодит нэхэмжлэх төлбөр{' '}
                        <strong className="text-[#34C759]">$0.00</strong> байна.
                      </p>
                    </div>

                    {!limitCheck.allowed && limitCheck.reason && (
                      <div className="rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/30 p-3 text-xs font-medium text-[#D70015] dark:text-[#FF453A]">
                        {limitCheck.reason}
                      </div>
                    )}

                    {/* Daily & Monthly Summary Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { title: 'Өнөөдөр', totals: displayToday },
                        { title: 'Энэ сар', totals: displayMonth },
                      ].map(({ title, totals }) => (
                        <div
                          key={title}
                          className="rounded-2xl bg-white dark:bg-[#2C2C2E] p-3.5 border border-black/[0.05] dark:border-white/[0.06] space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#1C1C1E] dark:text-white">{title}</span>
                            <span className="text-[11px] font-mono font-semibold text-[#28A745] dark:text-[#30D158]">
                              ~{formatUsdCost(totals.estimatedCostUsd)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono tabular-nums text-[#636366] dark:text-[#AEAEB2]">
                            <span>Нийт: {formatTokenCount(totals.totalTokens)}</span>
                            <span>Хүсэлт: {totals.requests}</span>
                            <span>Оролт: {formatTokenCount(totals.inputTokens)}</span>
                            <span>Гаралт: {formatTokenCount(totals.outputTokens)}</span>
                            <span>Think: {formatTokenCount(totals.thinkingTokens)}</span>
                            <span>Cache hit: {totals.cacheHits}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Budget Guard Form */}
                    <form
                      onSubmit={(e) => void handleSaveLimits(e)}
                      className="rounded-2xl bg-white dark:bg-[#2C2C2E] p-3.5 border border-black/[0.05] dark:border-white/[0.06] space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-[#1C1C1E] dark:text-white">
                          Зардлын хязгаар (Сервер хамгаалалт)
                        </h3>
                        {limitSavedMsg && (
                          <span className="text-[11px] font-semibold text-[#34C759]">{limitSavedMsg}</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <label className="space-y-1">
                          <span className="text-[11px] text-[#8E8E93]">Өдрийн дээд ($ USD)</span>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            value={limitDraft.dailyCostLimitUsd}
                            onChange={(e) =>
                              setLimitDraft((d) => ({
                                ...d,
                                dailyCostLimitUsd: Number(e.target.value) || 0,
                              }))
                            }
                            className="w-full min-h-[34px] rounded-xl bg-[#F2F2F7] dark:bg-[#1C1C1E] px-2.5 font-mono text-[#1C1C1E] dark:text-white"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-[11px] text-[#8E8E93]">Сарын дээд ($ USD)</span>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            value={limitDraft.monthlyCostLimitUsd}
                            onChange={(e) =>
                              setLimitDraft((d) => ({
                                ...d,
                                monthlyCostLimitUsd: Number(e.target.value) || 0,
                              }))
                            }
                            className="w-full min-h-[34px] rounded-xl bg-[#F2F2F7] dark:bg-[#1C1C1E] px-2.5 font-mono text-[#1C1C1E] dark:text-white"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-[11px] text-[#8E8E93]">Өдрийн токен хязгаар</span>
                          <input
                            type="number"
                            step="10000"
                            min="0"
                            value={limitDraft.dailyTokenLimit}
                            onChange={(e) =>
                              setLimitDraft((d) => ({
                                ...d,
                                dailyTokenLimit: Number(e.target.value) || 0,
                              }))
                            }
                            className="w-full min-h-[34px] rounded-xl bg-[#F2F2F7] dark:bg-[#1C1C1E] px-2.5 font-mono text-[#1C1C1E] dark:text-white"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-[11px] text-[#8E8E93]">Сарын токен хязгаар</span>
                          <input
                            type="number"
                            step="50000"
                            min="0"
                            value={limitDraft.monthlyTokenLimit}
                            onChange={(e) =>
                              setLimitDraft((d) => ({
                                ...d,
                                monthlyTokenLimit: Number(e.target.value) || 0,
                              }))
                            }
                            className="w-full min-h-[34px] rounded-xl bg-[#F2F2F7] dark:bg-[#1C1C1E] px-2.5 font-mono text-[#1C1C1E] dark:text-white"
                          />
                        </label>
                      </div>
                      <button
                        type="submit"
                        disabled={savingLimits}
                        className="w-full min-h-[36px] rounded-xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                      >
                        {savingLimits ? 'Хадгалж байна...' : 'Хязгаар хадгалах'}
                      </button>
                    </form>

                    {/* Recent API Calls Log */}
                    <div className="rounded-2xl bg-white dark:bg-[#2C2C2E] p-3.5 border border-black/[0.05] dark:border-white/[0.06] space-y-2">
                      <h3 className="text-xs font-bold text-[#1C1C1E] dark:text-white">
                        Сүүлийн API хүсэлтүүд ({recentLogs.length})
                      </h3>
                      {recentLogs.length === 0 ? (
                        <p className="text-xs text-[#8E8E93]">Одоогоор бүртгэгдсэн хүсэлт алга.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-56 overflow-y-auto">
                          {recentLogs.map((log) => (
                            <div
                              key={log.id}
                              className="rounded-xl bg-[#F2F2F7] dark:bg-[#1C1C1E] px-3 py-2 text-[11px] font-mono space-y-0.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-[#1C1C1E] dark:text-white truncate">
                                  {log.endpoint} · {log.usedModel}
                                </span>
                                <span className="text-[#8E8E93] shrink-0">
                                  {log.requestDurationMs}ms ·{' '}
                                  {log.cacheHit ? 'CACHE' : formatUsdCost(log.estimatedCostUsd)}
                                </span>
                              </div>
                              <p className="text-[10.5px] text-[#636366] dark:text-[#AEAEB2]">
                                In {log.inputTokens} · Out {log.outputTokens} · Think {log.thinkingTokens} ·
                                Cache {log.cachedTokens} · Нийт {log.totalTokens}
                              </p>
                              {log.apiError && (
                                <p className="text-[10.5px] text-[#FF3B30]">{log.apiError}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-white dark:bg-[#2C2C2E] p-3.5 border border-black/[0.05] dark:border-white/[0.06] flex items-start gap-2.5">
                      <Lock className="w-4 h-4 text-[#007AFF] dark:text-[#64D2FF] shrink-0 mt-0.5" />
                      <p className="text-xs text-[#636366] dark:text-[#AEAEB2] leading-relaxed">
                        Таны ярианаас ялгасан материалууд зөвхөн энэ төхөөрөмжийн{' '}
                        <strong className="text-[#1C1C1E] dark:text-white">хувийн санд</strong> хадгалагдана.
                        Шууд автоматаар баталгаажихгүй бөгөөд таны зөвшөөрөлгүй нийтийн санд орохгүй.
                      </p>
                    </div>

                    {memoryItems.length === 0 ? (
                      <div className="rounded-2xl bg-white dark:bg-[#2C2C2E] p-6 text-center text-xs text-[#8E8E93]">
                        AI багштай харилцан яриа хийсний дараа шинэ өгүүлбэр, залруулгууд энд автоматаар ялгарна.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {memoryItems.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl bg-white dark:bg-[#2C2C2E] p-3.5 border border-black/[0.05] dark:border-white/[0.06] space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-[#007AFF]/10 text-[#007AFF] dark:text-[#64D2FF] text-[10.5px] font-semibold">
                                {MEMORY_STATUS_LABELS[item.status]} · Хувийн
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteMemoryItem(item.id)}
                                aria-label="Устгах"
                                className="p-1 text-[#8E8E93] hover:text-[#FF3B30] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {item.newCzechSentence && (
                              <p className="text-xs font-semibold text-[#1C1C1E] dark:text-white">
                                {item.newCzechSentence}
                              </p>
                            )}
                            {item.mongolianTranslation && (
                              <p className="text-xs text-[#636366] dark:text-[#AEAEB2]">
                                {item.mongolianTranslation}
                              </p>
                            )}
                            {item.studentMistake && (
                              <p className="text-[11px] text-[#9A5B00] dark:text-[#FFD60A]">
                                Алдаа: «{item.studentMistake}» → {item.correctedCzech}
                              </p>
                            )}

                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-black/[0.05] dark:border-white/[0.06]">
                              <span className="text-[10.5px] font-mono text-[#8E8E93]">
                                Давтлага: {new Date(item.nextReviewAt).toLocaleDateString('mn-MN')}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {(item.status === 'Raw' || item.status === 'Extracted') && (
                                  <button
                                    type="button"
                                    onClick={() => handleAdvanceMemoryStatus(item.id, 'Validated')}
                                    className="min-h-[28px] px-2.5 rounded-lg bg-[#007AFF]/12 text-[#007AFF] dark:text-[#64D2FF] text-[11px] font-semibold cursor-pointer"
                                  >
                                    Шалгах
                                  </button>
                                )}
                                {item.status !== 'Approved' && (
                                  <button
                                    type="button"
                                    onClick={() => handleAdvanceMemoryStatus(item.id, 'Approved')}
                                    className="min-h-[28px] px-2.5 rounded-lg bg-[#34C759]/15 text-[#248A3D] dark:text-[#30D158] text-[11px] font-semibold cursor-pointer"
                                  >
                                    Батлах
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
