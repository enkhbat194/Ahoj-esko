# Ahoj Česko — isolated iPhone L01 Static Preview

**Status:** experimental **not** production. This branch is a dedicated preview source; it must NOT be merged into learner-app `main` without separate review.

## Provenance
- Source: `enkhbat194/Ahoj-esko`, branch `preview/ios-l01-render-static-20261120`.
- Curriculum baseline: `v0.9.20`, SHA-256 `bf6de3f4872353d13768e79cb53299bfe1927ca3927209334df3e7e548860a03`.
- Working source first lesson IDs, private source draft only, not native approved.
- Deployment service: Render **static site**, no server/DB/Vertex/paid AI credentials.
- Build command: `npm install --no-audit --no-fund && npm run lint && npm run build`.
- Publish directory: `dist`. Node 24.
- Build environment: `VITE_IPHONE_PREVIEW=true`.
- `autoDeploy=no` to limit build minutes/accidental deploys.

## What may be tested
1. iPhone Safari initial page loading and responsive layout.
2. 2 scripted Czech dialogue scenes / 11 dialogue turns.
3. 6 canonical phrase IDs without old PH002 wrong string.
4. Word-grouping plus local voice record/playback (MediaRecorder, microphone permission).
5. Six draft exercises: type answers, reveal proposed answers, self-review (NOT a correctness score).
6. One exit task: draft own response, store attempt (NOT CEFR grading).
7. Local progress persisting through Safari reload and JSON export/import in same source hash.
8. PWA Add to Home Screen and offline page navigation after first successful online load.

## Not available / not guaranteed
- No Gemini 3.8 generated/approved audio (unsafe draft WAV attachment deliberately blocked).
- No AI conversation, speech recognition, Gemini token spending, or Drive sign-in.
- No server-side progress sync and no end-to-end device verification until explicitly tested on an actual iPhone.
- Render Static Site is normally free; bandwidth and pipeline minutes share workspace-level allowances and may incur overage fees. Monitor billing, keep site unadvertised and manual deployment.

## Production safety
- No modifications to deployed Cloud Run, the existing audio factory or app main.
- No secrets in repo, static envVars or build.
- Render URL should be logged only once the actual service is created and deployment becomes **live**.
- Track status in https://github.com/enkhbat194/Ahoj-esko/issues/5
