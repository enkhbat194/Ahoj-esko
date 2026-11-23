# AHOJ — NEXT ACTION
Last updated: 2026-11-23. Status: IN PROGRESS, no production writes.

## Verified baseline
GitHub main: 4431da3eb6ea8e65266e8c30e3df741fcbe4be3e (verify newest SHA again on any next chat).
Continuity docs: Draft PR #29, https://github.com/enkhbat194/Ahoj-esko/pull/29
A0 Drive/GitHub source audit: Draft PR #30, https://github.com/enkhbat194/Ahoj-esko/pull/30
PR #30 compares the latest connected Drive doc against main curriculum JSON: 16 topics, 140 unique IDs, 0 missing/duplicate, 78 title matches, 62 title differences: 48 preliminary wording, 14 potential scope discrepancies. The report, Drive snapshot, machine-readable proposals, and lint audit are in the PR. ALL proposed titles remain pending editorial review. No existing curriculum JSON, UI, audio, or lesson status was altered.
PR #30 original CI completed SUCCESS: https://github.com/enkhbat194/Ahoj-esko/actions/runs/45056208325 . CI verifies a historical Drive snapshot, not live Drive sync. New commits need fresh CI.
PR #30 14-scope evidence worksheet: docs/A0_14_SCOPE_REVIEW_EVIDENCE_v0_1.md (same PR branch). It records proposed can-do, Czech sample gaps, exit scenarios, overlaps and blocker cases. It is NOT editorial sign-off; all 14 remain approved=false.
PR #31 (premature interactive pilot) was CLOSED UNMERGED on explicit curriculum-order correction: https://github.com/enkhbat194/Ahoj-esko/pull/31 . No lesson code was merged into main.

## Exactly one next task
Finalize the 14 flagged learning-objective / scope discrepancies from PR #30, using the new **evidence worksheet** docs/A0_14_SCOPE_REVIEW_EVIDENCE_v0_1.md plus docs/data/a0_outline_reconciliation_2026-11-23.json from branch feat/a0-outline-source-reconciliation-v1. Resolve missing sample phrases, register, semantic blockers (especially Pozor ≠ Stůj; Pracuji tady ≠ occupation), and exit-task/neighbor overlap. The worksheet is a draft source review only: editorial validation is still pending. Then review the other 48 wording proposals. DO NOT write production lesson content, claim approval, or send routine manual QA to the user before the accepted curriculum data is locked.

## Definition of done
1. Each of 62 rows has one accepted canonical title and can-do with evidence; scope cases have scenario/target utterances.
2. Stable A0-Tnn-Lnn skill IDs never reassign meaning; explicit versioning/migration for true semantic changes.
3. Update canonical repo JSON and generated JS in a new PR only after editorial validation, not by silently overwriting the Drive or main.
4. CI passes. Distinguish scripted coverage check from human Czech review and real learner/iPhone testing.
5. Update NEXT_ACTION with newest main SHA, PRs, validated results and the next single concrete task.

## Following milestone
Build 3–6 complete greetings / asking-to-repeat lesson vertical slice (A0-T02 and early A0-T03) using reusable lesson runner, persisted WAV manifest, meaningful practice, exit test and adaptive review; do not fabricate live lesson count.

## Parallel AUDIO G1 (separate repo, not to be confused with CONTENT next action)
AUTO AUDIO v1.2 is USER-CONFIRMED as technical primary policy. Audio Factory draft PR #7: https://github.com/enkhbat194/Audio-uildwerlel/pull/7 . Private 246 manifest from Google Drive; 124 Hana +122 Jan; actual Drive MP3 count in manifest 0. Six ElevenLabs Flows currently show 246 completed and 6 historic failed states. The PR adds read-only History matcher/downloader and offline tests; code is NOT production-deployed, History access and Drive OAuth write/readback remain unverified. **Next single Audio task:** verify authenticated ElevenLabs History Read lookup for Flow generations using narrowly scoped private key in an authorized runner, first LIST ONLY, without TTS generation. No API key in chat/public repo. If Flow history is absent, record blocker and do not regenerate. No public R2 or app publication.

## 2026-11-23 CONTENT checkpoint (added after original state)

The live Google Docs A0 source has been read again and matches the 140-title snapshot in PR #30 (0 live-title drift). On PR #30's feature branch, new unmerged editorial artifacts now exist:
- `docs/data/a0_14_scope_editorial_decisions_v0_2.json` — 14 proposed title/can-do/CZ/MN/register/assessment/overlap/evidence decisions, **all approved=false**.
- `docs/A0_14_SCOPE_EDITORIAL_REVIEW_v0_2.md` — human-readable scope comparison and release gates.
- `docs/A0_CONTENT_CRITICAL_PATH_v0_1.md` — content-first dependency graph and parallelizable work.
- `scripts/check-a0-outline-reconciliation.mjs` — expanded to check 14-case structural completeness in existing CI lint.

**NEXT ACTION REMAINS:** Independent Czech/Mongolian editorial validation of these 14 candidate resolutions, especially safety commands, occupation, ty/vy and test scope. Then review 48 wording records. This checkpoint does **not** claim pedagogical approval or a finished lesson and does not merge PR #30. Check PR #30 CI conclusion on its latest HEAD before reporting success.

## 2026-11-23 BATCH CONTENT checkpoint: 48 review proposals complete, NOT approved
PR #30: `feat/a0-outline-source-reconciliation-v1`. New draft files on that branch:
- `docs/data/a0_wording_review_batch_01_v0_1.json` through `04`: review 48 original wording cases, individually proposing name/can-do/CZ+MN examples/exit task/neighbor boundary.
- `docs/A0_48_WORDING_BATCH_REVIEW_v0_1.md`: four-batch summary.
- `docs/data/a0_62_editorial_decision_register_v0_1.json`: 14 original scope + 48 wording = 62 exact unique IDs with evidence and blockers. **18 of the 48 original wording cases are additional scope-risk *questions*, not newly proven errors**. Remaining 30 are wording draft proposals.
- `scripts/check-a0-outline-reconciliation.mjs`: strengthened automated structural verification for 14/48/62 entries and mandatory draft flags.
**Exactly one next CONTENT task:** Independently adjudicate the **14 original scope** and **18 additional scope-risk candidates** at Czech/Mongolian text and test level. Prioritize T09-L07/08 (safety), T06-L05 (Mongolian kinship vs Czech brother/sister), T12-L05 (square/rectangle), T09-L01 (profession), T02-L09/L10/L18 (formal/informal). Record approved/blocked **only with actual review evidence**. Batch the remaining 30 naming edits for subsequent editorial checks. Do NOT publish canonical JSON, perform TTS, or merge PR #30 while approved=false. CI on the final PR head must be checked separately (latest may be pending).

## 2026-11-23 VOICE + PRIVATE AUDIO ARCHIVE checkpoint
- **Private audio found and counted in connected secondary Google Drive:** `AHOJ_AUTO_AUDIO_PRIVATE_20261123` contains **246 MP3** `HANA_JAN_246_MP3` and **30 MP3** `REMAINING_ELEVENLABS_MP3`, total **276**. Both folder listings directly verified. Private archive integrity/tech QA reports state 276/276 MP3 matched receipts/ZIP checks and 276/276 decoded with no technical warnings. **Czech text/pronunciation NOT verified.**
- **Explicit owner voice requirement:** Reader/Graded Reader audio **male-only** (including current stuck-word playback). Lessons use **female + male speaker voices** assigned by scene roles. Dictionary must reuse **separate per-word audio for every approved Czech spoken surface form** used by content; a sentence MP3 is not a word MP3.
- **Do not delete, regenerate, publish or copy private 276 to R2/GitHub.** Voice quality and Czech text signoff needed before any application use.
- Actual machine policies recorded on **PR #32** `feat/curriculum-system-v1-2026-11-23`:
  - `curriculum/system-v1/audio-voice-policy.json`
  - `curriculum/system-v1/learning-contract.json` cumulative Top100→200→300→500→1000 lexeme/sense/form registry contract
  - `curriculum/system-v1/a0-topic-word-audio-inventory.draft.json` contains **81 orthographic word forms from 60 current A0 topic sample phrases only**; all unmapped/unapproved (not all app/reader words).
  - `scripts/check-learning-system.mjs` includes voice and lexicon backlog regression assertions.
- **NEXT REAL WORK:** tie all actual approved lessons and reader chapter text to the single lexicon's lemma/sense/form IDs, then map each to individually verified word assets; new TTS is forbidden before exact text approval. This is **not** app playback implemented.


## 2026-11-23 CONTENT-FIRST HANDOFF (PR #32)
- AUDIO ownership: different chat. Current curriculum work **must not call ElevenLabs, copy Drive assets, publish audio or mark audio QA pass**.
- Added `curriculum/system-v1/lexicon/top100.candidate.json`: **100 unique contextual Czech lemma candidates** with linked first session, CZ editorial PENDING, frequency NOT MEASURED. A candidate shortlist, not approved Czech corpus Top100.
- Added `curriculum/system-v1/exercise-catalog.json`: **12 exercise types**, pilot **7–9 visible exercises** and 15 pedagogical functions (the functions are not 15 compulsory separate screens).
- Added `curriculum/system-v1/lessons/a0-intro-001.content.draft.json`: **6 target lexemes, 7 draft utterances, 9 exercises with answer keys, unseen transfer**. Covers `A0-T02-L01` + `A0-T02-L02` only, NOT the third skill in provisional `A0-S004`. One audio exercise BLOCKED.
- Added `curriculum/system-v1/lessons/a0-intro-word-forms.draft.json`: **11 unique Czech orthographic forms, all individual word audio MISSING**, learner dialogue/lesson/reader word playback must share the eventual verified word form assets.
- Reader main has **two sample A0 books and four chapters without curriculum lexeme mappings or validated vocab coverage**. Added `curriculum/system-v1/reader-series-gates.draft.json`: four different adult graded series outlines + release/unknown-word/narrative quality gates. No story prose declared ready.
- CI script `scripts/check-learning-system.mjs` validates counts, references and all not-published flags. PR #32 is still DRAFT; main untouched.
- **NEXT ACTION:** complete CZ+MN editorial validation of the Top100 and first pilot content against actual Czech A1 and corpus evidence; fix the missing A0-T02-L03 packaging, then implement text-only A0 lesson engine and test scenario flows. Do not start reading novels or TTS before stable content and lexicon references.


### 2026-11-23 FIRST LESSON TEXT ENGINE CHECKPOINT
- PR #32 now also has `curriculum/system-v1/lesson-engine.mjs` and `scripts/test-lesson-engine.mjs` wired to `npm run lint`. Text exercise evaluator grades choice/match/token-order/cloze; DOES NOT invent STT pronunciation scores, open-ended semantic grading, learner mastery or audio success.
- First pack `A0-PACK-INTRO-001` has 6 draft lexemes, 9 exercise blocks (8 viewable text and 1 audio blocked), but is **not integrated in PWA** and source S004 has still 1 missing skill L03. Top100 and reading series are draft/editorial pending.
- Next code task (curriculum/engine only): versioned schema validation of approved lexeme/form/sentence boundaries and minimal Premium PWA mounting of the text-only pack in a feature branch, no fake production audio. Cross-chat audio owns ElevenLabs.


## 2026-11-23 READER/ADAPTIVE CONTENT CHECKPOINT
- On PR #32 branch `feat/curriculum-system-v1-2026-11-23`, independent reading **is not forced to use Top100-only vocabulary**. Unknown words have contextual glosses and are staged into flashcards after reading, not falsely assumed learned.
- `curriculum/system-v1/reader-stories.content.draft.json`: 3 unrelated reader directions and 3 draft opening chapters / 25 CZ+MN sentences / 64 Czech word-form annotations: cosmic mystery `Světlo v okně`, romantic mystery `Dopis bez jména`, astronomy science `Odkud má Měsíc světlo?`. All PENDING Czech/Mongolian editorial; no approved audio or publication.
- `curriculum/system-v1/reader-adaptive-engine.mjs`: pure offline reader event reducer, per-context word glossary, cards, de-duplicated cross-chapter profile, review due dates, errors/help/retries and cautious pause signals. `scripts/test-reader-adaptive.mjs` included in `npm run lint`.
- This is **NOT** an in-app working reader yet: UI bindings, learner progress persistence, AI conversational tutor and native language QA are still missing.
- **NEXT REAL ACTION:** connect an approved reader content package and reading events to existing Premium PWA's reader/card tabs (with feature flag), persist per-user progress, then test actual mobile flow. Avoid any ElevenLabs generation/Drive/R2 changes in this chat. Audio belongs to the separate active audio chat.
