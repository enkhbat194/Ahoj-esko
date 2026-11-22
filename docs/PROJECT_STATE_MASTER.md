# AHOJ — PROJECT STATE MASTER
Verified: 2026-11-23. Status: documentation proposal, not an approved product release.

## Read first
Repo: https://github.com/enkhbat194/Ahoj-esko
Canonical production branch: main. Last independently verified main commit: 4431da3eb6ea8e65266e8c30e3df741fcbe4be3e (2026-11-22). ALWAYS retrieve current main SHA before working.
Current source for A0 outline: public/cesky-reading-uiux/a0-curriculum.json. Connected Drive outline: AHOJ_A0_16_TOPICS_140_LESSON_OUTLINE_v1_0 (2026-11-22). The two currently differ in 62 lesson titles; some semantic differences. DO NOT silently choose one wording without reconciliation.
A0: 16 topics and 140 stable micro-skill IDs. All 140 were marked content_status=outline, qa_status=pending, audio_status=not_generated at verification. The UI shows outlines; it is NOT 140 finished lessons.
Main UI: public/cesky-reading-uiux/index.html; reader: reader-experience.js/.css; server: server.ts. Premium black/orange UI and 5 tabs. Old green React app must not be restored. Archive: archive/pre-separation-2026-11-22.
Existing AI: server tutor, reading-help and TTS endpoints. Current TTS model string: gemini-3.8-flash-lite-tts; in-memory up to 200 items, not persistent production audio. Browser speechSynthesis fallback; Browser SpeechRecognition guided mode with limitations. Do not equate STT transcript with pronunciation assessment.
CI on verified main: Test Ahoj Cesko PASS and Reader Browser QA PASS; its TTS and STT interactions are partly mocked and WAV is synthetic. This is not a physical iPhone Czech pronunciation certification.
Reading UI has a small number of real drafted book chapters, not the complete graded reader library. Full dictionary, validated morphology/word senses, persistent audio, audio-word alignment, verified STT and course-runner are NOT INTEGRATED.

## Fundamental product direction
Course standard: CEFR action-oriented goals + comprehensible input + interaction/output + recall + adaptive spaced review + corrective feedback. No 10x speed promise. Keep A0 16 domains as a draft; 140 IDs represent micro skills, not necessarily 140 separate 15-minute sessions. Proposed grouping: 68 A0 learning sessions, to validate in pilots.
Editorial: Czech naturalness, Mongolian natural meaning and audio phonetics are separate release gates. User does not do routine manual QA.
One source of truth: versioned repo JSON and schema, with Drive as reference/draft/backup. Do not create two editable independent production curricula.
Main product does not change unless PR tests and content QA pass. Proposed future decisions belong in docs/DECISIONS.md and are labelled PROPOSED.

## Current blocking gaps, ordered
1. Reconcile 62 Drive-vs-GitHub lesson titles and any semantic ID drift; define stable skill_id + session_id.
2. Finish 3–6 actual greeting/repair lessons as a vertical slice with natural Czech, Mongolian, listening, pronunciation chunks, retrieval, roleplay, novel scene, exit test.
3. Produce verified persisted WAV and audio manifest; no API generation on every lesson open.
4. Build reusable lesson renderer/engine and review persistence; do not replace whole premium UI.
5. Real iPhone Safari microphone/audio and learner pilot after CI.

## Cross-chat rule
Each new chat first reads this file, docs/NEXT_ACTION.md, docs/DECISIONS.md, docs/CURRICULUM_MASTER_DRAFT.md and checks main commit, branches, PRs, CI. Report VERIFIED vs PROPOSED vs NOT_TESTED. Do not guess from conversational memory.

## 2026-11-23 Owner-approved AUTO AUDIO v1.2 supersedes earlier suggested Gemini-first TTS direction
AUDIO FACTORY REPOSITORY: https://github.com/enkhbat194/Audio-uildwerlel ; G1 read-only recovery implementation DRAFT PR #7 https://github.com/enkhbat194/Audio-uildwerlel/pull/7 . Existing Audio Factory main is Firebase/Express/Vertex; the Cloudflare Workers/D1/Queues implementation described in v1.2 is a target, NOT deployed. Primary production TTS is ElevenLabs (eleven_multilingual_v2) with Hana and Jan, archival Google Drive PRIVATE. Do NOT publish any media into app, R2 or public CDN.
Private Drive ElevenLabs manifest (2026-11-21): 246 source IDs, 124 Hana/122 Jan, 0 MP3 exported to Google Drive, no final pronunciation QA. Six connected ElevenLabs Flows verified 252 run states: 246 completed, 6 historical failed. History API actual recoverability and MP3 checksums are NOT_TESTED. ChatGPT ElevenLabs connector lacks History list/download actions, so a separate authorized private runner is needed. No live API key requested in chat. Old audio exports and Gemini/Aneta tests must not be deleted.
Separate workstreams: CONTENT owner handles 62 Drive/GitHub A0 title discrepancies in Ahoj PR #30. AUDIO owner does G1 recovery without waiting for new content. Production NEW audio is blocked until content audio_ready; no automatic TTS on draft. Keep one source-of-truth lesson JSON in Ahoj repository; Drive is private media archive and content snapshot. New private audio must be linked to source content and must never be marked app-published automatically.
