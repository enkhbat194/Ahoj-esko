import React, { useEffect, useRef, useState } from 'react';
import { Bot, LoaderCircle, Sparkles } from 'lucide-react';

interface ReadingAiHelpProps {
  word: string;
  sentenceCs: string;
  sentenceMn: string;
  knownLemma?: string;
  knownMeaningMn?: string;
}

interface ReadingHelpResult {
  lemma: string;
  contextMeaningMn: string;
  grammarMn: string;
  explanationMn: string;
  exampleCs: string;
  exampleMn: string;
  uncertaintyMn: string;
}

/** Reader-only context explainer. Gemini credentials are never sent to the browser. */
export const ReadingAiHelp: React.FC<ReadingAiHelpProps> = ({
  word,
  sentenceCs,
  sentenceMn,
  knownLemma,
  knownMeaningMn,
}) => {
  const [answer, setAnswer] = useState<ReadingHelpResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    requestRef.current?.abort();
    setAnswer(null);
    setError('');
    setLoading(false);
    return () => requestRef.current?.abort();
  }, [word, sentenceCs, sentenceMn, knownLemma, knownMeaningMn]);

  const explain = async () => {
    requestRef.current?.abort();
    const request = new AbortController();
    requestRef.current = request;
    setLoading(true);
    setError('');
    setAnswer(null);
    try {
      const response = await fetch('/api/ai/reading-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: request.signal,
        body: JSON.stringify({
          word,
          sentenceCs,
          sentenceMn,
          knownLemma,
          knownMeaningMn,
        }),
      });
      const data = (await response.json()) as Partial<ReadingHelpResult> & { error?: string };
      if (!response.ok || data.error) {
        throw new Error(data.error || 'AI тайлбарыг ачаалж чадсангүй.');
      }
      if (requestRef.current !== request) return;
      setAnswer({
        lemma: data.lemma || '',
        contextMeaningMn: data.contextMeaningMn || '',
        grammarMn: data.grammarMn || '',
        explanationMn: data.explanationMn || '',
        exampleCs: data.exampleCs || '',
        exampleMn: data.exampleMn || '',
        uncertaintyMn: data.uncertaintyMn || '',
      });
    } catch (err) {
      if (request.signal.aborted || requestRef.current !== request) return;
      setError(err instanceof Error ? err.message : 'AI тайлбар одоогоор боломжгүй.');
    } finally {
      if (requestRef.current === request) setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#D96C2E]/35 bg-gradient-to-br from-[#D96C2E]/10 to-transparent p-3.5 space-y-3" aria-label="Чех үгийн AI тайлбар">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2">
          <Bot className="h-4 w-4 text-[#F09552]" aria-hidden="true" />
          <span className="text-sm font-semibold text-[#1C1C1E] dark:text-white">
            Уншлагын AI туслах
          </span>
        </div>
        <span className="text-[10px] font-semibold text-[#8E8E93]">Шалгах шаардлагатай AI тайлбар</span>
      </div>

      <button
        type="button"
        onClick={() => void explain()}
        disabled={loading}
        className="min-h-[44px] rounded-xl bg-[#D96C2E] px-4 py-2 text-sm font-bold text-white inline-flex items-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-transform"
      >
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
        {loading ? 'Тайлбарлаж байна…' : answer ? 'Дахин тайлбарлуулах' : 'Энэ үгийг AI-аар тайлбарлуулах'}
      </button>

      <div aria-live="polite">
        {error && <p role="alert" className="text-sm text-[#D96C2E]">{error}</p>}
        {answer && (
          <div className="space-y-2.5 rounded-xl bg-white/80 dark:bg-[#1C1C1E] p-3 text-sm leading-relaxed text-[#1C1C1E] dark:text-[#EBEBF5]">
            <p><span className="text-[#8E8E93]">Энэ өгүүлбэрийн утга:</span> <strong>{answer.contextMeaningMn || 'Тодорхойгүй'}</strong></p>
            {answer.lemma && <p><span className="text-[#8E8E93]">Үндсэн хэлбэр:</span> {answer.lemma}</p>}
            {answer.grammarMn && <p><span className="text-[#8E8E93]">Хэлзүй:</span> {answer.grammarMn}</p>}
            {answer.explanationMn && <p>{answer.explanationMn}</p>}
            {answer.exampleCs && (
              <div className="rounded-lg bg-[#D96C2E]/10 p-2.5">
                <p lang="cs" className="font-medium">{answer.exampleCs}</p>
                {answer.exampleMn && <p className="mt-1 text-[#8E8E93]">{answer.exampleMn}</p>}
              </div>
            )}
            {answer.uncertaintyMn && <p className="text-xs text-[#C17B3E]">Анхаарах: {answer.uncertaintyMn}</p>}
            <p className="text-[11px] text-[#8E8E93]">
              Энэ нь баталгаажсан толь, дуудлагын оноо биш. Хичээлийн эх өгөгдлийг өөрчлөхгүй.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
