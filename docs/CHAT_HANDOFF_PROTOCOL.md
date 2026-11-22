# AHOJ — CHAT HANDOFF AND PARALLEL WORK PROTOCOL
Proposed workflow, 2026-11-23.

## Single master startup instruction for ANY new chat
Continue AHOJ at https://github.com/enkhbat194/Ahoj-esko. First fetch the current main SHA, open PRs, CI status, and these files: docs/PROJECT_STATE_MASTER.md, docs/NEXT_ACTION.md, docs/DECISIONS.md, docs/CURRICULUM_MASTER_DRAFT.md, docs/architecture.md, docs/project_map.txt. Check actual repo files rather than trusting memory. The production branch is main. Old green React frontend is archived, not to be restored. Distinguish verified implementation, planned curriculum, failed integration and assumptions. Give one next concrete action and work on a feature branch. At the end, update handoff files via PR. Do not ask me to perform manual QA; automate engineering checks and flag genuine Czech/editorial reviews separately.

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
