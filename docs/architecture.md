# AHOJ — PRODUCT ARCHITECTURE (PROPOSED)
Verified current app: premium PWA, Express/TypeScript server, Vite build. Actual file map: docs/project_map.txt. No new framework rewrite.

## Data flow
Versioned CZ/MN canonical lesson JSON in repo -> schema + editorial content QA -> build -> reusable Lesson Engine -> Premium PWA (Stages, Reader, AI, Cards, Dictionary).
Owner-approved AUTO AUDIO v1.2: approved text in an audio_ready state -> segmentation by word / phrase / sentence / dialogue turn / story sentence -> exact text+voice+model+style hash -> reuse existing ElevenLabs History or private MP3 -> separately generated MP3 only when necessary -> technical, transcript and phonetic-risk QA -> PRIVATE Google Drive archive + verified SHA256/readback -> immutable audio manifest (publish_allowed=false). Main voices Hana/Jan, provider ElevenLabs; NO automatic app/R2 delivery. Cloudflare Workers + D1 + Queues is target architecture in separate Audio-uildwerlel repo, not deployed. Only after explicit public delivery approval may app use R2/CDN/service worker, with release manifests.
STT provider adapter/browser ASR -> transcription with confidence/evidence -> intent/task evaluator; separate pronunciation rubric verified on accented Czech learner speech; fallback to non-STT comprehension and repeat without fabricated successes.
Review store -> lesson attempts/retrieval history/next review; export/restore/migration. Use privacy-minimal events.

## Contracts
Topic: topic_id, level, can_do, prerequisites, status.
Micro skill: skill_id, can_do, topic_id, language_targets, assessment_intents, review_links.
Study session: session_id, skill_ids[], scene_ids[], review_ids[], exit_test_id, status.
Scene: lines with immutable sentence IDs, Czech surface text, Mongolian natural translation, speaker, register, verified context senses.
Audio: audio_id, sentence_id, text_hash, model_id, voice_id, storage_uri, sha256, duration, qa_status, timing_version.
Lexicon: lemma_id, POS, verified sense_id and meaning, Czech morphological forms, register, frequency/source/license.
Progress: profile_local_id, curriculum_version, session_id, activity outcome, prompt type, unassisted success, review due date.

## Runtime guarantees
No missing media assets treated as loaded. No fake duration, word timing, POS or speech grade. Device voice fallback may be playable but is NOT verified teacher WAV.
Single active audio owner; stuck-word audio only helps current word. iPhone Safari/browser availability tested distinctly from mocked Chrome tests.
Keep new data off production until content QA and schema migration, with feature flags when needed.

## Validation
Code CI (type/syntax/build/unit), schema coverage, content crosslinks, immutable audio hashes, decoded audio checks, Playwright UI, actual API smoke, native editorial tests, physical iPhone test, opt-in learning pilot. Report PASS/FAIL/NOT_TESTED/NOT_INTEGRATED.
