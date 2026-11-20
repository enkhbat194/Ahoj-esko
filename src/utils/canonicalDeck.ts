import type { VocabCard } from '../types/lesson';

export type CanonicalCardInput = Omit<VocabCard, 'id' | 'audioIds' | 'mastered' | 'practiceCount'>;

export interface CanonicalImportOptions {
  // The 72-lesson curriculum can intentionally reuse identical phrases across
  // lessons while keeping distinct source IDs and exercise progress.
  preserveDistinctCanonicalIds?: boolean;
}

/** Keep Czech diacritics; punctuation/meaning/context must not be discarded. */
export function canonicalCardFingerprint(card: Pick<VocabCard, 'czechWord' | 'mongolianWord'>): string {
  const normalize = (value: string) => value.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  return JSON.stringify([normalize(card.czechWord), normalize(card.mongolianWord)]);
}

/**
 * Legacy `canonicalId`s are not globally safe across curriculum versions.
 * Never attach a new meaning to an existing ID (and hence to existing SRS/audio).
 * Distinct Mongolian meanings remain separate even for identical Czech strings.
 */
export function selectCanonicalCardsToAdd(
  existing: VocabCard[],
  incoming: CanonicalCardInput[],
  timestamp: number,
  options: CanonicalImportOptions = {},
): { additions: VocabCard[]; conflictingIds: string[] } {
  const byId = new Map(existing.filter(c => c.canonicalId).map(c => [c.canonicalId!, canonicalCardFingerprint(c)]));
  const fingerprints = new Set(existing.map(canonicalCardFingerprint));
  const conflictingIds: string[] = [];
  const additions: VocabCard[] = [];

  incoming.forEach((item, index) => {
    const fingerprint = canonicalCardFingerprint(item);
    const id = item.canonicalId?.trim();
    if (id && byId.has(id)) {
      if (byId.get(id) !== fingerprint) conflictingIds.push(id);
      return;
    }
    if (fingerprints.has(fingerprint) && !(options.preserveDistinctCanonicalIds && id)) return;
    const card: VocabCard = {
      ...item,
      id: `canonical-${id ?? 'unlinked'}-${timestamp}-${index}`,
      audioIds: {},
      mastered: false,
      practiceCount: 0,
    };
    additions.push(card);
    fingerprints.add(fingerprint);
    if (id) byId.set(id, fingerprint);
  });

  return { additions, conflictingIds: [...new Set(conflictingIds)] };
}
