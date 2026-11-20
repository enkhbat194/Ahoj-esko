import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';

/**
 * Records ONLY the learner's own microphone locally for self-listening.
 * This is NOT Gemini source audio, ASR evaluation, or native pronunciation grading.
 * No server transmission, and audio is discarded when the view unmounts.
 */
export const L01SelfRecorder: React.FC = () => {
  const active = useRef(true);
  const starting = useRef(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const urlRef = useRef<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');

  const clearRecording = () => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setAudioUrl(null);
  };

  const stopCapture = () => {
    if (recorder.current?.state === 'recording') recorder.current.stop();
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setRecording(false);
  };

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      if (recorder.current) {
        recorder.current.onstop = null;
        recorder.current.ondataavailable = null;
        if (recorder.current.state === 'recording') recorder.current.stop();
      }
      stream.current?.getTracks().forEach(track => track.stop());
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const startCapture = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Энэ Safari хувилбарт микрофоны бичлэг дэмжигдэхгүй байна.');
      return;
    }
    if (starting.current || recording) return;
    starting.current = true;
    try {
      clearRecording();
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!active.current) { mediaStream.getTracks().forEach(track => track.stop()); return; }
      stream.current = mediaStream;
      const mediaRecorder = new MediaRecorder(mediaStream);
      recorder.current = mediaRecorder;
      chunks.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      mediaRecorder.onerror = () => {
        setError('Дуу бичихэд алдаа гарлаа. Микрофоны зөвшөөрлийг шалгана уу.');
        stopCapture();
      };
      mediaRecorder.onstop = () => {
        stream.current?.getTracks().forEach((track) => track.stop());
        stream.current = null;
        const blob = new Blob(chunks.current, { type: mediaRecorder.mimeType || 'audio/mp4' });
        if (blob.size > 0) {
          if (urlRef.current) URL.revokeObjectURL(urlRef.current);
          const next = URL.createObjectURL(blob);
          urlRef.current = next;
          setAudioUrl(next);
        }
        setRecording(false);
      };
      mediaRecorder.start();
      setRecording(true);
    } catch {
      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = null;
      setRecording(false);
      if (!active.current) return;
      setError('Микрофон ашиглах зөвшөөрөл олдсонгүй. Safari-ийн HTTPS ба зөвшөөрлийг шалгана уу.');
    } finally { starting.current = false; }
  };

  return (
    <section className="rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] p-4 space-y-3">
      <div>
        <h3 className="text-sm font-bold text-[#1C1C1E] dark:text-white">Өөрийн дуудлагыг бичиж сонсох</h3>
        <p className="text-xs text-[#636366] dark:text-[#AEAEB2] mt-1">
          Утсандаа түр бичнэ. Илгээхгүй, хадгалахгүй, зөв/буруу гэж автоматаар үнэлэхгүй.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={recording} onClick={() => void startCapture()}
          className="min-h-[42px] px-4 rounded-xl bg-[#007AFF] dark:bg-[#0A84FF] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer">
          <Mic className="w-4 h-4" />{recording ? 'Бичиж байна' : 'Бичлэг эхлүүлэх'}
        </button>
        <button type="button" disabled={!recording} onClick={stopCapture}
          className="min-h-[42px] px-4 rounded-xl bg-white dark:bg-[#1C1C1E] text-xs font-semibold flex items-center gap-2 disabled:opacity-40 cursor-pointer">
          <Square className="w-4 h-4" />Дуусгах
        </button>
        {audioUrl && (
          <button type="button" onClick={clearRecording}
            className="min-h-[42px] px-4 rounded-xl bg-white dark:bg-[#1C1C1E] text-xs font-semibold flex items-center gap-2 cursor-pointer">
            <Trash2 className="w-4 h-4" />Арилгах
          </button>
        )}
      </div>
      {audioUrl && <audio controls src={audioUrl} className="w-full" aria-label="Өөрийн дуудлагын бичлэг" />}
      {error && <p role="alert" className="text-xs text-[#D70015] dark:text-[#FF453A]">{error}</p>}
    </section>
  );
};
