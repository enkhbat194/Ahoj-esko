import { useEffect, useState } from 'react';
import type { CourseAudio } from '../utils/courseSource';

function Clip({clip}: {clip: CourseAudio}) {
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const src = URL.createObjectURL(clip.blob);
    setUrl(src);
    setFailed(false);
    return () => URL.revokeObjectURL(src);
  }, [clip]);
  const label = clip.receipt.style === 'natural' ? 'Энгийн хурд' : 'Удаан';
  return <label className="block space-y-1 text-xs">
    <span>{label}</span>
    {url && <audio controls preload="none" className="w-full max-w-sm" src={url} aria-label={label} onError={() => setFailed(true)} />}
    {failed && <span role="alert">Аудио тоглуулж чадсангүй.</span>}
  </label>;
}
export function CourseAudioButton({clips, template = false}: {clips?: CourseAudio[]; template?: boolean}) {
  if (!clips?.length) return <p className="text-xs text-[#636366] dark:text-[#AEAEB2]">{template
    ? 'Өөрийн нэрийг нөхөж хэлээрэй.' : 'Энэ мөрийн эх аудио хүлээгдэж байна.'}</p>;
  return <div className="space-y-2">{[...clips].sort((a,b) => b.receipt.style.localeCompare(a.receipt.style))
    .map(clip => <Clip key={clip.receipt.wavSha256} clip={clip}/>)}</div>;
}
