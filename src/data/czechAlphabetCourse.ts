/**
 * Czech alphabet draft practice dataset v1: 42 graphemes including CH.
 * Core display examples are Czech word samples; they are NOT native-approved
 * TTS or a pronunciation assessment. Use verified source audio later.
 */
export const CZECH_ALPHABET_DATA_VERSION = 'czech-alphabet-visual-v1';

export type CzechLetterKind = 'standard' | 'accented' | 'digraph' | 'loan';

export interface CzechAlphabetLetter {
  id: string;
  upper: string;
  lower: string;
  exampleCs: string;
  exampleMn: string;
  kind: CzechLetterKind;
  noteMn?: string;
}

const RAW_LETTERS: readonly (readonly [string, string, string, string])[] = [
  [
    "A",
    "a",
    "auto",
    "машин"
  ],
  [
    "Á",
    "á",
    "máma",
    "ээж"
  ],
  [
    "B",
    "b",
    "banán",
    "гадил"
  ],
  [
    "C",
    "c",
    "cena",
    "үнэ"
  ],
  [
    "Č",
    "č",
    "čaj",
    "цай"
  ],
  [
    "D",
    "d",
    "dům",
    "байшин"
  ],
  [
    "Ď",
    "ď",
    "loď",
    "усан онгоц"
  ],
  [
    "E",
    "e",
    "pes",
    "нохой"
  ],
  [
    "É",
    "é",
    "léto",
    "зун"
  ],
  [
    "Ě",
    "ě",
    "město",
    "хот"
  ],
  [
    "F",
    "f",
    "film",
    "кино"
  ],
  [
    "G",
    "g",
    "guma",
    "баллуур"
  ],
  [
    "H",
    "h",
    "hrad",
    "цайз"
  ],
  [
    "CH",
    "ch",
    "chléb",
    "талх"
  ],
  [
    "I",
    "i",
    "informace",
    "мэдээлэл"
  ],
  [
    "Í",
    "í",
    "mír",
    "энх тайван"
  ],
  [
    "J",
    "j",
    "jméno",
    "нэр"
  ],
  [
    "K",
    "k",
    "káva",
    "кофе"
  ],
  [
    "L",
    "l",
    "les",
    "ой"
  ],
  [
    "M",
    "m",
    "máma",
    "ээж"
  ],
  [
    "N",
    "n",
    "nos",
    "хамар"
  ],
  [
    "Ň",
    "ň",
    "kůň",
    "морь"
  ],
  [
    "O",
    "o",
    "oko",
    "нүд"
  ],
  [
    "Ó",
    "ó",
    "tón",
    "аялгуу"
  ],
  [
    "P",
    "p",
    "práce",
    "ажил"
  ],
  [
    "Q",
    "q",
    "quinoa",
    "киноа (гадаад үг)"
  ],
  [
    "R",
    "r",
    "ruka",
    "гар"
  ],
  [
    "Ř",
    "ř",
    "řeka",
    "гол"
  ],
  [
    "S",
    "s",
    "sýr",
    "бяслаг"
  ],
  [
    "Š",
    "š",
    "škola",
    "сургууль"
  ],
  [
    "T",
    "t",
    "tramvaj",
    "трамвай"
  ],
  [
    "Ť",
    "ť",
    "chuť",
    "амт"
  ],
  [
    "U",
    "u",
    "ulice",
    "гудамж"
  ],
  [
    "Ú",
    "ú",
    "úkol",
    "даалгавар"
  ],
  [
    "Ů",
    "ů",
    "dům",
    "байшин"
  ],
  [
    "V",
    "v",
    "voda",
    "ус"
  ],
  [
    "W",
    "w",
    "web",
    "веб сайт (гадаад үг)"
  ],
  [
    "X",
    "x",
    "taxi",
    "такси (гадаад үг)"
  ],
  [
    "Y",
    "y",
    "syn",
    "хүү"
  ],
  [
    "Ý",
    "ý",
    "dobrý",
    "сайн"
  ],
  [
    "Z",
    "z",
    "zima",
    "өвөл"
  ],
  [
    "Ž",
    "ž",
    "žena",
    "эмэгтэй"
  ]
];

const NOTES: Record<string, string> = {
  'Á': 'Урт эгшгийн тэмдэг. Авианы урт нь чухал; баталгаажсан дуудлагын аудиог тусад нь нэмнэ.',
  'É': 'Урт эгшиг. Чех хэлэнд үгийн өргөлт болон эгшгийн урт өөр зүйл.',
  'Ě': 'Энэ тэмдэг өмнөх гийгүүлэгчээс хамаарч дуудлагад нөлөөлдөг; дан ганц «е» гэж ойлгож болохгүй.',
  'Ď': 'Зөөлөн гийгүүлэгч. Хэлний байрлалын аудио, жишээ дараа нь нэмэгдэнэ.',
  'CH': 'Хоёр тэмдэгтээр бичигдсэн боловч Чех цагаан толгойд нэг үсэг.',
  'Í': 'Урт эгшиг. I болон Í нь бичиг, дуудлагаараа ялгаатай.',
  'Ň': 'Зөөлөн гийгүүлэгч. «kůň» (морь) үгийн төгсгөлд ордог.',
  'Ó': 'Урт эгшиг; зарим гадаад гаралтай үгэнд харьцангуй түгээмэл.',
  'Q': 'Ердийн Чех үгэнд ховор. Ихэвчлэн гадаад гаралтай үгэнд таарна.',
  'Ř': 'Чех хэлний өвөрмөц гийгүүлэгч; зөвхөн үсэг харж дуудлагыг нь дүгнэхгүй.',
  'Ť': 'Зөөлөн гийгүүлэгч. «chuť» (амт) гэдэг үгэнд ордог.',
  'Ú': 'Урт U эгшгийн бичлэгийн нэг хэлбэр.',
  'Ů': 'Ú-тэй ижил урт U авиаг илэрхийлдэг ч бичлэгийн дүрэм өөр.',
  'W': 'Ердийн Чех үгэнд ховор; гадаад үг, нэрэнд хэрэглэгдэнэ.',
  'X': 'Ихэвчлэн гадаад гаралтай үгэнд ордог.',
  'Y': 'I-тэй адил дуудагдах нөхцөл олон боловч зөв бичих дүрэм нь тусдаа.',
  'Ý': 'Урт Ý ба Í-ийн авиа олон нөхцөлд ижил ч үсгийн бичлэг өөр.',
  'Č': 'Háček (дээшээ тэмдэглэгээ) бүхий тусдаа үсэг.',
  'Š': 'Háček тэмдэглэгээтэй тусдаа үсэг.',
  'Ž': 'Háček тэмдэглэгээтэй тусдаа үсэг.',
};

const ACCENTED = new Set('Á Č Ď É Ě Í Ň Ó Ř Š Ť Ú Ů Ý Ž'.split(' '));
const LOAN = new Set(['Q', 'W', 'X']);

export const CZECH_ALPHABET_LETTERS: readonly CzechAlphabetLetter[] = RAW_LETTERS.map(
  ([upper, lower, exampleCs, exampleMn]) => ({
    id: upper,
    upper,
    lower,
    exampleCs,
    exampleMn,
    kind: upper === 'CH' ? 'digraph' : LOAN.has(upper) ? 'loan' : ACCENTED.has(upper) ? 'accented' : 'standard',
    ...(NOTES[upper] ? { noteMn: NOTES[upper] } : {}),
  }),
);

export const CZECH_ALPHABET_BY_ID = new Map(CZECH_ALPHABET_LETTERS.map(letter => [letter.id,letter]));
export const ALPHABET_LESSON_STEP_COUNT = 7;

/** Deterministic distractors that never equal the actual source token. */
export function letterOptions(letterId: string, count = 4): string[] {
  const index = CZECH_ALPHABET_LETTERS.findIndex(letter => letter.id === letterId);
  if (index < 0) return [];
  const results = [letterId];
  for (let n=1; results.length<count && n<42; n++) {
    const other = CZECH_ALPHABET_LETTERS[(index+n*7)%CZECH_ALPHABET_LETTERS.length].id;
    if (!results.includes(other)) results.push(other);
  }
  return results.map((_,i) => results[(i+index)%results.length]);
}

/** Mask only the exact Czech grapheme, including CH. */
export function maskLetterInExample(letter: CzechAlphabetLetter): string {
  const index = letter.exampleCs.toLocaleLowerCase('cs-CZ').indexOf(letter.lower);
  if (index < 0) return letter.exampleCs;
  return letter.exampleCs.slice(0,index) + '＿' + letter.exampleCs.slice(index + letter.lower.length);
}

export function isCzechLetterResponse(value: string, expectedLetterId: string): boolean {
  const target = CZECH_ALPHABET_BY_ID.get(expectedLetterId);
  return target != null && value.trim().toLocaleLowerCase('cs-CZ') === target.lower;
}
