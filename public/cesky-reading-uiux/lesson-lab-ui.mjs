/**
 * AHOJ A0 teaching engine — interactive preview for eight canonical
 * micro-skills (A0-T01-L01 onward).
 *
 * Persisted progress is only a practice record. Browser speech synthesis
 * is not an approved native recording, and SpeechRecognition is NEVER a
 * calibrated pronunciation score. Do not certify CEFR, phonetic performance,
 * or course release from these events.
 */
const PARAM = "lesson_lab";
const STORAGE_KEY = "ahoj.course.a0.t01.practice.v1";
const DAYS=[1,3,7,14,30];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));
const norm=s=>String(s??"").normalize("NFC").trim().replace(/\s+/gu," ").toLocaleLowerCase("cs-CZ");
const ID=id=>document.getElementById(id);
const dateStamp=ms=>new Date(ms).toLocaleDateString("mn-MN",{month:"short",day:"numeric"});
let pack=null,profile=null,active=null,started=false,opening=false,blocked=false,spokenText="";
let speechRecognition=null,cardReveal=new Set(),matchSelections={},matchActive=null,orderPicked=[],fieldValue="";
let feedbackMessage="",feedbackKind="",voiceState="UNTESTED",microphoneState="UNTESTED";
const supportedTypes=new Set(["model","choice","flashcards","listen_choice","match","order","cloze","speak"]);

function load(){
  try{
    const d=JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(d&&d.schema_version==="0.2.0"&&d.lessons&&d.review_queue)return d;
  }catch{}
  return {schema_version:"0.2.0",lessons:{},review_queue:{},last_opened_id:null,
          updated_at:Date.now(),saved_to_device:false};
}
function store(){
  profile.updated_at=Date.now();
  try {localStorage.setItem(STORAGE_KEY,JSON.stringify(profile));profile.saved_to_device=true;return true;}
  catch {profile.saved_to_device=false;return false;}
}
function stateFor(lesson){
  return profile.lessons[lesson.lesson_id]??(profile.lessons[lesson.lesson_id]={
    lesson_id:lesson.lesson_id,index:0,completed:[],mistakes:{},
    answers:{},audio_events:[],speech_attempts:[],finished:false,
    completed_at_ms:null,status:"IN_PROGRESS_NO_AUDIO_QA"
  });
}
function getLesson(id){return pack?.lessons.find(l=>l.lesson_id===id)||null;}
function currentStep(){const l=getLesson(active);return l?.steps[stateFor(l).index]??null;}
function stepDone(step){return stateFor(getLesson(active)).completed.includes(step.step_id);}
function countDone(){return stateFor(getLesson(active)).completed.length;}
function recordError(step,reason){
  const state=stateFor(getLesson(active));
  state.mistakes[step.step_id]=(state.mistakes[step.step_id]||0)+1;
  updateFeedback("bad",reason||"Дахин оролдоорой.");store();
}
function updateFeedback(kind,text){
 feedbackKind=kind;feedbackMessage=text;const slot=ID("cl-feedback");
 if(slot){slot.textContent=text;slot.dataset.kind=kind;slot.hidden=!text;}
}
function finishStep(meta={}){
 const step=currentStep();if(!step)return;
 const s=stateFor(getLesson(active));
 if(!s.completed.includes(step.step_id))s.completed.push(step.step_id);
 s.answers[step.step_id]={at_ms:Date.now(),...meta};
 feedbackKind="good";
 store();draw();
}
function canLaunch(id){
 const lesson=getLesson(id);if(!lesson)return false;
 if(lesson.order===1)return true;
 const prev=pack.lessons.find(l=>l.order===lesson.order-1);
 return Boolean(prev&&profile.lessons[prev.lesson_id]?.finished);
}
function start(id){
 if(!started||!getLesson(id))return false;
 if(!canLaunch(id)){
  showToast("Эхлээд өмнөх хичээлийн бүх дасгалыг гүйцээнэ үү.");return false;
 }
 if(opening)close();
 active=id;profile.last_opened_id=id;opening=true;
 cardReveal=new Set();matchSelections={};matchActive=null;orderPicked=[];fieldValue="";
 feedbackMessage="";feedbackKind="";
 store();draw();return true;
}
function stopMedia(){
 if(speechRecognition){try{speechRecognition.abort()}catch{}speechRecognition=null;}
 if(window.speechSynthesis)try{speechSynthesis.cancel()}catch{}
}
function close(){
 if(!opening)return;
 stopMedia();opening=false;active=null;
 const element=ID("course-lab-overlay");
 if(element){element.hidden=true;element.replaceChildren();}
 document.documentElement.classList.remove("course-lab-active");
 store();window.dispatchEvent(new CustomEvent("ahoj:course-progress-updated"));
}
function showToast(text){
 let item=ID("course-lab-toast");
 if(!item){item=document.createElement("div");item.id="course-lab-toast";
   item.style.cssText="position:fixed;z-index:9999;bottom:80px;left:10%;width:80%;background:#292b32;color:#fff;padding:12px;border:1px solid #ef9639;border-radius:12px;text-align:center;font-size:13px";
   document.body.append(item);}
 item.textContent=text;item.hidden=false;
 clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>{item.hidden=true;},2400);
}
function getVoice(){
 const all=window.speechSynthesis?.getVoices?.()??[];
 return all.find(v=>/^cs(?:-|$)/i.test(v.lang))??null;
}
function play(text,{onStarted=()=>{},onEnded=()=>{}}={}){
 stopMedia();
 if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){
  voiceState="UNAVAILABLE";showToast("Энэ төхөөрөмж дээр browser TTS ашиглах боломжгүй.");
  return false;
 }
 const utterance=new SpeechSynthesisUtterance(String(text));
 utterance.lang="cs-CZ";utterance.rate=.86;
 const v=getVoice();if(v)utterance.voice=v;
 let began=false;
 utterance.onstart=()=>{
  began=true;voiceState=v?"CZECH_DEVICE_TTS_NOT_EDITOR_APPROVED":"UNVERIFIED_FALLBACK_CS_CZ";
  const current=currentStep();
  if(current){
   const state=stateFor(getLesson(active));
   state.audio_events.push({step_id:current.step_id,text_cs:text,mode:"browser-tts",at_ms:Date.now(),verified:false});
   store();
  }
  onStarted();
 };
 utterance.onerror=()=>{voiceState="ERROR";showToast("Төхөөрөмжийн TTS дуу үүсгэж чадсангүй.");};
 utterance.onend=()=>{if(began)onEnded();};
 try{speechSynthesis.speak(utterance);return true;}catch{
  voiceState="ERROR";showToast("Төхөөрөмжийн TTS эхлүүлэх боломжгүй.");return false;
 }
}
function addFlashcards(lesson){
 const state=stateFor(lesson);
 for(const word of lesson.words){
  const k="course-form:"+norm(word.form_cs);
  const existing=profile.review_queue[k];
  if(existing){
   if(!existing.first_seen_in.includes(lesson.lesson_id))existing.first_seen_in.push(lesson.lesson_id);
   continue;
  }
  profile.review_queue[k]={
   card_key:k,word_cs:word.form_cs,meaning_mn:word.meaning_mn_context,
   first_seen_in:[lesson.lesson_id],first_seen_at_ms:Date.now(),
   due_at_ms:Date.now()+86_400_000,stage:0,
   independent_correct:0,incorrect:0,editorial_approved:false,
   audio_verified:false
  };
 }
 state.flashcards_added=true;store();
}
function button(label,action,klass="",extras=""){
 return '<button type="button" class="cl-button '+klass+'" data-cl-action="'+esc(action)+'" '+extras+'>'+esc(label)+'</button>';
}
function speechButton(text,label="▶ Сонсох"){
 return '<button type="button" class="cl-audio" data-cl-say="'+esc(text)+'" aria-label="'+esc(label)+'">▶</button>';
}
function relevantLetters(answer){
 const groups={
  a:["a","á","e","o"],e:["e","é","a","i"],i:["i","í","y","ý"],o:["o","ó","a","u"],
  u:["u","ú","ů","o"],y:["y","ý","i","í"],
  "č":["c","č","š","ž"],"š":["s","š","č","ž"],"ž":["z","ž","š","č"],
  "ď":["d","ď","ť","ň"],"ť":["t","ť","ď","ň"],"ň":["n","ň","ď","ť"],
  "ř":["r","ř","ž","š"],r:["r","ř","z","ž"],
  "á":["a","á","e","é"],"é":["e","é","a","á"],"í":["i","í","y","ý"],
  "ó":["o","ó","u","ú"],"ú":["u","ú","ů","o"],"ů":["u","ů","ú","o"],
  "ý":["y","ý","i","í"]
 };
 return groups[answer]||["č","š","ž","ř"];
}
function renderStep(step){
 switch(step.type){
 case "model":{
  const seen=step.examples.filter((x,i)=>cardReveal.has(step.step_id+":model:"+i)).length;
  return '<p class="cl-subtitle">'+esc(step.description_mn)+'</p>'+
   '<div class="cl-words">'+step.examples.map((x,i)=>{
     const open=cardReveal.has(step.step_id+":model:"+i);
     return '<div class="cl-model-row"><div class="cl-model-content">'+
      '<strong lang="cs">'+esc(x.text_cs)+'</strong>'+
      '<button type="button" class="cl-model-reveal'+(open?" is-revealed":"")+
      '" data-cl-model="'+i+'" aria-expanded="'+open+'">'+
      (open?esc(x.meaning_mn):"Утгыг харах")+'</button></div>'+
      speechButton(x.text_cs,"Чех үгийг сонсох")+'</div>';
   }).join("")+'</div>'+
   '<p class="cl-note">'+seen+' / '+step.examples.length+
   ' үгийн утгыг нээсэн · Дуудлагын аудио баталгаажаагүй.</p>'+
   button("Бүх үгтэй танилцлаа","complete-model","primary",seen<step.examples.length?"disabled":"");
 }

 case "choice":
 case "listen_choice":{
  const hasSound=step.type==="listen_choice";
  const saved=stateFor(getLesson(active)).answers[step.step_id]?.value??null;
  return '<p class="cl-subtitle cl-task-prompt">'+esc(step.prompt_mn)+'</p>'+
   (hasSound?'<div class="cl-hearing">'+speechButton(step.utterance.text_cs,"Чех үгийг сонсох")+
     '<p>Эхлээд сонс, дараа нь тохирох үгийг сонго.</p>'+
     '<small id="cl-heard-flag">Дууг сонсоогүй</small></div>':'')+
   '<div class="cl-options">'+step.options.map((o,i)=>
     '<button type="button" class="cl-button option'+(saved===o.id?" is-correct":"")+
     '" data-cl-action="option" data-answer="'+esc(o.id)+'" '+(saved!==null?"disabled":"")+
     '><span class="cl-choice-marker">'+String.fromCharCode(65+i)+
     '</span><span>'+esc(o.text)+'</span></button>').join("")+'</div>'+
   (hasSound?button("Дуу гарахгүй — үнэлгээгүй үргэлжлүүлэх","audio-unavailable","muted"):"");
 }

 case "flashcards":{
   return '<p class="cl-subtitle">'+esc(step.prompt_mn)+'</p>'+
    '<div class="cl-flashcards">'+step.items.map((x,i)=>{
      const key=step.step_id+":"+i,open=cardReveal.has(key);
      return '<button type="button" class="cl-flash'+(open?" flipped":"")+
      '" data-cl-card="'+i+'"><b lang="cs">'+esc(x.text_cs)+
      '</b><span>'+(open?esc(x.meaning_mn):"Дарж утгыг нээ")+
      '</span></button>';}).join("")+'</div>'+
    '<p class="cl-note">'+cardReveal.size+' / '+step.items.length+
      ' картын утгыг нээсэн. Үзсэн нь эзэмшсэн гэсэн үг биш.</p>'+
    button("Картын дадлагыг дуусгах","complete-cards","primary",cardReveal.size<step.items.length?"disabled":"");
 }
 case "match":{
   const matched=Object.keys(matchSelections).length,finished=stepDone(step);
   return '<p class="cl-subtitle">'+esc(step.prompt_mn)+'</p>'+
    '<p class="cl-match-instruction">① Чех үгийг дар · ② Монгол утгыг дар</p>'+
    '<div class="cl-match-board"><div class="cl-match-column" aria-label="Чех үгс">'+
    step.pairs.map((p,i)=>{
      const done=matchSelections[i]!==undefined;
      return '<button type="button" data-cl-match-word="'+i+
       '" class="cl-match-tile'+(done?" is-paired":matchActive===i?" is-active":"")+
       '" aria-pressed="'+(matchActive===i)+'" '+(done||finished?"disabled":"")+
       ' lang="cs">'+esc(p.text_cs)+'</button>';
    }).join("")+'</div><div class="cl-match-column" aria-label="Монгол утгууд">'+
    step.pairs.map((p,i)=>({p,i})).reverse().map(({p,i})=>{
      const done=Object.values(matchSelections).includes(i);
      return '<button type="button" data-cl-match-meaning="'+i+
       '" class="cl-match-tile'+(done?" is-paired":"")+'" '+(done||finished?"disabled":"")+
       '>'+esc(p.meaning_mn)+'</button>';
    }).join("")+'</div></div>'+
    '<p class="cl-match-progress" aria-live="polite">'+matched+' / '+step.pairs.length+
    ' зөв хос · Алдаа гарвал дахин сонгоорой.</p>';
 }

 case "order":{
  const chosen=orderPicked.map(i=>step.tiles[i]);
  return '<p class="cl-subtitle">'+esc(step.prompt_mn)+'</p>'+
  '<div class="cl-order-target" lang="cs">'+(chosen.length?esc(chosen.map(x=>x.text).join("")):"Үсгүүдийг дарж эвлүүл")+'</div>'+
  '<div class="cl-tiles">'+step.tiles.map((t,i)=>
   '<button type="button" class="cl-tile" data-cl-tile="'+i+'" '+(orderPicked.includes(i)?"disabled":"")+
   '>'+esc(t.text)+'</button>').join("")+'</div>'+
  button("Сүүлийн үсгийг буцаах","order-undo","muted")+
  button("Эвлүүлснийг шалгах","check-order","primary");
 }
 case "cloze":
  return '<p class="cl-subtitle">'+esc(step.prompt_mn)+'</p>'+
   '<div class="cl-cloze-preview" lang="cs">'+esc(step.pattern_cs)+'</div>'+
   '<form id="cl-cloze-form"><label class="cl-input-label">Дутуу үсэг</label>'+
   '<input type="text" id="cl-answer-input" lang="cs" autocapitalize="none" autocomplete="off" '+
   'spellcheck="false" placeholder="Чех үсгээр бич" value="'+esc(fieldValue)+'"/>'+
   button("Хариултаа шалгах","check-cloze","primary")+'</form>'+
   '<div class="cl-special">'+relevantLetters(step.answer_cs).map(x=>button(x,"special-letter","special")).join("")+'</div>';
 case "speak":
  return '<p class="cl-subtitle">'+esc(step.prompt_mn)+'</p>'+
    '<div class="cl-speaking"><strong lang="cs">'+esc(step.target_cs)+'</strong>'+
    '<p>'+esc(step.translation_mn)+'</p>'+
    speechButton(step.target_cs,"Үгийг сонсох")+'</div>'+
    button("🎙 Микрофоноор хэлэх","start-mic","primary")+
    '<p class="cl-note">Микрофоны STT бичвэр нь авианы үнэлгээ биш. Төхөөрөмж танихгүй байсан ч сурах дадлагыг үргэлжлүүлэх боломжтой.</p>'+
    '<p id="cl-transcript"></p>'+
    button("Микрофон боломжгүй — үнэлгээгүй үргэлжлүүлэх","mic-unavailable","muted");
 default:return "<p>Танигдаагүй дасгал</p>";
 }
}
function renderCompletion(lesson){
 const s=stateFor(lesson);
 const misses=s.audio_events.length?"":
 "Одоогоор баталгаажсан Чех аудионы бичлэг алга. ";
 return '<div class="cl-completion"><div class="cl-medal">✓</div>'+
  '<h2>Дадлага гүйцэтгэсэн</h2><p><b>'+esc(lesson.title_mn)+
  '</b> — '+lesson.steps.length+'/'+lesson.steps.length+' алхмыг гүйцэтгэв.</p>'+
  '<p>Энэ нь дуудлага, сонсгол, CEFR-ийн түвшин батлагдсан гэсэн дүн биш. '+
  esc(misses)+'Суралцах ахиц энэ төхөөрөмж дээр хадгалагдсан.</p>'+
  '<p>Алдсан хариултууд: '+Object.values(s.mistakes).reduce((a,b)=>a+b,0)+
  ' · Картын сан: '+Object.keys(profile.review_queue).length+'</p>'+
  (pack.lessons.some(l=>l.order===lesson.order+1)?
    button("Дараагийн хичээл →","next-lesson","primary"):"")+
  button("Энэ хичээлийг дахин үзэх","repeat-lesson","muted")+
  button("Хичээлийн жагсаалт руу","close","muted")+
  '<small class="cl-editorial">Баталгаажсан WAV, Чех хэлний редакц, дуудлагын шалгалт хүлээгдэж байна.</small></div>';
}
function draw(){
 if(!opening||!active)return;
 const lesson=getLesson(active),s=stateFor(lesson),step=currentStep();
 let wrap=ID("course-lab-overlay");
 if(!wrap){
  wrap=document.createElement("div");wrap.id="course-lab-overlay";document.body.appendChild(wrap);
 }
 wrap.hidden=false;document.documentElement.classList.add("course-lab-active");
 const progress=Math.round((s.completed.length/lesson.steps.length)*100);
 const previousKey=wrap.dataset.stepKey;
 const previousScroll=wrap.querySelector("#cl-scroll")?.scrollTop??0;
 const nextKey=lesson.lesson_id+":"+(s.finished?"completed":step?.step_id);
 const labels={model:"ТАНИЛЦ",choice:"СОНГО",flashcards:"КАРТ НЭЭ",
  listen_choice:"СОНС",match:"ХОСЛУУЛ",order:"ҮГ БҮТЭЭ",
  cloze:"БИЧ",speak:"ХЭЛЖ ҮЗ"};
 wrap.innerHTML='<div class="cl-shell"><header class="cl-header">'+
 '<button type="button" id="cl-close" aria-label="Хичээлээс гарах">‹</button>'+
 '<div><small>ČEŠTINA · '+esc(lesson.lesson_id)+'</small>'+
 '<h1>'+esc(lesson.title_mn)+'</h1></div>'+
 '<span>'+s.completed.length+'/'+lesson.steps.length+'</span></header>'+
 '<div class="cl-progress"><div style="width:'+progress+'%"></div></div>'+
 '<div class="cl-scroller" id="cl-scroll">'+
 (s.finished?renderCompletion(lesson):'<div class="cl-step-no">АЛХАМ '+
 (s.index+1)+' / '+lesson.steps.length+'</div>'+
 '<span class="cl-task-type">'+esc(labels[step.type]||"ДАСГАЛ")+'</span>'+
 '<h2>'+esc(step.title_mn)+'</h2>'+
 '<details class="cl-goal"><summary>Энэ хичээлээр юу сурах вэ?</summary>'+
 '<p>'+esc(lesson.can_do_mn)+'</p></details>'+
 '<section class="cl-exercise">'+renderStep(step)+'</section>'+
 '<p class="cl-feedback" id="cl-feedback" role="status" aria-live="polite" data-kind="'+esc(feedbackKind)+'" '+
 (!feedbackMessage?"hidden":"")+'>'+esc(feedbackMessage)+'</p>'+
 (stepDone(step)?'<div class="cl-next">'+
  button(s.index===lesson.steps.length-1?"Хичээлийг дуусгах":"Дараагийн алхам →","next-step","primary")+
  '</div>':"")+
 '<p class="cl-editorial">Туршилтын Чех–Монгол хичээл · TTS дуудлага албан ёсоор баталгаажаагүй.</p>')+
 '</div></div>';
 ID("cl-close")?.addEventListener("click",close);
 const view=ID("cl-scroll");
 if(view)view.scrollTop=previousKey===nextKey?previousScroll:0;
 wrap.dataset.stepKey=nextKey;
 if(step?.type==="listen_choice"){
  const flag=ID("cl-heard-flag");
  if(flag)flag.textContent=s.audio_events.some(x=>x.step_id===step.step_id)?
   "Browser TTS эхэлсэн · дуудлагын QA хүлээгдэж байна":"Сонсоогүй";
 }
}
function goNext(){
 const lesson=getLesson(active),s=stateFor(lesson),step=currentStep();
 if(!stepDone(step))return;
 feedbackMessage="";feedbackKind="";
 cardReveal=new Set();matchSelections={};matchActive=null;orderPicked=[];fieldValue="";
 if(s.index===lesson.steps.length-1){
  s.finished=true;s.status="PRACTICE_COMPLETE_NOT_CERTIFIED";
  s.completed_at_ms=Date.now();addFlashcards(lesson);
  store();draw();window.dispatchEvent(new CustomEvent("ahoj:course-progress-updated"));return;
 }
 s.index++;store();draw();
}
function answerOption(answerId){
 const step=currentStep();if(!step||!["choice","listen_choice"].includes(step.type))return;
 const s=stateFor(getLesson(active));
 let soundOK=true;
 if(step.type==="listen_choice"){
  soundOK=s.audio_events.some(x=>x.step_id===step.step_id);
  if(!soundOK){
   updateFeedback("bad","Сонсох товчийг эхлээд дараарай. Дуу ажиллахгүй бол текстэн хувилбарт шилжиж болно.");return;
  }
 }
 if(answerId===step.answer_id){
  finishStep({kind:step.type==="listen_choice"?"BROWSER_TTS_QUIZ_NOT_PHONEMIC_CERTIFICATION":"EXACT_CHOICE",
   correct:true,audio_verified:false,value:answerId});
  updateFeedback("good",step.feedback_mn+" · Дараагийн алхам руу шилж.");
 } else {
  const selected=step.options.find(o=>o.id===answerId)?.text??"";
  const mistakes=s.mistakes[step.step_id]??0;
  recordError(step,"«"+selected+"» тохирсонгүй. "+
   (mistakes>=1?step.feedback_mn:"Үгийн утга болон тэмдэглэгээг дахин ажигла."));
 }
}
function matchWord(index){
 const step=currentStep();
 if(step?.type!=="match"||stepDone(step)||matchSelections[index]!==undefined)return;
 matchActive=index;draw();
 updateFeedback("info","«"+step.pairs[index].text_cs+"» — баруун талын Монгол утгыг дар.");
}
function matchMeaning(index){
 const step=currentStep();if(step?.type!=="match"||stepDone(step))return;
 if(matchActive===null){updateFeedback("info","Эхлээд зүүн талын Чех үгийг сонго.");return;}
 const picked=matchActive;matchActive=null;
 if(picked!==index){
  draw();
  recordError(step,"«"+step.pairs[picked].text_cs+"» болон «"+
   step.pairs[index].meaning_mn+"» тохирохгүй. Өөр утгатай холбож үз.");
  return;
 }
 matchSelections[picked]=index;
 if(Object.keys(matchSelections).length===step.pairs.length){
  finishStep({correct:true,kind:"EXACT_MEANING_MATCH",pairs:step.pairs.length});
  updateFeedback("good","Бүх үгийг зөв утгатай холболоо.");
 }else{draw();updateFeedback("good","Зөв хос! Дараагийн Чех үгийг сонго.");}
}

function orderCheck(){
 const step=currentStep();if(step?.type!=="order")return;
 const actual=orderPicked.map(i=>step.tiles[i]?.text).join("");
 if(norm(actual)!==norm(step.target_cs)){recordError(step,"Зөв үг бүтсэнгүй. Үсгийн дарааллыг өөрчил.");return;}
 finishStep({correct:true,kind:"EXACT_GRAPHEME_ORDER",value:actual});
 updateFeedback("good",step.feedback_mn);
}
function clozeCheck(){
 const step=currentStep();if(step?.type!=="cloze")return;
 const input=ID("cl-answer-input");fieldValue=input?.value??fieldValue;
 if(norm(fieldValue)!==norm(step.answer_cs)){
  recordError(step,"Үсгийн тэмдэглэгээг дахин шалга. Чехийн урт/богино үсгийн ялгааг хадгална.");return;
 }
 finishStep({correct:true,kind:"EXACT_DIACRITIC_CLOZE",value:fieldValue});
 updateFeedback("good",step.feedback_mn);
}
function beginSpeaking(){
 const step=currentStep();if(step?.type!=="speak")return;
 const Native=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Native){
   microphoneState="UNSUPPORTED";updateFeedback("bad","Энэ Safari/WebView яриа танихгүй байна. «Үнэлгээгүй үргэлжлүүлэх» сонгож болно.");
   return;
 }
 stopMedia();const rec=new Native();
 rec.lang="cs-CZ";rec.continuous=false;rec.interimResults=false;rec.maxAlternatives=1;
 speechRecognition=rec;microphoneState="REQUESTED";
 rec.onresult=ev=>{
  const transcript=String(ev.results?.[0]?.[0]?.transcript??"").trim();
  spokenText=transcript;microphoneState="TRANSCRIPT_AVAILABLE_NOT_PHONETIC_SCORE";
  const state=stateFor(getLesson(active));
  state.speech_attempts.push({step_id:step.step_id,transcript,at_ms:Date.now(),is_pronunciation_grade:false});
  finishStep({kind:"SPEECH_ATTEMPT_NOT_GRADED",transcript});
  updateFeedback("good","Систем дараах бичвэрийг танилаа: «"+transcript+"». Дуудлага зөв гэсэн оноо биш.");
 };
 rec.onerror=ev=>{microphoneState="ERROR_"+String(ev.error);updateFeedback("bad","Микрофон: "+ev.error+" — зөвшөөрөл/танилт боломжгүй бол үнэлгээгүй үргэлжлүүл.");};
 rec.onend=()=>{speechRecognition=null;};
 try{rec.start();updateFeedback("info","Микрофон сонсож байна. Үгээ чангаар хэл.");}
 catch{microphoneState="FAILED";updateFeedback("bad","Микрофон эхлүүлэх боломжгүй.");}
}
function action(type,event){
 const step=currentStep(),lesson=getLesson(active);
 if(type==="next-step"){goNext();return;}
 if(type==="close"){close();return;}
 if(type==="complete-model"){
  if(step.examples.some((x,i)=>!cardReveal.has(step.step_id+":model:"+i)))return;
  finishStep({kind:"MODEL_ALL_MEANINGS_REVEALED_AUDIO_NOT_REQUIRED"});updateFeedback("good","Эхийг судалсан. Сонсох боломжтой байвал буцаж дууг сонсоорой.");return;}
 if(type==="complete-cards"){
  if(cardReveal.size!==step.items.length)return;
  finishStep({kind:"CARD_EXPOSURE_NOT_MASTERY",cards_seen:cardReveal.size});updateFeedback("good","Картын утгуудыг харсан; дараа нь давтлагад дахин гарна.");return;
 }
 if(type==="option"){answerOption(event.target.closest("[data-cl-action]").dataset.answer);return;}
  if(type==="order-undo"){orderPicked.pop();draw();return;}
 if(type==="check-order"){orderCheck();return;}
 if(type==="check-cloze"){clozeCheck();return;}
 if(type==="special-letter"){const input=ID("cl-answer-input");if(input){input.value+=event.target.textContent;fieldValue=input.value;input.focus();}return;}
 if(type==="start-mic"){beginSpeaking();return;}
 if(type==="mic-unavailable"){
  microphoneState="DECLARED_UNAVAILABLE";finishStep({kind:"SPEAKING_NOT_ASSESSED_MIC_UNAVAILABLE"});
  updateFeedback("info","Энэ алхмыг дуудлагаар үнэлээгүй. Дараа нь баталгаатай аудио, STT-ээр давтана.");return;
 }
 if(type==="audio-unavailable"){
  const s=stateFor(lesson);
  s.audio_events.push({step_id:step.step_id,text_cs:step.utterance.text_cs,mode:"TEXT_FALLBACK",at_ms:Date.now(),verified:false});
  finishStep({kind:"NO_AUDIO_TEXT_FALLBACK_NOT_LISTENING"});
  updateFeedback("info","Аудио сонсох алхмыг үнэлгээгүй алгасав. Хичээл зөвхөн текстэн дадлагаар үргэлжилнэ.");return;
 }
 if(type==="next-lesson"){
  const next=pack.lessons.find(l=>l.order===lesson.order+1);
  if(next)start(next.lesson_id);return;
 }
 if(type==="repeat-lesson"){
  profile.lessons[lesson.lesson_id]=undefined;delete profile.lessons[lesson.lesson_id];start(lesson.lesson_id);return;
 }
}
function bindRoot(){
 document.addEventListener("click",ev=>{
  if(!opening||!active)return;
  const target=ev.target.closest("#course-lab-overlay [data-cl-action]");
  if(target){const actionType=target.dataset.clAction;action(actionType,ev);return;}
  const say=ev.target.closest("#course-lab-overlay [data-cl-say]");
  if(say){
   const stepId=currentStep()?.step_id;
   play(say.dataset.clSay,{onStarted:()=>{
    if(opening&&currentStep()?.step_id===stepId){
     const flag=ID("cl-heard-flag");if(flag)flag.textContent="Төхөөрөмжийн TTS эхэлсэн · дуудлага батлагдаагүй";
    }
   }});
   return;
  }
  const model=ev.target.closest("#course-lab-overlay [data-cl-model]");
   if(model){cardReveal.add(currentStep().step_id+":model:"+model.dataset.clModel);draw();return;}
   const word=ev.target.closest("#course-lab-overlay [data-cl-match-word]");
   if(word){matchWord(Number(word.dataset.clMatchWord));return;}
   const meaning=ev.target.closest("#course-lab-overlay [data-cl-match-meaning]");
   if(meaning){matchMeaning(Number(meaning.dataset.clMatchMeaning));return;}
   const flip=ev.target.closest("#course-lab-overlay [data-cl-card]");
  if(flip){
   cardReveal.add(currentStep().step_id+":"+flip.dataset.clCard);
   draw();return;
  }
  const tile=ev.target.closest("#course-lab-overlay [data-cl-tile]");
  if(tile){const i=Number(tile.dataset.clTile);
   if(!orderPicked.includes(i))orderPicked.push(i);
   draw();return;
  }
 });

 document.addEventListener("input",ev=>{
  if(ev.target.id==="cl-answer-input")fieldValue=ev.target.value;
 });
 document.addEventListener("submit",ev=>{
  if(ev.target.id==="cl-cloze-form"){ev.preventDefault();clozeCheck();}
 });
 document.addEventListener("keydown",ev=>{
  if(opening&&ev.key==="Escape"){ev.preventDefault();close();}
 });
}
async function boot(){
 try{
  const resp=await fetch("./lesson-a0-t01-first3.draft.json",{cache:"no-store"});
  if(!resp.ok)throw Error("Lesson pack HTTP "+resp.status);
  const d=await resp.json();
  // Additional draft pack: preserve v0.2.0 localStorage, IDs and prior lessons.
  const additional=await fetch("./lesson-a0-t01-l04.draft.json",{cache:"no-store"});
  if(!additional.ok)throw Error("Additional lesson HTTP "+additional.status);
  const ext=await additional.json();
  const more=await fetch("./lesson-a0-t01-l05-to-l08.draft.json",{cache:"no-store"});
  if(!more.ok)throw Error("L05-L08 lesson HTTP "+more.status);
  const rest=await more.json();
  if(rest.publication?.approved!==false || rest.publication?.published!==false)
    throw Error("Unreviewed extra lesson pack must not claim publication");
  const lessons=[...d.lessons,...ext.lessons,...rest.lessons].sort((a,b)=>a.order-b.order);
  if(d.status!=="FIRST_3_LESSON_INTERACTIVE_PREVIEW_NOT_LINGUISTIC_OR_AUDIO_RELEASE" ||
     ext.publication?.approved!==false || ext.publication?.published!==false ||
     lessons.some((l,i)=>l.order!==i+1 || l.steps.length!==9 ||
       l.steps.some(s=>!supportedTypes.has(s.type))) ||
     new Set(lessons.map(l=>l.lesson_id)).size!==lessons.length)
     throw Error("Unexpected lesson data schema");
  pack={...d,lessons};profile=load();started=true;
  bindRoot();
  window.dispatchEvent(new CustomEvent("ahoj:course-ready"));
 }catch(err){blocked=true;console.error("Course preview not loaded",err);}
}

/**
 * Vocabulary bridge into the existing Premium Cards tab.
 * "Remembered" is a learner self-report, not objective Czech comprehension,
 * pronunciation or speech quality certification.
 */
function markReview(cardKey,result){
 const card=profile?.review_queue?.[cardKey];
 if(!card||card.due_at_ms>Date.now())return false;
 if(!["remembered","with_hint","forgotten"].includes(result))return false;
 card.attempts??=[];
 card.attempts.push({at_ms:Date.now(),result,graded_by:"LEARNER_SELF_REPORT_ONLY"});
 if(result==="remembered"){
  card.stage=Math.min(card.stage+1,DAYS.length-1);
  card.independent_correct+=1;
 } else if(result==="forgotten"){
  card.stage=0;card.incorrect+=1;
 } else card.stage=Math.max(0,card.stage-1);
 card.due_at_ms=Date.now()+DAYS[card.stage]*86_400_000;
 card.last_result=result;
 store();return true;
}
function decorateCardsTab(root){
 if(!started||!root)return false;
 let box=root.querySelector("#a0-lesson-course-cards");
 if(!box){box=document.createElement("section");box.id="a0-lesson-course-cards";box.className="cl-course-card-section";root.appendChild(box);}
 const cards=Object.values(profile.review_queue).sort((a,b)=>a.due_at_ms-b.due_at_ms);
 const due=cards.filter(c=>c.due_at_ms<=Date.now()).length;
 box.innerHTML='<header class="cl-course-card-head"><small>ҮЕ ДАВАХ · А0</small>'+
 '<h2>Хичээлээс сурсан үгс</h2><p>Үг сонсох, хараад санах дасгал. Суралцагчийн өөрийн үнэлгээ тул бодит ярианы баталгаа биш.</p>'+
 '<div>'+cards.length+' үг · '+due+' давтах хугацаа болсон</div></header>'+
 (cards.length?'<div class="cl-course-card-grid">'+cards.map(card=>{
  const revealed=cardReveal.has("review:"+card.card_key);
  const ready=card.due_at_ms<=Date.now();
  return '<article class="cl-course-card"><div class="cl-card-meta">'+
   esc(card.first_seen_in[0])+'</div><h3 lang="cs">'+esc(card.word_cs)+'</h3>'+
   '<small>'+esc(ready?"Давтах өдөр болсон":"Дараагийн давтлага: "+dateStamp(card.due_at_ms))+'</small>'+
   '<button type="button" class="cl-course-reveal" data-course-reveal="'+esc(card.card_key)+'">'+
   (revealed?"Утгыг нуух":"Утгыг харах")+'</button>'+
   (revealed?'<div class="cl-course-meaning">'+esc(card.meaning_mn)+'</div>':"")+
   (ready&&revealed?'<div class="cl-course-review">'+
    '<button data-course-key="'+esc(card.card_key)+'" data-course-result="remembered">Санасан</button>'+
    '<button data-course-key="'+esc(card.card_key)+'" data-course-result="with_hint">Сэжүүртэй</button>'+
    '<button data-course-key="'+esc(card.card_key)+'" data-course-result="forgotten">Мартсан</button></div>':
    '<p class="cl-card-due-note">Энэ картыг хугацаа нь болоход санаж гаргах дасгалаар шалгана.</p>')+
  '</article>';
 }).join("")+'</div>': '<p class="cl-course-empty">Эхний хичээлээ гүйцээвэл үгс автоматаар энд нэмэгдэнэ.</p>')+
 '<p class="cl-course-warning">Чех үгийн утга болон дуудлагын редакцын шалгалт хүлээгдэж байна.</p>';
 box.onclick=e=>{
  const reveal=e.target.closest("[data-course-reveal]");
  if(reveal){
   const key="review:"+reveal.dataset.courseReveal;
   if(cardReveal.has(key))cardReveal.delete(key);else cardReveal.add(key);
   decorateCardsTab(root);return;
  }
  const review=e.target.closest("[data-course-result]");
  if(review&&markReview(review.dataset.courseKey,review.dataset.courseResult)){
   cardReveal.delete("review:"+review.dataset.courseKey);
   decorateCardsTab(root);
  }
 };
 return true;
}
function renderCardsTab(root,{append=false}={}){
 if(!started||!root)return false;
 if(!append)root.innerHTML='<section class="cl-course-cards-root"><h1>Миний картууд</h1>'+
   '<p>Хичээл болон уншлагаас цугларсан үгсийг давтана.</p></section>';
 return decorateCardsTab(root);
}

window.AhojLessonLab={
 openLesson:start,close,isOpen:()=>opening,hasLesson:id=>Boolean(getLesson(id)),
 getStatus:()=>({initialized:started,blocked,story:false,ids:pack?.lessons.map(l=>l.lesson_id)||[],
   completed:pack?.lessons.filter(l=>profile?.lessons?.[l.lesson_id]?.finished).map(l=>l.lesson_id)||[],
   phoneticAudioApproved:false,editorialApproved:false,storageKey:STORAGE_KEY}),
 getProgress:()=>structuredClone(profile??{}),
 getReviewDue:()=>Object.values(profile?.review_queue??{}).filter(c=>c.due_at_ms<=Date.now()),
 renderCardsTab,decorateCardsTab,markReview
};
boot();
