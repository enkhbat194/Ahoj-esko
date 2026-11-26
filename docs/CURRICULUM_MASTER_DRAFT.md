# AHOJ — CURRICULUM MASTER DRAFT v0.2
Proposal 2026-11-23. NOT an approved CEFR certification or a fixed word-frequency standard.

## Levels
A0 = Pre-A1 preparation (internal A0); A1, A2, B1, B2 = CEFR. Optional internal subdivisions A1.1/A1.2 etc. Every lesson must have real-world can_do and novel transfer check.
Tentative topic counts: A0 16, A1 14, A2 14, B1 12, B2 12; ONLY A0 topic names exist in verified outline. Design full A1-B2 can-do inventory before treating counts as fixed.

## Vocabulary targets (cumulative UNIQUE LEMMAS; design hypotheses, not CEFR official quotas)
A0 220–300; A1 700–1,000; A2 1,500–2,000; B1 2,700–3,500; B2 4,000–5,500. Czech inflections are not additional lemmas. Track separately: unique lemma, distinct sense, learned fixed chunk, word form, receptive/production mastery, exposures and retrieval successes. A0 initial active targets approximately 150–200 lemmas.

## A0: 140 stable micro-skill IDs grouped provisionally into 68 USER LEARNING SESSIONS
Topic | name | micro-skill IDs | proposed 12–18-minute sessions | exit capability
T01 | Alphabet and sounds | 8 | 4 | Distinguish and read essential Czech sounds in simple words; parallel with speaking
T02 | Greetings and introductions | 18 | 8 | Greet, introduce self/others, distinguish informal/formal
T03 | Repair misunderstandings | 8 | 4 | Ask to repeat, slow down or explain
T04 | Numbers and money | 8 | 4 | Hear prices, ask prices, choose payment
T05 | Day/time/appointment | 8 | 4 | Understand and agree a simple time
T06 | Family | 8 | 4 | Introduce family members
T07 | Food and shopping | 10 | 5 | Order food, ask quantities, pay
T08 | Transport and directions | 9 | 5 | Ask for stop and follow directions
T09 | Work/tools/safety | 10 | 5 | Ask for tools, stop and request safety clarification
T10 | Body and health | 10 | 5 | State low-risk symptoms and seek help, not medical advice
T11 | Home and housing | 8 | 4 | Locate rooms/objects and report simple problems
T12 | Colour and shape | 7 | 3 | Identify objects by colour/size
T13 | Clothing | 8 | 4 | Ask size, try on, choose item
T14 | Weather | 7 | 3 | Understand and describe basic weather
T15 | School/learning | 7 | 3 | Follow instructions and ask to repeat
T16 | Animals | 6 | 3 | Describe a familiar animal using previously learned constructions
TOTAL | 16 topics | 140 IDs | 68 SESSIONS | provisional grouping only.
This is a mapping proposal, not a change to the existing JSON. T01 sound lessons must NOT block T02 speaking. A0 core survival skills have higher priority than animal, colour or specialist vocabulary.

## Lesson composition
Teaching session: 12–18 minutes, usually 2 micro skills, sometimes 1–3. Introduce approximately 4–6 NEW useful lemmas total (0–2 for alphabet/review/assessment; do not impose a fixed quota). Also teach 1–2 new functional chunks (e.g., Dobrý den; Ještě jednou, prosím) and at most one main new grammatical pattern when needed. Learner-visible Czech token volume, lexical difficulty and support must adapt.
Learning flow: situation/picture -> short natural dialogue -> meaning check -> pronunciation CHUNK to word to sentence (never systematically syllabify Czech) -> delayed uncued recall -> personalized reply -> 2–6 turn interaction -> new scenario -> adaptive review. Correct only priority error and retry.
Do NOT teach all new vocabulary only as isolated cards. Offer optional quick picture+audio+meaning for 1–3 opaque or critical words BEFORE a scene, then train them in sentences. New words need multiple contexts and productive attempts.

## Choosing words
Rank by: (1) survival/task utility 35%, (2) spoken Czech frequency 25%, (3) reuse across topics 20%, (4) phonetic/morphological teachability 10%, (5) safety/social appropriacy 10%. All weights are internal prioritization heuristics, not research-derived constants. Use Czech National Corpus spoken samples ORAL/ORTOFON and corpus written SYN carefully, Czech A1 model situations and Institute of Czech Language dictionary, plus Czech native/editorial review. No wholesale import of copyrighted dictionaries/corpus examples. Maintain lemma_id, sense_id, POS, register, gender, example context and source/license.
Avoid selecting nouns simply because a beginner picture vocabulary book has them; prioritize prosím, nerozumím, kde, kolik, potřebuju, můžu, chci, jdu, máte when pragmatically appropriate.

## Stories and input
Two streams: A) embedded micro scenes tightly linked to lesson skills, B) graded episodic reader (consistent 2–4 characters and unfolding mysteries, not random 800 sentences).
A0 scenes 20–60 seconds, later short episodes around 50–100 Czech tokens initially; increase only if comprehended. For initial graded reader drafting, target roughly 85–95% already known/strongly supported text tokens PLUS 1–3 purposeful new lexical targets; this is a product heuristic, NOT Krashen's numerical i+1 law. Gloss or illustrate all otherwise blocking words; keep Czech native idiom and grammar. Do not limit all texts to exact previously seen words, otherwise no genuine acquisition.
Every story sentence carries text version, word/lemma IDs, context-appropriate Mongolian translation, audio ID, word timing only if verified, and review links. Existing 800-sentence drafts are candidate material, not an automatic production curriculum.

## Spacing and passing
Initial learning: 2–3 varied uses plus recall; attempt next session then ~1/3/7/14/30 days as a DEFAULT SEED, not universal fixed spacing. Correct and easy -> extend interval; incorrect or with help -> shorten and re-contextualize. Count retrieval without hints separately from listening.
Assess 5 dimensions separately: can-do success, comprehension, register, intelligibility, repair. Low-confidence browser STT is NOT proof of poor pronunciation. Human/native Czech reviews and actual learner pilot required before claims.
A0 pass based on novel scenarios: meet, clarify, price/payment, appointment, travel, simple help; supplementary domains accessible optionally; not a CEFR exam certificate.

## Sources to consult on each update
Council of Europe CEFR Companion Volume; Czech model situations at cestina-pro-cizince.cz; Charles University phonetics; Czech National Corpus wiki.korpus.cz; UJC Czech dictionaries; retrieval/spaced practice evidence. All numeric quotas above are proposals to validate.
