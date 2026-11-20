import type { ActiveTab, LearnSubTab } from '../types/lesson';

export type PremiumNavId = 'home' | 'read' | 'ai' | 'cards' | 'menu';

export const PREMIUM_NAV_ORDER: readonly PremiumNavId[] = [
  'home', 'read', 'ai', 'cards', 'menu',
] as const;

export const PREMIUM_NAV_LABELS: Record<PremiumNavId, string> = {
  home: 'Үе давах',
  read: 'Унших',
  ai: 'AI',
  cards: 'Карт',
  menu: 'Цэс',
};

export function premiumNavTarget(id: PremiumNavId): {
  activeTab: ActiveTab;
  learnSubTab?: LearnSubTab;
} {
  switch (id) {
    case 'home': return { activeTab: 'today' };
    case 'read': return { activeTab: 'story' };
    case 'ai': return { activeTab: 'learn', learnSubTab: 'ai' };
    case 'cards': return { activeTab: 'review' };
    case 'menu': return { activeTab: 'profile' };
  }
}

export function premiumNavSelected(activeTab: ActiveTab, learnSubTab: LearnSubTab): PremiumNavId | null {
  switch (activeTab) {
    case 'today': return 'home';
    case 'story': return 'read';
    case 'review': return 'cards';
    case 'profile': return 'menu';
    case 'learn': return learnSubTab === 'ai' ? 'ai' : 'home';
  }
}
