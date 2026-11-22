# AHOJ — CHAT HANDOFF AND PARALLEL WORK PROTOCOL
Proposed workflow, 2026-11-23.

## Single master startup instruction for ANY new chat
Continue AHOJ at https://github.com/enkhbat194/Ahoj-esko. First fetch the current main SHA, open PRs, CI status, and these files: docs/PROJECT_STATE_MASTER.md, docs/NEXT_ACTION.md, docs/DECISIONS.md, docs/CURRICULUM_MASTER_DRAFT.md, docs/architecture.md, docs/project_map.txt. Check actual repo files rather than trusting memory. The production branch is main. Old green React frontend is archived, not to be restored. Distinguish verified implementation, planned curriculum, failed integration and assumptions. Give one next concrete action and work on a feature branch. At the end, update handoff files via PR. Do not ask me to perform manual QA; automate engineering checks and flag genuine Czech/editorial reviews separately.


## Branch-aware startup correction (2026-11-23)
**Critical:** PR #29 continuity files are not in main until that PR is merged. The generic instruction above to fetch `docs/NEXT_ACTION.md` from main will return 404 right now. First get PR #29 status. If still open, fetch those files from branch `docs/continuity-curriculum-proposal-2026-11-23`. PR #30 editorial files likewise live only on `feat/a0-outline-source-reconciliation-v1` until merged. Use the branch-aware, task-specific [NEW_CHAT_MASTER_PROMPT_CONTENT_v2_2026-11-23.md](NEW_CHAT_MASTER_PROMPT_CONTENT_v2_2026-11-23.md) as the current detailed startup contract. The latest 14-scope evidence register is in PR #30 v0.2; `approved=false` for every case. Never assume these files have moved to main or that pending editorial gates passed.

## Four workstreams / chats
1. MASTER: coordinates PRs, evidence, decisions, one NEXT_ACTION. Does not modify code concurrently with implementation chats.
2. CURRICULUM: defines skill, text, lexicon, story and pedagogical QA on separate content branch. Owns content data, never changes site shell silently.
3. APP ENGINE: reader, lesson runner, card, review, storage, STT, frontend/backend on feature branch. Consumes approved schemas, does not invent lessons.
4. AUDIO & QA: TTS provider adapter, generation job, persistent storage, audio hashes/alignment and tests on media branch. Does not rewrite curriculum text.

## Golden operating rules
- GitHub main is canonical only after PR merge; drafts and proposals belong to separate branches.
- Each feature branch starts from latest main. No concurrent edits to same file without coordination.
- Propose schema changes first; lock schema version for batch work. Maintain migration for stable skill IDs.
- No unchecked auto-merge. Branch CI + real API smoke + asset checks + targeted browser QA before merging; if missing capabilities state NOT_TESTED.
- Each chat writes: verified main SHA, files touched, tests run and exact results, pending PR, one next task, blockers in handoff docs.
- Work does not execute autonomously after a chat ends. Parallel chats and agents need an explicit running task and access to connectors; this protocol provides recoverability, not automatic invisible background work.
- Never expose Google/AI keys or private data in logs/docs. Keep secrets server-side.
