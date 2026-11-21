# AHOJ ČESKO — READING EXPERIENCE MASTER STANDARD v1.1

**Date:** 2026-11-22  
**Repository:** enkhbat194/Ahoj-esko — branch main only  
**Scope:** Reading UX and player; NO new AI backend, paid API or curriculum rewrite  
**References:** User-provided three iPhone screenshots (two current Render, one desired English reader) plus user's Czech Reading Experience Master Prompt v1.0. The third screenshot is the interaction/layout reference, NOT the source of English linguistic rules.

## Монгол хэрэгжүүлэх заавар — энэ хэсгийг эхэлж мөрдөнө

**Гол шийдвэр:** Таны өгсөн Англи аппын **гурав дахь зураг** бол уншлагын талбай ба тоглуулагчийн харьцааны жишиг. Түүний Англи өгүүлбэр, толь, хэлний дүрмийг хуулж болохгүй. Одоо байгаа Ahoj Česko-ийн хар–улбар шар–алтлаг Premium хэв маягийг хадгал.

**Эхний ээлжинд зөвхөн UI/UX (интерфейс, хэрэглэгчийн үйлдэл) хөгжүүлнэ.** AI backend (серверийн AI хөдөлгүүр), төлбөртэй API, шинэ өгөгдлийн сан нэмж байгуулж болохгүй.

1. **Header (дээд удирдлага):** Буцах; төвд ном/бүлгийн богино гарчиг; нэг жижиг тохиргооны товч. Утсан дээрх цаг, батарей, браузерын URL зурвасыг давхар зурж болохгүй. Гарчгийн доор дахин ижил том гарчиг тавихгүй.
2. **Reading canvas (унших талбай):** Чех өгүүлбэрүүдийг үндсэн дэлгэцийн ихэнх хэсэгт том, цэвэрхэн харуул. Үсэг анхдагчаар 18px, тохируулга 16–28px; мөр хооронд ойролцоогоор 1.7; догол мөрийн зай 22–30px. Өгүүлбэр бүрийн араас speaker (чанга яригч) дүрс байрлуулахгүй. Үг дарахад түргэн толь; тэнд тухайн өгүүлбэрийг сонсох сонголт байна.
3. **Bottom player (доод тоглуулагч):** 390×844 болон 428×926 зэрэг босоо дэлгэцэд ойролцоогоор 230–285 CSS px эзлэхээр зорь. Дээрээ хугацаа/seek bar (хугацаа гүйлгэх шугам); дараа нь «Дуудаж унших»; Play/Pause + ±5 секунд; доор Repeat, хурд, Tt. Хураахад 60–70px хэмжээтэй болгох. Богино дэлгэцэд зайлшгүй бол анхнаасаа хураалттай байх.
4. **Audio/TTS (аудио/төхөөрөмжийн яриа):** Бодит аудио байхгүй бол 00:21 гэх мэт хуурамч хугацаа гаргаж болохгүй. Чех TTS байвал сонсго; TTS-д секундийн seek болон ±5s товчийг ажиллаж байгаа мэт үзүүлэхгүй. Karaoke (аудио дагаж тодруулах) нь баталгаатай үг бүрийн start/end таймстамптай аудиод л ажиллана.
5. **Guided Read Aloud (дуудаж унших):** STT (яриаг текст болгох) холбогдоогүй үед disabled (идэвхгүй) гэж үнэнээр харуул. Улбар шар speaker-ийн үүрэг нь зөвхөн хэрэглэгчийн **гацсан одоогийн үгийн** жишиг дуудлага; ерөнхий дууны товч биш. Тусламж сонссон нь үгийг зөв уншсан гэсэн үг биш.
6. **Quick/Full Dictionary (түргэн/үндсэн толь):** Үгийн бичигдсэн хэлбэр, lemma (үндсэн хэлбэр), POS (үгийн аймаг), sense (өгүүлбэрт тохирсон утга), Чехийн тийн ялгал/үйл үгийн төгс ба төгс бус хэлбэрийг тусад нь удирд. Өгөгдөлгүй бол утга, CEFR, IPA, дуудлагын оноо зохиохгүй.
7. **QA (чанарын шалгалт):** 320×568, 375×667, 390×844, 428×926 болон landscape (хэвтээ дэлгэц) дээр нэг нэгээр нь шалга. GitHub CI, Render HTTPS, бодит iPhone Safari шалгалт гурав өөр нотолгоо. Аудио, STT, NLP, өгөгдөлтэй холболт хийгдээгүй функцийг **NOT INTEGRATED** гэж тэмдэглэ.

**Чухал зөрчил шийдсэн нь:** v1.0 мастер төлөвлөгөөнд олон дэлгэрэнгүй үйлдэл байсан. Тэдгээрийг бүгдийг нь эхний дэлгэц дээр зэрэг харагдуулбал унших талбай хумигдана. Иймээс **унших текст + намхан тоглуулагч** үндсэн дэлгэц, харин толь/тайлбар/хувирал/тохиргоо тусдаа sheet (доороос нээгдэх цонх) эсвэл дараагийн дэлгэц байна.

---

## 0. Source-of-truth and priorities

1. The third example screenshot is the target for density and hierarchy. Czech text is the primary focus. Do not stack redundant chapter headings, sentence-level speaker buttons, or huge explanatory labels inside the reading canvas.
2. Existing premium near-black / orange / warm-gold design remains, including compatible glass borders and soft motion; copying English spelling, inflection, grammar or phrasal-verb content is prohibited.
3. Keep the existing 5-tab app, library, book detail, writing/quiz, story and canonical lesson engine intact; change the reader module incrementally, rather than replacing main with a standalone demo.
4. UI state must never misrepresent missing data, fake audio duration, pronunciation confidence, completion time, POS, CEFR, word meaning or API success.
5. Full product completeness is NOT claimed until real Czech story data, word timing, content QA, audio, microphone and dictionary services are integrated and tested separately. Every UI component with unavailable capabilities shows a disabled, understandable state.

## 1. Reading layout reference (CSS px, not screenshot physical pixels)

- Header: 52–62 px, compact, back arrow, centered book title and subtitle (chapter name + index), one accessible settings/text-size action. Never draw iOS's own battery/time status bar.
- Reading canvas: flex:1; overflow-y:auto; Czech prose continuous, legible, starting 18 px with adjustable 16–28 px, line-height about 1.65–1.75, paragraph spacing about 22–30 px. Maintain original paragraphs, punctuation, quotations and dialogues; handle Czech diacritics. Do not place individual speaker widgets inline after every sentence; they break Czech text wrapping.
- Tap a WORD to open context-aware Quick Dictionary. A sentence's listen action is offered unobtrusively via sentence selection/context sheet, not repeated on every line.
- Player expanded: target roughly 230–285 CSS px on 390×844 / 428×926, adjusting for browser chrome/safe area, and never covering text. Layout sequence: timestamps + seek / collapse, guided-read control, ±5 sec / Play-Pause / ±5 sec, Repeat / speed / Tt. Keep source/unsupported details short, non-intrusive and accurate. Reference screenshot is layout only, not a mandate for fake 00:21 duration.
- Player collapsed: about 60–70 px with at least Play-Pause + expand, preserves current playback position/state.
- Small devices (320×568) and landscape: scrolling text remains reachable; if an expanded player would consume too much space, compact by default and permit controlled internal scrolling on player. Preserve at least 44×44 CSS px interactive hit areas where feasible.
- Respect dynamic viewport, viewport resize, iOS safe-area insets, reduced-motion preference, text scaling and contrast. Keyboard and bottom sheet may not cover focused controls.

## 2. Audio control and Repeat state (real media only)

- Modes: NONE, HTML_AUDIO, DEVICE_TTS, GUIDED_READING; only one active audio owner at a time.
- HTML_AUDIO: Play/Pause/Resume, actual elapsed+duration, seek, clamp ±5sec within [0,duration], speed 0.75/0.85/1/1.25/1.5, Repeat ON loops; OFF permits current cycle to complete, then ends. Use HTMLMediaElement.currentTime and timeupdate.
- Repeat scope defaults to chapter; future selections: current sentence and an explicit sentence range. Loop boundaries must be real media boundaries, not estimated by word count.
- Karaoke: current sentence and word are separate state. Highlight text only with verified wordTiming alignment to the exact version of the audio. Seek updates highlight immediately; Pause preserves. Verified POS (word category) color is a separate optional layer. Do not derive per-word timestamps by dividing duration.
- DEVICE_TTS: if no story audio and a Czech cs-CZ voice exists, allow genuine device speech; never present made-up seconds, seek or ±5sec as operational. iOS Safari speech boundary callbacks may not be reliable enough for true karaoke: do not assert accurate word timing. Show actual limitations.
- Sentence playback: prefer verified sentenceStartMs/sentenceEndMs for HTML_AUDIO; stop at the sentence end when requested. For device TTS, synthesize the selected Czech sentence only. Do not automatically continue to the next sentence for sentence-only playback.
- Playback speed changes must preserve native audio pitch as supported. Release media resources when leaving a chapter. Handle audio stalls, error events, visibility/background changes conservatively.

## 3. Guided Read Aloud — required future experience, NOT STT integration claim

- UX states: disabled, permission_required, ready, listening, recognizing, accepted, retry, playing_word_help, completed, unsupported/error.
- Switching on stops chapter audio, requests microphone permission, highlights first token. Sequential/continuous Czech speech recognition should advance across matched words; silence is not a mistake. Incorrect/unrecognized word stays current.
- The ORANGE SPEAKER inside this specific guided box means ONLY 'play example audio of the CURRENT STUCK WORD'. It is not mute and not chapter play. Stop/duck microphone during example playback and restore after. Hearing help NEVER advances the word.
- Repeat ON resets to first word at last accepted word; OFF marks completed. Keep recognition correctness separate from phoneme-level pronunciation assessment. Browser STT alone must never be shown as '100% correct pronunciation'.
- If cs-CZ speech services / model aren't available, show a truthful disabled or unsupported state. Do not simulate success.

## 4. Word tap → contextual quick dictionary → full Czech dictionary

- Word tap pauses chapter audio and opens a swipeable bottom sheet without changing reading scroll or audio time; closing sheet does NOT auto-resume. Handle stale asynchronous responses with request IDs.
- Quick sheet: selected surface form, lemma (if verified), POS badge, context-specific Mongolian meaning before alternative senses, morphology details, pronunciation/IPA and audio when present, example sentence CZ+MN, sense selection, flashcard action and Full Dictionary link. Distinct compact, expanded, loading, partial and not_found states.
- Full Dictionary: morphology-specific cards, semantic senses grouped by lemma+POS+sense_id, 7 Czech noun cases and numbers, gender/animacy where applicable, adjective agreement, verb aspect, person, tense, mood, se/si reflexive units, related roots/prefix verbs/collocations, CEFR/frequency only when source verified. Link back to the exact prior sentence and scroll.
- Never use English 'phrasal verbs' as Czech equivalent; never merge distinct homographs/parts of speech into one sense card.
- User-suggested translations are separate from verified lexicon entries. Unknown lemma / translation / IPA / CEFR should say unknown rather than fabricated.

## 5. Czech linguistic and tokenization contract

- Keep DISPLAY text and token analysis distinct; stable IDs and character offsets must align with diacritics, Czech punctuation, quotations and long/short vowels.
- Do not strip word suffixes to guess lemma. E.g. knihou → kniha, psa → pes, vidím → vidět. In 'Jdu do obchodu' the preposition 'do' selects genitive: context resolves obchodu; an isolated ending does not prove its case.
- Czech 7 cases, number, grammatical gender, animacy, verb aspect (psát/napsat), reflexive particles and adjective agreement are not English grammar forms.
- Pronunciation plan includes ř, ch, ě, ď/ť/ň, ú/ů, vowel length versus stress, syllabic r/l, clusters, regressive voice assimilation and preposition+stress group. A long vowel is NOT automatically stressed.
- POS categories and stable colors: NOUN blue; VERB orange; ADJ green; ADV violet; PRON teal; ADP/prepositions pink-mauve; CCONJ/SCONJ gold; NUM teal-green; PART slate; INTJ pink. Unknown gray. Color mode off/default sparse, user can show color only on current word; textual POS label always accompanies color in dictionary.
- Candidate NLP components (future, after license review): MorphoDiTa, MorfFlex CZ, UDPipe and context-aware lexicon. No claim that any is installed.

## 6. Data contract (type-level, no fake fallback values)

Book: book_id, title_cs, title_mn, level, chapters, cover, progressSource.  
Chapter: chapter_id, book_id, title_cs/title_mn, paragraphs, audio_reference, audio_version, text_version, reading_position.  
Sentence: sentence_id, original_cs, translation_mn, ordered_token_ids, optional audio_start_ms/end_ms.  
Token: token_id, visible_text, sentence_id, start/end_character_offset, optional lemma, POS, morphology, verified_sense_id, verified_pronunciation_reference, optional start/end_audio_ms, source/confidence.  
DictionaryEntry: entry_id, lemma, POS, sense_ids, morphology, examples, related_terms, sources, licenses, verified_status.  
ReaderSession: chapter_id, mode, audio_position, repeat_enabled/scope, speed, selected_token, last_accepted_token, scroll_position, font_size, POS_color_mode, dictionary_sheet_state.  
Always keep lemma and sense_id separate. word-timing data must be audio-version-specific and validated.

## 7. State model and non-conflicting transitions

- Audio: idle, loading, playing, paused, seeking, ended, error.
- Reading: normal, highlighted_sentence, manual_scrolling, translation_visible, chapter_completed.
- Dictionary: closed, compact, expanded, loading, partial, not_found, full_open.
- Guided: disabled, permission_required, ready, listening, recognizing, accepted, retry, playing_word_help, completed, unsupported/error.
- Guided activation pauses/stops audio; one voice owner only. Dictionary tap pauses audio. Word-help audio is not fed into microphone. Drawer opening doesn't lose token/time/scroll. Chapter transition cleans old audio/mic and tokens. Collapsing the player does not alter playback.

## 8. Development workflow and acceptance

Phase A — Reader layout: implementation + physical iPhone follow-up; automated viewport QA at 320×568, 375×667, 390×844, 428×926 and landscape. Match screenshot #3 density and placement, not its English content. Regression coverage for existing tabs/library/quiz/writing.
Phase B — Audio UX: real media Player, seek/repeat/speed, sentence selection, verified karaoke, scroll state. Test file-based audio separately from TTS. NO fictitious seconds.
Phase C — Guided UI states: disabled now, later mic permission/STT, incremental word sequence, stuck-word helper, repeat and real pronunciation assessment when available.
Phase D — Quick/full dictionaries: context, Czech inflections, POS labeling and colors, examples, flashcard persistence, exact return position.
Phase E — Bind verified Czech curriculum and audio manifest. Do not silently replace the canonical 72-lesson system with demo book data.
Phase F — Automated CI, Render HTTPS smoke, device-specific iPhone Safari/PWA tests, accessibility and offline/errors. Report PASS, FAIL, NOT_TESTED, NOT_INTEGRATED separately for UI, actual audio, microphone, backend and data.

### Current checkpoint: verified vs outstanding (2026-11-22)
- DONE IN CODE: premium chapter reader, word tap with basic vocabulary fallback, translation toggle, CSS responsive layout, compact player, TTS fallback contract, native file player contract, navigation and partial saved state.
- UI TUNING NOW: match screenshot #3; remove inline speaker icons; prioritize readable text and smaller player; improve accessibility.
- TESTED PREVIOUSLY: Chrome responsive and interaction tests at 320×568, 390×844, 428×926; synthetic 8-second WAV test for native play/pause/seek/±5 sec. Real iPhone screenshot is user-observed but full device QA not independently completed.
- NOT INTEGRATED: real published chapter audio/timing, production karaoke, precise POS/morphology/sense lexicon, complete full dictionary, actual microphone STT, pronunciation quality assessment, repeat sentence-range mode and canonical 72-lesson data binding.
- NEVER CLAIM: UI preview proves STT, real-word audio alignment, dictionary correctness or AI integration. No changes to Production or Gemini key as part of UI work.

## 9. Delivery format
1. Updated premium reader in the single main branch; useful live preview when deployed.
2. Design/navigation and state description, clear screen-size constraints.
3. Modular media controls, word/sentence components and safe data contract.
4. Real Chrome/CI/Render test evidence with precise failures and untested device scope.
5. Changed files, traceable commits, and list of all still-missing integrations.
6. Avoid UI clutter; prefer the user's third reference screenshot for layout over previous placeholder cards.

**North-star flow:** Read Czech → listen to real Czech audio → follow genuine word highlight → attempt continuous read-aloud → play the stuck word only if needed → inspect context-sensitive Quick Dictionary → open full Czech grammar → save flashcard → return to original reading position. Each action must be implemented or truthfully disabled, never simulated.
