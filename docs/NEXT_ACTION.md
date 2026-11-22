# AHOJ — NEXT ACTION
Last updated: 2026-11-23. Status: IN PROGRESS, no production writes.

## Verified baseline
GitHub main: 4431da3eb6ea8e65266e8c30e3df741fcbe4be3e (verify newest SHA again on any next chat).
Continuity docs: Draft PR #29, https://github.com/enkhbat194/Ahoj-esko/pull/29
A0 Drive/GitHub source audit: Draft PR #30, https://github.com/enkhbat194/Ahoj-esko/pull/30
PR #30 compares the latest connected Drive doc against main curriculum JSON: 16 topics, 140 unique IDs, 0 missing/duplicate, 78 title matches, 62 title differences: 48 preliminary wording, 14 potential scope discrepancies. The report, Drive snapshot, machine-readable proposals, and lint audit are in the PR. ALL proposed titles remain pending editorial review. No existing curriculum JSON, UI, audio, or lesson status was altered.
PR #30 CI was in progress at the time this file was edited; check actual run result rather than assuming PASS. CI verifies a historical Drive snapshot, not live Drive sync.

## Exactly one next task
Resolve the 14 flagged learning-objective / scope discrepancies from PR #30, checking Czech target utterances, natural Mongolian interpretation, social register, and exit-task suitability. Use docs/data/a0_outline_reconciliation_2026-11-23.json and docs/A0_OUTLINE_RECONCILIATION_REPORT.md from branch feat/a0-outline-source-reconciliation-v1. Review the other 48 editorial-wording proposals for consistency. Treat all proposals as unapproved until Czech/Mongolian review. Do NOT send routine manual QA to the user.

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
