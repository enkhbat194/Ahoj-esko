import type { Dialogue, TopicId, VocabCard } from '../types/lesson';

export const DEFAULT_PROJECT_DRIVE_FOLDER_ID = '1TFTOQHQK7JKQFhueBI8LURbxRIdROhYj';

export interface ParsedDriveCard {
  // Provenance key for content/audio linking; never derive from display text alone.
  canonicalId?: string;
  topicId: TopicId;
  czechWord: string;
  phoneticHint: string;
  mongolianWord: string;
  czechSentence: string;
  mongolianSentence: string;
}

export interface ParsedDriveCurriculum {
  cards: ParsedDriveCard[];
  dialogues: Omit<Dialogue, 'id'>[];
  detectedFormat: 'json' | 'csv' | 'lines' | 'unstructured';
}

export function extractDriveFolderId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]{10,})/);
  if (folderMatch?.[1]) return folderMatch[1];

  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (idParamMatch?.[1]) return idParamMatch[1];

  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === ',' || ch === '\t' || ch === ';') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeTopic(val?: string): TopicId {
  const v = (val ?? '').trim().toLowerCase();
  if (v === 'greetings' || v === 'cafe' || v === 'transport' || v === 'work' || v === 'custom') {
    return v;
  }
  if (v.includes('кафе') || v.includes('дэлгүүр') || v.includes('shop')) return 'cafe';
  if (v.includes('тээвэр') || v.includes('трамвай') || v.includes('bus')) return 'transport';
  if (v.includes('ажил') || v.includes('work')) return 'work';
  if (v.includes('мэнд') || v.includes('greet')) return 'greetings';
  return 'custom';
}

export function parseDriveCurriculumText(
  rawText: string,
  fileName?: string
): ParsedDriveCurriculum {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { cards: [], dialogues: [], detectedFormat: 'unstructured' };
  }

  // 1. JSON format ({ cards, dialogues } or array of card objects)
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as
        | Partial<{ cards: VocabCard[]; dialogues: Dialogue[] }>
        | VocabCard[];
      const rawCards = Array.isArray(parsed) ? parsed : Array.isArray(parsed.cards) ? parsed.cards : [];
      const rawDialogues = !Array.isArray(parsed) && Array.isArray(parsed.dialogues) ? parsed.dialogues : [];

      const cards: ParsedDriveCard[] = rawCards
        .filter((c) => Boolean(c?.czechWord && c?.mongolianWord))
        .map((c) => ({
          topicId: normalizeTopic(c.topicId),
          czechWord: String(c.czechWord).trim(),
          phoneticHint: String(c.phoneticHint ?? '').trim() || String(c.czechWord).trim(),
          mongolianWord: String(c.mongolianWord).trim(),
          czechSentence: String(c.czechSentence ?? c.czechWord).trim(),
          mongolianSentence: String(c.mongolianSentence ?? c.mongolianWord).trim(),
          ...(typeof c.canonicalId === 'string' && c.canonicalId.trim()
            ? { canonicalId: c.canonicalId.trim() }
            : {}),
        }));

      const dialogues: Omit<Dialogue, 'id'>[] = rawDialogues
        .filter((d) => Boolean(d?.titleCz && Array.isArray(d.lines) && d.lines.length > 0))
        .map((d) => ({
          topicId: normalizeTopic(d.topicId),
          titleMn: String(d.titleMn ?? d.titleCz).trim(),
          titleCz: String(d.titleCz).trim(),
          situationMn: String(d.situationMn ?? '').trim(),
          lines: d.lines.map((l, idx) => ({
            id: l.id || `line-${idx + 1}`,
            speaker: l.speaker === 'B' ? 'B' : 'A',
            speakerName: String(l.speakerName || (l.speaker === 'B' ? 'Хэрэглэгч' : 'Багш')),
            czech: String(l.czech || '').trim(),
            phonetic: String(l.phonetic || '').trim(),
            mongolian: String(l.mongolian || '').trim(),
          })),
        }));

      if (cards.length > 0 || dialogues.length > 0) {
        return { cards, dialogues, detectedFormat: 'json' };
      }
    } catch {
      // Fall through to CSV / structured line parsers
    }
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  // 2. CSV / TSV (Google Sheets export)
  const lowerName = (fileName ?? '').toLowerCase();
  const looksLikeCsv =
    lowerName.endsWith('.csv') ||
    lowerName.endsWith('.tsv') ||
    (lines.length >= 2 && (lines[0].includes(',') || lines[0].includes('\t')));

  if (looksLikeCsv) {
    const rows = lines.map(splitCsvLine);
    const headerKeys = rows[0].map((c) => c.toLowerCase().replace(/[^a-z0-9]/g, ''));
    // Audio production queues and QA manifests are not curriculum cards.
    // Do not manufacture bogus vocabulary from source_id/request_id columns.
    const looksLikeAudioManifest = headerKeys.some((key) =>
      ['sourceid', 'requestid', 'batchid', 'audiosha256', 'audiotextkey'].includes(key)
    );
    if (looksLikeAudioManifest && !(headerKeys.includes('czechword') && headerKeys.includes('mongolianword'))) {
      return { cards: [], dialogues: [], detectedFormat: 'unstructured' };
    }
    const canonicalIdColumn = headerKeys.indexOf('canonicalid');
    const firstRowLower = rows[0].map((c) => c.toLowerCase()).join(' ');
    const startIdx =
      firstRowLower.includes('czech') ||
      firstRowLower.includes('чех') ||
      firstRowLower.includes('word') ||
      firstRowLower.includes('үг')
        ? 1
        : 0;

    const csvCards: ParsedDriveCard[] = [];
    for (let i = startIdx; i < rows.length; i += 1) {
      const cols = rows[i];
      if (cols.length < 2) continue;
      if (cols.length >= 5) {
        // czechWord, phoneticHint, mongolianWord, czechSentence, mongolianSentence
        if (cols[0] && cols[2]) {
          csvCards.push({
            topicId: normalizeTopic(cols[5]),
            czechWord: cols[0],
            phoneticHint: cols[1] || cols[0],
            mongolianWord: cols[2],
            czechSentence: cols[3] || cols[0],
            mongolianSentence: cols[4] || cols[2],
            ...(canonicalIdColumn >= 0 && cols[canonicalIdColumn]?.trim()
              ? { canonicalId: cols[canonicalIdColumn].trim() }
              : {}),
          });
        }
      } else if (cols.length >= 3) {
        if (cols[0] && cols[1]) {
          csvCards.push({
            topicId: 'custom',
            czechWord: cols[0],
            phoneticHint: cols[2] || cols[0],
            mongolianWord: cols[1],
            czechSentence: cols[3] || cols[0],
            mongolianSentence: cols[1],
          });
        }
      } else if (cols[0] && cols[1]) {
        csvCards.push({
          topicId: 'custom',
          czechWord: cols[0],
          phoneticHint: cols[0],
          mongolianWord: cols[1],
          czechSentence: cols[0],
          mongolianSentence: cols[1],
        });
      }
    }

    if (csvCards.length > 0) {
      return { cards: csvCards, dialogues: [], detectedFormat: 'csv' };
    }
  }

  // 3. Structured separator lines: "Dobrý den — Сайн байна уу" or "word | phonetic | mn | sentence"
  const lineCards: ParsedDriveCard[] = [];
  for (const line of lines) {
    const cleaned = line.replace(/^[-*•\d.)]+\s*/, '');
    if (cleaned.includes('|')) {
      const parts = cleaned.split('|').map((p) => p.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        lineCards.push({
          topicId: 'custom',
          czechWord: parts[0],
          phoneticHint: parts[2] || parts[0],
          mongolianWord: parts[1],
          czechSentence: parts[3] || parts[0],
          mongolianSentence: parts[4] || parts[1],
        });
      }
      continue;
    }

    const dashMatch = cleaned.match(/^(.+?)\s+(?:—|–|->|=|:|-)\s+(.+)$/);
    if (dashMatch?.[1] && dashMatch?.[2]) {
      const left = dashMatch[1].trim();
      const right = dashMatch[2].trim();
      // Ignore English/Mongolian metadata lines like "Version: 0.1"
      if (left.length <= 80 && right.length <= 160 && /[a-záčďéěíňóřšťúůýž]/i.test(left)) {
        lineCards.push({
          topicId: 'custom',
          czechWord: left,
          phoneticHint: left,
          mongolianWord: right,
          czechSentence: left,
          mongolianSentence: right,
        });
      }
    }
  }

  if (lineCards.length > 0) {
    return { cards: lineCards, dialogues: [], detectedFormat: 'lines' };
  }

  return { cards: [], dialogues: [], detectedFormat: 'unstructured' };
}
