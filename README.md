# Ahoj Česko — үндсэн апп (main)
## Эхлэх цэг
**Ганц идэвхтэй ажлын салбар: main.** 2026-11-25-наас шинэ чат бүрд шинэ branch үүсгэхгүй. Өмнөх салбарууд нь хадгалсан эх материал; шууд merge хийхгүй, устгахгүй.
- [AGENTS.md](AGENTS.md) — ажлын заавал мөрдөх дүрэм.
- [PROJECT_STATE.md](PROJECT_STATE.md) — одоогийн төлөв, ганц NEXT ажил.
- [CURRICULUM_MASTER.md](CURRICULUM_MASTER.md) — сургалтын үндсэн шаардлага.
- [ARCHITECTURE.md](ARCHITECTURE.md) — техникийн нэгтгэл, хязгаар.
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) — суралцагчид ээлтэй UI.
Өмнөх салбарын ажлын заавраас эдгээр файл давуу хүчинтэй. Үндсэн аппын код, сургалтын чанар, release-ийг баталгаажуулсан гэсэн үг биш.
## Үндсэн апп
- / → /cesky-reading-uiux/index.html?tab=stages.
- UI: public/cesky-reading-uiux/index.html.
- Уншлага: reader-experience.js/css. Цагаан толгой: alphabet-a0.js/html/css.
- Хоёр жишээ номын дөрвөн бүлэг; дутуу бүлгийг хиймэл загвараар нөхөхгүй.
- Хичээлийн бүрэн өгөгдөл, баталгаажсан толь, аудио, дуудлагын үнэлгээ бүрэн холбогдоогүй.
- Уншлагын өмнөх дэлгэрэнгүй UX баримт: docs/CZECH_READING_EXPERIENCE_MASTER_V1_1.md; шинэ master стандарттай зөрчилдвөл шинэ стандартыг баримтална.
## Серверийн API
- GET /api/health
- GET /api/ai/usage; POST /api/ai/usage/limits
- POST /api/ai/tutor; POST /api/ai/reading-help
- POST /api/ai/tts (сервер restart үед аудио алдагдаж болзошгүй, persistent audio factory биш)
## Command
npm run dev · npm run build · npm run lint
Автомат CI, reader-browser QA-г хадгална. Хэрэглэгчээр хөгжүүлэгчийн QA хийлгэхгүй. Main-д жижиг, шалгасан commit; хүчээр ref солихгүй.
