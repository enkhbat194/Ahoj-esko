# AHOJ — DECISION REGISTER
2026-11-23. All decisions recorded here are architecture direction unless marked APPROVED after verification.

D001 [DIRECTION]: main Premium 5-tab PWA is the product. No restoration of archived old green React app. Feature branches + tested PRs only.
D002 [DIRECTION]: CEFR can-do and meaningful communication determine success; Krashen comprehensible input is one pillar, not input-only, no rigid 80/20 split.
D003 [PROPOSED]: A0 uses 16 communication domains, 140 stable micro-skill IDs; group provisionally into 68 user-visible study sessions; do not claim 140 completed lessons.
D004 [PROPOSED]: cumulative lemma targets and new lemmas per study session are planning hypotheses; adjust with pilot, do not call them CEFR standards.
D005 [DIRECTION]: dictionary stores lemma and sense and context separately. Czech case/verb conjugations are forms of a lemma, not independent new vocabulary counts.
D006 [DIRECTION]: text+audio manifest version lock, canonical source content in GitHub; Drive acts as draft/reference/archive.
D007 [USER_CONFIRMED AUTO AUDIO v1.2]: PRIVATE PRODUCTION only. Recover archived audio and produce NEW separate MP3 per approved word/sentence/phrase/dialogue/story unit; persist privately in Google Drive with source ID, exact text/voice/model/settings hash, SHA256, duration, QA and upload readback. No public R2/CDN or app publication until separately approved.
D008 [USER_CONFIRMED AUTO AUDIO v1.2]: PRIMARY production TTS ElevenLabs eleven_multilingual_v2, voices Hana and Jan. Already 246 completed generation nodes recorded, but 0 corresponding archived MP3 in Drive. First priority G1 recover with History Read without new TTS. Gemini/Google/other voices remain separate previous trials or future alternatives requiring explicit decision. Never silently substitute default provider or voice.
D009 [DIRECTION]: browser ASR transcript is not a full pronunciation grade; current stuck-word help plays only current word and does NOT advance progress.
D010 [DIRECTION]: automation performs structural, audio-format, coverage, source-version and browser tests. Czech naturalness and phonetics require distinct editorial/pilot gates; ordinary manual QA is not delegated to the user.
D011 [OPEN]: Resolve 62 Drive-vs-repo titles, any semantic drift in IDs, skill-to-session mapping and A0 exit criteria.
D012 [OPEN]: Choose exact Czech voice/model, storage backend/configuration, budget ceilings and STT provider only after live bench.
D013 [OPEN]: A1–B2 topic inventories and full curriculum not approved yet; tentative level topology only.

Changing an APPROVED decision requires rationale, alternatives, affected files, migration plan and verification evidence. Never overwrite decisions silently.
