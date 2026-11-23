# AHOJ — Шинэ чатнаас яг үргэлжлүүлэх нэг эхлэх баримт

**Хамгийн сүүлд бодитоор баталгаажуулсан төлөв:** 2026-11-23, Asia/Ulaanbaatar.  
**Энэ файлын үүрэг:** шинээр эхлэх, давтан судалгаа/төлөвлөгөө бичих, буруу салбарт ажиллах алдаанаас сэргийлэх.  
**Repo:** https://github.com/enkhbat194/Ahoj-esko  
**ACTIVE WORK BRANCH:** `feat/curriculum-system-v1-2026-11-23`  
**Active Draft PR:** https://github.com/enkhbat194/Ahoj-esko/pull/32  
**Production `main`:** PR #32-ын эдгээр lesson/Reader Lab шинэчлэлүүд `main`-д **хараахан нэгтгэгдээгүй**.

## 0. Шинэ чат шууд эхлэх горим

1. GitHub connector-оор репогийн **тухайн үеийн** `main` commit, PR #32-ийн `head_sha`, CI, PR #29 ба #30-ийн төлөвийг шалга. Өмнөх SHA-г шинэ мэт битгий зарла.
2. **ЭНЭ ФАЙЛ** болон `curriculum/system-v1/README.md`-г **PR #32 салбараас** унш. `main`-ээс л хайвал одоогийн хэрэгжүүлэлт олдохгүй. Нэмж PR #29 салбар `docs/continuity-curriculum-proposal-2026-11-23`-ын `docs/NEXT_ACTION.md`, `docs/PROJECT_STATE_MASTER.md`, `docs/DECISIONS.md`, `docs/CHAT_HANDOFF_PROTOCOL.md`-ыг уншиж болно — эдгээр нь **PR #29-ийн draft, main-д ороогүй**.
3. Давтан архитектурын илтгэл, шинэ апп/репо/Render хийхийг ЗОГСОО. **`A0-T01-L04`-ийг бодитоор кодод хийж, хөдөлгүүрт холбон автоматаар шалгаж** ажлаа үргэлжлүүл.
4. Тухайн чат эцэст CI үр дүн, Render deploy статус, бодит ажлын нотолгоо, дараагийн яг нэг ажлыг шинэчил; санах ой дангаараа хангалтгүй.

## 1. Current verified baseline — яг юу ХИЙГДСЭН

- AHOJ: Чех–Монгол хэлээр **бодит амьдралд ярьж сурах** PWA; одоогийн black/orange Premium UI-г хадгална. Доод цэс: `Үе давах / Унших / AI / Карт / Толь`.
- A0 каноник `public/cesky-reading-uiux/a0-curriculum.json`: **16 сэдэв, 140 micro-skill outline**. 140 нь 140 бүрэн хичээл гэсэн үг биш.
- `curriculum/system-v1/mission-map.json`: CEFR Pre-A1(A0) → A1 → A2 → B1 → B2; **72 mission (зорилго), 72 fully-authored lesson БИШ**. A0 140 skills-ийг **53 provisional session** болгон зурагласан; тэдгээр нь гүйцэтгэсэн хичээл биш.
- `curriculum/system-v1/learning-contract.json`: CEFR can-do + ойлгомжтой оролт + утгатай яриа + retrieval + давталт + шинэ нөхцөлд шалгах 15-step contract. 15 алхам нь суралцах мөчлөгийн гэрээ; одоогийн эхний micro-lesson UI дээр **9 бодит interaction** хэрэгжсэн; хоёрыг хольж болохгүй.
- **Эхний 3 хичээл UI дээр ажилладаг:** `A0-T01-L01` (үсгийн эхний A/M/P/T авиа), `L02` (a/e/i/o/u), `L03` (урт/богино byt/být, pas/pás). Тус бүр 9 алхамтай, **нийт 27 ажиллагаатай interaction**. Exact choice, listen-choice (browser TTS), үгийн карт, matching, үсэг эвлүүлэх, diacritic cloze, шинэ нөхцөл, микрофоны оролдлого. Буруу хариулбал дахин оролдох, L01→L02→L03 түгжээ, ахиц хадгалалттай.
- UI зам: `Үе давах → Цагаан толгой ба дуудлага → 01-р хичээл → Хичээл эхлэх`. `A0-T01-L04...`-ийн товч одоогоор зөвхөн outline.
- `Карт` табад эхний 3 хичээлийн үгс нэг л удаа орно, хэрэглэгч `санасан / сэжүүртэй / мартсан` гэсэн өөрийн үнэлгээ өгч 1/3/7/14/30 хоногийн туршилтын давтлага хийх боломжтой. Browser localStorage `ahoj.course.a0.t01.practice.v1`. Account хооронд sync **хийгдээгүй**.
- `Унших` хэсэгт одоогийн хуучин 2 жишээ + 3 шинэ **редакцын draft** ном нэг `Бүх зохиолууд` дотор. Нэг shared Reader player, word tap → контекст толь → `Карт`. Browser Czech TTS sentence-by-sentence; `Дуудаж унших` mode дунд гол товч mic; гацсан **одоогийн үг**-ийн speaker, auto STT resume *оролдлого*, ил тод skip, тоглогчийн responsive CSS.
- Үлдсэн зарчим: уншлагыг зөвхөн өмнөх үзсэн үгээр зохиохгүй; сонирхолтой cosmic/love/mystery/real-life түүх, түвшин нь аажмаар хүндэрнэ; шинэ үг картанд орж давтагдана. **Reader 3 draft Czech/MN текстийг quality approved гэж үзэхгүй.**
- `Top 100`: `curriculum/system-v1/lexicon/top100.candidate.json` файлын **100 нэр дэвшигч, 0 approved, 0 corpus-rank verified**, lemma/ID duplication 0. Шинэ үг сонголт `A0-T02` эхлэхээс өмнө шалгах. `ano, ne, moci, potřebovat` зэрэг хэрэглээний үгсийн priority дахин үнэлэгдэнэ.
- PR #30: Drive/GitHub `A0` outline-ын **62 зөрүү БҮРТГЭСЭН** болохоос 62-г шийдсэн гэсэн үг биш. ID-г бүү чимээгүй соль.

## 2. Evidence baseline (docs creation-оос ӨМНӨ шалгасан)

- **Last code/content CI-confirmed SHA:** `b787d5a55cc1886800c184193cc7b51287fc20df`.
- GitHub Actions `Test Ahoj Cesko`: **PASS**, run `45184920444`: https://github.com/enkhbat194/Ahoj-esko/actions/runs/45184920444 .
- GitHub Actions `Ahoj Czech Reader Browser QA`: **PASS**, run `45184920437`: https://github.com/enkhbat194/Ahoj-esko/actions/runs/45184920437 . Automated Chromium mobile checks include 27 exercise completions, incorrect-answer retry, Cards, localStorage restoration, and the 5-book Reader Lab flow. Mocked browser TTS/STT ≠ verified iPhone Safari phonetic assessment.
- **Single existing Free Render dev server:** https://ahoj-reader-lab-preview-20261123.onrender.com/cesky-reading-uiux/index.html?reader_lab=1 .
- Render service id `srv-dc21v9qvcj2c73a0g8k0`, workspace `tea-d9oh7btbedkc73ct13rg`, deploy id `dep-dc2410qvcj2c73a5ts7g`: **LIVE** at exact SHA above. Test branch `feat/curriculum-system-v1-2026-11-23`. **No new Render service, no additional app, no changes to production `main`!**
- Хэрэв энэ гарын авлагын commit илүү сүүлийн SHA бол **шинэ HEAD**-ийн тестийг тусад нь шалга. Эндхийн CI/Render нь өмнөх app SHA-тай холбогдсон байгааг ил тод тэмдэглэ.

## 3. Files — өөрчлөх зөв газар

| Зорилго | Эх файлууд |
|---|---|
| А0 16 сэдэв, 140 outline | `public/cesky-reading-uiux/a0-curriculum.json` (main-д одоогийн base) |
| Сургалтын стандарт | `curriculum/system-v1/mission-map.json`, `learning-contract.json`, `README.md` |
| 3 canonical pilot хичээл | `curriculum/system-v1/lessons/a0-t01-l01-to-l03.interactive.draft.json` |
| Browser mirror lesson pack | `public/cesky-reading-uiux/lesson-a0-t01-first3.draft.json` (canonical-тай байт бүр адил байх test) |
| Lesson UI engine, progress, Cards | `public/cesky-reading-uiux/lesson-lab-ui.mjs`, `lesson-lab-ui.css` |
| Premium course route | `public/cesky-reading-uiux/index.html`: `showTopicOutline`, `renderApp`, `data-lesson-start` |
| Existing books/reader | `public/cesky-reading-uiux/reader-experience.js`, `reader-lab-ui.mjs`, холбогдох CSS/JSON |
| Lexicon | `curriculum/system-v1/lexicon/top100.candidate.json` |
| Unit/content CI | `scripts/check-first-a0-lessons.mjs`; `npm run lint`; `scripts/check-reader-lab-integration.mjs` |
| End-to-end QA | `scripts/check-reader-browser.mjs`; `.github/workflows/reader-browser.yml` |
| Active PR | #32; cross-chat docs PR #29; discrepancies PR #30 |

## 4. NEXT ACTION — Дараагийн чат шууд ҮҮНИЙГ хийнэ

**`A0-T01-L04 — Č, Š, Ž авиаг таних`-ийг 9 орчим ажиллах interaction-тайгаар зохиож `Үе давах` таб дахь 04-р хичээлийн картаас нээдэг болго.** Үүнд can-do outcome, жижиг `č/š/ž` бичиг/дуу ялгалт, баталгаажсан Чех утгатай үгийн жишээ (эх сурвалж болон редакцын статусыг зөв тэмдэглэх), хэсэг/үг/утгатай хэллэг, карт, listening attempt (audio asset байгаа эсэхийг шалгах), exact-choice, matching, cloze/spelling, шинэ үгийн сорил, STT attempt болон буруу хариултын feedback байх ёстой. Аудио заавал үүссэн гэж бүү таамагла.

**Technical debt next chat must avoid:**
- Одоогийн engine `lesson-lab-ui.mjs` дотор **3 lesson**, `d.lessons.length === 3`, 9 алхам, `A0-T01-L0${order}` гэсэн hardcoded assumptions бий; L04 нэмэхдээ өгөгдөлд суурилсан dynamic lesson pack/availability болгож **өмнөх L01-03-ийн ахицыг алдахгүй**, хадгалсан state миграцийн хэрэгцээг шалга.
- Өмнөх 3 хичээлийн canonical ба browser mirror-ийг солих/өргөтгөх үед `scripts/check-first-a0-lessons.mjs`-ийн 3×9 lock-ийг 4×... болж зөв өөрчлөөд шинэ/хуучны integrity-г батал; хуучин tests-ийг хасахгүй.
- Browser QA 320/390/428px-г үргэлжлүүл; 4-р lesson-ийг 1–3 дууссаны дараа нээж **бодитоор алдаа гаргаад засаж**, login-free localStorage-аа дахин нээж туулахыг батлах.
- `L04` баталсан дараа **`L05 C/Č, S/Š, Z/Ž` → `L06 Ď, Ť, Ň` → `L07 R/Ř` → `L08 танил бус үгийг унших сорил`**, дараа нь `A0-T02` мэндчилгээ рүү ор.
- Хэрэглэгч тестийг өөрөө гүйцэтгэхгүй гэж хэлсэн: **автомат QA-г кодод нэмж GitHub Actions PASS болгож** байж үр дүн зарла.

## 5. Release / audio / pedagogical red lines

- **Бүрэн хичээл** гэж нэрлэх шалгуур: суралцагч нээгээд эхнээс нь дуустал дасгалаа хийж, хариултаа шалгуулаад, ахицаа хадгалж, дараагийн хичээлд шилжиж чадна; холбоосгүй товч/хуурамч PASS байхгүй. **Туршилтын хичээл** ба **аудио/Чех редакц баталгаажсан production хичээл**-ийг тусад нь хэл.
- Хичээлийн эцсийн хоолой **эмэгтэй + эрэгтэй**; уншлагын өгүүллэгийн TTS **эрэгтэй хоолой**. Browser-ийн `cs-CZ` default TTS-тэй бол эрэгтэй гэж батлах боломжгүй.
- Хэрэглэгчийн Drive дахь `audio/audio` хавтсанд 270+ файл бий гэж мэдээлсэн; энэ чатаар Drive файл бүрийг шалгасан баталгаа байхгүй. Өмнө ElevenLabs 246 хэллэг үүссэн бүртгэл нь Drive-д 246 бүгд хадгалагдсан гэдгийг батлахгүй. **Хуучин аудиог устгах, чимээгүй дахин үйлдвэрлэх, GitHub/R2-д public upload хийхгүй.** Тусдаа AUDIO чиглэлээр content-approved текст → нэг utterance/word = нэг file → archive/hash → QA → manifest → app гэсэн зарчмаар.
- Үгийн үндсэн ID, Czech text, translation sense, voice, audio asset hash/version, task, score, flashcard бүгд canonical content-оос холбогдоно. Текст солигдвол хуучин audio-г автоматаар valid гэж үзэхгүй. STT текст зөв танигдсан нь авиа зөв дуудсан гэсэн үг биш. `PRACTICE_COMPLETE_NOT_CERTIFIED` гэдэг хязгаарыг хэвээр хадгал.
- 72 mission / 53 provisional A0 sessions / 140 A0 micro-skills / 3 pilot interactive lessons — **4 өөр тоо**. `68` A0 хичээл нь өмнөх төлөвлөлтийн *санал*, баталгаатай тоо биш. Нэг хичээлийн 4–6 үг, 12–18 минут, 1/3/7/14/30 хоног нь туршиж батлах таамаглал. Эцсийн зорилго — can-do үйлдэл, өмнө хараагүй харилцаанд хэрэглэж чадах эсэх.
- PR #32 **Draft**; баталгаажаагүй зохиол/Толь/Аудио + engine бүгд холилдсон тул шууд `main` merge хийхгүй. Дараа production-руу гаргахын өмнө алдаагүй шалгасан UI-only өөрчлөлтийг editorial content-оос салгаж PR болгон дэвшүүлж болно. Шинэ Render үүсгэхгүй.

## 6. New chat copy-paste starting command

> **AHOJ сургалтын хичээлүүдийг яг өмнөх төлөвөөс үргэлжлүүл.**
> Repo: https://github.com/enkhbat194/Ahoj-esko  
> Active working branch / Draft PR #32: `feat/curriculum-system-v1-2026-11-23` / https://github.com/enkhbat194/Ahoj-esko/pull/32  
> Эхлээд энэ салбарын `docs/START_NEXT_CHAT_AHOJ.md` ба `curriculum/system-v1/README.md`-г унш; PR #29/30 болон current CI/deploy/main SHA-г шалга.  
> **L01, L02, L03 бодитоор хийсэн, 27 interaction Chrome browser QA PASS. Дахин эхнээс нь бүү хий.**  
> **ШУУД A0-T01-L04 (Č/Š/Ž)-ийг өгөгдөл, ажилладаг UI, 9 орчим дасгал, ахиц хадгалалт, Cards холболт, browser E2E автомат шалгалттайгаар хэрэгжүүл**. Дараа L05–L08 дарааллаар хийнэ.  
> Хуучин UI-г устгах, шинэ Render/репо үүсгэх, баталгаажаагүй аудио нийтлэх, Top100-г баталгаатай мэт үзэх, бүх PR #32-ыг `main` руу шууд merge хийхийг хориглоно.  
> Хэрэглэгчээс manual QA шаардахгүй; зөвхөн GitHub-д хадгалсан commit, CI/deploy нотолгоотой тайлагна. Аудио байхгүйгээс болж хуурамч phonetic PASS битгий өг. 
