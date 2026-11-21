# Ahoj Česko — Single-main UI/UX consolidation (2026-11-22)

## Canonical product and source of truth
- `main` remains the canonical React / Express app, not the stale standalone iPhone preview.
- Newer premium Czech reading UX (Library file `czech_app_latest_preview.html`, 2026-11-21, 4,601 lines) is tracked at `public/cesky-reading-uiux/index.html` and served under **the same HTTPS origin** as the real app: `/cesky-reading-uiux/index.html`.
- Existing `src/App.tsx`, canonical course, KLIC17 StoryReader, audio factory contracts, SRS and Google Gemini server routes remain intact.
- Main premium homepage and canonical reader include a discoverable link to this newest UI.
- The UX page drawer has **Бодит сургалтын апп** linking to `/?tab=story` (canonical data-backed reader).
- The UX page's AI chat requests `/api/ai/tutor`; selected story vocabulary can request `/api/ai/reading-help`; both are existing server-side Gemini endpoints and need an actual `GEMINI_API_KEY` secret in the Render environment. No API key is checked in or exposed to the browser. Missing secret must show an error, never a fake AI answer.
- The UX page's book library, chapter completion counter, quiz and writing screens **still use example/demo data**. They do not yet share canonical learner progress or actual 72-lesson data. Do NOT report the entire UI/backend/product as fully integrated. This is one-codebase/one-domain integration with on-demand real AI where configured.
- Removed fabricated `book.readSeconds += 85` reading-time increments. The other demo chapter progress is still illustrative and should be replaced with real state before release.

## Branch source audit
Old branch contents and per-file changes were reviewed against `main` on 2026-11-22; see `PROJECT_CONTROL.md §7`. Latest branches `preview/cesky-reading-uiux-20261122` and `integrate/cesky-uiux-main-20261122` were also included. Earlier alphabet audio, canonical lesson runner, review fixes and reader context Gemini route already exist in newer main; do not blindly overlay older branch versions.

Some preview-only branches contain unique historical `IphonePreview.tsx`, `l01DialogueTraining` source and a large `private-course-v1.bin` that are **not active in current main**. After the owner-authorized consolidation, the one-time CI step `consolidate_on_main` first merges those old commits with git strategy `ours` (preserves the entire branch ancestry and legacy content within main history **without changing current tree**), pushes main, then removes every non-main branch ref. A failed push stops deletions to protect source content. This is intentionally one-time and tied to an exact squash commit title, not an ongoing branch-deleting policy.

## Deployment
- Existing Render Node web service: `ahoj-cesko-main-server-preview`, https://ahoj-cesko-main-server-preview.onrender.com ; deploy of main is **manual**.
- Old static previews may reference a branch that becomes deleted: their already deployed static URLs can remain, but **re-deploying them from deleted branches will no longer work**. Source UI is now bundled in main and can be served by the Node Preview.
- The server's `GEMINI_API_KEY` must be a Render Environment secret; it cannot be inferred from GitHub and is currently **not verified configured**.
- Production must not be changed or auto-deployed as part of this exercise.

## QA contract
`npm run lint` must pass TypeScript and `scripts/check-cesky-uiux.mjs` (compile the actual inline UI JavaScript with Node VM; reject mock AI responses and fabricated reading seconds). Existing unit tests and Vite build must pass CI. Real iPhone Safari/PWA, live Gemini and audio tests require device/service verification and stay open in Issue #5.

## Remaining functional gap
Port the UI reader's real chapter data, timed audio/Karaoke, contextual quick/full dictionary, microphone and SRS from the canonical engine into React components; the standalone UI remains a rich but **non-canonical reading prototype** until then. Do not replace canonical curriculum data with demo book chapters.
