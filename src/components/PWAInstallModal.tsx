import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Download, Share, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallControlsProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallControlsProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be restricted in some browsers
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        {isInstallable && (
          <button
            type="button"
            onClick={() => void install()}
            className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-full bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Суулгах</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          aria-label="iPhone дээр суулгах заавар"
          className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            isInstallable
              ? 'border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white'
              : 'bg-[#007AFF] dark:bg-[#0A84FF] text-white hover:opacity-90'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{compact ? 'iPhone-д суулгах' : 'iPhone-д суулгах'}</span>
        </button>
      </div>

      {showIOSGuide &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#1C1C1E] p-6 shadow-xl border border-black/[0.06] dark:border-white/[0.1] max-h-[90vh] overflow-y-auto">
              <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" aria-hidden="true" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="ios-install-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    iPhone дээр апп болгон суулгах
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Энэ вэб аппыг Safari-аас үндсэн дэлгэц дээрээ суулгаснаар бүтэн дэлгэцээр, интернэтгүй үед ч аудиотойгоо ажиллана.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Заавар хаах"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <ol className="mt-5 space-y-3 text-sm text-slate-800 dark:text-slate-200">
                <li className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="font-mono font-semibold text-[#11457E] dark:text-sky-300 shrink-0">01.</span>
                  <span>
                    Доорх холбоосыг хуулж iPhone дээрээ <strong>Safari</strong> хөтөчөөр нээнэ үү.
                  </span>
                </li>
                <li className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="font-mono font-semibold text-[#11457E] dark:text-sky-300 shrink-0">02.</span>
                  <span className="flex flex-wrap items-center gap-1">
                    Safari-ийн доод хэсгийн <Share className="w-4 h-4 inline text-[#11457E] dark:text-sky-300" aria-hidden="true" />{' '}
                    <strong>Хуваалцах (Share)</strong> товчийг дарна уу.
                  </span>
                </li>
                <li className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="font-mono font-semibold text-[#11457E] dark:text-sky-300 shrink-0">03.</span>
                  <span>
                    Доош гүйлгэж <strong>«Add to Home Screen»</strong> буюу{' '}
                    <strong>«Үндсэн дэлгэцэд нэмэх»</strong>-ийг дарж баталгаажуулна уу.
                  </span>
                </li>
              </ol>

              <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => void handleCopyUrl()}
                  className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Холбоос хуулагдлаа' : 'Холбоос хуулах'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="flex-1 min-h-[44px] rounded-xl bg-[#11457E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0C3563] cursor-pointer"
                >
                  Ойлголоо
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 lg:bottom-4 left-4 right-4 sm:right-auto z-40 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg"
    >
      <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>Офлайн горим — Хадгалсан хичээл болон аудио хэвийн ажиллаж байна</span>
    </div>
  );
};
