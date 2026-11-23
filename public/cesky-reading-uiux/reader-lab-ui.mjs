/**
 * AHOJ Reader Lab — opt-in browser vertical slice, ?reader_lab=1.
 * Original published reader and lesson pages stay unchanged by default.
 * This module never requests or generates TTS and never sends learner data out.
 */
import {
  startReaderChapter, tokenizeCzech, recordReaderEvent,
  readerWordTooltip, createLearnerReadingProfile, commitReaderAttempt,
  activateGlobalReadingCards, reviewGlobalReadingCard,
  suggestLearningFocus
} from "./reader-lab-engine.mjs";

const ENABLED = new URLSearchParams(location.search).get("reader_lab") === "1";
const PROFILE_KEY="ahoj.reader.lab.profile.v1";
const SESSIONS_KEY="ahoj.reader.lab.sessions.v1";
const escapeHtml = x => String(x ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const safeRead = (key, fallback) => {
  try {const value=JSON.parse(localStorage.getItem(key));return value&&typeof value==="object"?value:fallback;}
  catch {return fallback;}
};
const safeSave = (key,value) => {
  try {localStorage.setItem(key,JSON.stringify(value));return true;}
  catch {return false;}
};
const dayLabel = millis => Number.isFinite(millis)
  ? new Date(millis).toLocaleDateString("mn-MN",{year:"numeric",month:"short",day:"numeric"})
  : "—";
let content=null;
let profile=createLearnerReadingProfile();
let sessions={};
let active=null,activeBook=null,activeChapter=null;
let selectedToken=null;
let lastError="";
let savedOk=true;
let currentCardRevealed=false;
let dictionaryQuery="";
let initialized=false;
const byId = id => document.getElementById(id);
const findBook=id=>content?.books.find(b=>b.story_id===id);
const now=()=>Date.now();
const chapterTokens = chapter => chapter.sentences.flatMap(s=>tokenizeCzech(s.text_cs).map(t=>({
  sentence_id:s.sentence_id, start:t.start, text:t.text
})));

function persist() {
  const a=safeSave(PROFILE_KEY,profile);
  const b=safeSave(SESSIONS_KEY,sessions);
  savedOk=a&&b;
  return savedOk;
}
function persistChapter() {
  if(!active)return;
  sessions[active.chapter_id]=active;
  persist();
}
function profileSourceInfo(){
  return "Туршилтын контент · Чех найруулга, орчуулга, уншлагын түвшин батлагдаагүй · Аудио хараахан байхгүй.";
}
function setupStyle() {
  if(byId("reader-lab-style"))return;
  const link=document.createElement("link");
  link.id="reader-lab-style";link.rel="stylesheet";
  link.href="./reader-lab-ui.css?v=1";document.head.appendChild(link);
}
function storyCards() {
  const query=byId("bookSearchInput")?.value?.trim()?.toLocaleLowerCase("cs-CZ")||"";
  const visible=content.books.filter(book =>
   !query || (book.title_mn+" "+book.title_cs+" "+book.genre).toLocaleLowerCase("cs-CZ").includes(query));
  return visible.map((book,i)=>{
   const gradient=[
     "linear-gradient(145deg,#17334b,#215c6c 48%,#161d31)",
     "linear-gradient(145deg,#362139,#7b3754 55%,#20172b)",
     "linear-gradient(145deg,#0e3b52,#167d8a 55%,#182a42)"
   ][i%3];
   const tag=book.genre==="science_curiosity"?"Танин мэдэхүй":
     book.genre==="romance_mystery"?"Хайр · Нууц":"Нууц · Адал явдал";
   const chapter=book.chapters[0];
   const finished=profile.reading_history.some(x=>x.chapter_id===chapter.chapter_id);
   return '<article class="book-card lab-in-library" role="button" tabindex="0" data-lab-open="'+
     escapeHtml(book.story_id)+'" aria-label="'+escapeHtml(book.title_mn)+' унших">'+
     '<div class="book-cover" style="background:'+gradient+'">'+
       '<div class="book-cover-deco" aria-hidden="true"><span class="lab-cover-glow">✧</span></div>'+
       '<div class="book-cover-top"><div class="book-badges">'+
         '<span class="badge-cefr">'+escapeHtml(book.reading_tier.includes("A1")?"A1":"A0+")+'</span>'+
         '<span class="badge-lps">ЭХ · DRAFT</span></div></div>'+
       '<div class="cover-center-title"><div class="cover-main-text">'+escapeHtml(book.title_mn)+
       '</div><span class="cover-cat-tag">'+escapeHtml(tag)+'</span></div>'+
       '<div class="book-cover-bottom"><span class="age-pill">'+chapter.sentences.length+
       ' өгүүлбэр</span></div></div>'+
       '<div class="book-info"><h3 class="book-title">'+escapeHtml(book.title_mn)+
       '</h3><p class="book-mn-sub" lang="cs">'+escapeHtml(book.title_cs)+'</p>'+
       '<div class="book-meta"><span>'+escapeHtml(tag)+' · 1 бүлэг'+
         (finished?" · Уншсан":"")+'</span></div></div></article>';
  }).join("");
}
function decorateReadingView() {
 if(!ENABLED || !initialized || !content)return;
 const nav=byId("navGrid")?.querySelector('[data-tab="read"]');
 if(nav?.getAttribute("aria-current")!=="page")return;
 const container=byId("readingScroll");
 const grid=container?.querySelector(".books-grid");
 if(!grid||grid.querySelector(".lab-in-library"))return;
 const markup=storyCards();
 if(!markup)return;
 grid.insertAdjacentHTML("beforeend",markup);
 const count=container.querySelector(".count-pill");
 if(count){
   const originals=grid.querySelectorAll(".book-card:not(.lab-in-library)").length;
   const drafts=grid.querySelectorAll(".lab-in-library").length;
   count.textContent=(originals+drafts)+" ном";
 }
 grid.querySelectorAll(".lab-in-library").forEach(card=>{
  card.addEventListener("click",()=>openReader(card.dataset.labOpen));
  card.addEventListener("keydown",event=>{
    if(event.key==="Enter"||event.key===" "){event.preventDefault();openReader(card.dataset.labOpen);}
  });
 });
}
function chapterMarkup(chapter) {
 return chapter.sentences.map(sentence=>{
  let at=0;const parts=[];
  const tokens=tokenizeCzech(sentence.text_cs);
  const normalized=active.tokens.filter(t=>t.sentence_id===sentence.sentence_id);
  for(const t of tokens){
    parts.push(escapeHtml(sentence.text_cs.slice(at,t.start)));
    const target=normalized.find(x=>x.start===t.start);
    if(!target)throw new Error("Reader word offset mismatch");
    parts.push('<button type="button" class="lab-word'+
      (target.sense_known?" is-known":"")+'" data-lab-token="'+target.token_order+
      '" lang="cs" aria-label="'+escapeHtml(t.text)+' үгийн тайлбар">'+
      escapeHtml(t.text)+'</button>');
    at=t.end;
  }
  parts.push(escapeHtml(sentence.text_cs.slice(at)));
  return '<p class="lab-sentence" lang="cs">'+parts.join("")+'</p>';
 }).join("");
}
function quizMarkup(chapter) {
 return chapter.comprehension_checks.map(q=>{
  const old=active.answer_log.find(x=>x.question_id===q.id);
  const pick=old?.choice_index;
  const verdict=old?(old.correct?"Зөв. Утгыг таньжээ.":"Алдаатай. Утгыг дахин шалгаарай."):"";
  return '<div class="lab-question"><div class="lab-qtext">'+escapeHtml(q.question_mn)+'</div>'+
  '<div class="lab-choices">'+q.choices_mn.map((choice,i)=>
   '<button type="button" data-lab-q="'+escapeHtml(q.id)+'" data-lab-choice="'+i+'" '+
   (old?"disabled ":"")+
   'class="lab-choice '+(old&&pick===i?(old.correct?"is-correct":"is-incorrect"):"")+
   '">'+escapeHtml(choice)+'</button>').join("")+'</div>'+
   '<p class="lab-feedback" aria-live="polite">'+escapeHtml(verdict)+'</p></div>';
 }).join("");
}
function readerHeader(){
 return '<header class="lab-reader-head"><button type="button" id="lab-reader-close" '+
 'aria-label="Уншлага хаах">‹</button><div><small>ТУРШИЛТЫН УНШЛАГА · '+
 escapeHtml(activeBook.reading_tier.replaceAll("_"," "))+'</small><h1>'+
 escapeHtml(activeBook.title_mn)+'</h1></div><span class="lab-reader-lock">Чех редакц хүлээгдэж байна</span></header>';
}
function readerFooter(){
 const queue=active.flashcards.length+active.card_backlog.length;
 return '<section class="lab-end">'+
 '<p>Унших нь таалагдсан уу? Шинэ үгээ картад хуваарилж, дараа нь тухтай давтана.</p>'+
 '<div class="lab-inline-status">'+queue+' үг/хэллэг картын жагсаалтад байна. '+
 (savedOk?"Энэ төхөөрөмж дээр хадгалж байна.":"Хадгалалт хаалттай: энэ сессийн ахиц түр зуурынх.")+
 '</div>'+
 '<button type="button" class="lab-primary" id="lab-finish">Бүлгийг уншсанаар тэмдэглэх</button>'+
 '<button type="button" class="lab-secondary" id="lab-open-cards">Карт руу шилжих</button>'+
 '<p class="lab-disclaimer">'+escapeHtml(profileSourceInfo())+'</p></section>';
}
function readerBody() {
 return readerHeader()+
  '<main class="lab-reader-scroll" id="lab-reader-scroll"><div class="lab-reading-info">'+
   '<span>'+activeChapter.sentences.length+' өгүүлбэр</span> · '+
   '<span>Утга дарахад карт үүснэ</span> · <span>Дуу: хүлээгдэж байна</span>'+
  '</div><article class="lab-prose">'+chapterMarkup(activeChapter)+'</article>'+
  '<details class="lab-translation"><summary>Монгол утгыг харах</summary>'+
  activeChapter.sentences.map(x=>'<p>'+escapeHtml(x.translation_mn_draft)+'</p>').join("")+
  '</details><section class="lab-comprehension"><h2>Ойлгосноо шалгах · заавал биш</h2>'+
  quizMarkup(activeChapter)+'</section>'+readerFooter()+'</main>'+
  '<div class="lab-gloss-shade" id="lab-gloss-shade" hidden></div>';
}
function updateReader() {
 // One shared player for both the two existing books and the three new drafts.
 if(!active||!activeBook||!activeChapter)return;
 const shell=byId("readerShell");
 const ch={
   num:1,title:activeBook.title_cs,
   cz:activeChapter.sentences.map(x=>x.text_cs),
   mn:activeChapter.sentences.map(x=>x.translation_mn_draft),
   vocab:content.form_annotations.map(x=>({
     cz:x.surface_form_cs,mn:x.meaning_mn_in_this_context_draft
   })),
   audioUrl:null
 };
 const book={
   id:activeBook.story_id,title:activeBook.title_mn,
   chapters:[ch],completedChapters:active.chapter_read?[1]:[]
 };
 shell.classList.remove("reader-lab-shell");
 window.AhojReaderExperience.mount({
   host:shell,book,chapter:ch,readingState:{showTranslation:false},
   onClose:closeReader,
   onPrevious:()=>{},
   onComplete:finishChapter,
   onWordTap:(word)=>{
     const source=activeChapter.sentences[word.sentenceId];
     const token=active.tokens.find(x=>
       x.sentence_id===source?.sentence_id&&x.start===word.start);
     if(!token)return false;
     openGloss(token.token_order);
     return true;
   }
 });
 const scroll=shell.querySelector("#ar-scroll");
 const end=scroll?.querySelector(".ar-end");
 if(!end)return;
 const quiz=document.createElement("section");
 quiz.id="lab-comprehension";
 quiz.className="lab-comprehension";
 quiz.innerHTML='<h2>Ойлгосноо шалгах · сонголттой</h2>'+quizMarkup(activeChapter);
 end.before(quiz);
 quiz.addEventListener("click",e=>{
   const btn=e.target.closest("[data-lab-q]");
   if(btn)answerQuiz(btn.dataset.labQ,Number(btn.dataset.labChoice));
 });
 const cards=document.createElement("button");
 cards.type="button";cards.id="lab-open-cards";cards.className="lab-secondary";
 cards.textContent="Уншлагын карт руу очих";
 end.append(cards);
 cards.addEventListener("click",()=>{
    if(!active.chapter_read)finishChapter();
    closeReader();
    byId("navGrid")?.querySelector('[data-tab="cards"]')?.click();
 });
 const warning=document.createElement("p");
 warning.className="lab-disclaimer";
 warning.textContent=profileSourceInfo();
 end.append(warning);
}
function openReader(bookId) {
 const book=findBook(bookId);
 if(!book)return;
 activeBook=book;activeChapter=book.chapters[0];
 try{
  const saved=sessions[activeChapter.chapter_id];
  active=saved?.chapter_id===activeChapter.chapter_id&&Array.isArray(saved.tokens)
    ? saved : startReaderChapter({
      chapter:activeChapter,formAnnotations:content.form_annotations,
      phraseAnnotations:content.phrase_annotations,
      knownSenseKeys:profile.known_reading_sense_keys,
      knownFormIds:[],cardActivationCap:4
    });
  if(!active.reader_attempt_id)active.reader_attempt_id=activeChapter.chapter_id+":"+now();
  selectedToken=null;lastError="";persistChapter();
  const overlay=byId("readerOverlay");
  if(!overlay||!byId("readerShell")||!window.AhojReaderExperience?.mount)
    throw new Error("Shared Czech reader player unavailable");
  overlay.hidden=false;
  updateReader();
 }catch(err){
  console.error("Reader Lab open:",err);
  alert("Уншлагын тоглуулагч ачаалагдсангүй. Шинээр нээгээд үзнэ үү.");
  const overlay=byId("readerOverlay");if(overlay)overlay.hidden=true;
 }
}
function closeReader() {
 window.AhojReaderExperience?.destroy?.();
 const overlay=byId("readerOverlay"),shell=byId("readerShell");
 if(overlay)overlay.hidden=true;
 byId("lab-gloss-shade")?.remove();
 if(shell){shell.classList.remove("reader-lab-shell");shell.innerHTML="";}
 active=null;activeBook=null;activeChapter=null;selectedToken=null;
 decorateReadingView();
}
function isOpen(){return Boolean(active)&&byId("readerOverlay")?.hidden===false;}
function openGloss(order) {
 const token=active?.tokens.find(x=>x.token_order===order);
 if(!token)return;
 selectedToken=token;
 const tooltip=readerWordTooltip(active,{
   sentence_id:token.sentence_id,start:token.start
 });
 active=recordReaderEvent(active,{
  type:"gloss_opened",token_order:order,at_ms:now(),
  event_id:"gloss-"+active.chapter_id+"-"+order+"-"+now()
 });
 persistChapter();
 const card=[...active.flashcards,...active.card_backlog].find(x=>x.card_key===token.card_key);
 const shell=byId("readerShell");
 if(!shell)return;
 let shade=byId("lab-gloss-shade");
 if(!shade){shade=document.createElement("div");
   shade.id="lab-gloss-shade";shade.className="lab-gloss-shade";
   shell.appendChild(shade);}
 shade.hidden=false;
 const note=token.sense_known?"Өмнө танилцсан утга":"Шинэ эсвэл баталгаажаагүй утга";
 shade.innerHTML='<section class="lab-gloss" role="dialog" aria-modal="true" '+
 'aria-label="Контекст толь"><button type="button" id="lab-gloss-close" class="lab-x">✕</button>'+
 '<span class="lab-eyebrow">'+escapeHtml(note)+'</span>'+
 '<h3 lang="cs">'+escapeHtml(tooltip.surface_cs)+'</h3>'+
 '<p class="lab-lemma">Үндсэн хэлбэр: <b lang="cs">'+escapeHtml(tooltip.lemma_cs)+'</b></p>'+
 '<p class="lab-meaning">'+escapeHtml(tooltip.mn_meaning_draft)+'</p>'+
 '<div class="lab-note">'+(card?"Картын жагсаалтад нэмэгдлээ.":"Энэ нь тусдаа үгийн карт биш.")+
 '</div><p class="lab-disclaimer">Энэ тайлбар Чех редакцаар батлагдаагүй.</p>'+
 '<button type="button" id="lab-gloss-dismiss" class="lab-primary">Үргэлжлүүлэн унших</button></section>';
 shade.onclick=e=>{
   if(e.target===shade||e.target.closest("#lab-gloss-close,#lab-gloss-dismiss")){
     shade.hidden=true;shade.innerHTML="";
   }
 };
}
function answerQuiz(questionId,choiceIndex) {
 if(!active||!activeChapter)return;
 const q=activeChapter.comprehension_checks.find(x=>x.id===questionId);
 if(!q||active.answer_log.some(x=>x.question_id===questionId))return;
 active=recordReaderEvent(active,{
  type:"optional_comprehension_answer",question_id:questionId,
  choice_index:choiceIndex,at_ms:now(),event_id:active.chapter_id+":q:"+questionId
 },{chapter:activeChapter});
 persistChapter();
 const node=byId("lab-comprehension");
 if(node)node.innerHTML='<h2>Ойлгосноо шалгах · сонголттой</h2>'+quizMarkup(activeChapter);
}
function finishChapter() {
 if(!active)return;
 active=recordReaderEvent(active,{
   type:"chapter_finished",at_ms:now(),event_id:active.chapter_id+":finished"
 },{chapter:activeChapter});
 profile=commitReaderAttempt(profile,active,{
  attempt_id:active.reader_attempt_id,story_id:activeBook.story_id,
  genre:activeBook.genre,at_ms:now()
 });
 profile=activateGlobalReadingCards(profile,{max_active:4});
 persistChapter();
 const guide=suggestLearningFocus(profile,{now_ms:now(),desired_genre:activeBook.genre});
 const button=byId("ar-complete");
 if(button){button.textContent="✓ Уншсанаар тэмдэглэсэн";button.disabled=true;}
 const end=byId("ar-scroll")?.querySelector(".ar-end");
 if(end&&!end.querySelector(".lab-finish-note")){
  const note=document.createElement("p");
  note.className="lab-finish-note";
  note.textContent="Уншсан гэж тэмдэглэлээ. Карт: "+
    profile.flashcards.length+" идэвхтэй, "+profile.card_backlog.length+
    " дараалалд. "+(guide.weak_contextual_sense_keys.length?
    "Хэцүү үгсийг давтлагад оруулна.":"Дараагийн уншлагаа сонгоорой.");
  end.append(note);
 }
}
function setupReaderEvents() {
 byId("lab-reader-close")?.addEventListener("click",closeReader);
 byId("lab-reader-scroll")?.addEventListener("click",e=>{
  const word=e.target.closest("[data-lab-token]");
  if(word){openGloss(Number(word.dataset.labToken));return;}
  const q=e.target.closest("[data-lab-q]");
  if(q)answerQuiz(q.dataset.labQ,Number(q.dataset.labChoice));
 });
 byId("lab-finish")?.addEventListener("click",finishChapter);
 byId("lab-open-cards")?.addEventListener("click",()=>{
  finishChapter();closeReader();
  byId("navGrid")?.querySelector('[data-tab="cards"]')?.click();
 });
}
function cardList(showAll=false) {
 const arr=showAll?[...profile.flashcards,...profile.card_backlog]:profile.flashcards;
 return arr.length?arr.map(c=>{
  const due=c.due_at_ms<=now();
  const revealed=currentCardRevealed===c.card_key;
  const enabled=due&&profile.flashcards.some(x=>x.card_key===c.card_key);
  return '<article class="lab-flashcard"><span class="lab-eyebrow">'+
   escapeHtml(c.card_unit==="fixed_phrase"?"ТОГТМОЛ ХЭЛЛЭГ":"ҮГ · КОНТЕКСТ")+'</span>'+
   '<h3 lang="cs">'+escapeHtml(c.display_cs)+'</h3>'+
   '<p class="lab-card-due">'+(enabled?"Давтах хугацаа болсон":"Дараагийн давтлага: "+dayLabel(c.due_at_ms))+'</p>'+
   '<button class="lab-flip" type="button" data-lab-reveal="'+escapeHtml(c.card_key)+
   '">'+(revealed?"Утгыг нуух":"Утгыг харах")+'</button>'+
   (revealed?'<div class="lab-card-answer">'+escapeHtml(c.meaning_mn)+'</div>':"")+
   (enabled?'<div class="lab-card-actions">'+
    '<button data-lab-result="independent_correct" data-lab-key="'+escapeHtml(c.card_key)+
    '">Санаж хэлсэн</button><button data-lab-result="correct_with_hint" data-lab-key="'+escapeHtml(c.card_key)+
    '">Сэжүүртэй</button><button data-lab-result="incorrect" data-lab-key="'+escapeHtml(c.card_key)+
    '">Алдсан</button></div>':
    '<small>Өнөөдөр танилцах боломжтой. Давтлагын үнэлгээг хугацаанд нь хийнэ.</small>')+
   '</article>';
 }).join(""):'<p class="lab-empty">Одоогоор карт байхгүй. Уншлагын хэсэгт үг дээр дарж эхлээрэй.</p>';
}
function navigationFrame(title,subtitle,body){
 return '<section class="lab-tab"><span class="lab-eyebrow">УНШЛАГАТАЙ ХОЛБОСОН ТУРШИЛТ</span>'+
 '<h1>'+escapeHtml(title)+'</h1><p>'+escapeHtml(subtitle)+'</p>'+body+
 '<p class="lab-disclaimer">'+escapeHtml(profileSourceInfo())+
 ' Энэ төхөөрөмж дээрх түр өгөгдөл; аккаунт хооронд синк хийгдээгүй.</p></section>';
}
function renderCardsTab(root){
 if(!ENABLED||!initialized||!root)return false;
 const guide=suggestLearningFocus(profile,{now_ms:now()});
 root.innerHTML=navigationFrame("Миний давталтын картууд",
 "Номоос сонгосон шинэ үгс нэг сан руу орно. Алдаа ихтэй үгс давтлагад түрүүлнэ.",
 '<div class="lab-metrics"><span>Идэвхтэй '+profile.flashcards.length+'</span>'+
 '<span>Дараалалд '+profile.card_backlog.length+'</span>'+
 '<span>Хугацаа болсон '+guide.due_flashcards.length+'</span></div>'+
 '<p class="lab-support">Дараагийн зөвлөмж: '+
 escapeHtml(guide.next_guidance==="EXPLAIN_WEAK_WORDS_IN_NEW_CONTEXT_THEN_OFFER_STORY"?
 "Хэцүү үгсийг өөр өгүүлбэрт давт.":guide.next_guidance==="REVIEW_DUE_WORDS_THEN_OFFER_STORY"?
 "Хугацаа нь болсон картаа давт.":"Сонирхсон зохиолоо үргэлжлүүлэн унш.")+
 '</p><div class="lab-card-stack">'+cardList()+'</div>');
 root.querySelectorAll("[data-lab-reveal]").forEach(btn=>btn.addEventListener("click",()=>{
  currentCardRevealed=currentCardRevealed===btn.dataset.labReveal?"":btn.dataset.labReveal;
  renderCardsTab(root);
 }));
 root.querySelectorAll("[data-lab-result]").forEach(btn=>btn.addEventListener("click",()=>{
  try{
   const key=btn.dataset.labKey;
   if(!profile.flashcards.some(c=>c.card_key===key&&c.due_at_ms<=now()))return;
   profile=reviewGlobalReadingCard(profile,{
    card_key:key,result:btn.dataset.labResult,at_ms:now()
   });
   currentCardRevealed="";
   profile=activateGlobalReadingCards(profile,{max_active:4});
   persist();renderCardsTab(root);
  }catch(e){console.error("Cannot review card",e);}
 }));
 return true;
}
function renderDictionaryTab(root){
 if(!ENABLED||!initialized||!root)return false;
 const q=dictionaryQuery.toLocaleLowerCase("cs-CZ").trim();
 const rows=content.form_annotations.filter(x=>
  !q||x.surface_form_cs.toLocaleLowerCase("cs-CZ").includes(q)||
    x.lemma_cs.toLocaleLowerCase("cs-CZ").includes(q)||
    x.meaning_mn_in_this_context_draft.toLocaleLowerCase("mn-MN").includes(q)
 );
 root.innerHTML=navigationFrame("Контекстийн толь",
 "Энэ нь 3 туршилтын эхийн үгийн тайлбар — батлагдсан бүрэн Чех–Монгол толь биш.",
 '<label class="lab-search-label" for="lab-dict-search">Үг эсвэл утга хайх</label>'+
 '<input id="lab-dict-search" type="search" placeholder="měsíc, dopis, гэрэл..." '+
 'value="'+escapeHtml(dictionaryQuery)+'" autocomplete="off">'+
 '<p class="lab-result-count">'+rows.length+' бичгийн хэлбэр</p>'+
 '<div class="lab-dict-list">'+rows.slice(0,150).map(x=>
 '<article><strong lang="cs">'+escapeHtml(x.surface_form_cs)+'</strong>'+
 '<small lang="cs">'+escapeHtml(x.lemma_cs)+'</small>'+
 '<span>'+escapeHtml(x.meaning_mn_in_this_context_draft)+'</span>'+
 '</article>').join("")+'</div>');
 const input=byId("lab-dict-search");
 input?.addEventListener("input",()=>{
  const pos=input.selectionStart;dictionaryQuery=input.value;renderDictionaryTab(root);
  const newInput=byId("lab-dict-search");newInput?.focus();
  try{newInput.setSelectionRange(pos,pos);}catch{}
 });
 return true;
}
function showPendingNavigation() {
 const nav=byId("navGrid")?.querySelector('[aria-current="page"]');
 const tab=nav?.dataset.tab;
 const main=byId("mainArea");
 if(tab==="cards")renderCardsTab(main);
 else if(tab==="dictionary")renderDictionaryTab(main);
 else if(tab==="read")decorateReadingView();
}
async function boot(){
 if(!ENABLED)return;
 setupStyle();
 try{
  const r=await fetch("./reader-lab-content.draft.json",{cache:"no-store"});
  if(!r.ok)throw new Error("Draft story data unavailable: "+r.status);
  content=await r.json();
  if(content.status!=="DRAFT_STORIES_AND_GLOSSES_NOT_NATIVE_REVIEWED_NOT_PUBLISHED")
    throw new Error("Unexpected reader content status");
  profile=safeRead(PROFILE_KEY,createLearnerReadingProfile());
  if(!Array.isArray(profile.flashcards)||!Array.isArray(profile.card_backlog))
    profile=createLearnerReadingProfile();
  sessions=safeRead(SESSIONS_KEY,{});
  initialized=true;
  const main=byId("mainArea");
  const observer=new MutationObserver(()=>{
    if(byId("reader-lab-shelf")||!byId("readingScroll"))return;
    decorateReadingView();
  });
  if(main)observer.observe(main,{childList:true,subtree:false});
  showPendingNavigation();
  window.dispatchEvent(new CustomEvent("ahoj:reader-lab-ready"));
 }catch(err){
  lastError=String(err?.message??err);
  console.error("Reader lab unavailable",lastError);
 }
}
window.AhojReaderLab={
 enabled:ENABLED,isOpen,closeReader,renderCardsTab,renderDictionaryTab,decorateReadingView,
 getStatus:()=>({
   enabled:ENABLED,initialized,storyCount:content?.books.length??0,
   active:active?.chapter_id??null,cardCount:profile.flashcards.length,
   backlogCount:profile.card_backlog.length,storageOk:savedOk,error:lastError,
   status:"UNREVIEWED_DRAFT_PREVIEW"
 })
};
boot();
