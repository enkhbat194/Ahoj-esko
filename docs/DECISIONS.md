# AHOJ — DECISION REGISTER
2026-11-23. All decisions recorded here are architecture direction unless marked APPROVED after verification.

D001 [DIRECTION]: main Premium 5-tab PWA is the product. No restoration of archived old green React app. Feature branches + tested PRs only.
D002 [DIRECTION]: CEFR can-do and meaningful communication determine success; Krashen comprehensible input is one pillar, not input-only, no rigid 80/20 split.
D003 [PROPOSED]: A0 uses 16 communication domains, 140 stable micro-skill IDs; group provisionally into 68 user-visible study sessions; do not claim 140 completed lessons.
D004 [PROPOSED]: cumulative lemma targets and new lemmas per study session are planning hypotheses; adjust with pilot, do not call them CEFR standards.
D005 [DIRECTION]: dictionary stores lemma and sense and context separately. Czech case/verb conjugations are forms of a lemma, not independent new vocabulary counts.
D006 [DIRECTION]: text+audio manifest version lock, canonical source content in GitHub; Drive acts as draft/reference/archive.
D007 [DIRECTION]: pre-generate approved Czech WAVs and persist them outside ephemeral server cache. Provider is replaceable. Audio QA and voice consistency required.
D008 [PROPOSED]: try Gemini 3.8 Flash TTS, then Google Cloud Chirp 3 HD Czech, Azure Czech Neural, or local Piper Czech as quality/cost/availability dictates. Do 20-sentence A/B Czech benchmark with native reviewer; never silently mix teacher voices.
D009 [DIRECTION]: browser ASR transcript is not a full pronunciation grade; current stuck-word help plays only current word and does NOT advance progress.
D010 [DIRECTION]: automation performs structural, audio-format, coverage, source-version and browser tests. Czech naturalness and phonetics require distinct editorial/pilot gates; ordinary manual QA is not delegated to the user.
D011 [OPEN]: Resolve 62 Drive-vs-repo titles, any semantic drift in IDs, skill-to-session mapping and A0 exit criteria.
D012 [OPEN]: Choose exact Czech voice/model, storage backend/configuration, budget ceilings and STT provider only after live bench.
D013 [OPEN]: A1–B2 topic inventories and full curriculum not approved yet; tentative level topology only.

Changing an APPROVED decision requires rationale, alternatives, affected files, migration plan and verification evidence. Never overwrite decisions silently.
