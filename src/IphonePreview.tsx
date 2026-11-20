import { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Bot, Menu as MenuIcon } from 'lucide-react';
import { CanonicalFirstLessonView } from './components/CanonicalFirstLessonView';
import { PremiumBottomNav } from './components/PremiumBottomNav';
import { PremiumHomeView } from './components/PremiumHomeView';
import { CzechAlphabetCourseView } from './components/CzechAlphabetCourseView';
import { getAlphabetContinueTarget, loadAlphabetProgress } from './utils/alphabetProgress';
import { L01_WORKING_SOURCE } from './data/l01WorkingSource';
import { KLIC17_CHAPTERS } from './data/klic17Story';
import type { PremiumNavId } from './utils/premiumNavigation';

type PreviewView = 'home' | 'alphabet_overview' | 'alphabet_resume' | 'lesson' | 'read' | 'ai' | 'cards' | 'menu';

const panel = 'rounded-3xl border border-[#B28A54]/40 bg-[#092B2D] p-4 space-y-3 shadow-xl';
const secondary = 'text-sm text-[#AAC4BC]';
const navButton = 'min-h-[43px] inline-flex items-center gap-2 rounded-xl border border-[#C59D64]/55 px-4 text-sm text-[#F6D9A1]';

export function IphonePreview() {
  const [view, setView] = useState<PreviewView>('home');
  const [flipped, setFlipped] = useState<string[]>([]);
  const [notice, setNotice] = useState('');

  const openAi = () => {
    setView('ai');
    setNotice('Энэ нь төлбөргүй Static Preview (зөвхөн дэлгэцийн туршилт). AI багшийн API үйлчилгээ энд холбогдоогүй; жинхэнэ AI багшийн код үндсэн аппд тусдаа бий.');
  };

  const navigate = (id: PremiumNavId) => {
    if (id === 'ai') openAi();
    else setView(({home:'home',read:'read',cards:'cards',menu:'menu'} as const)[id]);
  };

  const selected: PremiumNavId =
    view === 'lesson' || view === 'home' || view === 'alphabet_overview' || view === 'alphabet_resume' ? 'home' :
    view === 'read' ? 'read' : view === 'cards' ? 'cards' : view === 'ai' ? 'ai' : 'menu';

  return (
    <div className="premium-app-surface min-h-dvh text-[#F8F1E4] flex flex-col">
      <header className="premium-minimal-header" aria-label="Дээд цэс">
        <button type="button" className="premium-menu-trigger" aria-label="Цэс нээх"
          onClick={() => setView('menu')}>
          <MenuIcon size={22} strokeWidth={1.8}/>
        </button>
      </header>

      <main className="relative flex-1 w-full max-w-3xl mx-auto px-3 sm:px-6 pb-[calc(100px+env(safe-area-inset-bottom))]">
        {view === 'home' && (
          <PremiumHomeView
            onOpenAlphabet={() => setView('alphabet_overview')}
            onContinueCourse={() => {
              const target = getAlphabetContinueTarget(loadAlphabetProgress());
              setView(target ? 'alphabet_resume' : 'lesson');
            }}
          />
        )}

        {(view === 'alphabet_overview' || view === 'alphabet_resume') && (
          <CzechAlphabetCourseView key={view}
            startAt={view === 'alphabet_resume' ? 'resume' : 'overview'}
            onExit={() => setView('home')}
            onContinueAfterAlphabet={() => setView('lesson')}
          />
        )}

        {view !== 'home' && view !== 'alphabet_overview' && view !== 'alphabet_resume' && (
          <div className="pt-2 space-y-4">
            <button type="button" className={navButton} onClick={() => setView('home')}>
              <ArrowLeft className="w-4 h-4" /> Нүүр рүү
            </button>

            {view === 'lesson' && (
              <div className="rounded-2xl bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white p-2 sm:p-4">
                <CanonicalFirstLessonView onLaunchMissionRoleplay={openAi} />
              </div>
            )}

            {view === 'read' && (
              <section className={panel}>
                <div className="text-[#EAC381] text-[11px] tracking-widest">УНШИХ · НООРОГ</div>
                <h1 className="text-2xl font-semibold font-serif">Klíč číslo 17</h1>
                <p className={secondary}>Унших туршилт. Үг, өгүүлбэрийн баталгаажаагүй эхийг нийтэлсэн хичээл гэж үзэхгүй.</p>
                <div className="space-y-3 pt-2">
                  {KLIC17_CHAPTERS[0]?.sentences.slice(0, 9).map((line) => (
                    <div key={line.id} className="rounded-xl border border-white/10 bg-[#062024] p-3 space-y-1">
                      <p className="text-[#F4EBDD] font-semibold">{line.cs}</p>
                      <p className="text-xs text-[#9CB6B1]">{line.mn}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {view === 'ai' && (
              <section className={panel}>
                <div className="mx-auto w-20 h-20 grid place-items-center rounded-full border border-[#3EE2CB]/60 bg-[#0D4446] shadow-[0_0_26px_#2DDACB3B]">
                  <Bot size={44} color="#8CFCE5" strokeWidth={1.5}/>
                </div>
                <h1 className="text-center text-2xl font-serif">AI багш</h1>
                <p role="status" className={secondary}>{notice || 'Энэ туршилтын Static Preview нь AI багшийн серверийг ачаалахгүй.'}</p>
                <p className={secondary}>
                  GitHub-ийн үндсэн `main` аппд AI багшийн интерфейс, бодит ярианы API холболтын код хэвээр байна.
                  Энэ тусгаарлагдсан хувилбар дээр ямар нэгэн AI дуудлага, төлбөр үүсгэхгүй.
                </p>
                <button className={navButton} type="button" onClick={() => setView('lesson')}>
                  Эхний хичээлийг үзэх <ArrowRight className="w-4 h-4"/>
                </button>
              </section>
            )}

            {view === 'cards' && (
              <section className={panel}>
                <div className="text-[#EAC381] text-[11px] tracking-widest">ХЭЛЛЭГИЙН КАРТ · НООРОГ</div>
                <h1 className="text-2xl font-serif">А0 · Эхний 6 хэллэг</h1>
                <p className={secondary}>Карт дээр дарж Монгол утгыг нээ. Энэ бол iPhone Preview-ийн хувийн туршилт, албан оноо биш.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {L01_WORKING_SOURCE.phrases.map(p => {
                    const open = flipped.includes(p.id);
                    return <button type="button" key={p.id} aria-expanded={open}
                      onClick={() => setFlipped(list => list.includes(p.id)?list.filter(x=>x!==p.id):[...list,p.id])}
                      className="min-h-[117px] text-left rounded-2xl border border-[#C49B65]/30 bg-[#052226] p-4 space-y-2">
                      <p className="text-lg font-semibold text-[#FFE8BA]">{p.cs}</p>
                      {open && <p className="text-sm text-[#B5D0C6]">{p.mn}</p>}
                      <span className="text-[10px] text-[#83A8A1]">{open?'Утгыг нуух':'Утгыг харах'}</span>
                    </button>;
                  })}
                </div>
              </section>
            )}

            {view === 'menu' && (
              <section className={panel}>
                <h1 className="text-2xl font-serif">Цэс</h1>
                <p className={secondary}>Ahoj Česko · iPhone загварын туршилт</p>
                <p className={secondary}>Сургалтын эх: v0.9.20. Зөвхөн хяналтын/ноорог өгөгдөл. Бүрэн 72 хичээлийг энд идэвхжүүлээгүй.</p>
                <div className="grid gap-2">
                  <button type="button" className={navButton} onClick={() => setView('alphabet_overview')}>
                    <BookOpen className="w-4 h-4"/> Чех цагаан толгой · 42 үсэг
                  </button>
                  <button type="button" className={navButton} onClick={() => setView('lesson')}>
                    <BookOpen className="w-4 h-4"/> A0 · Мэндчилгээний хичээл
                  </button>
                  <button type="button" className={navButton} onClick={() => setView('read')}>Унших хэсэг</button>
                  <button type="button" className={navButton} onClick={() => setView('cards')}>Хэллэгийн карт</button>
                </div>
                <p className="text-xs text-[#7F9D99]">Микрофоны түр бичлэг зөвхөн хичээлийн дэлгэц дээр ажиллана. Gemini TTS, AI API, Firebase болон Google Drive холболт энэ Preview-д идэвхгүй.</p>
              </section>
            )}
          </div>
        )}
      </main>

      <PremiumBottomNav selected={selected} onNavigate={navigate}/>
    </div>
  );
}
