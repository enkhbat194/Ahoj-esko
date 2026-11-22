# AHOJ — Content-first critical path and zero-rework handoff v0.1
**Date:** 2026-11-23. **Status:** WORKFLOW PROPOSAL — not production approval.

## Invariants
- One canonical released curriculum source: versioned repo JSON. Drive is a versioned input/reference and export/archive, **not a second independent production editor**.
- `skill_id` is stable; `session_id` groups skills only after validation. 140 micro-skill IDs ≠ 140 complete lessons. 68 sessions remains unapproved hypothesis.
- A Czech expression is not `audio_ready` until exact surface text, context-specific MN meaning, grammar, formality and phrase boundaries are approved.
- Preserve PR #31 closed and unmerged. Do not revive unverified code; avoid premature UI/TTS development.
- Every job stores `input_version`, `output_version`, content hash, provenance, status and its blocking reason.
- Separate independent PASS states: structural/CI, CZ linguistic editorial, MN editorial, audio/phonetic, simulated browser QA, real device/learner QA.

## Dependency chain (the shortest path without rework)

| Gate | Work package | Exact output required | Can start after | Can run in parallel | Exit condition and blocked successor |
|---|---|---|---|---|---|
| G0 | Repository/Drive freeze | PR #30 source snapshot; 140 stable ID parity; 62 row ledger; commit SHA | Now | None (shared baseline) | **DONE** for historical snapshot; live Drive drift still needs checking when source changes. |
| G1 | 14 scope resolutions | For each ID: Drive/GitHub titles, one recommended standard name + observable can-do, CZ/MN targets, register, context, distinct exit test, neighbor overlap and sources | G0 | Gate G2 may gather **evidence only**, without accepted publishing | **DRAFT COMPLETE**, stored in `docs/data/a0_14_scope_editorial_decisions_v0_2.json`; native CZ/MN editorial signoff is blocking release. |
| G2 | Remaining 48 wording reviews | 48 decisions with same stable IDs, accepted Mongolian title, can-do and concrete CZ example; a flag for any case that unexpectedly changes scope | G0 | G1's expert reviews | All 48 independently reviewed, no semantic drift hidden under `wording_review`. |
| G3 | Lock all 62 decisions | Versioned `content_decision_manifest`; exact 62/62 coverage, source hash, migration log, human/AI roles, blocking reasons; accepted canon state only after required editorial signoff | G1+G2 | Lesson framework schema/prototype **specification** (no app code) | **62/62 approved or explicitly quarantined**. Never silently publish unresolved entries. |
| G4 | Canonical sync | One new branch/PR applies only approved decisions into `public/.../a0-curriculum.json`; regenerate JS from JSON, produce Drive read-only export snapshot | G3 | Prepare lesson specifications and test fixtures | JSON↔JS parity, ID retention, no unreviewed publication, CI PASS; clean migration trace. |
| G5 | 3–6 validated lesson content packs | Approved beginner micro-skill targets, complete scenarios, utterance IDs, natural CZ/MN, remediation, recall/review, new-context exit tests, required audio unit segmentation | G4 | Independent text/audio technical evaluation, **without new TTS generation yet** | Each pack: no missing content or links; editorial PASS on exact utterance revisions. |
| G6 | Content-addressed media production | After `audio_ready`: per-word/phrase/sentence/dialogue-turn/story-sentence private media; manifest with hashes, audio/phonetic QA, explicit publication permissions | G5 | Engine module/contract design only | 100% media referenced present+verified. No duplicate synthesis and no public R2 while blocked. |
| G7 | Reusable lesson engine + automated QA | Run 3–6 complete lessons through the *same* components: practice, replay current stuck word, retrieval, feedback, review, exit; automated contract/CI/browser checks | G5 (text engine); G6 (verified media integration) | Accessibility and dictionary content planning | Type/schema, broken-link, linguistic coverage, media hash, e2e flow PASS. Browser STT transcript ≠ pronunciation grade. |
| G8 | Physical-device and learner validation | iPhone Safari mic/audio, offline/restore, actual learner task outcome, observed confusion/errors and remediation plan | G7 | Expansion planning only | Tested on real device; no 100% pronunciation claims; gates documented. |
| G9 | Expand across A0 then A1–B2 | Versioned approved topic/skill/session maps and lesson packs built from G7 factory | G8 + curricula reviewed by level | Incremental levels, not a speculative bulk release | Each release meets the exact same QA gates, with content hashes and traceability. |

## Parallel work that does not invalidate the critical path
- **Track A: scope review** — fix 14 ambiguous cases and collect independent Czech/MN proof without touching canonical JSON.
- **Track B: wording review** — 48 other proposals, flag any new actual scope errors; no changes to accepted material while A unresolved.
- **Track C: data contracts** — document `skill_id`, `session_id`, `utterance_id`, `sense_id`, `review_status`, `source_hash`, `audio_unit_type`, `qa_gate` and migration semantics; specification only until approved content.
- **Track D: QA design** — deterministic validators for duplicate/missing IDs, phrase/translation pairing, register tags, source drift, scope collision, audio boundary manifest and gate coverage.
- **Audio work** is explicitly excluded from this content workstream now; no new TTS, Worker or PR #31 pilot.

## Decision format and anti-rework checks
One row per ID, never free-floating duplicate tables. Minimum fields:
`skill_id`, `source_drive_title_mn`, `source_github_title_mn`, `recommended_title_mn`, `recommended_can_do_mn`, `cz_targets[]`, `mn_glosses[]`, `register`, `context`, `assessment`, `neighbors`, `evidence_urls[]`, `editorial_status`, `approved`, `source_version`.

A **content freeze** records the hash for every approved utterance. If a CZ phrase changes, only assets with that text hash are invalidated; unaffected MP3s, exercises and review history should not be recreated. `approved=true` is only set after the required linguistic gates, not because CI passed.

## Immediate NEXT_ACTION after this commit
1. Run automated validation of v0.2 14-case register and refresh PR #30 CI.
2. Resolve actual Czech-native and Mongolian editorial gates, priority: **T09-L07 safety**, **T09-L01 profession**, **T02-L09/L10/L18 register**, **T05-L08 scope**.
3. Gather and review 48 wording rows separately; do not mislabel editorial reviews as completed lesson content.
4. Finalize 62 decisions; only then create canonical data update PR.

**Current state:** G0 PASS; G1 draft data and evidence complete but NOT approved; G2–G9 not complete. Never use deadlines or learner gains as fabricated promises.
