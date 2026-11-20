import React, { useState } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { L01_WORKING_SOURCE } from '../data/l01WorkingSource';
import { PremiumBookArtwork } from './PremiumBookArtwork';
import { alphabetSeenCount, loadAlphabetProgress } from '../utils/alphabetProgress';
import '../premium-home.css';

interface PremiumHomeViewProps {
  onOpenAlphabet: () => void;
  onContinueCourse: () => void;
}

const BOOK_INTRO_SESSION_KEY = 'ahoj_book_intro_viewed_v1';

export const PremiumHomeView: React.FC<PremiumHomeViewProps> = ({
  onOpenAlphabet, onContinueCourse,
}) => {
  const [playIntro] = useState(() => {
    try {
      if (sessionStorage.getItem(BOOK_INTRO_SESSION_KEY) === '1') return false;
      sessionStorage.setItem(BOOK_INTRO_SESSION_KEY, '1');
      return true;
    } catch {
      return true;
    }
  });
  const [progress] = useState(loadAlphabetProgress);
  const seen = alphabetSeenCount(progress);
  const alphabetDone = seen === 42;
  const heading = alphabetDone ? L01_WORKING_SOURCE.titleMn : 'Чех цагаан толгой';
  const caption = alphabetDone
    ? 'Dobrý den. · Jmenuji se …'
    : '42 үсэг · CH, Č, Š, Ř, Ž, Ě, Ů';
  const countLabel = alphabetDone
    ? 'Цагаан толгойн харааны дасгал 42/42'
    : `${seen}/42 үсгийн харааны ба бичгийн дасгалыг үзсэн`;

  return (
    <div className={`premium-home ${playIntro ? 'premium-home--intro' : ''}`}
      data-testid="premium-home">
      <button type="button" className="premium-alphabet-card"
        onClick={onOpenAlphabet} aria-label="Чех цагаан толгойн үсэг сонгох, давтах">
        <span className="premium-alphabet-symbol" aria-hidden="true">Aa</span>
        <span className="premium-alphabet-copy">
          <strong>Цагаан толгой сурах</strong>
          <span>{seen}/42 үзсэн · Үзсэн, үзээгүй үсгээ сонго</span>
        </span>
        <ChevronRight size={24} strokeWidth={2} aria-hidden="true"/>
      </button>

      <div className="premium-hero" aria-hidden="true">
        <PremiumBookArtwork className="premium-book-svg" />
      </div>

      <section className="premium-current-lesson" aria-label="Үе давах сургалт">
        <div className="premium-lesson-tags">
          <span className="premium-tag-a0">A0</span>
          <span className="premium-tag-chapter">{alphabetDone?'БҮЛЭГ 01 · МЭНДЧИЛГЭЭ':'БҮЛЭГ 00 · ҮСЭГ'}
            <ChevronRight size={17} aria-hidden="true"/></span>
        </div>
        <h1 className="premium-lesson-title">{heading}</h1>
        <p className="premium-lesson-subtitle">{caption}</p>
        <p className="premium-lesson-count">{countLabel}</p>
        <div className="premium-progress-track" role="progressbar"
          aria-valuenow={seen} aria-valuemin={0} aria-valuemax={42}
          aria-label={countLabel}>
          <div className="premium-progress-fill" style={{width:`${100*seen/42}%`}}/>
        </div>
        <button type="button" className="premium-start-btn" onClick={onContinueCourse}>
          <span>Үе давах</span><ArrowRight size={23} strokeWidth={1.8} aria-hidden="true"/>
        </button>
        <p className="premium-home-footnote">
          {alphabetDone
            ? 'Дараагийн бүлэг: мэндлэх, нэрээ хэлэх, нэр асуух.'
            : 'Сүүлд үзсэн үсгийн дуусаагүй алхмаас автоматаар үргэлжилнэ.'}
        </p>
      </section>
    </div>
  );
};
