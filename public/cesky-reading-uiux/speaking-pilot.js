(()=>{"use strict";
function normalize(s){return String(s).normalize("NFC").toLocaleLowerCase("cs-CZ").replace(/[.,!?;:]/g,"").trim().replace(/\s+/g," ");}
function speechMatch(heard,models,open){return open?"ungraded":models.some(m=>normalize(m)===normalize(heard))?"recognized":"unmatched";}
function buildMatch(chosen,answer){return chosen.length===answer.length&&chosen.every((v,i)=>v===answer[i]);}
const lessons=window.AHOJ_SPEAKING_PILOT?.lessons||[],root=document.getElementById("exercise"),count=document.getElementById("count"),bar=document.querySelector("progress"),audioStatus=document.getElementById("audioStatus");
const id=new URLSearchParams(location.search).get("lesson")||lessons[0]?.id,lesson=lessons.find(l=>l.id===id);
if(!lesson){root.textContent="Хичээл олдсонгүй. Үндсэн апп руу буцна уу.";return;}
document.getElementById("lessonTitle").textContent=lesson.title;
const key="ahoj:speaking-pilot:v1:"+id;let saved={};try{saved=JSON.parse(localStorage.getItem(key)||"{}")||{};}catch(_){}
const blank=()=>({correct:0,wrong:0,recognized:0,unmatched:0,open:0,assisted:0,unverified:0,listeningSkipped:0});
let step=Number.isInteger(saved.step)&&saved.step>=0&&saved.step<=9?saved.step:0,stats=Object.assign(blank(),saved.stats||{}),sub=0,generation=0,recognition=null,utter=null,audioOK=false;
if(step===9&&new URLSearchParams(location.search).get("restart")==="1"){step=0;stats=blank();}
function persist(){try{localStorage.setItem(key,JSON.stringify({step,stats,completed:step===9}));}catch(_){}}
const E=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;};
function B(txt,fn,cls){const b=E("button",cls,txt);b.type="button";b.addEventListener("click",fn);return b;}
function add(...els){root.append(...els);}
function heading(label,title,desc){add(E("div","tag",label),E("h1","",title));if(desc)add(E("p","muted",desc));}
function footer(...buttons){const f=E("div","foot");f.append(...buttons);add(f);}
function status(){let p=E("p","status","");p.setAttribute("role","status");add(p);return p;}
function cleanup(){generation++;audioOK=false;if(recognition){try{recognition.abort();}catch(_){}recognition=null;}if(window.speechSynthesis){try{speechSynthesis.cancel();}catch(_){}}utter=null;audioStatus.textContent="";}
function next(){cleanup();step++;sub=0;persist();render();}
function advanceItem(total){if(sub+1>=total)next();else{sub++;render();}}
function delayNext(fn){const g=generation;setTimeout(()=>{if(g===generation)fn();},650);}
function play(text,onDone){if(recognition){try{recognition.abort();}catch(_){}recognition=null;}audioStatus.textContent="";audioOK=false;
 if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){audioStatus.textContent="Энэ төхөөрөмжийн аудио дэмжигдэхгүй.";return;}
 speechSynthesis.cancel();const voice=speechSynthesis.getVoices().find(v=>/^cs(?:-|$)/i.test(v.lang));
 if(!voice){audioStatus.textContent="Чех хэлний төхөөрөмжийн хоолой олдсонгүй. Баталгаажсан аудио хараахан холбоогүй.";return;}
 const g=generation,u=new SpeechSynthesisUtterance(text);utter=u;u.lang="cs-CZ";u.voice=voice;u.rate=.82;audioStatus.textContent="Төхөөрөмжийн Чех TTS · туршилтын аудио";
 u.onend=()=>{if(g!==generation)return;audioOK=true;utter=null;audioStatus.textContent="Аудио дууслаа.";if(onDone)onDone();};
 u.onerror=()=>{if(g===generation){utter=null;audioStatus.textContent="Аудио тоглуулж чадсангүй.";}};
 speechSynthesis.speak(u);
}
function audioButton(text,done){return B("▷  Сонсох",()=>play(text,done));}
function micPanel(models,open,onAdvance,allowReveal=true){const box=E("section","speak"),feedback=E("p","status","Микрофоныг дарж ярина уу."),model=E("div","card");model.hidden=true;const g=generation;let busy=false,finished=false,revealed=false,result="unverified";
 const mic=B("",start,"mic");mic.setAttribute("aria-label","Чехээр ярих");mic.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4m-5 0h10"/></svg>';
 function start(){if(busy||finished||g!==generation)return;const R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R){feedback.textContent="Энэ хөтөч яриа танихгүй. Өөрөө хэлж, жишээтэй харьцуулна уу.";return;}if(window.speechSynthesis)speechSynthesis.cancel();let r;try{r=new R();recognition=r;r.lang="cs-CZ";r.interimResults=false;r.maxAlternatives=1;busy=true;mic.disabled=true;feedback.textContent="Микрофон асаж байна…";r.onstart=()=>{if(g===generation)feedback.textContent="Сонсож байна…";};r.onresult=e=>{if(g!==generation)return;const heard=e.results[0]?.[0]?.transcript||"";result=speechMatch(heard,models,open);feedback.textContent="Танигдсан текст: "+heard+(result==="recognized"?" · Загварт таарлаа.":result==="ungraded"?" · Нээлттэй хариуг автоматаар үнэлээгүй.":" · Загварт яг таараагүй. Дахин хэлж болно.")+" Дуудлагын оноо биш.";};r.onerror=e=>{if(g===generation)feedback.textContent="Яриа танилт амжилтгүй ("+e.error+"). Дахин оролдох эсвэл үнэлгээгүй үргэлжлүүлэх боломжтой.";};r.onend=()=>{if(g===generation){busy=false;mic.disabled=false;recognition=null;}};r.start();}catch(_){busy=false;mic.disabled=false;feedback.textContent="Микрофон ажилласангүй.";}}
 function finish(){if(finished||busy)return;finished=true;if(revealed)stats.assisted++;else stats[result==="ungraded"?"open":result]++;onAdvance();}
 box.append(mic,feedback,E("small","muted","Яриа таних үйлчилгээ ашиглагдаж болно. Энэ нь авиа, дуудлагын нарийвчилсан үнэлгээ биш."));
 if(allowReveal){const reveal=B("Жишээ хариу харах",()=>{revealed=true;model.hidden=false;reveal.disabled=true;});model.append(E("p","",models.join(" / ")),audioButton(models[0]));box.append(reveal,model);}
 add(box);footer(B("Үргэлжлүүлэх",finish,"primary"));
}
function options(prompt,choices,answer,after,needAudio=false){if(prompt)add(E("div","card cz",prompt));const box=E("div","options"),p=status();let locked=false;const btns=[];choices.forEach(c=>{const b=B(c,()=>{if(locked)return;if(needAudio&&!audioOK){p.textContent="Эхлээд аудио сонсоно уу.";return;}if(c===answer){locked=true;b.classList.add("correct");stats.correct++;p.textContent="✓ Зөв";btns.forEach(x=>x.disabled=true);root.querySelectorAll(".foot button").forEach(x=>x.disabled=true);delayNext(after);}else{stats.wrong++;b.classList.add("wrong");p.textContent="Дахин оролдоорой.";}});btns.push(b);box.append(b);});root.insertBefore(box,p);}
function matching(s){heading("БАТАТГАХ","Үг, утгыг холбоорой");const grid=E("div","matching"),p=status(),pairs=s.pairs;let left=null,right=null,done=new Set();let ls=[],rs=[];const order=pairs.map((_,i)=>i).reverse();function pick(side,i,b){if(done.has(i))return;if(side===0){ls.forEach(x=>x.classList.remove("chosen"));left=i;}else{rs.forEach(x=>x.classList.remove("chosen"));right=i;}b.classList.add("chosen");if(left!==null&&right!==null){if(left===right){done.add(left);ls[left].disabled=true;rs[left].disabled=true;ls[left].classList.add("correct");rs[left].classList.add("correct");stats.correct++;p.textContent=done.size+"/"+pairs.length+" · Зөв";}else{stats.wrong++;p.textContent="Энэ хоёр тохирохгүй байна.";}ls[left].classList.remove("chosen");rs[right].classList.remove("chosen");left=right=null;if(done.size===pairs.length)delayNext(next);}}
 pairs.forEach((pair,i)=>{ls[i]=B(pair[0],()=>pick(0,i,ls[i]));rs[i]=B(pair[1],()=>pick(1,i,rs[i]));});pairs.forEach((_,i)=>grid.append(ls[i],rs[order[i]]));root.insertBefore(grid,p);}
function builder(s){heading("ӨГҮҮЛБЭР","Үгсийг дарааллаар байрлуул",s.mn);let selected=[];const answer=E("div","answer"),bank=E("div","bank"),p=status();const buttons=s.tokens.map((t,i)=>B(t,()=>{selected.push(i);draw();}));const undo=B("Буцаах",()=>{selected.pop();draw();});let locked=false;
 function draw(){answer.replaceChildren(...selected.map((i,j)=>B(s.tokens[i],()=>{if(!locked){selected.splice(j,1);draw();}})));buttons.forEach((b,i)=>b.disabled=selected.includes(i)||locked);undo.disabled=!selected.length||locked;if(selected.length===s.answer.length){if(buildMatch(selected.map(i=>s.tokens[i]),s.answer)){locked=true;stats.correct++;p.textContent="✓ Зөв";buttons.forEach(b=>b.disabled=true);undo.disabled=true;delayNext(next);}else{stats.wrong++;p.textContent="Дарааллыг засна уу.";}}else p.textContent="";}
 bank.append(...buttons);root.insertBefore(answer,p);root.insertBefore(bank,p);footer(undo);draw();}
function render(){cleanup();root.replaceChildren();count.textContent=Math.min(step+1,9)+"/9";bar.value=Math.min(step+1,9);if(step===9){count.textContent="9/9";heading("ДУУСЛАА",lesson.title,"Хичээлийн дасгал дууссан. Эзэмшсэн чадварын баталгаа биш.");const res=E("div","result card");[["Зөв хариулсан оролдлого",stats.correct],["Буруу оролдлого",stats.wrong],["Яриа загварт таарсан",stats.recognized],["Загварт таараагүй",stats.unmatched],["Нээлттэй · үнэлээгүй",stats.open],["Тусламжтай",stats.assisted],["Баталгаажаагүй яриа",stats.unverified],["Алгассан сонсгол",stats.listeningSkipped]].forEach(([k,v])=>{const p=E("p","",k+" · ");p.append(E("strong","",String(v)));res.append(p);});add(res);const n=lessons[lessons.indexOf(lesson)+1],a=E("a","button primary",n?"Дараагийн хичээл":"Үндсэн апп");a.href=n?"?lesson="+encodeURIComponent(n.id):"./index.html";footer(a,B("Дахин хийх",()=>{step=0;sub=0;stats=blank();persist();render();}));return;}
 const s=lesson.steps[step];if(s.type==="learn"){heading("ШИНЭ ХЭЛЛЭГ","Сонсоод дагаж хэлээрэй");const c=E("div","card hero");c.append(E("div","cz",s.cz),E("p","",s.mn),audioButton(s.example||s.cz));if(s.hint)c.append(E("small","",s.hint));add(c);micPanel([s.example||s.cz,s.cz],false,next,false);}
 else if(s.type==="match")matching(s);
 else if(s.type==="listen"){const item=s.items[sub];heading("СОНСОХ · "+(sub+1)+"/"+s.items.length,"Сонссон хэллэгээ сонго");add(audioButton(item.cz));options(null,item.options,item.cz,()=>advanceItem(s.items.length),true);footer(B("Аудио байхгүй · алгасах",()=>{stats.listeningSkipped++;advanceItem(s.items.length);}));}
 else if(s.type==="gap"||s.type==="context"){heading(s.type==="gap"?"ХЭЛЛЭГ":"БОДИТ НӨХЦӨЛ",s.type==="gap"?"Дутуу хэсгийг нөх":"Тохирох хариуг сонго",s.type==="context"?s.prompt:null);options(s.type==="gap"?s.prompt:null,s.options,s.answer,next);}
 else if(s.type==="build")builder(s);
 else if(s.type==="dialogue"||s.type==="recall"){const item=s.items[sub];heading((s.type==="dialogue"?"ХАРИЛЦАН ЯРИА":"САНАЖ ХЭЛЭХ")+" · "+(sub+1)+"/"+s.items.length,"Өөрөө Чехээр хэлээрэй");if(item.partner){const p=E("div","partner");p.append(E("small","","Харилцагч"),E("p","",item.partner),audioButton(item.partner));add(p);}add(E("div","card hero",item.mn));micPanel(item.models,!!item.open,()=>advanceItem(s.items.length));}
 else {heading("АЛДАА","Дасгалын төрөл танигдсангүй");footer(B("Алгасах",next));}
}
window.addEventListener("pagehide",cleanup);render();
})();