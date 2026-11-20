import React, { useMemo, useState } from 'react';
import { ArrowRight, ChevronRight, X } from 'lucide-react';
import { L01_WORKING_SOURCE } from '../data/l01WorkingSource';
import { loadL01Progress, reviewedL01Count } from '../utils/l01PracticeProgress';
import type { TutorMode } from '../types/lesson';
import { PremiumBookArtwork } from './PremiumBookArtwork';
import '../premium-home.css';

interface PremiumHomeViewProps {
  onStartMission: () => void;
  onLaunchRoleplay: (mode: TutorMode) => void;
  onOpenStory: () => void;
}

/** The exact Czech alphabet shown as visual reference, not an audio/pronunciation claim. */
const CZECH_ALPHABET = [
  'A','Á','B','C','Č','D','Ď','E','É','Ě','F','G','H','CH','I','Í','J',
  'K','L','M','N','Ň','O','Ó','P','Q','R','Ř','S','Š','T','Ť','U','Ú',
  'Ů','V','W','X','Y','Ý','Z','Ž',
] as const;

const SELECTED_DIACRITICS = [
  { symbol: 'Č', sample: 'čaj', meaning: 'цай' },
  { symbol: 'Š', sample: 'škola', meaning: 'сургууль' },
  { symbol: 'Ř', sample: 'řeka', meaning: 'гол' },
  { symbol: 'Ž', sample: 'žena', meaning: 'эмэгтэй' },
  { symbol: 'Ě', sample: 'město', meaning: 'хот' },
  { symbol: 'Ů', sample: 'dům', meaning: 'байшин' },
] as const;

export const PremiumHomeView: React.FC<PremiumHomeViewProps> = ({
  onStartMission,
  onLaunchRoleplay,
  onOpenStory,
}) => {
  const [slide, setSlide] = useState(0);
  const [alphabetOpen, setAlphabetOpen] = useState(false);
  const progress = useMemo(() => loadL01Progress(), []);
  const reviewed = reviewedL01Count(progress);
  const slides = [
    {
      eyebrow: 'A0',
      badge: 'ХИЧЭЭЛ 01',
      heading: L01_WORKING_SOURCE.titleMn,
      caption: 'Dobrý den. · Jmenuji se …',
      progress: reviewed / L01_WORKING_SOURCE.exercises.length,
      progressLabel: `${reviewed}/${L01_WORKING_SOURCE.exercises.length} дасгал өөрөө шалгасан`,
      button: 'Үе давах',
      action: onStartMission,
    },
    {
      eyebrow: 'AI',
      badge: 'ЯРИАНЫ ДАДЛАГА',
      heading: 'AI багштай чехээр ярилцах',
      caption: 'Өөрийн түвшинд тохирсон ярианы дасгал',
      progress: 0,
      progressLabel: 'Ярианы ахицыг худал оноогоор илэрхийлэхгүй',
      button: 'AI багштай ярилцах',
      action: () => onLaunchRoleplay('coach'),
    },
    {
      eyebrow: 'A0',
      badge: 'УНШЛАГА',
      heading: 'Чех хэлээр уншиж сурах',
      caption: 'Klíč číslo 17 · Интерактив уншлага',
      progress: 0,
      progressLabel: 'Үг болон өгүүлбэрийг тайлбартай унших',
      button: 'Уншиж эхлэх',
      action: onOpenStory,
    },
  ] as const;
  const current = slides[slide];

  return (
    <div className="premium-home" data-testid="premium-home">
      <button
        type="button"
        className="premium-alphabet-card"
        onClick={() => setAlphabetOpen(true)}
        aria-label="Чех цагаан толгойн үсгүүдийг харах"
      >
        <span className="premium-alphabet-symbol" aria-hidden="true">Aa</span>
        <span className="premium-alphabet-copy">
          <strong>Цагаан толгой сурах</strong>
          <span>Чех хэлний үсэг, тэмдэглэгээтэй танилцах</span>
        </span>
        <ChevronRight size={24} strokeWidth={2} aria-hidden="true" />
      </button>

      <div className="premium-hero" aria-hidden="true">
        <div className="premium-hero-wave premium-wave-back" />
        <PremiumBookArtwork className="premium-book-svg" />
        <div className="premium-hero-wave premium-wave-front" />
      </div>

      <section className="premium-current-lesson" aria-label="Сургалтын үндсэн хуудас">
        <div className="premium-lesson-tags">
          <span className="premium-tag-a0">{current.eyebrow}</span>
          <span className="premium-tag-chapter">{current.badge}<ChevronRight size={17} aria-hidden="true"/></span>
        </div>
        <h1 key={slide} className="premium-lesson-title">{current.heading}</h1>
        <p className="premium-lesson-subtitle">{current.caption}</p>
        <p className="premium-lesson-count">{current.progressLabel}</p>
        <div
          className="premium-progress-track"
          role="progressbar"
          aria-valuenow={Math.round(current.progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={current.progressLabel}
        >
          <div className="premium-progress-fill" style={{ width: `${Math.max(0, Math.min(100, current.progress * 100))}%` }} />
        </div>
        <button className="premium-start-btn" type="button" onClick={current.action}>
          <span>{current.button}</span><ArrowRight size={23} strokeWidth={1.8} aria-hidden="true"/>
        </button>
        <div className="premium-dots" role="group" aria-label="Сургалтын карт сонгох">
          {slides.map((item, idx) => (
            <button
              type="button"
              key={item.badge}
              className={idx===slide ? 'premium-dot active' : 'premium-dot'}
              onClick={() => setSlide(idx)}
              aria-label={`${idx+1}-р карт: ${item.heading}`}
              aria-pressed={idx===slide}
            />
          ))}
        </div>
      </section>

      {alphabetOpen && (
        <div className="premium-alphabet-overlay" role="presentation" onMouseDown={(e) => {
          if (e.target===e.currentTarget) setAlphabetOpen(false);
        }}>
          <section className="premium-alphabet-dialog" role="dialog" aria-modal="true" aria-labelledby="czech-alphabet-title">
            <div className="premium-alphabet-dialog-head">
              <div>
                <p className="premium-smallcaps">Чех хэлний эхлэл</p>
                <h2 id="czech-alphabet-title">Česká abeceda</h2>
                <p>Чех цагаан толгойн үсгүүд</p>
              </div>
              <button type="button" className="premium-close" onClick={() => setAlphabetOpen(false)} aria-label="Цагаан толгойн цонхыг хаах"><X size={22}/></button>
            </div>
            <div className="premium-letter-grid">
              {CZECH_ALPHABET.map(letter=> <span key={letter} className="premium-letter">{letter}</span>)}
            </div>
            <p className="premium-alphabet-note">
              <strong>CH</strong> нь Чех хэлний цагаан толгойд тусдаа үсэгт тооцогддог.
              Зөв дуудлагын баталгаажсан аудио бэлэн болоогүй тул энэ хэсэг зөвхөн үсэг танилцуулна.
            </p>
            <div className="premium-diacritics">
              {SELECTED_DIACRITICS.map(item=><div key={item.symbol}>
                <span>{item.symbol}</span><strong>{item.sample}</strong><small>{item.meaning}</small>
              </div>)}
            </div>
            <button type="button" className="premium-primary-small" onClick={() => {setAlphabetOpen(false);onStartMission();}}>
              A0-ийн эхний хичээл рүү орох <ArrowRight size={17}/>
            </button>
          </section>
        </div>
      )}
    </div>
  );
};
