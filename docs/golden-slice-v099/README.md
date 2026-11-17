# Ahoj Česko — Golden Slice v0.9.9

**Date:** 2026-11-17  | **Status:** DRAFT UX/QA PREVIEW ONLY. NOT PUBLIC TEACHING CONTENT.

## What is actually implemented

- Functional, standalone responsive PWA slice under `public/golden-slice/`, compatible with current React/Vite repo's `public/` folder. Existing main app not replaced.
- **One A0 lesson:** six canonical draft phrases with full source IDs. Each phrase can be opened and viewed as tokens; reviewed glossary tokens can be saved; missing word analyses are NOT auto-invented.
- **Reader:** 20 first-chapter sample sentences from `Klíč číslo 17`, sentence translation reveal, QA notes, word analysis, candidate lesson links. Candidate links never imply verified learning.
- **Unified local review:** lesson/story sentence deduplication by normalized Czech text **and exact translation**, source lineage tracked; flashcard answer hidden until user asks; only due cards gradeable; simple documented fallback intervals, NOT FSRS.
- **Text roleplay:** limited deterministic intent recognizer supports combined Czech intents in one response, stateful simulated turns, no punitive scoring for unknown input. NOT live AI.
- **Pronunciation self-practice:** voluntary on-device microphone record + playback + delete. Audio exists only in page memory, never sent to server or durable storage; not phoneme-scored. On iPhone requires HTTPS and permission and still needs real-device validation.
- **Progress export/import/wipe:** versioned JSON schema; malformed and oversize imports rejected, no server sync; 0 real XP awarded for unpublished content.
- Five responsive app tabs; accessible semantic sentence buttons and word buttons (no nested interactive controls).

## Running locally

```
cd public/golden-slice
python -m http.server 8765
```

Open `http://localhost:8765` (or deploy the files on a private HTTPS preview host). iPhone must use an HTTPS URL, **not** Windows localhost. In GitHub's existing Vite app, assets in `public/golden-slice/` resolve under `/golden-slice/` after Vite serves/builds the branch. `main` stays unchanged until PR review/merge. The folder has no API secrets.

## Verification

```
node --test tests/test_golden_slice.mjs
node --check public/golden-slice/app.mjs
```

**Observed:** 19/19 Node tests passed, content integrity and 5-tab HTML static checks passed. **Not observed:** interactive browser/iPhone QA: the test container's Chromium navigation is blocked by administrator policy (`ERR_BLOCKED_BY_ADMINISTRATOR`) for both localhost and file URLs. Browser test script retained at `tests/browser_check.py` for later execution in a normal workstation.

## Non-negotiable gates

- 6 lesson phrases and 20 story sentences are editorial drafts, NOT native Czech approved.
- No production publish, reference TTS, automatic phoneme scoring, CEFR certification or XP until linguistic QA and human-reviewed gold set.
- No external AI/STT provider or FSRS package installed. The preview must not be marketed as having those features.
- Offline Service Worker caches the demo app shell; progress lives only in browser localStorage. Synchronization, schema migrations, and iPhone offline testing are future work.
- Existing v0.9.8 and previous QA results preserved. No existing lesson/source IDs modified.

## Next meaningful acceptance gate

1. Run 390px and 320px viewport tap-path tests on real browser.
2. Human native Czech & Mongolian review of these exact 6 + 20 samples including gender/registration/meaning.
3. Validate actual iPhone Safari microphone, playback, offline reinstall and storage limits.
4. Replace demo fallback with official FSRS library (Node >=24 as package requires), migrated event schema, deterministic tests.
5. Integrate privacy-aware backend for constrained AI roleplay / ASR only when benchmark & keys are ready.
