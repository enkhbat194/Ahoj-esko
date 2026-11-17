import type {
  StoryChapter,
  StoryGlossaryEntry,
  StoryProgressState,
  StorySentence,
  TopicId,
  VocabCard,
} from '../types/lesson';

export const STORY_PROGRESS_STORAGE_KEY = 'ahoj_cesko_klic17_progress_v1';

export interface StoryToken {
  text: string;
  lookupKey: string;
  isWord: boolean;
}

const CZECH_WORD_REGEX = /([A-Za-zÁČĎÉĚÍŇÓŘŠŤÚŮÝŽáčďéěíňóřšťúůýž]+)/;

export function normalizeCzechToken(raw: string): string {
  return raw
    .trim()
    .replace(/^[„“”"'(\[]+|[.,!?:;…„“”"'”\])]+$/g, '')
    .toLocaleLowerCase('cs-CZ');
}

export function tokenizeCzechSentence(sentence: string): StoryToken[] {
  const parts = sentence.split(CZECH_WORD_REGEX).filter((part) => part.length > 0);
  return parts.map((part) => {
    const isWord = /^[A-Za-zÁČĎÉĚÍŇÓŘŠŤÚŮÝŽáčďéěíňóřšťúůýž]+$/.test(part);
    return {
      text: part,
      lookupKey: isWord ? normalizeCzechToken(part) : '',
      isWord,
    };
  });
}

export function lookupGlossaryEntry(
  rawWord: string,
  glossary: Record<string, StoryGlossaryEntry>
): StoryGlossaryEntry | null {
  const key = normalizeCzechToken(rawWord);
  if (!key) return null;
  return glossary[key] ?? null;
}

export function mapLessonIdsToTopic(lessonIds: string[], chapterNumber: number): TopicId {
  if (lessonIds.some((id) => id.includes('M06-L03') || id.includes('TRANSPORT'))) return 'transport';
  if (lessonIds.some((id) => id.includes('M03') || id.includes('CAFE'))) return 'cafe';
  if (lessonIds.some((id) => id.includes('M04') || id.includes('M05'))) return 'work';
  if (chapterNumber === 5 || chapterNumber === 6 || chapterNumber >= 19) return 'work';
  if (chapterNumber >= 15 && chapterNumber <= 18) return 'transport';
  return 'greetings';
}

export function buildStoryWordCanonicalId(entry: StoryGlossaryEntry, surfaceWord: string): string {
  const key = normalizeCzechToken(entry.lemma || surfaceWord).replace(/\s+/g, '_');
  return `KLIC17-WORD:${key}`;
}

export function buildStorySentenceCanonicalId(sentence: StorySentence): string {
  return `KLIC17:${sentence.id}`;
}

export function buildStoryWordSrsCard(
  surfaceWord: string,
  entry: StoryGlossaryEntry,
  sentence: StorySentence,
  chapter: Pick<StoryChapter, 'chapter' | 'titleCs'>
): Omit<VocabCard, 'id' | 'audioIds' | 'mastered' | 'practiceCount'> {
  const canonicalId = buildStoryWordCanonicalId(entry, surfaceWord);
  const headword =
    entry.nounGender || entry.lemma === normalizeCzechToken(surfaceWord)
      ? entry.lemma
      : surfaceWord.trim();

  return {
    topicId: entry.topicId ?? mapLessonIdsToTopic(sentence.lessonIds, chapter.chapter),
    czechWord: headword,
    phoneticHint: entry.phonetic,
    mongolianWord: `${entry.mn} (${entry.grammar})`,
    czechSentence: sentence.cs,
    mongolianSentence: `${sentence.mn} · Klíč 17 (${chapter.titleCs})`,
    canonicalId,
    lemmaGroup: entry.lemmaGroup,
    nounGender: entry.nounGender,
    qaStatus: entry.qaStatus,
  };
}

export function buildStorySentenceSrsCard(
  sentence: StorySentence,
  chapter: Pick<StoryChapter, 'chapter' | 'titleCs'>
): Omit<VocabCard, 'id' | 'audioIds' | 'mastered' | 'practiceCount'> {
  return {
    topicId: mapLessonIdsToTopic(sentence.lessonIds, chapter.chapter),
    czechWord: sentence.cs,
    phoneticHint: `Klíč 17 · ${sentence.id}`,
    mongolianWord: sentence.mn,
    czechSentence: sentence.cs,
    mongolianSentence: `${sentence.mn} · ${chapter.chapter}-р бүлэг (${chapter.titleCs})`,
    canonicalId: buildStorySentenceCanonicalId(sentence),
    lemmaGroup: `story_${sentence.id.toLowerCase()}`,
    qaStatus: 'draft_ai',
  };
}

export function isStoryItemInDeck(
  canonicalId: string,
  fallbackCzechWord: string,
  cards: Pick<VocabCard, 'canonicalId' | 'czechWord'>[]
): boolean {
  const targetNorm = normalizeCzechToken(fallbackCzechWord);
  return cards.some(
    (card) =>
      card.canonicalId === canonicalId ||
      (targetNorm.length > 0 && normalizeCzechToken(card.czechWord) === targetNorm)
  );
}

export function extractChapterGlossaryItems(
  chapter: StoryChapter,
  glossary: Record<string, StoryGlossaryEntry>
): Array<{
  surfaceWord: string;
  entry: StoryGlossaryEntry;
  sentence: StorySentence;
  canonicalId: string;
}> {
  const seenCanonical = new Set<string>();
  const results: Array<{
    surfaceWord: string;
    entry: StoryGlossaryEntry;
    sentence: StorySentence;
    canonicalId: string;
  }> = [];

  for (const sentence of chapter.sentences) {
    for (const token of tokenizeCzechSentence(sentence.cs)) {
      if (!token.isWord) continue;
      const entry = lookupGlossaryEntry(token.text, glossary);
      if (!entry) continue;
      const canonicalId = buildStoryWordCanonicalId(entry, token.text);
      if (seenCanonical.has(canonicalId)) continue;
      seenCanonical.add(canonicalId);
      results.push({
        surfaceWord: token.text,
        entry,
        sentence,
        canonicalId,
      });
    }
  }
  return results;
}

export function markSentenceRead(
  state: StoryProgressState,
  sentenceId: string
): StoryProgressState {
  if (state.readSentenceIds.includes(sentenceId)) return state;
  return {
    ...state,
    readSentenceIds: [...state.readSentenceIds, sentenceId],
  };
}

export function toggleKnownWord(
  state: StoryProgressState,
  lemmaGroupOrKey: string
): StoryProgressState {
  const key = normalizeCzechToken(lemmaGroupOrKey);
  if (!key) return state;
  const exists = state.knownWords.includes(key);
  return {
    ...state,
    knownWords: exists
      ? state.knownWords.filter((w) => w !== key)
      : [...state.knownWords, key],
  };
}

export function calculateChapterStats(
  chapter: StoryChapter,
  progress: StoryProgressState,
  cards: Pick<VocabCard, 'canonicalId' | 'czechWord'>[],
  glossary: Record<string, StoryGlossaryEntry>
): {
  readCount: number;
  totalSentences: number;
  readPercent: number;
  glossaryCount: number;
  syncedWordsCount: number;
} {
  const readSet = new Set(progress.readSentenceIds);
  const readCount = chapter.sentences.filter((s) => readSet.has(s.id)).length;
  const totalSentences = chapter.sentences.length;
  const readPercent = totalSentences > 0 ? Math.round((readCount / totalSentences) * 100) : 0;
  const chapterGlossary = extractChapterGlossaryItems(chapter, glossary);
  const syncedWordsCount = chapterGlossary.filter((item) =>
    isStoryItemInDeck(item.canonicalId, item.entry.lemma, cards)
  ).length;

  return {
    readCount,
    totalSentences,
    readPercent,
    glossaryCount: chapterGlossary.length,
    syncedWordsCount,
  };
}

export function loadStoryProgress(): StoryProgressState {
  try {
    const raw = localStorage.getItem(STORY_PROGRESS_STORAGE_KEY);
    if (!raw) {
      return { readSentenceIds: [], knownWords: [], lastChapter: 1 };
    }
    const parsed = JSON.parse(raw) as Partial<StoryProgressState>;
    return {
      readSentenceIds: Array.isArray(parsed.readSentenceIds) ? parsed.readSentenceIds : [],
      knownWords: Array.isArray(parsed.knownWords) ? parsed.knownWords : [],
      lastChapter: typeof parsed.lastChapter === 'number' && parsed.lastChapter >= 1 ? parsed.lastChapter : 1,
    };
  } catch {
    return { readSentenceIds: [], knownWords: [], lastChapter: 1 };
  }
}

export function saveStoryProgress(state: StoryProgressState): void {
  try {
    localStorage.setItem(STORY_PROGRESS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}
