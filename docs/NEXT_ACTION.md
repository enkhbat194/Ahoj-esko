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
