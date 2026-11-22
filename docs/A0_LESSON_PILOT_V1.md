# AHOJ — A0 interactive lesson pilot v1 (NOT published)

## Scope and ground truth
- **App:** current premium dark/orange PWA at \`public/cesky-reading-uiux/index.html\`.
- **Canonical curriculum:** \`a0-curriculum.json\` / \`a0-curriculum.js\`, unchanged: 16 topics, 140 stable outline IDs.
- **Interactive pilot IDs only:** \`A0-T02-L01\`, \`A0-T02-L02\`, \`A0-T03-L01\`, \`A0-T03-L03\`.
- **Phrase source:** Czech and Mongolian strings are looked up from the existing corresponding topic's \`phrases\` array. The engine rejects unknown phrases or lesson IDs on initialization.
- **Editorial status:** \`editorial_pending\`. The pilot is NOT equivalent to published lesson content or Czech-native review. It does not resolve the 62 Drive/source title differences; see draft PR #30.

## Implemented learner journey
1. Stage → Topic → select an available **Туршилтын дасгал**.
2. See the real Czech phrase with its existing Mongolian meaning; tap to try the device's Czech system voice.
3. Answer a contextual meaning question; incorrect answers retry and count as errors.
4. Speak aloud; optionally record up to 12 seconds and replay **locally**. Explicitly self-report that speaking was attempted; **no automatic pronunciation grade**.
5. Answer an unaided-recall multiple choice and a different contextual exit scenario.
6. Save a versioned \`localStorage\` record, labeled \`result: "practice_only"\`, never "mastered". Show a tentative reminder after 1 day when errors occurred or 3 days otherwise.
7. Reopen or resume a partially completed lesson. Audio recording itself is ephemeral, never uploaded or saved across reloads.

## Audio policy
No ElevenLabs, Cloudflare, remote audio recovery, paid TTS, or new MP3 generation. The pilot only uses a **Czech-language browser system voice when one exists**; otherwise it reports unavailability and permits text-based practice. This is not a substitute for verified native Czech MP3. No microphone recording is transmitted to the server.

## Non-goals and known limitations
- Four **pilot** micro-lessons, not four production-ready lessons.
- Multiple-choice checks demonstrate recognition/retrieval only, not free speaking competence.
- No authenticated cross-device progress sync, full adaptive SRS, persisted WAV manifest, or verified audio.
- Self-reported spoken practice must never be represented as pronunciation success.
- Content needs Czech/Mongolian editorial and learner validation before release.
- Existing reader and other Stage outline cards remain unchanged.

## Test gates
- \`npm run lint\`: existing TypeScript/outline checks plus \`scripts/check-lesson-pilot.mjs\`, covering canonical phrase/ID matching, wrong-answer retry, progression, speaking self-report, storage and no remote TTS calls.
- \`scripts/check-reader-browser.mjs\`: existing reader QA plus a real mobile Chromium click-through of the Stage → greeting lesson → exit path. This is **not** an iPhone hardware test.

## Next after passing CI
Verify on an actual iPhone (Czech voice availability and microphone recording); commission Czech-native editorial review; then iterate from four pilots to 3–6 fully reviewed lessons with verified audio and a proper task-based speaking assessment. Do not claim 140 complete lessons.
