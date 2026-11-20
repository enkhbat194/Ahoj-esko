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

## Dialogue pedagogy decision (2026-11-20)

The first UI was **not** dialogic learning: 11 uninteractive scripted lines were
displayed as a scrolling text wall. The redesigned preview uses **one turn at
a time** and a gradual decrease of support:

1. `explore`: identify the speaker, inspect **one** Czech turn and its meaning.
2. `guided`: choose role A/B; read the partner turn; produce your own turn out
   loud; optionally type; reveal original reference **after trying**; record
   a *subjective* self-review.
3. `challenge`: the Czech reference answer and Mongolian cues are hidden
   until explicitly requested; respond without on-screen cribbing, then
   self-review. No automatic correctness/CEFR or pronunciation grade.
4. Learner work is keyed to exact `B01/B02-Txx` IDs with source SHA;
   original Czech and Mongolian remain unchanged. UI cue for `Odkud jste?`
   clarifies **"Та хаанаас ирсэн бэ?"**, but the source translation
   **"Та хааных вэ?"** is retained, and Czech **"Odkud jste?"** is
   grammatically correct in formal address.
5. No AI teacher, native TTS or audio files are fabricated; local microphone
   recording is temporary and remains on-device.

Product and teaching references:

- Pimsleur conversational context, graduated recall:
  https://www.pimsleur.com/the-pimsleur-method/
- Babbel contextual dialogues, spaced retrieval and feedback:
  https://www.babbel.com/the-babbel-method
- Busuu goal-driven conversational exchanges:
  https://help.busuu.com/hc/en-us/articles/21862192336402-What-are-Busuu-Conversations-and-how-can-they-help-me-learn-a-language
- Duolingo Adventures tasks/real-life scenarios:
  https://blog.duolingo.com/adventures/
- British Council roleplay, controlled to free speaking, self-correction:
  https://www.teachingenglish.org.uk/professional-development/teachers/planning-lessons-and-courses/role-play

### iPhone acceptance checklist

- [ ] Opening the preview shows one active conversation turn, not all lines.
- [ ] Both B01 and B02 load; A and B role choices display own and partner
      turns correctly, without rewriting source content.
- [ ] Switching explore/guided/challenge resets the visible turn.
- [ ] A role turn requires a spoken/written **attempt** plus an explicit
      post-reveal self-review before proceeding, not a fabricated AI grade.
- [ ] In challenge mode the translation/reference is hidden by default.
- [ ] Czech `Odkud jste?` is unchanged; the training cue is precise.
- [ ] After Safari reload, chosen turn notes survive, as do all six
      existing exercise responses and exit attempt.
- [ ] Local iPhone microphone records and plays back, but audio does not
      persist after leaving a training turn.
- [ ] Offline PWA test after initial load. No API keys or production
      backend requests. Verify deploy SHA, HTTP and device behavior.
