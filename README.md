# Ahoj Česko — үндсэн апп (main)

## Салбарын бүтэц
- `main`: одоо ашиглагдаж байгаа ганц PWA, reader UI, үндсэн серверийн API, PWA тохиргоо, автоматаар ажиллах CI/reader QA.
- `archive/pre-separation-2026-11-22`: цэвэрлэгээ хийхийн өмнөх **бүрэн snapshot**. Туршилтын 8 ном, 86 автоматаар нөхөгддөг бүлэг, ашиглагдахгүй байсан AI API, хуучин Render smoke script энд хэвээр хадгалагдсан.

## Үндсэн апп
- `/` → `/cesky-reading-uiux/index.html?tab=stages`.
- Үндсэн UI: `public/cesky-reading-uiux/index.html`.
- Уншлагын хөдөлгүүр: `reader-experience.js`, `reader-experience.css`.
- Зөвхөн бие даан бичигдсэн 4 бүлэг бүхий 2 жишээ ном одоо уншлагын хэсэгт үлдсэн. Дутуу 86 бүлгийг хиймэл загвараар нөхөхгүй.
- Хичээлийн бүрэн өгөгдөл, баталгаажсан толь, бэлэн аудио сан, жинхэнэ дуудлагын үнэлгээ одоогоор холбогдоогүй.

## Сервер дээр үлдсэн API
- `GET /api/health`
- `GET /api/ai/usage`, `POST /api/ai/usage/limits`
- `POST /api/ai/tutor`, `POST /api/ai/reading-help`
- `POST /api/ai/tts` (үүсгэсэн аудио сервер restart хийхэд алдагдах боломжтой; persistent audio factory биш)

## Гүйцэтгэлийн дүрэм
- `main` дээр үндсэн бүтээгдэхүүн болон түүнд шууд шаардлагатай кодыг л хадгална.
- Шинэ prototype / туршилтыг тусдаа feature branch дээр хөгжүүлж, зөвхөн баталгаажсан үед main руу нийлүүлнэ.
- Автомат CI, reader-browser QA-г main дээр хадгална. Хэрэглэгчийг гар QA хийлгэхгүй.
- `docs/CZECH_READING_EXPERIENCE_MASTER_V1_1.md` нь уншлагын UX суурь баримт бичиг.

## Command
`npm run dev` · `npm run build` · `npm run lint`
