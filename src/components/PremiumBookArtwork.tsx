import React from 'react';

/**
 * Ahoj Česko original illustrated open-book hero.
 * Self-contained SVG: no stock imagery, network dependency, or copied third-party asset.
 * The design follows the user's teal/gold atmosphere, not the source app's content.
 */
export const PremiumBookArtwork: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    viewBox="0 0 840 620"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Алтан гэрэлтэй, маргад ногоон хавтастай дэлгээтэй ном"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <radialGradient id="book-backlight" cx="0" cy="0" r="1" gradientTransform="translate(428 329) rotate(90) scale(283 427)" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0D726C" stopOpacity=".56"/><stop offset=".52" stopColor="#063E3F" stopOpacity=".19"/>
        <stop offset="1" stopColor="#031718" stopOpacity="0"/>
      </radialGradient>
      <linearGradient id="book-pageleft" x1="166" y1="280" x2="430" y2="490" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F9D593"/><stop offset=".16" stopColor="#E4AF61"/>
        <stop offset=".55" stopColor="#4B2D20"/><stop offset=".92" stopColor="#D6A45F"/><stop offset="1" stopColor="#FFF0C3"/>
      </linearGradient>
      <linearGradient id="book-pageright" x1="447" y1="480" x2="722" y2="245" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFF2B7"/><stop offset=".13" stopColor="#C5893E"/>
        <stop offset=".53" stopColor="#F5DB9E"/><stop offset=".85" stopColor="#9D6433"/><stop offset="1" stopColor="#FDE1A0"/>
      </linearGradient>
      <linearGradient id="book-leftcover" x1="251" y1="176" x2="429" y2="471" gradientUnits="userSpaceOnUse">
        <stop stopColor="#195955"/><stop offset=".34" stopColor="#0A3A3A"/><stop offset=".78" stopColor="#041D22"/>
        <stop offset="1" stopColor="#0A5552"/>
      </linearGradient>
      <linearGradient id="book-rightcover" x1="488" y1="259" x2="673" y2="484" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2F7770"/><stop offset=".35" stopColor="#0D5150"/><stop offset=".84" stopColor="#052B30"/>
        <stop offset="1" stopColor="#14766C"/>
      </linearGradient>
      <linearGradient id="book-gold" x1="253" y1="147" x2="690" y2="489" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFF2B8"/><stop offset=".21" stopColor="#C8812B"/>
        <stop offset=".43" stopColor="#FBE3A4"/><stop offset=".7" stopColor="#D99C43"/>
        <stop offset="1" stopColor="#FFECC7"/>
      </linearGradient>
      <linearGradient id="book-orbit" x1="144" y1="428" x2="730" y2="248" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F6B64B" stopOpacity="0"/><stop offset=".19" stopColor="#F9CD74"/>
        <stop offset=".51" stopColor="#FFDDA2"/><stop offset=".8" stopColor="#BD7737" stopOpacity=".6"/>
        <stop offset="1" stopColor="#FFF0BE"/>
      </linearGradient>
      <linearGradient id="book-goldtext" x1="332" y1="270" x2="544" y2="408" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FEF1C0"/><stop offset=".39" stopColor="#D89541"/><stop offset=".72" stopColor="#FFEDB7"/>
        <stop offset="1" stopColor="#B66B26"/>
      </linearGradient>
      <filter id="book-drop" x="-30%" y="-35%" width="160%" height="180%">
        <feGaussianBlur stdDeviation="22"/>
      </filter>
      <filter id="book-glimmer" x="-70%" y="-70%" width="240%" height="240%">
        <feGaussianBlur stdDeviation="7"/>
      </filter>
      <filter id="book-softglow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.5"/>
      </filter>
    </defs>
    <ellipse cx="425" cy="353" rx="398" ry="270" fill="url(#book-backlight)"/>
    {/* Organic turquoise ribbons frame the art without copying another app's character. */}
    <path d="M-70 365 C139 206 153 363 337 152 C463 15 620 59 854 178 L854 241 C660 133 513 97 386 217 C214 379 106 287 -70 443Z" fill="#0D7372" opacity=".14"/>
    <path d="M-82 488 C155 363 286 600 437 519 C591 435 652 381 899 344 L899 489 C705 447 618 580 447 570 C254 558 160 446 -82 560Z" fill="#15B6AE" opacity=".08"/>
    <path d="M-42 520 C138 406 254 563 416 550 C580 534 654 414 861 437" stroke="#27C2B1" strokeOpacity=".28" strokeWidth="2"/>
    <ellipse cx="453" cy="475" rx="313" ry="42" fill="#000D11" opacity=".75" filter="url(#book-drop)"/>
    <path d="M131 434 C244 409 361 463 455 489 C572 451 652 419 769 439" stroke="#FBC36A" strokeOpacity=".27" strokeWidth="21" filter="url(#book-glimmer)"/>
    {/* Gilded covers and physical page stacks */}
    <path d="M137 419 C233 392 369 446 459 473 C552 415 676 400 773 413 L755 454 C646 443 542 477 462 503 C349 471 250 452 130 456Z" fill="#241C19" stroke="url(#book-gold)" strokeWidth="3"/>
    <path d="M148 408 C192 259 216 226 248 186 C327 209 412 333 462 468 C366 433 277 383 148 408Z" fill="url(#book-pageleft)" stroke="#F4CE8C" strokeWidth="3"/>
    <path d="M462 470 C501 360 598 276 727 259 C756 290 767 365 766 410 C643 396 557 428 462 470Z" fill="url(#book-pageright)" stroke="#F9D79C" strokeWidth="3"/>
    {Array.from({length:7},(_,i)=>(
      <path key={'l'+i} d={`M${160+i*4} ${408-i*10} C${245+i*2} ${384-i*9} ${378+i*2} ${435-i*2} 460 470`}
        stroke={i%2?"#FFF1C5":"#8B5028"} strokeWidth=".9" strokeOpacity=".48"/>
    ))}
    {Array.from({length:7},(_,i)=>(
      <path key={'r'+i} d={`M463 ${474-i*2} C${546+i*2} ${435-i*9} ${659+i*3} ${399-i*9} ${759-i*2} ${411-i*9}`}
        stroke={i%2?"#FFF1C5":"#7F4B2E"} strokeWidth=".85" strokeOpacity=".48"/>
    ))}
    <path d="M220 217 C300 245 380 337 459 469 C371 433 290 401 168 403 C180 347 196 271 220 217Z" fill="url(#book-leftcover)" stroke="url(#book-gold)" strokeWidth="3.2"/>
    <path d="M459 469 C513 355 589 305 728 274 C753 323 752 379 756 406 C632 401 536 433 459 469Z" fill="url(#book-rightcover)" stroke="url(#book-gold)" strokeWidth="3.2"/>
    {/* Embossed page rules */}
    <path d="M240 250 C314 277 373 353 436 442 C365 409 287 380 197 383" stroke="#CDA167" strokeOpacity=".5" strokeWidth="1.3"/>
    <path d="M257 269 C319 305 362 359 412 424 C346 398 273 371 211 372" stroke="#BEA16D" strokeOpacity=".3" strokeWidth=".9"/>
    <path d="M492 435 C548 345 618 324 717 304 L737 386 C641 378 553 414 492 435Z" stroke="#DCAB68" strokeOpacity=".53" strokeWidth="1.3"/>
    <path d="M515 420 C581 348 631 330 702 316" stroke="#D4A56A" strokeOpacity=".36" strokeWidth="1"/>
    {/* Page headings, original vector typography */}
    <g className="premium-book-letter-marks">
      <text x="316" y="358" fill="url(#book-goldtext)" fontFamily="Georgia, 'Times New Roman', serif" fontSize="120" fontWeight="400" transform="rotate(12 316 358)">A</text>
      <text x="583" y="390" fill="url(#book-goldtext)" fontFamily="Georgia, 'Times New Roman', serif" fontSize="136" fontStyle="italic">a</text>
    </g>
    <path d="M457 471 Q463 489 473 482" stroke="#FFE8AE" strokeWidth="5" strokeLinecap="round"/>
    <path d="M147 433 C269 412 375 463 460 485 C565 447 675 414 764 432" stroke="#EFCB81" strokeWidth="3" strokeLinecap="round"/>
    {/* Orbiting light wraps across the book */}
    <ellipse cx="449" cy="357" rx="328" ry="118" transform="rotate(-19 449 357)" stroke="url(#book-orbit)" strokeWidth="2.2" strokeOpacity=".87"/>
    <ellipse cx="449" cy="357" rx="328" ry="118" transform="rotate(-19 449 357)" stroke="url(#book-gold)" strokeWidth="7" strokeOpacity=".16" filter="url(#book-glimmer)"/>
    <circle cx="698" cy="270" r="10" fill="#FFE4A0" filter="url(#book-glimmer)"/>
    <circle cx="698" cy="270" r="4" fill="#FFF5D0"/>
    <circle cx="165" cy="457" r="10" fill="#FFC46B" filter="url(#book-glimmer)"/>
    <circle cx="165" cy="457" r="3.5" fill="#FFF0C0"/>
    <path d="M697 251 V289 M679 270 H717 M165 442 V472 M150 457 H180" stroke="#FFE6A2" strokeOpacity=".78" strokeWidth="1.2"/>
    <ellipse cx="453" cy="507" rx="175" ry="4.5" fill="#FFC16F" opacity=".9" filter="url(#book-glimmer)"/>
    <ellipse cx="453" cy="509" rx="93" ry="1.5" fill="#FFE4AE" opacity=".73"/>
  </svg>
);
