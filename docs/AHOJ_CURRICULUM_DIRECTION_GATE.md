# AHOJ — Curriculum direction recovery / 2026-11-25

Status: candidate working standard; no production approval. This file supersedes the assumption that the existing A0-T02 outline or the 18-lesson draft is mandatory. The GitHub branch remains a draft PR; main, audio importer and private archives are not changed.

## Original goal and scope
Монгол хэлтэй насанд хүрэгчдийг Pre-A1–B2 түвшинд бодит нөхцөлд Чехээр сонсож ойлгох, өөрөө хариулах чадварт хүргэх. Pre-A1 is the foundational stage, not a fixed word count. CEFR descriptors are outcome references, not a prescribed sequence. Curriculum determines content, exercise selection, UI and code; existing assets are optional inputs. The 24 UI patterns are a component pool, not a lesson template. Default 2–3 new units per microcycle, separately introduced; two cycles where useful. This is a design hypothesis, not a universal empirical rule. A1–B2 retain literacy and writing where appropriate.

## Recovered source record
- AHOJ_PEDAGOGY_GATE_v0_1.md, 2026-11-24: ten communicative goals and three pilots; do not scale before evidence; keyboard optional except specific literacy tasks.
- AHOJ_OctoLearn_Research_02.md: nine steps observed in selected replay lessons; variable lessons, cumulative recall, spoken application; not proof of efficacy or SRS.
- AHOJ_OctoLearn_Research_03.md: cross-topic transfer, number/form practice, novel contexts and listening-first interaction; not a fixed syllabus.
- Original conversation not fully recoverable verbatim; these documents are recovered references, not a claim of complete transcript access.

## Audit / divergence
1. Research05: 66 of 244 screens used typing; previous gate already identified this.
2. PR #35 began with three pilot lessons; actual audio, iPhone and learner evidence gates were incomplete.
3. Scaling L04–L06 before validating pilots was premature.
4. L07–L10 commit db125b9bf1e522d41b7991497997086d7dfbb2ec explicitly aligned to the existing 18-lesson outline. This is the identifiable point where a legacy outline became a constraint.
5. L11–L18 commit dfeb6a3d7448b21a943cf1e1e62569edc7b66cf9 extended that mistake. Preserve it for reuse, not as an approved curriculum.
6. At baseline 8c3e26197727fe6777ff490f714d98142e4e540e, the 18-lesson CI passed, but used mocked audio/microphone and fixed 9-step counts. Text recognition and transcript matching cannot certify understanding or pronunciation. Speech repetition and independent recall were aggregated.
7. Recorded audio availability must not determine target phrases. The previous 94-text demand was only for that draft.

## Candidate early communicative goals (not a locked lesson list)
| Outcome ID | Real-world task | Examples / prerequisites | Evidence |
|---|---|---|---|
| C01 | Greet and leave appropriately | Dobrý den. / Ahoj! / Na shledanou. | Listen to intention, choose register, say without model |
| C02 | Introduce oneself | C01; Jmenuji se… / Jsem… | Actual own name, not a preselected name |
| C03 | Ask and exchange names | C02; Jak se jmenujete? / A vy? | Respond to audio; distinguish from own-introduction utterance |
| C04 | Accept or decline an offer politely | Ano. / Ne. / Prosím. / Děkuji.; short chunks in 2+2 cycle; C01 | Novel offer, choose yes/no and speak |
| C05 | Repair a conversation | Promiňte. / Nerozumím. / Ještě jednou, prosím. / Pomalu, prosím.; C04 | Request slower/repeated speech when incomprehensible |
| C06 | Ask for help | Můžete mi pomoci?; C01/C04/C05 | Ask for help, thank, end interaction |
| C07 | Handle a short social exchange | Jak se máte? / Dobře, děkuji.; C01/C04 | Listen and answer; ask back |
| C08 | Give essential personal details | Origin, residence, work; teach required forms before testing; C02/C03 | Respond with real personal information |
| C09 | Understand and use practical numbers | Numbers, prices, quantity; C04 | Random-number recognition and spoken production |
| C10 | Buy an everyday item | C01/C04/C05/C09; quantity, item, price, payment | New shopping scenario, not word-order score |

Ordering is an editorial hypothesis for survival communication; refine through linguistic checks and learning evidence. Do not force all pronouns or possessives before repair/thanks/help. Czech forms in new example tasks require review and exact prerequisite records. Avoid arbitrary gendered number forms and cases when expanding. Broader CEFR mapping and later levels remain incomplete.

## Implementation constraints
- L01–L03 revision 2: candidate pilot, add listen-to-meaning with Mongolian alternatives, hide partner transcript by default, flag revealed or unheard dialogue; separate repeat recognition and independent model-match counters. Existing v1 progress stays in its old namespace.
- L04–L18 retained as legacy draft, not deleted. No automatic next route from revised L03 to draft L04.
- Variable lesson lengths from actual steps, no fixed 9 steps. Keep structural tests, exact vocabulary prerequisites and safe audio registry. Existing test corpus of 18 records is not a target size.
- Distinguish instruction-supported recall, model repetition, transcript matching, independent transfer, meaning recognition and pronunciation. Do not label any of these as mastery without relevant evidence.
- No new audio production simply because a draft text is missing. Resolve required pilot text against catalog first; approved files only, Czech voice roles separately, no credentials or private asset identifiers in public repo.

## Stop/go rules
Before scale-up: verify three pilot storyboards against intended task, Czech naturalness and Mongolian meaning; real audio technical and language checks; actual Safari/device audio and mic functionality; automated flow tests and accessibility; observe independent spoken outcome and delayed recall. STT exact model match is not a phoneme score or semantic grading. No manual QA burden on owner; owner may listen/approve content. If native reviewer, real device, or valid independent learner evidence is unavailable, mark pending and keep pilot status, not production. Do not use count of lessons or CI PASS as a substitute. Expand C04–C06 only after the pilot gate, then other outcomes; count/sequence depends on evidence.

## Known remaining work
Full CEFR outcome map, canonical lexical/form/phrase IDs and spaced review, explicit cross-topic prerequisite graph, real pronunciation evaluation, new UI components where outcomes require them, approved MP3 binding, preview, native editorial review and learner pilot. Preserve existing app navigation and working features. No restart of audio collector.
