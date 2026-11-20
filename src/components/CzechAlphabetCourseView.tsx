import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, RotateCcw, VolumeX } from 'lucide-react';
import {
  ALPHABET_LESSON_STEP_COUNT, CZECH_ALPHABET_LETTERS, CZECH_ALPHABET_BY_ID,
  isCzechLetterResponse, letterOptions, maskLetterInExample,
} from '../data/czechAlphabetCourse';
import {
  alphabetLessonAction, alphabetSeenCount, completeAlphabetStep,
  getAlphabetContinueTarget, getLetterStatus, loadAlphabetProgress,
  moveAlphabetStep, openAlphabetLetter, saveAlphabetProgress, skipAlphabetStep,
  type AlphabetProgressState,
} from '../utils/alphabetProgress';
import { LetterTracePad } from './LetterTracePad';
import '../alphabet-course.css';

const STEPS = [
  'Үсэгтэй танилцах','Үг дотроос таних','Том, жижиг хэлбэр','Хуруугаар бичих',
  'Үгэнд нөхөх','Санаж бичих','Эцсийн шалгалт',
] as const;
const STATUS_LABEL = {
  unseen:'Үзээгүй',
  in_progress:'Үргэлжилж байна',
  seen:'Үзсэн',
} as const;

export const CzechAlphabetCourseView: React.FC<{
  startAt: 'overview' | 'resume';
  onExit: () => void;
  onContinueAfterAlphabet: () => void;
}> = ({startAt,onExit,onContinueAfterAlphabet}) => {
  const [progress,setProgress]=useState<AlphabetProgressState>(loadAlphabetProgress);
  const firstTarget = useMemo(()=>getAlphabetContinueTarget(progress),[]);
  const [screen,setScreen]=useState<'overview'|'detail'|'runner'|'finished'>(
    startAt==='resume' ? (firstTarget?'runner':'finished'):'overview',
  );
  const [selectedId,setSelectedId]=useState<string|null>(startAt==='resume'?firstTarget?.letterId??null:null);
  const [choice,setChoice]=useState('');
  const [secondChoice,setSecondChoice]=useState('');
  const [typed,setTyped]=useState('');
  const [traceAttempted,setTraceAttempted]=useState(false);
  const [showHelp,setShowHelp]=useState(false);
  const [feedback,setFeedback]=useState('');
  const [storageError,setStorageError]=useState(false);
  const [restoreMessage,setRestoreMessage]=useState('');

  const letter = selectedId ? CZECH_ALPHABET_BY_ID.get(selectedId) : undefined;
  const activeStep = letter&&progress.lastVisited?.letterId===letter.id ? progress.lastVisited.step:0;
  const status=letter?getLetterStatus(progress,letter.id):'unseen';
  const completed=alphabetSeenCount(progress);
  const resume=getAlphabetContinueTarget(progress);

  const persist=(next:AlphabetProgressState)=>{
    setProgress(next);
    setStorageError(!saveAlphabetProgress(next));
  };
  const resetForm=()=>{
    setChoice('');setSecondChoice('');setTyped('');setTraceAttempted(false);
    setShowHelp(false);setFeedback('');
  };
  const selectLetter=(id:string)=>{
    setSelectedId(id);setScreen('detail');resetForm();
  };
  const startLetter=(id:string,repeat=false)=>{
    persist(openAlphabetLetter(progress,id,repeat));
    setSelectedId(id);setScreen('runner');resetForm();
  };
  const continueSaved=()=>{
    const target=getAlphabetContinueTarget(progress);
    if(!target){setScreen('finished');return;}
    persist(moveAlphabetStep(progress,target.letterId,target.step));
    setSelectedId(target.letterId);setScreen('runner');resetForm();
  };
  const goBack=()=>{
    if(screen==='runner' && letter){
      setScreen('detail');resetForm();return;
    }
    if(screen==='detail'||screen==='finished'){setScreen('overview');setSelectedId(null);resetForm();return;}
    onExit();
  };
  const completeStep=()=>{
    if(!letter)return;
    const step=activeStep;
    let valid=false;
    switch(step){
      case 0: valid=true;break;
      case 1: valid=choice===letter.id;break;
      case 2: valid=isCzechLetterResponse(choice,letter.id);break;
      case 3: valid=traceAttempted;break;
      case 4: valid=choice===letter.id;break;
      case 5: valid=isCzechLetterResponse(typed,letter.id);break;
      case 6: {
        const done=progress.letters[letter.id]?.completedSteps??[];
        if(done.some(x=>x<6) || done.length<6){
          const missing=Array.from({length:6},(_,i)=>i).find(x=>!done.includes(x))??0;
          persist(moveAlphabetStep(progress,letter.id,missing));
          resetForm();
          setFeedback('Алгассан алхмаа эхэлж гүйцээ. Алгасалтыг амжилттай болсон гэж тооцохгүй.');
          return;
        }
        valid=isCzechLetterResponse(choice,letter.id) && secondChoice===letter.id;
        break;
      }
    }
    if(!valid){
      setFeedback(step===3?'Эхлээд хуруугаараа бичиж үз.':'Хариулт тохирохгүй байна. Дахин оролдоорой.');
      return;
    }
    const next=completeAlphabetStep(progress,letter.id,step);
    persist(next);
    resetForm();
    if(getLetterStatus(next,letter.id)==='seen'){
      setScreen('detail');
      setRestoreMessage(`${letter.upper}: 7/7 харааны ба бичгийн дасгал гүйцэтгэсэн. Дуудлагын үнэлгээ хийгдээгүй.`);
    }
  };
  const skip=()=>{
    if(!letter)return;
    persist(skipAlphabetStep(progress,letter.id,activeStep));
    resetForm();
    setFeedback('Энэ алхмыг алгассан. Ахицын оноо нэмэгдэхгүй; дараа нь нөхөж хийнэ.');
  };

  const options=letter?letterOptions(letter.id):[];
  const wordAnswer=letter?.exampleCs??'';
  const progressSteps=letter?progress.letters[letter.id]?.completedSteps??[]:[];

  const exportProgress=()=>{
    const blob=new Blob([JSON.stringify(progress,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement('a');anchor.href=url;anchor.download='ahoj-czech-alphabet-progress.json';
    document.body.appendChild(anchor);anchor.click();anchor.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  };

  return (
    <div className="alphabet-course" data-testid="alphabet-course">
      <header className="alphabet-course-header">
        <button type="button" className="alphabet-back" onClick={goBack}
          aria-label={screen==='overview'?'Нүүр рүү буцах':'Өмнөх хуудас руу буцах'}>
          <ArrowLeft size={22}/>
        </button>
        <div>
          <p className="alphabet-small">{screen==='runner'?'Үсгийн дадлага':'A0 · Чех хэлний эхлэл'}</p>
          <h1>{screen==='overview'?'Чех цагаан толгой':screen==='finished'?'Цагаан толгой дууслаа':letter?.upper??'Үсэг'}</h1>
        </div>
        <span className="alphabet-count">{completed}/42</span>
      </header>
      {storageError&&<div role="alert" className="alphabet-error">Safari ахицыг хадгалж чадсангүй. JSON нөөц файл гаргаж хадгалаарай.</div>}
      {restoreMessage && screen==='detail' && <p className="alphabet-hint" role="status">{restoreMessage}</p>}

      {screen==='overview'&&(
        <section className="alphabet-panel">
          <p className="alphabet-small">Чех цагаан толгойн 42 үсэг · CH нэг үсэг</p>
          <h2>Үзсэн, үзээгүй үсгүүд</h2>
          <p className="alphabet-muted">Үсэг дээр дараад сурах, үргэлжлүүлэх эсвэл давтах. Үсэг «үзсэн» болсон нь зөвхөн харааны болон бичгийн дасгал дууссаныг илэрхийлнэ.</p>
          <div className="alphabet-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={42} aria-valuenow={completed}
            aria-label={`${completed}/42 үсгийг үзсэн`}>
            <div style={{width:`${100*completed/42}%`}}/>
          </div>
          <div className="alphabet-status-legend">
            <span>○ Үзээгүй</span><span>◐ Үргэлжилж байна</span><span>✓ Үзсэн</span>
          </div>
          <div className="alphabet-letter-grid">
            {CZECH_ALPHABET_LETTERS.map(item=>{
              const st=getLetterStatus(progress,item.id);
              return <button type="button" key={item.id}
                onClick={()=>selectLetter(item.id)}
                className={`alphabet-letter-card ${st}`}
                aria-label={`${item.upper} · ${STATUS_LABEL[st]}`}>
                <strong>{item.upper}</strong><span>{item.lower}</span><small>{st==='seen'?'✓':st==='in_progress'?'◐':'○'}</small>
              </button>;
            })}
          </div>
          <div className="alphabet-course-actions">
            <button type="button" className="alphabet-main-button" onClick={continueSaved}>
              {completed===42?'Шалгасан үсгүүдийг харах':'Сүүлд үзсэнээс үргэлжлүүлэх'}
              <ArrowRight size={19}/>
            </button>
            <button type="button" className="alphabet-outline-button" onClick={exportProgress}>Ахицын нөөц JSON татах</button>
          </div>
          <div className="alphabet-muted">
            <VolumeX size={16}/> Баталгаажсан Чех дуудлагын аудио хараахан холбогдоогүй. Авианы үнэлгээ гэж ойлгохгүй.
          </div>
        </section>
      )}

      {screen==='detail' && letter && (
        <section className="alphabet-panel alphabet-detail">
          <div className="alphabet-detail-letter">{letter.upper}<small>{letter.lower}</small></div>
          <span className={`alphabet-status-label ${status}`}>{STATUS_LABEL[status]}</span>
          <h2>{letter.exampleCs}</h2>
          <p className="alphabet-muted">{letter.exampleMn}</p>
          {letter.noteMn && <p className="alphabet-note">{letter.noteMn}</p>}
          <p className="alphabet-muted">
            {status==='seen'
              ? 'Энэ үсгийн 7/7 харааны ба бичгийн дасгалыг үзсэн. Хүссэн үедээ давтаж болно.'
              : status==='in_progress'
                ? `Дуусгасан алхам: ${progressSteps.length}/7. Үргэлжлүүлэхэд хадгалсан алхмаас орно.`
                : 'Энэ үсгийг харах, үгнээс таних, бичих, шалгах дасгалаар судална.'}
          </p>
          <button type="button" className="alphabet-main-button"
            onClick={()=>startLetter(letter.id,status==='seen')}>
            {alphabetLessonAction(status)}<ArrowRight size={19}/>
          </button>
          {status==='seen' && resume && (
            <button type="button" className="alphabet-outline-button" onClick={continueSaved}>
              Дараагийн үсгээ үргэлжлүүлэх <ChevronRight size={16}/>
            </button>
          )}
        </section>
      )}

      {screen==='runner'&&letter&&(
        <section className="alphabet-panel alphabet-runner" key={letter.id+':'+activeStep}>
          <div className="alphabet-step-heading">
            <div>
              <p className="alphabet-small">{letter.id} · {STEPS[activeStep]}</p>
              <h2>Алхам {activeStep+1}/{ALPHABET_LESSON_STEP_COUNT}</h2>
            </div>
            <span>{progressSteps.length}/7</span>
          </div>
          <div className="alphabet-progress-track">
            <div style={{width:`${(activeStep+1)*100/ALPHABET_LESSON_STEP_COUNT}%`}} />
          </div>
          {activeStep===0 && (
            <div className="alphabet-step-body">
              <p className="alphabet-muted">Том ба жижиг үсгийн хэлбэрийг харьцуул.</p>
              <div className="alphabet-letter-pair"><strong>{letter.upper}</strong><span>{letter.lower}</span></div>
              <div className="alphabet-example"><small>Үгэнд орсон жишээ</small><strong>{wordAnswer}</strong><span>{letter.exampleMn}</span></div>
              {letter.noteMn&&<p className="alphabet-note">{letter.noteMn}</p>}
            </div>
          )}
          {activeStep===1 && (
            <div className="alphabet-step-body">
              <p className="alphabet-muted"><strong>{wordAnswer}</strong> үгэнд орсон шинэ үсгийг сонго.</p>
              <div className="alphabet-large-word">{wordAnswer}</div>
              <div className="alphabet-answer-grid">
                {options.map(o=><button type="button" key={o} aria-pressed={choice===o}
                  className={`alphabet-choice ${choice===o?'chosen':''}`} onClick={()=>{setChoice(o);setFeedback('');}}>{o}</button>)}
              </div>
            </div>
          )}
          {activeStep===2 && (
            <div className="alphabet-step-body">
              <p className="alphabet-muted"><strong>{letter.upper}</strong> үсгийн жижиг хэлбэрийг сонго.</p>
              <div className="alphabet-large-word">{letter.upper}</div>
              <div className="alphabet-answer-grid">
                {options.map(o=><button type="button" key={o} aria-pressed={choice===CZECH_ALPHABET_BY_ID.get(o)?.lower}
                  className={`alphabet-choice ${choice===CZECH_ALPHABET_BY_ID.get(o)?.lower?'chosen':''}`}
                  onClick={()=>{setChoice(CZECH_ALPHABET_BY_ID.get(o)?.lower??'');setFeedback('');}}>
                  {CZECH_ALPHABET_BY_ID.get(o)?.lower}
                </button>)}
              </div>
            </div>
          )}
          {activeStep===3 && (
            <div className="alphabet-step-body">
              <p className="alphabet-muted">Загварыг дагуулан хуруугаараа бичиж үз. «CH» бол хоёр тэмдэгттэй нэг үсэг.</p>
              <LetterTracePad key={letter.id} letter={letter.upper} onAttemptChange={setTraceAttempted}/>
            </div>
          )}
          {activeStep===4 && (
            <div className="alphabet-step-body">
              <p className="alphabet-muted">Дутуу үсгийг нөхөж, үгийг гүйцээ.</p>
              <div className="alphabet-large-word">{maskLetterInExample(letter)}</div>
              <p className="alphabet-muted">{letter.exampleMn}</p>
              <div className="alphabet-answer-grid">
                {options.map(o=><button type="button" key={o} aria-pressed={choice===o}
                  className={`alphabet-choice ${choice===o?'chosen':''}`} onClick={()=>{setChoice(o);setFeedback('');}}>{o}</button>)}
              </div>
            </div>
          )}
          {activeStep===5 && (
            <div className="alphabet-step-body">
              <p className="alphabet-muted">Жишээ үгийн дутуу тэмдэглэгээг санаад Чехээр бич.</p>
              <div className="alphabet-large-word">{maskLetterInExample(letter)}</div>
              <label htmlFor="alphabet-typing" className="alphabet-small">Дутуу үсэг:</label>
              <input id="alphabet-typing" className="alphabet-typing" autoCapitalize="none" autoComplete="off"
                maxLength={2} value={typed} onChange={e=>{setTyped(e.target.value);setFeedback('');}}
                placeholder="Энд бич..." />
              <button type="button" className="alphabet-outline-button" onClick={()=>setShowHelp(!showHelp)}>
                {showHelp?'Нэмэлт тэмдэглэгээ нуух':'Чех гар байхгүй бол үсэг сонгох'}
              </button>
              {showHelp&&<div className="alphabet-answer-grid">
                {options.map(o=><button type="button" key={o} className="alphabet-choice"
                  onClick={()=>{setTyped(CZECH_ALPHABET_BY_ID.get(o)?.lower??'');setFeedback('');}}>{CZECH_ALPHABET_BY_ID.get(o)?.lower}</button>)}
              </div>}
            </div>
          )}
          {activeStep===6 && (
            <div className="alphabet-step-body">
              <p className="alphabet-muted">Эцсийн давтлага — хоёр сонголтыг хоёуланг зөв хий.</p>
              <p className="alphabet-small">1. <strong>{letter.upper}</strong> үсгийн жижиг хэлбэр аль нь вэ?</p>
              <div className="alphabet-answer-grid">
                {options.map(o=><button type="button" key={o}
                  className={`alphabet-choice ${choice===CZECH_ALPHABET_BY_ID.get(o)?.lower?'chosen':''}`}
                  onClick={()=>{setChoice(CZECH_ALPHABET_BY_ID.get(o)?.lower??'');setFeedback('');}}>
                  {CZECH_ALPHABET_BY_ID.get(o)?.lower}
                </button>)}
              </div>
              <p className="alphabet-small">2. <strong>{maskLetterInExample(letter)}</strong> үгэнд ямар үсэг дутуу байна вэ?</p>
              <div className="alphabet-answer-grid">
                {options.map(o=><button type="button" key={o}
                  className={`alphabet-choice ${secondChoice===o?'chosen':''}`}
                  onClick={()=>{setSecondChoice(o);setFeedback('');}}>{o}</button>)}
              </div>
            </div>
          )}
          {feedback&&<p className="alphabet-feedback" role="status">{feedback}</p>}
          <div className="alphabet-lesson-controls">
            <button type="button" className="alphabet-outline-button"
              disabled={activeStep===0}
              onClick={()=>{persist(moveAlphabetStep(progress,letter.id,activeStep-1));resetForm();}}>
              <ArrowLeft size={15}/> Буцах
            </button>
            <button type="button" className="alphabet-main-button" onClick={completeStep}>
              {activeStep===6?'Шалгалтаа дуусгах':'Шалгах / Үргэлжлүүлэх'}
              <Check size={18}/>
            </button>
          </div>
          <button type="button" className="alphabet-skip" onClick={skip}>
            Алгасах (дууссанд тооцохгүй) <ArrowRight size={15}/>
          </button>
          <p className="alphabet-muted"><VolumeX size={14}/> Баталгаажсан дуудлагын аудио холбогдоогүй. Харааны дасгалын дүнг дуудлагын оноо гэж үзэхгүй.</p>
        </section>
      )}

      {screen==='finished'&&(
        <section className="alphabet-panel alphabet-finished">
          <Check size={50} color="#42D8C6"/>
          <h2>42 үсгийн харааны дасгал дууссан</h2>
          <p className="alphabet-muted">Чех үсгийн бичлэг, жишээ, таних дасгалыг үзсэн. Дуудлагын баталгаажсан аудио, шалгалтын хэсэг тусад нь батлагдах ёстой.</p>
          <button type="button" className="alphabet-main-button" onClick={onContinueAfterAlphabet}>
            Дараагийн бүлэг: Мэндчилгээ <ArrowRight size={19}/>
          </button>
          <button type="button" className="alphabet-outline-button" onClick={()=>setScreen('overview')}>
            Үсгээ давтах <RotateCcw size={17}/>
          </button>
        </section>
      )}
    </div>
  );
};
