import { useState } from 'react';
import { CanonicalFirstLessonView } from './components/CanonicalFirstLessonView';

/**
 * Preview-only render target for Render Static Site.
 * Deliberately imports NO Firebase, paid Gemini/Vertex code, Drive or backend.
 * Its host is different from the existing production app.
 */
export function IphonePreview() {
  const [notice, setNotice] = useState('');

  return (
    <div className="min-h-dvh bg-[#F2F2F7] dark:bg-black text-[#1C1C1E] dark:text-white">
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border-b border-black/[0.08] dark:border-white/[0.12] pt-safe">
        <div className="max-w-3xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-base font-bold">Ahoj Česko</span>
          <span className="rounded-full bg-[#007AFF]/12 text-[#007AFF] dark:text-[#64D2FF] px-3 py-1 text-xs font-semibold">
            iPhone Preview · A0 L01
          </span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 pt-4 pb-[calc(4rem+env(safe-area-inset-bottom))] space-y-4">
        <section className="rounded-2xl border border-[#007AFF]/20 bg-white dark:bg-[#1C1C1E] p-4 space-y-2">
          <h2 className="text-sm font-bold">Эхний хичээлийн туршилтын хувилбар</h2>
          <p className="text-xs text-[#636366] dark:text-[#AEAEB2] leading-relaxed">
            Энэ бол үйлдвэрлэлийн апп биш. Сургалтын эх v0.9.20 · редакцын ноорог. Зөвхөн
            эхний хичээлийн 5 шат, бичгийн оролдлого, төхөөрөмж дээрх микрофоны бичлэг,
            офлайн нөөцлөлт, хадгалалтыг шалгана.
          </p>
          <p className="text-xs text-[#636366] dark:text-[#AEAEB2]">
            Gemini аудио, AI багшийн сервер, Google Drive нэвтрэлт энд идэвхгүй. Төлбөртэй AI хүсэлт илгээхгүй.
          </p>
          <p className="text-[11px] font-mono text-[#8E8E93]">Static Preview • No backend • No source publication</p>
        </section>
        {notice && (
          <div role="status" className="rounded-xl border border-[#007AFF]/20 bg-white dark:bg-[#1C1C1E] p-3 text-sm">
            {notice}
          </div>
        )}
        <CanonicalFirstLessonView
          onLaunchMissionRoleplay={() => setNotice('AI багш зөвхөн тусдаа сервертэй хувилбарт ажиллана. Энэ Preview-д төлбөртэй AI үйлчилгээг зориуд унтраасан.')}
        />
      </main>
    </div>
  );
}
