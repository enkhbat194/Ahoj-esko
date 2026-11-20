# Үе давах — Czech task-first learning path v1 (proposed; NOT replacing canonical 72 lessons)

**Owner request (2026-11-20).** Home -> `Үе давах` always resumes a saved lesson step. `Цагаан толгой сурах` shows all letters and clearly distinguishes **unseen / in progress / seen** with learn/continue/repeat. Once the alphabet module is stable, future large themed units use the same progress and assessment engine.

## 0. Letter foundational module — separately versioned; not a fabricated 73rd canonical lesson

42 Czech letters (including `CH` after `H`). Extra Czech letters and accents: `á, č, ď, é, ě, í, ň, ó, ř, š, ť, ú, ů, ý, ž`. `q, w, x` commonly occur in loans. Core 7 **visual** stages per letter: observe -> find in Czech word -> uppercase/lowercase match -> trace with finger -> fill example word -> recall/type -> two-item check. An optional trace assistance does not auto-assess stroke accuracy. Each step is persistent, skip gives **no credit**; iPhone reload resumes exact letter/step. A letter marked `seen` indicates visual and spelling tasks, NOT native Czech pronunciation mastery.

**Required for actual full phonological learning, not falsely claimed in preview:** certified Czech letter/phoneme/word audio from the approved Gemini 3.8 TTS pipeline, playback at learner choice, sound contrast (A/Á, E/É/Ě, U/Ú/Ů, R/Ř, S/Š, Z/Ž), phonetic/syllabic progression with editorial QA, recording + feedback validation, accessibility and real iPhone QA. Initial 42 × 7 = **294 visual steps**: this is intentionally transparent. For adult learners whose Latin literacy already exists, introduce a later evidence-based placement/fast track rather than forcing every trace forever; do not bypass checks silently.

## 1. Greetings and social entry — first themed unit, build around usable utterances

This topic should be split into **small coherent skills**, not English word-for-word translation.

| Subtopic | CEFR-style can-do | Czech pattern examples | Important contrast |
| --- | --- | --- | --- |
| 1. Formal vs familiar greeting | Greet an unfamiliar person and a friend | `Dobrý den.` / `Ahoj.` | `vy` vs `ty` varies with social setting |
| 2. I/you am/are | Say and ask basic identity | `Já jsem ...`; `Ty jsi ...`; `Vy jste ...` | Czech verb changes; pronoun may be omitted |
| 3. Are you well? | Ask and answer well-being politely | `Jak se máte?` / `Jak se máš?`; `Mám se dobře, děkuji.` | English "How are you?" is NOT `Jak jste?` |
| 4. Names | Introduce oneself, ask a name | `Jmenuji se Jana.`; `Jak se jmenujete?` / `Jak se jmenuješ?` | Not literal English "What is your name?" |
| 5. Who is that? | Identify people and ask names | `Kdo je to?`; `To je Pavel.`; `Jak se jmenuje?` | `kdo` = who, `co` = what, `jak` = how |
| 6. Origins | Ask someone's origin / state own | `Odkud jste?`; `Jsem z Mongolska.` | `Odkud jsi?` familiar |
| 7. Negation | Say a simple identity is not true | `Nejsem student.` / `Nejsem studentka.`; `Nejste ...` | Gender form and conjugation both matter |
| 8. Repair and politeness | Ask for repetition, thank someone | `Prosím.` / `Děkuji.` / `Nerozumím.` / `Můžete to prosím zopakovat?` | Functional recovery before long conversation |
| 9. Practice and exit | Conduct short new-person meeting without cribbing | `Dobrý den. Jmenuji se... Odkud jste?` | Source-bound rubric; avoid fabricated AI speech score |

**Existing canonical 72-lesson source:** A0=24 + A1=48, 431 phrases/144 dialogues/432 exercises/72 exits v0.9.20 is the existing curriculum work. Map its phrases/exercises to this theme via **source IDs and source SHA** after editorial review. **Do NOT overwrite or automatically reshuffle existing lesson IDs.**

## 2. Next large thematic groups (outline, not implemented)

1. **Numbers** — 0–20, tens, telephone numbers, prices, quantities, buying and giving a number.
2. **Colors, shapes and objects** — basic colors/form/size, describe a real object; Czech gender agreement taught in small contextual examples `červený stůl`, `červená taška`, `červené auto`.
3. **People, family and possessions** — `kdo`, `ten/ta/to`, `můj/tvůj/váš`, relationships and ownership in an appropriate case.
4. **Time, days and plans** — days, hours, when/where, simple appointments.
5. **Food, coffee shop and shops** — requests, `prosím`, quantities, prices, substitutions.
6. **City and transport** — ask directions, ticket, stop, `Kde je ...?`.
7. **Housing and practical errands** — address, landlord, documentation, repair, asking for help.
8. **Workplace and safety** — introductions, shift, tools, reporting a problem, repair instructions, Czech workplace register.
9. **Health and emergencies** — describe basic needs, ask for urgent help; no medical advice beyond language-learning scenarios.

## Per-topic reusable product contract

`unit → subtopic → skill objective → source content IDs → guided practice → speech/application (AI tutor when valid) → transfer challenge → honest assessment → saved progress → spaced review`.

- Every user-facing activity is a **functional** task (what can the learner actually say/do?), not merely words copied from English.
- Slow escalation: known chunks -> replace one slot -> ask/answer -> negate/repair -> roleplay -> new-person, new-situation test.
- **One independent progress engine** tracks `unseen/in_progress/seen`, exact step, attempts, retries and last position. `skip` never marks mastery, source revisions must version/isolate progress.
- Visual completion is not speech evaluation. No unverified audio/automatic pronunciation confidence. Teacher feedback and CEFR grades need a real, tested speech-evaluation contract, not string equality.
- The main app routes topic steps to the learner, AI teacher offers guided practice and adaptive feedback, not a second disconnected script list. No production or paid provider change in this UI work.

**Pedagogical references:** Council of Europe CEFR Companion Volume (Pre-A1, phonological competence and goal-oriented interaction), Czech-specific formal/familiar address teaching (`ty/vy`), Czech alphabet 42 letters including CH. These are design references, **not** a claim of native approval of each draft Czech word.
- https://www.coe.int/en/web/education/-/common-european-framework-of-reference-for-languages-learning-teaching-assessment-14
- https://unstats.un.org/unsd/ungegn/sessions/4th_session_2025/documents/GEGN.2_2025_152_CRP152_Item7d.pdf
- https://www.czechonline.org/upload/Downloads/files/table/19/item/12/54/g-01-formalni-a-neformalni-osloveni.pdf
