# Ahoj Česko — v0.9.9 Execution Report

- Date: 2026-11-17.
- Source of truth: v0.9.8 Golden Slice demo and 431-item source registry. No rewrite of validated A0/A1 books.
- Newly implemented: answer-before-grade guard, due-only grading, card dedupe with meaning-context guard and multiple source IDs, story sentence+token semantic click controls, 5th pronunciation tab with on-device ephemeral recording, versioned progress export/import/delete, improved multi-intent text scenario & deterministic conversation, no real XP and explicit QA status.
- Fixed bug: v0.9.8 nested sentence button and word controls, v0.9.8 single-intent-per-turn recognition, early regrading without retrieval, untracked source-duplicate cards.
- Automated: 19/19 Node tests passed, independent static content integrity checks passed.
- Browser QA: BLOCKED_BY_ADMINISTRATOR in provided environment. Not reported as pass.
- User-facing content: A0 lesson M01-L01 6 sentences, story CH01 20 sentences; every item draft/qa pending.
- Privacy: no recording upload, audio memory lifetime only, no API keys in frontend.
- Remaining: actual AI, ASR pronunciation score, real FSRS, native human review, device test, public release.
- Git integration: develop on isolated branch `feature/ahoj-golden-slice-v099`; existing `main` untouched.
