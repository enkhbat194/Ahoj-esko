// Golden Slice v0.9.9: explicit, deterministic PREVIEW logic. NOT FSRS, AI or pronunciation scoring.
export const STORE_VERSION = 1;
export const CARD_INTERVAL_DAYS = {again:[0,0,1,1],hard:[1,1,2,3],good:[1,3,7,14],easy:[3,7,14,30]};
export const GOALS=['greeting','self_introduction','ask_name','state_origin'];
export function normalizeCzech(s){return String(s||'').normalize('NFC').toLocaleLowerCase('cs-CZ').replace(/[!?.,…:;]+/g,' ').replace(/\s+/g,' ').trim()}
export function wordTokens(text){return String(text||'').match(/[\p{L}]+(?:[’'-][\p{L}]+)*/gu)||[]}
export function emptyStore(){return {format:'ahoj-golden-slice',version:STORE_VERSION,cards:{},reviewEvents:{},lessonSeen:[]}}
export function validStore(s){if(!s||s.format!=='ahoj-golden-slice'||s.version!==STORE_VERSION||!s.cards||typeof s.cards!=='object'||Array.isArray(s.cards)||!s.reviewEvents||typeof s.reviewEvents!=='object'||Array.isArray(s.reviewEvents)||!Array.isArray(s.lessonSeen))return false;return Object.values(s.cards).every(c=>c&&typeof c.key==='string'&&typeof c.phrase==='string'&&Number.isInteger(c.reps)&&c.reps>=0&&typeof c.dueAt==='string')}
export function addCard(state,key,phrase,{source='lesson',mn=''}={}){
 if(typeof key!=='string'||!key||!normalizeCzech(phrase))throw Error('Invalid card');
 const next=structuredClone(state);next.cards||={};next.reviewEvents||={};
 const equivalent=Object.values(next.cards).find(c=>normalizeCzech(c.phrase)===normalizeCzech(phrase)&&String(c.mn||'').trim()===String(mn||'').trim());
 if(equivalent){equivalent.sourceIds=[...new Set([...(equivalent.sourceIds||[equivalent.key]),key])];return next}
 next.cards[key]={key,phrase,mn,source,sourceIds:[key],reps:0,dueAt:new Date(0).toISOString(),status:'draft'};return next;
}
export function reviewCard(state,{eventId,key,grade,nowIso}){
 if(!Object.hasOwn(CARD_INTERVAL_DAYS,grade))throw Error('Unknown grade');
 if(typeof eventId!=='string'||!eventId.trim())throw Error('Event ID required');
 const now=new Date(nowIso);if(Number.isNaN(now.getTime()))throw Error('Invalid timestamp');
 const next=structuredClone(state);next.reviewEvents||={};next.cards||={};
 if(next.reviewEvents[eventId])return next;
 const card=next.cards[key];if(!card)throw Error('Card not found');
 const n=card.reps||0;const days=CARD_INTERVAL_DAYS[grade][Math.min(n,3)];
 const due=new Date(now.getTime()+(grade==='again'&&days===0?10*60*1000:days*86400000));
 next.cards[key]={...card,reps:n+1,dueAt:due.toISOString(),lastGrade:grade};
 next.reviewEvents[eventId]={eventId,key,grade,at:now.toISOString()};return next;
}
export function isDue(card,now=Date.now()){return Date.parse(card.dueAt)<=now}
export function classifyDemoIntents(text){const t=normalizeCzech(text);const found=[];
 if(/(?:^|\s)(dobrý den|ahoj|zdravím)(?=\s|$)/u.test(t))found.push('greeting');
 if(/(?:^|\s)(jmenuji se|moje jméno je)(?=\s|$)/u.test(t))found.push('self_introduction');
 if(/(?:^|\s)(jak se jmenujete|jak vám říkají)(?=\s|$)/u.test(t))found.push('ask_name');
 if(/(?:^|\s)(jsem z|pocházím z)(?=\s|$)/u.test(t))found.push('state_origin');
 if(/(?:^|\s)(zopakovat|ještě jednou|nerozumím)(?=\s|$)/u.test(t))found.push('clarify');
 return found;
}
export function nextRoleplayState(state,text){const intents=classifyDemoIntents(text);const done=[...new Set([...(state.completedIntents||[]),...intents.filter(i=>GOALS.includes(i))])];return {completedIntents:done,complete:GOALS.every(i=>done.includes(i)),intents,turns:[...(state.turns||[]),{learner:text,intents}]}}
export function promptFor(state){if(state.complete)return 'Děkuji, rád vás poznávám.';const missing=GOALS.find(x=>!state.completedIntents.includes(x));return ({greeting:'Dobrý den!','self_introduction':'Jak se jmenujete?','ask_name':'A jak se jmenuji já? Zeptejte se mě.','state_origin':'Odkud jste?'})[missing]}
export function pronunciationStatus(data){if(!data.microphonePermission||!data.referenceApproved)return 'not_assessable';if(data.noise||data.asrUnavailable||data.asrMismatch)return 'uncertain';return 'transcribed_not_scored'}
export function awardRealXp(event){return event?.qaApproved===true&&event?.evidenceVerified===true?5:0}
