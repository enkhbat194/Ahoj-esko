import React from 'react';
import { BookOpen, GraduationCap, Layers3, Menu } from 'lucide-react';
import { PREMIUM_NAV_LABELS, PREMIUM_NAV_ORDER, type PremiumNavId } from '../utils/premiumNavigation';
import '../premium-home.css';

function PremiumAiGlyph() {
  return (
    <svg viewBox="0 0 64 64" width="47" height="47" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="premium-ai-face" x1="14" y1="12" x2="49" y2="57" gradientUnits="userSpaceOnUse">
          <stop stopColor="#67F4E7"/><stop offset=".54" stopColor="#14736F"/><stop offset="1" stopColor="#064744"/>
        </linearGradient>
      </defs>
      <path d="M31.5 10.5V17" stroke="#E5D8AF" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="31.5" cy="8.5" r="3" fill="#FDE0A2" />
      <rect x="11" y="18" width="42" height="35" rx="16" fill="#07343B" stroke="#85F9EB" strokeWidth="1.9"/>
      <rect x="15.5" y="21.7" width="33" height="27.5" rx="11.5" fill="url(#premium-ai-face)" stroke="#B4FFEA" strokeOpacity=".7"/>
      <rect x="6" y="29" width="7" height="14" rx="3.5" fill="#127A7A" stroke="#76E3D9" strokeWidth="1.2"/>
      <rect x="51" y="29" width="7" height="14" rx="3.5" fill="#127A7A" stroke="#76E3D9" strokeWidth="1.2"/>
      <ellipse cx="25" cy="34.5" rx="3.7" ry="4.5" fill="#E2FFFB"/>
      <ellipse cx="39" cy="34.5" rx="3.7" ry="4.5" fill="#E2FFFB"/>
      <path d="M26 44C28 46.8 35.5 46.8 38 44" stroke="#E3FAF3" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

const icons: Record<Exclude<PremiumNavId, 'ai'>, typeof BookOpen> = {
  home: GraduationCap,
  read: BookOpen,
  cards: Layers3,
  menu: Menu,
};

export const PremiumBottomNav: React.FC<{
  selected: PremiumNavId | null;
  onNavigate: (id: PremiumNavId) => void;
}> = ({ selected, onNavigate }) => (
  <nav aria-label="Доод үндсэн цэс" className="premium-dock">
    <div className="premium-dock-grid">
      {PREMIUM_NAV_ORDER.map((id) => {
        const active = selected === id;
        if (id === 'ai') {
          return (
            <button
              key={id}
              className={`premium-dock-button premium-ai-button ${active ? 'active' : ''}`}
              type="button"
              onClick={() => onNavigate(id)}
              aria-label="AI багштай ярилцах"
              aria-current={active ? 'page' : undefined}
            >
              <span className="premium-ai-orb">
                <PremiumAiGlyph />
              </span>
              <span className="premium-ai-label">AI</span>
            </button>
          );
        }
        const Icon = icons[id];
        return (
          <button
            key={id}
            className={`premium-dock-button ${active ? 'active' : ''}`}
            type="button"
            onClick={() => onNavigate(id)}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={23} strokeWidth={1.65} aria-hidden="true" />
            <span>{PREMIUM_NAV_LABELS[id]}</span>
          </button>
        );
      })}
    </div>
  </nav>
);
