import React, { useState } from 'react';
import { ArrowLeft,ArrowRight,ChevronRight,RotateCcw,ShieldAlert,Volume2,VolumeX } from 'lucide-react';
import {
  CZECH_ALPHABET_PACKS,CZECH_ALPHABET_PACK_BY_ID,approvedAlphabetAudio,spellingRequiresWordContext,
  type AlphabetAudioKind, type AlphabetPackStage,
} from '../data/czechAlphabetPacks';
import {
  getPackContinueTarget,introduceNextLetter,lettersIntroducedCount,
  loadPackProgress,openPack,packIntroducedCount,packIsCompleted,packReport,packsPassedCount,
  safePackProgress,savePackProgress,scorePackAudioChoice,
  type AlphabetPackProgress,
} from '../utils/alphabetPackProgress';
import '../alphabet-course.css';
import '../alphabet-packs.css';

interface Props {
  startAt: 'overview'|'resume';
  onExit:()=>void;
  onContinueAfterAlphabet:()=>void;
  onOpenAiTeacher?:()=>void;
}

function AudioCue({letterId,kind,onHeard,onError}:{
  letterId:string;kind:AlphabetAudioKind;onHeard:()=>void;onError:()=>void;
}){
  const entry=approvedAlphabetAudio(letterId,kind);
  const [broken,setBroken]=useState(false);
  if(!entry||broken)return (
    <div className="alphabet-pack-no-audio" role="status">
      <VolumeX size={23} aria-hidden="true"/>
      <div><strong>Баталгаажсан Чех аудио байхгүй</strong>
        <p>Сонсголын шалгалтыг дуугүйгээр эсвэл англи үсгийн дуудлагаар орлуулахгүй.</p>
      </div>
    </div>
  );
  return <div className="alphabet-pack-audio">
    <span><Volume2 size={20}/> Чех эх аудио · {kind==='letter_name'?'Үсгийн нэр':'Жишээ үгийг бүтнээр'}</span>
    <audio key={entry.sourceId+kind} controls preload="none" src={entry.url}
      onEnded={onHeard} onError={()=>{setBroken(true);onError();}} aria-label="Чех дуудлагын аудио тоглуулах"/>
  </div>;
}

export const CzechAlphabetCourseView:React.FC<Props>=({
  startAt,onExit,onContinueAfterAlphabet,onOpenAiTeacher,
})=>{
  const [data,setData]=useState<AlphabetPackProgress>(loadPackProgress);
  const [screen,setScreen]=useState<'overview'|'runner'>(
    startAt==='resume'&&getPackContinueTarget(loadPackProgress())?'runner':'overview',
  );
  const [selectedPack,setSelectedPack]=useState<string|null>(
    startAt==='resume'?getPackContinueTarget(loadPackProgress())?.packId??null:null,
  );
  const [answer,setAnswer]=useState<string|null>(null);
  const [notice,setNotice]=useState('');
  const [manualReport,setManualReport]=useState(false);
  const [reviewIndex,setReviewIndex]=useState<number|null>(null);
  const [storageFailed,setStorageFailed]=useState(false);
  const [audioError,setAudioError]=useState(false);
  const [heard,setHeard]=useState(false);
  const [restoredMessage,setRestoredMessage]=useState('');

  const pack=selectedPack?CZECH_ALPHABET_PACK_BY_ID.get(selectedPack):undefined;
  const step=data.last?.packId===selectedPack?data.last:null;
  const stats=pack?packReport(data,pack.id):null;
  const stage:AlphabetPackStage=step?.stage??'introduce';
  const promptIndex=step?.index??0;
  const cueLetter=pack?.letters[promptIndex];
  const introduced=lettersIntroducedCount(data);
  const passed=packsPassedCount(data);
  const nextTarget=getPackContinueTarget(data);
  const isReview=reviewIndex!==null;

  const save=(next:AlphabetPackProgress)=>{
    setData(next);setStorageFailed(!savePackProgress(next));
  };
  const clear=()=>{setAnswer(null);setNotice('');setAudioError(false);setHeard(false);setManualReport(false);setReviewIndex(null);};
  const open=(id:string)=>{
    const pack=CZECH_ALPHABET_PACK_BY_ID.get(id);if(!pack)return;
    const completedIntro=packIntroducedCount(data,id)===pack.letters.length;
    save(openPack(data,id));
    setSelectedPack(id);setScreen('runner');clear();
    if(completedIntro&&!packIsCompleted(data,id))setNotice('Энэ багцын 4–5 үсгийг үзсэн. Дараагийн алхам нь баталгаажсан сонсгол.');
  };
  const continueLesson=()=>{
    const next=getPackContinueTarget(data);
    if(!next){onContinueAfterAlphabet();return;}
    open(next.packId);
  };
  const showOverview=()=>{clear();setSelectedPack(null);setScreen('overview');};
  const finishIntro=()=>{
    if(!pack)return;
    const next=introduceNextLetter(data,pack.id);
    if(next===data)return;
    save(next);setAnswer(null);setNotice('');
  };
  const onChoose=(id:string)=>{
    if(!pack||!cueLetter)return;
    const kind:AlphabetAudioKind=stage==='listen_name'?'letter_name':'sound_in_word';
    if(!approvedAlphabetAudio(cueLetter.id,kind)||audioError){
      setNotice('Баталгаажсан аудио байхгүй үед сонголтыг үнэлэхгүй.');return;
    }
    if(!heard){setNotice('Аудиог эхнээс нь дуустал сонсоод хариулна уу.');return;}
    const response=scorePackAudioChoice(data,pack.id,kind,cueLetter.id,id);
    if(!response.scored){setNotice('Аудиог баталгаажуулж чадаагүй. Оноо тооцохгүй.');return;}
    setAnswer(id);save(response.next);if(response.correct)setHeard(false);
    setNotice(response.correct?'Зөв. Дараагийн авиаг сонсоорой.':'Дахин сонсоод сонгоорой. Энэ алдааг тайланд тэмдэглэнэ.');
  };
  const nextPack=()=>{
    if(!pack)return;
    const p=CZECH_ALPHABET_PACKS[pack.index+1];
    if(p){open(p.id);return;}
    showOverview();setRestoredMessage('Бүх 42 үсгийн танилцуулгыг үзсэн байж болно. Сонсгол ба AI үнэлгээ баталгаажаагүй байхад бүрэн төгссөн гэж тооцохгүй.');
  };
  const visibleReport=manualReport||stage==='report';
  const introLetter=pack?.letters[isReview?(reviewIndex??0):Math.min(promptIndex,pack.letters.length-1)];
  const audioKind:AlphabetAudioKind=stage==='listen_name'?'letter_name':'sound_in_word';
  const audioPending=Boolean(cueLetter &&!approvedAlphabetAudio(cueLetter.id,audioKind));

  const downloadBackup=()=>{
    const text=JSON.stringify(data,null,2);
    const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='ahoj-alphabet-pack-progress.json';
    document.body.appendChild(a);a.click();a.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const restoreBackup=async(file?:File)=>{
    if(!file)return;
    try{
      if(file.size>120000)throw Error('oversize');
      const next=safePackProgress(JSON.parse(await file.text()));
      if(!next)throw Error('schema');
      save(next);showOverview();setRestoredMessage('Ахиц сэргээгдлээ. Хуучин 7 алхамтын оноог сонсголын оноо болгож тооцоогүй.');
    }catch{setRestoredMessage('Сэргээх боломжгүй: файлын загвар эсвэл хувилбар тохирохгүй байна.');}
  };

  return <div className="alphabet-course alphabet-pack-course" data-testid="alphabet-pack-course">
    <header className="alphabet-course-header">
      <button type="button" className="alphabet-back" onClick={screen==='runner'?showOverview:onExit}
        aria-label="Буцах"><ArrowLeft size={23}/></button>
      <div><p className="alphabet-small">A0 · ЦАГААН ТОЛГОЙ</p>
        <h1>{screen==='overview'?'Үсгийн багцууд':pack?`Багц ${pack.index+1} · ${pack.letters.map(l=>l.upper).join(' ')}`:'Цагаан толгой'}</h1>
      </div><span className="alphabet-count">{introduced}/42</span>
    </header>

    {storageFailed&&<p role="alert" className="alphabet-error">Safari ахицыг хадгалж чадсангүй. Нөөц файлаа татаж хадгалаарай.</p>}

    {screen==='overview'&&<section className="alphabet-panel alphabet-packs-overview">
      <div className="alphabet-pack-overview-header">
        <div><p className="alphabet-small">Нийт 9 багц · Тус бүр 4–5 үсэг</p>
          <h2>Богино багц, бодит дадлага</h2>
        </div>
        <span className="alphabet-pack-progress-pill">{passed}/9 шалгалт</span>
      </div>
      <p className="alphabet-muted">
        Үсгийг дарааллаар үзнэ. Баталгаажсан аудио орж ирэхэд сонсоод таних, авиа тохируулах шалгалт идэвхжинэ.
        Өмнөх 7 алхамтын ахицыг устгахгүй, гэхдээ сонсголын баталгаа гэж тооцохгүй.
      </p>
      <div className="alphabet-progress-track" role="progressbar" aria-valuenow={introduced} aria-valuemin={0}
        aria-valuemax={42} aria-label={`${introduced} / 42 үсэг танилцуулсан`}>
        <div style={{width:`${introduced/42*100}%`}}/>
      </div>
      <div className="alphabet-packs-grid">
        {CZECH_ALPHABET_PACKS.map(p=>{
          const count=packIntroducedCount(data,p.id),done=packIsCompleted(data,p.id);
          return <button type="button" key={p.id} className={`alphabet-pack-card ${done?'passed':count?'started':''}`}
            onClick={()=>open(p.id)} aria-label={`${p.index+1}-р багц: ${p.letters.map(l=>l.upper).join(', ')}. ${count}/${p.letters.length} танилцсан`}>
            <div className="alphabet-pack-card-top"><small>БАГЦ {String(p.index+1).padStart(2,'0')}</small>
              <span>{done?'Шалгасан':count===p.letters.length?'Сонсгол хүлээж байна':count?'Үргэлжлүүлэх':'Эхлэх'}</span></div>
            <strong>{p.letters.map(l=>l.upper).join(' · ')}</strong>
            <div className="alphabet-pack-card-bottom"><span>{count}/{p.letters.length} үсэг</span>
              <ChevronRight size={19} /></div>
          </button>;
        })}
      </div>
      <button type="button" className="alphabet-main-button alphabet-wide" onClick={continueLesson}>
        Сүүлд үзсэнээс үргэлжлүүлэх <ArrowRight size={19}/>
      </button>
      <div className="alphabet-pack-backups">
        <button type="button" className="alphabet-outline-button" onClick={downloadBackup}>Ахицын JSON нөөц</button>
        <label className="alphabet-outline-button">Ахиц сэргээх
          <input type="file" accept="application/json,.json" className="sr-only" onChange={e=>{
            void restoreBackup(e.currentTarget.files?.[0]);e.currentTarget.value='';
          }}/>
        </label>
      </div>
      {restoredMessage&&<p role="status" className="alphabet-note">{restoredMessage}</p>}
    </section>}

    {screen==='runner'&&pack&&<section className="alphabet-panel alphabet-pack-runner">
      <div className="alphabet-pack-stagebar" role="list" aria-label="Нэг багцын 4 үе шат">
        {[
          ['introduce','Танилцах'],
          ['listen_name','Сонсоод сонгох'],
          ['match_sound','Авиа тохируулах'],
          ['report','Дүгнэлт'],
        ].map(([id,label],i)=><div key={id} role="listitem" className={`alphabet-pack-stage ${(visibleReport?id==='report':stage===id)?'active':''}`}>
          <b>{i+1}</b><span>{label}</span>
        </div>)}
      </div>

      {isReview&&introLetter&&<div className="alphabet-pack-intro">
        <p className="alphabet-small">ЭНЭ БАГЦЫГ ДАВТАХ · {(reviewIndex??0)+1}/{pack.letters.length}</p>
        <div className="alphabet-pack-letter-big">{introLetter.upper}<span>{introLetter.lower}</span></div>
        <div className="alphabet-pack-example"><strong>{introLetter.exampleCs}</strong><span>{introLetter.exampleMn}</span></div>
        {introLetter.noteMn&&<p className="alphabet-note">{introLetter.noteMn}</p>}
        <div className="alphabet-pack-inline">
          <button type="button" className="alphabet-outline-button" onClick={()=>setReviewIndex(Math.max(0,(reviewIndex??0)-1))}
            disabled={reviewIndex===0}>Өмнөх</button>
          <button type="button" className="alphabet-main-button" onClick={()=>{
            if((reviewIndex??0)<pack.letters.length-1)setReviewIndex((reviewIndex??0)+1);
            else setReviewIndex(null);
          }}>{reviewIndex===pack.letters.length-1?'Давтлага хаах':'Дараагийн үсэг'}<ArrowRight size={17}/></button>
        </div>
      </div>}

      {!isReview&&!visibleReport&&stage==='introduce'&&introLetter&&<div className="alphabet-pack-intro">
        <p className="alphabet-small">ҮСЭГ ТАНИЛЦУУЛАХ · {promptIndex+1}/{pack.letters.length}</p>
        <h2>Одоо {introLetter.upper} үсэг</h2>
        <div className="alphabet-pack-letter-big">{introLetter.upper}<span>{introLetter.lower}</span></div>
        <div className="alphabet-pack-example"><small>Жишээ үг</small><strong>{introLetter.exampleCs}</strong><span>{introLetter.exampleMn}</span></div>
        {introLetter.noteMn&&<p className="alphabet-note">{introLetter.noteMn}</p>}
        <p className="alphabet-muted">Танилцаж буй үсгийг дарааллаар харна. Бичих дасгалыг үсэг бүрээр албадахгүй.</p>
        <button type="button" className="alphabet-main-button alphabet-wide" onClick={finishIntro}>
          {promptIndex===pack.letters.length-1?'Үсгүүдийг үзэж дуусгах':'Дараагийн үсэг'}
          <ArrowRight size={20}/>
        </button>
      </div>}

      {!isReview&&!visibleReport&&(stage==='listen_name'||stage==='match_sound')&&<div className="alphabet-pack-quiz">
        <p className="alphabet-small">{stage==='listen_name'?'ҮСГИЙН НЭРИЙГ СОНСОХ':'ҮГ ДАХЬ АВИАГ ЯЛГАХ'} · {promptIndex+1}/{pack.letters.length}</p>
        <h2>{stage==='listen_name'?'Аль үсгийн нэр сонсогдов?':'Сонссон үгэнд аль үсэг бичигдэх вэ?'}</h2>
        <AudioCue key={cueLetter?.id+stage} letterId={cueLetter?.id??''} kind={audioKind}
          onHeard={()=>setHeard(true)} onError={()=>setAudioError(true)}/>
        {!audioPending&&!audioError&&<div className="alphabet-pack-answer-grid">
          {pack.letters.map(l=><button type="button" key={l.id} className={`alphabet-choice ${answer===l.id?'chosen':''}`}
            onClick={()=>onChoose(l.id)}>{l.upper}</button>)}
        </div>}
        <p className="alphabet-muted">{stage==='listen_name'
          ?'Чех үсгийн нэрийг сонсоод багцын 4–5 сонголтоос сонго.'
          :'Бүтэн Чех үгийг сонсоод түүний зөв бичлэгт аль үсэг ордгийг сонго. Ижил авиатай өөр үсэг байж болно.'}</p>
        {(audioPending||audioError)&&<p className="alphabet-error">
          Баталгаажсан Gemini 3.8 Flash TTS аудио байхгүй учир сонсголын оноо тооцохгүй.
          Энэ хэсгийг дуугүйгээр зөв гэж тэмдэглэхгүй.
        </p>}
        {cueLetter && spellingRequiresWordContext(cueLetter.id) && stage==='match_sound' &&
          <p className="alphabet-note">Энэ үсгийг ганц тусгаар авианаас таних боломжгүй байж болно.
          Үг бүтнээрээ болон зөв бичих дүрмээр нь ялгана.</p>}
        {notice&&<p className="alphabet-note" role="status">{notice}</p>
        <div className="alphabet-pack-inline">
          <button type="button" className="alphabet-outline-button" onClick={()=>{setManualReport(true);setNotice('')}}>
            Одоогийн тайлан
          </button>
          <button type="button" className="alphabet-outline-button" onClick={()=>{setReviewIndex(0);setNotice('')}}>
            Үсгүүдээ давтах <RotateCcw size={15}/>
          </button>
        </div>
        {audioPending&&<button type="button" className="alphabet-main-button alphabet-wide" onClick={nextPack}>
          {pack.index===CZECH_ALPHABET_PACKS.length-1?'Багцын жагсаалт руу':'Дараагийн багцын үсгүүдийг үзэх'}
          <ArrowRight size={17}/>
        </button>}
      </div>}

      {!isReview&&visibleReport&&stats&&<div className="alphabet-pack-report">
        <p className="alphabet-small">БАГЦ {pack.index+1} · ҮНЭЛГЭЭНИЙ ТӨЛӨВ</p>
        <h2>{stats.completed?'Сонсгол, авиа ялгалтын багц дууслаа':'Сонсголын эцсийн үнэлгээ хүлээгдэж байна'}</h2>
        <div className="alphabet-pack-report-stats">
          <div><b>{stats.visualIntroduced}/{stats.total}</b><span>Танилцсан үсэг</span></div>
          <div><b>{stats.nameRecognized}/{stats.total}</b><span>Нэр таньсан</span></div>
          <div><b>{stats.soundMatched}/{stats.total}</b><span>Авиа тохируулсан</span></div>
        </div>
        <section><h3>Анхаарах үсэг, авиа</h3>
          <p>{stats.problemLetters.length?stats.problemLetters.join(' · '):
            stats.completed?'Энэ багцын автомат сонголтод алдаа бүртгэгдээгүй.':
              'Дуудлага сонсох шалгалт хийгдээгүй тул сул үсгийг тогтоох боломжгүй.'}</p>
          <p className="alphabet-muted">{pack.contrastNoteMn}</p></section>
        <section><h3>Давтах жишээ үгс</h3><div className="alphabet-pack-words">
          {stats.practiceWords.map(item=><span key={item.id}><b>{item.cs}</b><small>{item.mn}</small></span>)}
        </div></section>
        <section><h3>Өгүүлбэрт хэрэглэх</h3>
          <p>Үсэг, жишээ үг дээр ажиллаж байна. Өгүүлбэрийн хэрэглээг дараагийн «Мэндчилгээ» бүлгийн бодит даалгавраар шалгана.
            Одоохондоо өгүүлбэрийн оноо байхгүй.</p>
        </section>
        <div className="alphabet-pack-ai-alert">
          <ShieldAlert size={21}/><div><strong>AI багшийн үнэлгээ хараахан хийгдээгүй</strong>
          <p>Яриа, дуу бичлэгийг бодитоор шинжилсэн AI багшийн баталгаажсан холболт байхгүй.
            Энэ тайлан бол зөвхөн аппын бүртгэсэн үйлдлийн тайлан. AI оноо, 100% дуудлага гэж харуулахгүй.</p></div>
        </div>
        {onOpenAiTeacher&&<button type="button" className="alphabet-outline-button alphabet-wide" onClick={onOpenAiTeacher}>
          AI багштай бие даан дадлага хийх <ArrowRight size={17}/></button>}
        <button type="button" className="alphabet-main-button alphabet-wide" onClick={nextPack}>
          {pack.index===CZECH_ALPHABET_PACKS.length-1?'Багцын жагсаалт':'Дараагийн багц'}
          <ArrowRight size={18}/>
        </button>
        <button type="button" className="alphabet-outline-button alphabet-wide" onClick={()=>setManualReport(false)}>
          Сонсголын дасгал руу буцах
        </button>
      </div>}

      {!visibleReport&&!isReview&&stage==='listen_name'&&packIntroducedCount(data,pack.id)===pack.letters.length&&
        <p className="alphabet-muted">Үсгийн нэр ба бодит авиа тусдаа. Суралцагчийн үйлдлийг аудиогүйгээр оноож болохгүй.</p>}
    </section>}
  </div>;
};
