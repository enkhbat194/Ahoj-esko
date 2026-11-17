import type { ContentQaStatus, CzechNounGender, LearnerSelfForm, VocabCard } from '../types/lesson';

export const LEARNER_GENDER_STORAGE_KEY = 'ahoj_cesko_learner_gender_v1';

export interface GenderVisualSpec {
  id: CzechNounGender;
  labelMn: string;
  shortLabel: string;
  hex: string;
  badgeClass: string;
  textClass: string;
}

export const CZECH_GENDER_COLORS: Record<CzechNounGender, GenderVisualSpec> = {
  masculine_animate: {
    id: 'masculine_animate',
    labelMn: 'Амьтай эр хүйс',
    shortLabel: 'Эр (амьтай)',
    hex: '#3B82F6',
    badgeClass: 'bg-[#3B82F6]/12 text-[#1D4ED8] dark:text-[#60A5FA]',
    textClass: 'text-[#1D4ED8] dark:text-[#60A5FA]',
  },
  masculine_inanimate: {
    id: 'masculine_inanimate',
    labelMn: 'Амьгүй эр хүйс',
    shortLabel: 'Эр (амьгүй)',
    hex: '#06B6D4',
    badgeClass: 'bg-[#06B6D4]/12 text-[#0E7490] dark:text-[#22D3EE]',
    textClass: 'text-[#0E7490] dark:text-[#22D3EE]',
  },
  feminine: {
    id: 'feminine',
    labelMn: 'Эм хүйс',
    shortLabel: 'Эм',
    hex: '#F43F5E',
    badgeClass: 'bg-[#F43F5E]/12 text-[#BE123C] dark:text-[#FB7185]',
    textClass: 'text-[#BE123C] dark:text-[#FB7185]',
  },
  neuter: {
    id: 'neuter',
    labelMn: 'Саармаг хүйс',
    shortLabel: 'Саармаг',
    hex: '#10B981',
    badgeClass: 'bg-[#10B981]/12 text-[#047857] dark:text-[#34D399]',
    textClass: 'text-[#047857] dark:text-[#34D399]',
  },
};

export interface CuratedGenderExpression {
  id: string;
  meaningMn: string;
  agreementType: 'invariant' | 'learner_self';
  subject: 'none' | 'learner';
  fixed?: string;
  variants?: {
    masculine: string;
    feminine: string;
  };
  qaStatus: ContentQaStatus;
}

/**
 * Resolves Czech text strictly from curated pre-authored forms per AHOJ_GENDER_RULES_v0_2.
 * Never fabricates Czech morphological endings using regex/string mutation, and never alters
 * invariant or character persona dialogue lines based on learner gender.
 */
export function resolveCuratedCzechForm(
  expr: {
    agreementType: 'invariant' | 'learner_self' | 'character_self';
    fixed?: string;
    variants?: { masculine: string; feminine: string };
    personaGender?: LearnerSelfForm;
  },
  learnerGender: LearnerSelfForm
): string {
  if (expr.agreementType === 'learner_self') {
    if (expr.variants) {
      return expr.variants[learnerGender] || expr.variants.masculine;
    }
    return expr.fixed ?? '';
  }

  if (expr.agreementType === 'character_self') {
    if (expr.variants && expr.personaGender) {
      return expr.variants[expr.personaGender] || expr.variants.masculine;
    }
    return expr.fixed ?? '';
  }

  return expr.fixed ?? '';
}

export function resolveCardDisplayCzech(card: VocabCard, learnerGender: LearnerSelfForm): string {
  if (card.selfFormVariants) {
    return card.selfFormVariants[learnerGender];
  }
  return card.czechWord;
}

export function getQaStatusLabelMn(status?: ContentQaStatus): string {
  if (status === 'native_approved') return 'Баталгаажсан';
  if (status === 'qa_review') return 'Хянагдаж буй';
  return 'Ноорог · QA хүлээгдэж буй';
}

export function loadStoredLearnerGender(): LearnerSelfForm {
  try {
    const raw = localStorage.getItem(LEARNER_GENDER_STORAGE_KEY);
    if (raw === 'feminine' || raw === 'masculine') return raw;
  } catch {
    // Ignore storage access errors
  }
  return 'masculine';
}

export function saveStoredLearnerGender(gender: LearnerSelfForm): void {
  try {
    localStorage.setItem(LEARNER_GENDER_STORAGE_KEY, gender);
  } catch {
    // Ignore storage quota errors
  }
}
