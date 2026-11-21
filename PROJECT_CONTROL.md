# Ahoj Česko — PROJECT_CONTROL.md

> **Нэгдсэн ажлын удирдлагын эх** · 2026-11-20 · **Энэ баримт ажлын чиглэлийг өөрчлөхгүй.**
> **LIVE blocker tracker:** [Issue #5 — P0/P1 саадууд](https://github.com/enkhbat194/Ahoj-esko/issues/5).
> Зөвхөн Issue #5-ын checkbox/нотолгоог гүйцэтгэлийн бодит төлөв гэж үз. Шинэ handoff/ZIP/чат санамжийг status authority гэж үзэхгүй.

## 1. Нэг төслийн бодит бүтэц (three sources, one pipeline)

| Үүрэг | Authoritative current location | Баталгаажсан хүрээ |
|---|---|---|
| Сургалтын үндсэн эх | Google Drive Ahoj Cesko → 06_CURRICULUM_PRODUCTION → [72 lesson v0.9.20 JSON](https://drive.google.com/file/d/1uKAl1QN_ITbghZMmcg0YLCn5ORDfeEty/view) | A0=24, A1=48; 431 phrase, 144 scenes/619 turns, 432 exercises, 72 exit tasks. Эхийн SHA-256 `bf6de3f4872353d13768e79cb53299bfe1927ca3927209334df3e7e548860a03`. QA final биш. |
| Сурагчийн апп | [enkhbat194/Ahoj-esko](https://github.com/enkhbat194/Ahoj-esko) `main` | PR #3/#4 merged, canonical `lessons[]` JSON → **draft** cards/dialogues preview import, latest CI [PASS](https://github.com/enkhbat194/Ahoj-esko/actions/runs/44646036610). **Not** all lesson/exercise runtime integrated. |
| Аудио үйлдвэр | [enkhbat194/Audio-uildwerlel](https://github.com/enkhbat194/Audio-uildwerlel): `main` + `experiment/free-hosting-render-20261118` | Experiment: **106 ahead, 1 behind** vs main as checked 2026-11-20; GitHub WIF/Vertex TTS/QA/quota workflows exist there, **not** all merged. Do not merge wholesale. |
| Private audio evidence | Drive Ahoj Cesko → [07_AUDIO_FACTORY](https://drive.google.com/drive/folders/1sClo-DLFkmzvc-PH3mrt0i-jIBq-NfJ1) → [45 WAV draft reconciliation](https://drive.google.com/file/d/1S6jq05ffi1gfYwMpUfGF2QxBb_0juWkn/view) | 45 WAV hashes, initial 42 AUTO_PASS + 3 QUARANTINED; 2 PH011→PH006 proposed source-alias corrections; no approval/publishing claim. |

**Өмнөх кодын сангууд:** `czech-helnii-60-honog` = 60-day alpha; `czech-mongolian-app` = older prototype. Эдгээрийг canonical 72 хичээлийн үндсэн эх болгож болохгүй; устгахгүй.

**Тусдаа цөм биш:** `feature/ahoj-golden-slice-v099` — draft PR #1, not merged, no proven hosted iPhone Preview. `v0.9.28` болон бусад ZIP нь v0.9.20 canonical JSON-ийн supplemental QA/patch packs, эхийг дураараа солихгүй.

## 2. iPhone readiness: BUILD PASS ≠ live deployment

**Status as of 2026-11-20: iPhone Preview URL NOT VERIFIED.**
- Main repo has Vite/PWA config and GitHub CI tests/build PASS.
- `.github/workflows/ci.yml` runs checks/build **only**: no verified deploy-to-Preview/Production job. Repo homepage empty and GitHub Pages disabled.
- Audio Factory AI Studio / Cloud Run endpoint is separate from the **learner** app. Do not give Audio Factory URL as an iPhone lesson link.
- Accept a Preview as test-ready **only after:** real HTTPS URL, deployed Git SHA, backend health/auth, iPhone Safari login/lesson navigation, playback with user gesture, recording permission, offline update, restore of progress tested. Store evidence in Issue #5.
- **Private user preview:** QA pending content must be clearly marked draft, unsafe/unapproved audio cannot appear as release-approved; do not require a broad new native-human certification before testing the engineering flows.
- **Public production:** explicit QA release gate, no unapproved/external audio, privacy, costs/quotas verified.

## 3. Non-negotiable pipeline contract

`Canonical lesson source ID + cs_exact + source/dataset SHA → typed lesson, phrases, turn, exercise, exit → approved TTS intent → generated WAV → immutable WAV hash + AUTO QA + quarantine → owner-approved/private subset → audio manifest → exact-ID app playback → iPhone smoke test.`

- An imported `cards[]` preview is **not** a completed 72-lesson interactive curriculum. App currently lacks integrated verified 432 grading contracts and 72 exit executions.
- Every audio mapping MUST use at minimum `source_id`, `dataset_sha256`, exact Czech text/hash, `model`, `voice`, `style`, `wav_sha256`, `qa_status`, `publication_gate`. Same Czech text can map to multiple IDs, but source alias must be explicit and logged.
- Error cases: `429` = no WAV, **not AUTO_PASS**. `QUARANTINED` = private, not learner-app playback. `AUTO_PASS` = automatic technical/text checks, **not** native-level phonology guarantee. `draft_ai` must never be silently promoted to `native_approved`.
- All *new* TTS voice generation via **Gemini 3.8 Flash TTS**. Never present FFmpeg-derived Slow as newly synthesized Gemini audio. Keep experimental Render hosting read-only and separate from production.
- Do not publish personal identifiers from old story archives. In «Түлхүүр №17» new content remains Edward/Эдвард.

## 4. Fixed priorities — do not restart the product

1. **P0** Prove real learner-app Preview URL & deployed SHA; smoke-test on iPhone.
2. **P0** Audit audio experiment vs main (106/1 difference); PR only tested needed pieces, never mass-merge.
3. **P0** Bring the 432 exercises/72 exits, stable IDs and lesson navigation into app with deterministic tests.
4. **P0** Bind exactly source-verified WAVs into app; keep aliases/quarantine locked; demonstrate end-to-end one A0 lesson.
5. **P1** Resume-safe, quota-budgeted permanent audio queue/storage and automatic QA/manifest sync.
6. **P1** Offline, microphone, SRS migration, version/caching on real iPhone; Preview/Production isolation.
7. **P2/paused** Extra sentences, A2/B2, rebranding/mascot/logo, new provider experiments. No deletion of prior work.

## 5. Workflow for every future chat / branch

1. Read this **PROJECT_CONTROL.md** and [Issue #5](https://github.com/enkhbat194/Ahoj-esko/issues/5). Query GitHub/Drive for fresh facts. Never ask to recreate the 72 lessons.
2. Take **one highest-priority independently verifiable blocker**. First inspect existing implementations before editing.
3. Make changes only in the owning repo, on a feature branch; run tests, open PR, merge only after CI and compatibility review. Do not modify original canonical source or unrelated repositories.
4. Update issue checkbox with **concrete commit/CI URL or Drive manifest/hash**, remaining blocker, and next task. Do not claim deployed until actual runtime verified.
5. Continue from issue next time. No new sprawling handoff ZIPs, mock release numbers, duplicated QA registers or new design direction unless there is a demonstrable dependency.

## 6. Key paths

- Main curriculum working JSON: `AHOJ_72_LESSONS_AUDIO_PREFLIGHT_WORKING_v0_9_20.json`
- Drive root: https://drive.google.com/drive/folders/1TFTOQHQK7JKQFhueBI8LURbxRIdROhYj
- App main: https://github.com/enkhbat194/Ahoj-esko
- Audio main/experimental: https://github.com/enkhbat194/Audio-uildwerlel
- Operations/real progress: https://github.com/enkhbat194/Ahoj-esko/issues/5

**Definition of progress:** changed tested runtime behavior + a verifiable receipt + integration into the next stage; a new document, mock UI, or passing CI alone does **not** equal a usable iPhone app.


## 7. Branch consolidation audit — 2026-11-22 (owner-authorized)

**Target of integration:** `main` is the canonical learner product. User authorized selecting all needed changes from live branches, **not** replacing newer product UI with an earlier preview app.

**Verified action:** [Reading Gemini PR #25](https://github.com/enkhbat194/Ahoj-esko/pull/25) merged via squash to `main` SHA `f8f021cc1a8f6684ee720cc4b1a9483abb4879b2`; [PR CI PASS](https://github.com/enkhbat194/Ahoj-esko/actions/runs/44924658833). The `GEMINI_API_KEY` stays server-side. Live backend secret, iPhone and API response tests remain **NOT TESTED**.

Branch contents were compared by Git tree/blob SHA plus selected actual text differences against the previous `main` `d66e7323c66f8eb67e0fa1847d84a1493212db55` before PR #25. Distinguish history divergence from current code changes.

| Source branch | Decision against main | Reason |
|---|---|---|
| `feat/reader-ai-context-20261122` | **MERGED (#25)** | On-demand Czech word context explanation, without client-side key disclosure |
| `fix/course-review-source` | **ALREADY PRESENT** | Every file blob equals the then-current main tree; no separate source rewrite needed |
| `feat/canonical-lesson-runner` | **ALREADY IN MAIN, newer variants retained** | Main includes course runner, source reader/storage, dialogues, progress and tests; branch differs only in five older files; do not roll these back |
| `feat/alphabet-context-audio-20261120` | **ALREADY PRESENT** | Czech alphabet audio/pack source and tests represented in main; old branch has previous generic app/course components |
| `feat/alphabet-audio-all-packs-20261120` | **ALREADY PRESENT / superseded** | Main has same 802-line preview manifest pinned to Audio Factory source `4ebbf757...`, plus newer context-aware examples and mask-word UI/tests |
| `fix/alphabet-word-blank-context-20261120` | **ALREADY PRESENT / superseded** | Main contains the word-blank mask exercise and associated tests; only older audio label differs |
| `feat/preview-gemini-alphabet-audio-20261120` | **SUPERSEDED** | Older ~100-line manifest/first-pack subset vs main's expanded ~802-line manifest; do not downgrade |
| `feat/ios-canonical-course` | **SELECTED PRODUCT FEATURES ALREADY IN MAIN; preview-only extras isolated** | Main has canonical course and premium navigation; branch also changes the entrypoint to a separate iPhone preview and includes preview-only static assets |
| `fix/ios-shared-review` | **PRODUCT FIXES ALREADY PRESENT; preview-only extras isolated** | Its review/course fixes have matching blob SHAs in main; extra `IphonePreview.tsx`, static bundle/docs/tests are preview-specific |
| `preview/ios-l01-render-static-20261120` | **KEEP SEPARATE** | Deployed Render Static Preview entrypoint, not the full learner app; merging `src/main.tsx` would replace the main product with the limited preview |

**Outcome:** No other branch was merged wholesale. The existing main implementations are newer or identical for reusable functional pieces. The actual preview branch stays intact and must **not** replace the product's React entrypoint. No branches were deleted or retargeted. This is a file-level integration audit, **not** live backend/iPhone QA nor a claim that every old branch's Git ancestry was merged. Any later unique validated code must still receive its own CI-tested PR.

**Pending:** B01/B03/B04/B06 in [Issue #5](https://github.com/enkhbat194/Ahoj-esko/issues/5); especially server-backed Preview and `GEMINI_API_KEY` secret verification, exact audio provenance and iPhone tests.
