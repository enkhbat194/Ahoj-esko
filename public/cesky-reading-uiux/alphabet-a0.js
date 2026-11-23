/* A0 Chapter 0 — A B C D. No mock pronunciation scores. */
(function(){'use strict';
const BASE=location.pathname.includes('/cesky-reading-uiux/')?'./index.html':'./index.html';
const WORDS=[
 {letter:'A',name:'á',sound:'/a/',word:'ananas',ipa:'/ˈananas/',mn:'Хан боргоцой',translit:'ананас',hint:'/a/ — ам ангайж хэлэх богино, нээлттэй эгшиг.',short:'А авиа.'},
 {letter:'B',name:'bé',sound:'/b/',word:'banán',ipa:'/ˈbanaːn/',mn:'Гадил',translit:'банан',hint:'/b/ — хоёр уруулаа нийлүүлж хаагаад, дуу авиатай нээнэ.',short:'Б авиа.'},
 {letter:'C',name:'cé',sound:'/t͡s/',word:'citrón',ipa:'/ˈt͡sɪtroːn/',mn:'Нимбэг',translit:'цитрон',hint:'/t͡s/ — монгол «ц»-тэй ойролцоо. /k/ биш.',short:'Ц авиа.'},
 {letter:'D',name:'dé',sound:'/d/',word:'dort',ipa:'/dort/',mn:'Торт',translit:'дорт',hint:'/d/ — хэлний үзүүрийг дээд шүдний ард ойр байрлуулж, дуу авиатай нээнэ.',short:'Д авиа.'}
];
const LESSON={picture:2,missing:2,recognition:1,speaking:2}; // Configurable question targets for each four-letter batch.
const KEY='ahoj:a0:chapter0:abcd:v1';
const state={step:0,errorCount:0,replayCount:0,attempts:[],events:[],answered:false,speechResult:null,voiceStatus:'',micBusy:false};
const exercise=document.getElementById('exercise');
const speaker='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l6 5V4L8 9H4Zm13-1a6 6 0 0 1 0 8m2-11a10 10 0 0 1 0 14"/></svg>';
const micIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4m-5 0h10"/></svg>';
function log(type,data){const item={at:new Date().toISOString(),type,step:state.step+1,...data};state.events.push(item);persist();}
function persist(){try{localStorage.setItem(KEY,JSON.stringify({version:1,lesson:'A0-C0-ABCD',savedAt:new Date().toISOString(),step:state.step,errors:state.errorCount,replays:state.replayCount,attempts:state.attempts,events:state.events,speech:state.speechResult,complete:state.step>=8}));}catch(e){console.warn('Learning progress was not stored:',e);}}
function photo(id,extra){return '<span class="fruit-photo '+(extra||'')+'" role="img" aria-label="'+WORDS[id].mn+'" data-fruit="'+id+'"></span>';}
function player(){return '<section class="audio-card glass" aria-label="Сонсох аудио"><button type="button" class="round-btn" data-replay aria-label="Дахин сонсох">'+speaker+'</button><div class="wave" aria-hidden="true">'+Array.from({length:23},(_,i)=>'<i style="height:'+ (7+(Math.sin(i*.9)**2)*30+(i%5)*2) +'px"></i>').join('')+'</div></section>';}
function heading(title,icon,auto){return '<div class="section-title"><div class="title-group"><span class="badge-icon">'+icon+'</span><h2>'+title+'</h2></div>'+(auto?'<span class="autoplay" id="audioBadge">▶ Аудио автоматаар тоглоно</span>':'')+'</div>';}
function fb(){return '<div class="feedback" id="feedback" role="status"></div>';}
function showFeedback(text,wrong){const el=document.getElementById('feedback');if(el){el.textContent=(wrong?'✕ ':'✓ ')+text;el.classList.toggle('bad',!!wrong);}}
function render(){if(state.step>=8){renderComplete();return;}exercise.classList.toggle('is-speaking',state.step===7);exercise.classList.remove('is-result');const k=state.step;state.answered=false;document.getElementById('progressCount').textContent=(k+1)+'/8';document.getElementById('progressFill').style.width=((k+1)/8*100)+'%';
 if(k<4){const w=WORDS[k];exercise.innerHTML=heading('Үсэгтэй танилцъя','▣',true)+'<div class="intro"><div class="letter-card glass"><span class="letter-block">'+w.letter+'</span><div class="letter-copy"><div>Үсгийн нэр: <b>'+w.name+'</b></div><div>Үндсэн авиа: <b>'+w.sound+'</b></div></div></div><div class="vocab-card glass">'+photo(k)+'<div class="vocab-copy"><div class="vocab-head"><strong>'+w.word+'</strong><button class="round-btn" data-replay aria-label="'+w.word+' дахин сонсох">'+speaker+'</button></div><span class="ipa">'+w.ipa+'</span><span class="meaning">'+w.mn+'</span><span class="translit">'+w.translit+'</span></div></div><div class="tip"><b>Авиа зүйн зөвлөмж:</b> '+w.hint+'</div><button type="button" class="cta" id="next">Дараах →</button></div>';document.getElementById('next').addEventListener('click',()=>advance());}
 else if(k===4){exercise.innerHTML=heading('Сонсож зураг сонго','◉',false)+'<p class="question-help">Нэг үг сонсогдоно. Тохирох зургийг товшоорой.</p>'+player()+'<div class="choice-grid">'+WORDS.map((w,i)=>'<button class="picture-choice" type="button" data-choice="'+i+'">'+photo(i)+'<strong>'+w.word+'</strong></button>').join('')+'</div>'+fb();listenChoices(LESSON.picture);}
 else if(k===5){exercise.innerHTML=heading('Дутуу үсгийг нөх','▣',true)+player()+'<div class="fill-card glass">'+photo(LESSON.missing)+'<span class="missing-word">_'+WORDS[LESSON.missing].word.slice(1)+'</span></div><div class="tip">Энэ үгийн <b>эхний</b> дутуу үсгийг сонго.</div><div class="letter-choices">'+WORDS.map((w,i)=>'<button class="letter-choice" type="button" data-choice="'+i+'">'+w.letter+'</button>').join('')+'</div>'+fb();listenChoices(LESSON.missing);}
 else if(k===6){exercise.innerHTML=heading('Сонсож үг таних','◉',false)+player()+'<div class="text-choices">'+WORDS.map((w,i)=>'<button class="text-choice" type="button" data-choice="'+i+'">'+w.word+'<span class="circle-choice"></span></button>').join('')+'</div>'+fb();listenChoices(LESSON.recognition);}
 else {renderMic();}
 exercise.querySelectorAll('[data-replay]').forEach(el=>el.addEventListener('click',()=>playCurrent(true)));
 if(k!==7){setTimeout(()=>{if(state.step===k)playCurrent(false);},180);} }
function listenChoices(expected){exercise.querySelectorAll('[data-choice]').forEach(btn=>btn.addEventListener('click',()=>{if(state.answered)return;const chosen=Number(btn.dataset.choice);const correct=chosen===expected;state.attempts.push({step:state.step+1,expected:WORDS[expected].word,chosen:WORDS[chosen].word,correct,time:new Date().toISOString()});if(!correct){state.errorCount++;log('incorrect',{expected:WORDS[expected].word,chosen:WORDS[chosen].word});showFeedback('Дахин оролдоорой. Аудиог сонсоод засах боломжтой.',true);btn.style.borderColor='#dd8186';return;}state.answered=true;log('correct',{word:WORDS[expected].word,attempts:state.attempts.filter(x=>x.step===state.step+1).length});btn.classList.add('selected');btn.insertAdjacentHTML('beforeend','<span class="check-mark" aria-hidden="true">✓</span>');showFeedback('Зөв! '+WORDS[expected].word+' · автоматаар үргэлжилнэ',false);exercise.querySelectorAll('[data-choice]').forEach(el=>el.disabled=true);setTimeout(()=>{if(state.answered)advance();},900);}));}
function advance(){stopAudio();state.step++;persist();render();}
let currentUtterance=null;let lastAudio=null;
function stopAudio(){try{if(lastAudio){lastAudio.pause();lastAudio=null;}if('speechSynthesis' in window)speechSynthesis.cancel();}catch(_){}currentUtterance=null;}
function playCurrent(replay,forcedIndex){if(replay){state.replayCount++;log('replay',{});}const target=Number.isInteger(forcedIndex)?forcedIndex:state.step<4?state.step:state.step===4?LESSON.picture:state.step===5?LESSON.missing:state.step===6?LESSON.recognition:LESSON.speaking;const word=WORDS[target];if(!word)return;stopAudio();const badge=document.getElementById('audioBadge');if(badge)badge.textContent='♪ Дуудлагыг сонсоорой';
 const audio=new Audio('../audio/words/'+encodeURIComponent(word.word)+'.wav');lastAudio=audio;
 const onDone=()=>{if(badge)badge.textContent='↻ Дахин сонсох боломжтой';if(state.step===7&&!state.micBusy){const status=document.getElementById('micInstruction');let granted=false;try{granted=sessionStorage.getItem('ahoj-mic-granted')==='1';}catch(_){}if(granted&&(window.SpeechRecognition||window.webkitSpeechRecognition)){if(status)status.textContent='Жишээ аудио дууслаа. Микрофоныг идэвхжүүлж байна.';startRecognition();}else if(status)status.textContent='Жишээ аудио дууслаа. Микрофоны товчийг дарж ярина уу.';}};
 audio.addEventListener('ended',onDone,{once:true});audio.play().catch(()=>{if(lastAudio!==audio)return;if(!('speechSynthesis' in window)){if(badge)badge.textContent='Аудио байхгүй — дахин сонсох';onDone();return;}const utter=new SpeechSynthesisUtterance(word.word);utter.lang='cs-CZ';utter.rate=.78;const voices=speechSynthesis.getVoices().filter(v=>v.lang.toLowerCase().startsWith('cs'));if(voices.length)utter.voice=voices[0];currentUtterance=utter;utter.onend=onDone;utter.onerror=()=>{if(badge)badge.textContent='Аудио тоглуулах боломжгүй';onDone();};speechSynthesis.speak(utter);log('audio_fallback',{source:'browser-tts-unverified',word:word.word});});}
let recognition=null;
function renderMic(){
 const w=WORDS[LESSON.speaking];
 exercise.classList.add('is-speaking');
 exercise.innerHTML=heading('Дуудлага шалгах','♩',false)
 +'<div class="mic-word glass">'+photo(LESSON.speaking)+'<div class="vocab-copy"><div class="vocab-head"><strong>'+w.word+'</strong><button type="button" class="round-btn" data-replay aria-label="Дуудлагыг дахин сонсох">'+speaker+'</button></div><span class="ipa">'+w.ipa+'</span><span class="meaning">'+w.mn+'</span></div></div>'
 +'<p class="mic-instruction" id="micInstruction">Жишээ дуудлагыг сонсоод микрофоныг дарна уу. Эхний удаа зөвшөөрөл шаардлагатай.</p>'
 +'<div class="mic-panel glass"><button type="button" class="mic-button" id="micStart" aria-label="Микрофон асаах">'+micIcon+'</button><p id="micLabel">Ярихад бэлэн</p></div>'
 +'<div class="mic-feedback" id="micFeedback" role="status" hidden><strong id="pronStatus">—</strong><span id="heardText"></span><small id="pronNote">Яриа танилт нь дуудлагын нарийвчилсан оноо биш.</small><button type="button" class="retry-mini" id="retry">↻ Дахин оролдох</button></div>'
 +'<button type="button" class="cta" id="finish">Үр дүн харах →</button>';
 exercise.querySelector('[data-replay]').addEventListener('click',()=>playCurrent(true));
 document.getElementById('micStart').addEventListener('click',startRecognition);
 document.getElementById('retry').addEventListener('click',()=>{state.speechResult=null;document.getElementById('micFeedback').hidden=true;document.getElementById('micLabel').textContent='Ярихад бэлэн';startRecognition();});
 document.getElementById('finish').addEventListener('click',()=>{log('lesson_finished',{speechResult:state.speechResult});if(recognition&&state.micBusy){try{recognition.abort();}catch(_){}state.micBusy=false;}advance();});
 setTimeout(()=>{if(state.step===7)playCurrent(false);},180);
}
function showMicResult(status,heard,note){
 const f=document.getElementById('micFeedback');if(!f)return;
 f.hidden=false;
 document.getElementById('pronStatus').textContent=status;
 document.getElementById('heardText').textContent=heard||'';
 document.getElementById('pronNote').textContent=note||'Яриа танилт нь дуудлагын нарийвчилсан оноо биш.';
}
function startRecognition(){
 if(state.micBusy)return;
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Speech){document.getElementById('micLabel').textContent='Яриа таних боломжгүй';showMicResult('Энэ браузер дэмжихгүй','', 'Хичээлийн үр дүнг үзэж болно. Дуудлагын оноо зохиож харуулахгүй.');log('stt_unavailable',{});return;}
 try{
  recognition=new Speech();recognition.lang='cs-CZ';recognition.interimResults=false;recognition.maxAlternatives=1;
  recognition.onstart=()=>{if(state.step!==7)return;state.micBusy=true;try{sessionStorage.setItem('ahoj-mic-granted','1');}catch(_){}const label=document.getElementById('micLabel');if(label)label.textContent='Сонсож байна…';const f=document.getElementById('micFeedback');if(f)f.hidden=true;};
  recognition.onresult=e=>{if(state.step!==7)return;const heard=(e.results[0]?.[0]?.transcript||'').trim();const norm=s=>s.toLocaleLowerCase('cs-CZ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,'');const matched=norm(heard)===norm(WORDS[LESSON.speaking].word);state.speechResult={recognized:heard,recognizedTarget:matched,method:'browser-stt',pronunciationScore:null};const label=document.getElementById('micLabel');if(label)label.textContent='Сонсож дууслаа';showMicResult(matched?'Үг танигдлаа':'Үгийг таньсангүй',heard?'Сонссон үг: '+heard:'',matched?'Яриа танилтын үр дүн; дуудлагын үнэлгээ биш.':'Та дахин хэлж болно, эсвэл үр дүнгээ үзэж болно.');log('stt_result',state.speechResult);};
  recognition.onerror=e=>{if(state.step!==7)return;state.micBusy=false;const label=document.getElementById('micLabel');if(label)label.textContent='Микрофон: '+e.error;showMicResult('Үнэлэх боломжгүй','', 'Зөвшөөрөл эсвэл төхөөрөмжийн хязгаарлалт гарлаа. Хичээлээ дуусгаж болно.');log('stt_error',{error:e.error});};
  recognition.onend=()=>{state.micBusy=false;};
  recognition.start();
 }catch(e){state.micBusy=false;const label=document.getElementById('micLabel');if(label)label.textContent='Микрофоныг асааж чадсангүй';showMicResult('Үнэлэх боломжгүй','', 'Хичээлээ дуусгаж болно.');log('stt_error',{error:String(e)});}
}
function renderComplete(){
 exercise.classList.remove('is-speaking');exercise.classList.add('is-result');
 document.getElementById('progressCount').textContent='8/8';document.getElementById('progressFill').style.width='100%';
 const speech=state.speechResult;const sttText=speech?(speech.recognizedTarget?'Яриа танилтаар үг танигдсан.':'Яриа танилтаар үг бүрэн танигдаагүй.'):'Ярианы үнэлгээ хийгдээгүй.';
 const needsC=state.attempts.some(a=>a.expected==='citrón'&&!a.correct);
 const tip=needsC?'C үсгийн /t͡s/ авиаг дахин сонсож бататгаарай.':state.errorCount?'Алдаа гаргасан үгсээ дахин сонсож давтаарай.':'Үгсээ мартахгүйн тулд дараа нь дахин сонсоорой.';
 exercise.innerHTML='<div class="summary-complete">'
  +'<div class="result-hero"><span class="result-check" aria-hidden="true">✓</span><h2>Хичээл дууслаа</h2><p>Эхний дөрвөн үсэг, үгтэй танилцлаа.</p></div>'
  +'<section class="result-words glass"><h3>Үзсэн үг (4)</h3><div class="result-grid">'+WORDS.map((w,i)=>'<div class="result-word">'+photo(i)+'<span>'+w.word+'</span><button type="button" data-play-word="'+i+'" aria-label="'+w.word+' сонсох">'+speaker+'</button></div>').join('')+'</div></section>'
  +'<div class="result-stats glass"><div class="stat"><strong>'+state.attempts.length+'</strong><span>Сонголтын оролдлого</span></div><div class="stat"><strong>'+state.errorCount+'</strong><span>Алдаа</span></div><div class="stat"><strong>'+state.replayCount+'</strong><span>Давтан сонссон</span></div></div>'
  +'<div class="result-tip"><b>Бататгах:</b> '+tip+'<br><span>'+sttText+' Энэ нь дуудлагын оноо биш.</span></div>'
  +'<div class="result-actions"><button type="button" class="cta" id="goHome">Үе давах хэсэгт буцах →</button><button type="button" class="subtle" id="restart">↻ Дахин сурах</button></div>'
  +'</div>';
 document.querySelectorAll('[data-play-word]').forEach(b=>b.addEventListener('click',()=>playCurrent(true,Number(b.dataset.playWord))));
 document.getElementById('goHome').addEventListener('click',()=>{stopAudio();location.href=BASE+'?tab=stages';});
 document.getElementById('restart').addEventListener('click',()=>{stopAudio();state.step=0;state.errorCount=0;state.replayCount=0;state.events=[];state.attempts=[];state.speechResult=null;persist();render();});
}
function init(){document.getElementById('goBack').addEventListener('click',()=>{stopAudio();location.href=BASE+'?tab=stages';});try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved?.lesson==='A0-C0-ABCD'&&Number.isInteger(saved.step)&&saved.step>=0&&saved.step<=8){state.step=saved.step;state.errorCount=saved.errors||0;state.replayCount=saved.replays||0;state.attempts=saved.attempts||[];state.events=saved.events||[];state.speechResult=saved.speech||null;}}catch(_){}render();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAudio();});init();
})();