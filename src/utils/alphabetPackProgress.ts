import {
  CZECH_ALPHABET_PACKS,CZECH_ALPHABET_PACK_BY_ID,CZECH_ALPHABET_PACK_VERSION,
  availableAlphabetAudio,type AlphabetPackStage,type AlphabetAudioKind,
} from '../data/czechAlphabetPacks';
import { ALPHABET_STORAGE_KEY } from './alphabetProgress';

export const ALPHABET_PACK_STORAGE_KEY='ahoj_czech_alphabet_packs_v1';
export interface PackProgress{
  introducedIds:string[];
  nameCompletedIds:string[];
  soundCompletedIds:string[];
  firstTryCorrectIds:string[];
  mistakeCounts:Record<string,number>;
  finishedAt:number|null;
}
export interface AlphabetPackCursor{
  packId:string;
  stage:AlphabetPackStage;
  index:number;
}
export interface AlphabetPackProgress{
  schema:2;
  sourceVersion:string;
  packs:Record<string,PackProgress>;
  last:AlphabetPackCursor|null;
  earlierVisualFamiliarIds:string[];
  updatedAt:number;
}
export function emptyPackProgress():AlphabetPackProgress{
  return {schema:2,sourceVersion:CZECH_ALPHABET_PACK_VERSION,packs:{},last:null,earlierVisualFamiliarIds:[],updatedAt:0};
}
export function validPackCursor(x:unknown):x is AlphabetPackCursor {
  if(!x || typeof x!=='object'||Array.isArray(x))return false;
  const c=x as AlphabetPackCursor;
  const pack=CZECH_ALPHABET_PACK_BY_ID.get(c.packId);
  return Boolean(pack) && ['introduce','listen_name','match_sound','report'].includes(c.stage)
    &&Number.isInteger(c.index)&&c.index>=0&&c.index<=(pack?.letters.length??0);
}
export function safePackProgress(raw:unknown):AlphabetPackProgress|null{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
  const input=raw as Partial<AlphabetPackProgress>;
  if(input.schema!==2||input.sourceVersion!==CZECH_ALPHABET_PACK_VERSION)return null;
  const packs:Record<string,PackProgress>={};
  if(input.packs && typeof input.packs==='object'&&!Array.isArray(input.packs)){
    for(const [id,p] of Object.entries(input.packs)){
      const pack=CZECH_ALPHABET_PACK_BY_ID.get(id);
      if(!pack||!p||typeof p!=='object'||Array.isArray(p))continue;
      const entry=p as PackProgress;
      const ids=new Set(pack.letters.map(l=>l.id));
      const getIds=(value:unknown):string[]=>Array.isArray(value)
        ?[...new Set(value.filter((x):x is string=>typeof x==='string'&&ids.has(x)))]:[];
      const names=getIds(entry.nameCompletedIds),sounds=getIds(entry.soundCompletedIds);
      const introduced=getIds(entry.introducedIds);
      const firstTry=getIds(entry.firstTryCorrectIds);
      const errors:Record<string,number>={};
      if(entry.mistakeCounts&&typeof entry.mistakeCounts==='object'&&!Array.isArray(entry.mistakeCounts)){
        for(const [k,v] of Object.entries(entry.mistakeCounts)){
          if(ids.has(k)&&Number.isInteger(v)&&v>0&&v<=10000)errors[k]=v;
        }
      }
      packs[id]={introducedIds:introduced,nameCompletedIds:names,soundCompletedIds:sounds,
        firstTryCorrectIds:firstTry,mistakeCounts:errors,
        finishedAt:names.length===pack.letters.length&&sounds.length===pack.letters.length
          &&typeof entry.finishedAt==='number'&&entry.finishedAt>0&&Number.isFinite(entry.finishedAt)
          ?entry.finishedAt:null};
    }
  }
  const legacyIds=new Set(CZECH_ALPHABET_PACKS.flatMap(p=>p.letters.map(l=>l.id)));
  const familiar=Array.isArray(input.earlierVisualFamiliarIds)
    ? [...new Set(input.earlierVisualFamiliarIds.filter((x):x is string=>typeof x==='string'&&legacyIds.has(x)))]
    :[];
  return {schema:2,sourceVersion:CZECH_ALPHABET_PACK_VERSION,packs,
    last:validPackCursor(input.last)?input.last:null,earlierVisualFamiliarIds:familiar,
    updatedAt:typeof input.updatedAt==='number'&&Number.isFinite(input.updatedAt)&&input.updatedAt>=0?input.updatedAt:0};
}
export function loadPackProgress():AlphabetPackProgress{
  if(typeof localStorage==='undefined')return emptyPackProgress();
  try{
    const saved=localStorage.getItem(ALPHABET_PACK_STORAGE_KEY);
    if(saved)return safePackProgress(JSON.parse(saved))??emptyPackProgress();
    const next=emptyPackProgress();
    // Read-only migration: old v1 7-step progress is evidence of familiarity,
    // never proof of Czech audio discrimination or new pack completion.
    const older=localStorage.getItem(ALPHABET_STORAGE_KEY);
    if(older){
      const legacy=JSON.parse(older) as {letters?:Record<string,{visited?:boolean;completedSteps?:number[]}>};
      if(legacy?.letters&&typeof legacy.letters==='object'){
        next.earlierVisualFamiliarIds=CZECH_ALPHABET_PACKS
          .flatMap(p=>p.letters.filter(l=>legacy.letters?.[l.id]?.visited===true).map(l=>l.id));
      }
    }
    return next;
  }catch{return emptyPackProgress();}
}
export function savePackProgress(state:AlphabetPackProgress):boolean{
  if(typeof localStorage==='undefined')return false;
  const safe=safePackProgress(state);if(!safe)return false;
  try{localStorage.setItem(ALPHABET_PACK_STORAGE_KEY,JSON.stringify(safe));return true;}catch{return false;}
}
function current(state:AlphabetPackProgress,packId:string):PackProgress{
  return state.packs[packId]??{
    introducedIds:[],nameCompletedIds:[],soundCompletedIds:[],
    firstTryCorrectIds:[],mistakeCounts:{},finishedAt:null,
  };
}
function change(state:AlphabetPackProgress,packId:string,data:PackProgress,last:AlphabetPackCursor|null,now:number):AlphabetPackProgress{
  return {...state,packs:{...state.packs,[packId]:data},last,updatedAt:now};
}
export function packIntroducedCount(state:AlphabetPackProgress,packId:string):number{
  return current(state,packId).introducedIds.length;
}
export function packIsCompleted(state:AlphabetPackProgress,packId:string):boolean{
  const pack=CZECH_ALPHABET_PACK_BY_ID.get(packId);const data=current(state,packId);
  return Boolean(pack && data.finishedAt && data.nameCompletedIds.length===pack.letters.length
    &&data.soundCompletedIds.length===pack.letters.length);
}
export function packsPassedCount(state:AlphabetPackProgress):number{
  return CZECH_ALPHABET_PACKS.filter(p=>packIsCompleted(state,p.id)).length;
}
export function lettersIntroducedCount(state:AlphabetPackProgress):number{
  return CZECH_ALPHABET_PACKS.reduce((sum,p)=>sum+packIntroducedCount(state,p.id),0);
}
export function getPackContinueTarget(state:AlphabetPackProgress):AlphabetPackCursor|null{
  const last=state.last;
  if(last&&validPackCursor(last)){
    const p=CZECH_ALPHABET_PACK_BY_ID.get(last.packId)!;
    if(last.stage==='introduce' && current(state,p.id).introducedIds.length<p.letters.length)return last;
    // If the learner last started a listening exercise, keep that saved stage.
    if(last.stage==='listen_name'||last.stage==='match_sound')return last;
    if(last.stage==='report'&&!packIsCompleted(state,p.id))return last;
  }
  // First unlock all visual introductory packs, to keep learning usable
  // while QA-approved Gemini TTS audio is pending. No audio scores faked.
  const nextIntro=CZECH_ALPHABET_PACKS.find(p=>packIntroducedCount(state,p.id)<p.letters.length);
  if(nextIntro)return {packId:nextIntro.id,stage:'introduce',index:packIntroducedCount(state,nextIntro.id)};
  const needsAudio=CZECH_ALPHABET_PACKS.find(p=>!packIsCompleted(state,p.id));
  return needsAudio?{packId:needsAudio.id,stage:'listen_name',index:0}:null;
}
export function openPack(state:AlphabetPackProgress,packId:string,now=Date.now()):AlphabetPackProgress{
  const p=CZECH_ALPHABET_PACK_BY_ID.get(packId);if(!p)return state;
  const item=current(state,packId);
  const stage:AlphabetPackStage=item.introducedIds.length<p.letters.length?'introduce':
    item.nameCompletedIds.length<p.letters.length?'listen_name':
    item.soundCompletedIds.length<p.letters.length?'match_sound':'report';
  const index=stage==='introduce'?item.introducedIds.length:
    stage==='listen_name'?item.nameCompletedIds.length:
    stage==='match_sound'?item.soundCompletedIds.length:0;
  return {...state,last:{packId,stage,index},updatedAt:now};
}
export function introduceNextLetter(state:AlphabetPackProgress,packId:string,now=Date.now()):AlphabetPackProgress{
  const p=CZECH_ALPHABET_PACK_BY_ID.get(packId);if(!p)return state;
  const item=current(state,packId);
  if(state.last?.packId!==packId||state.last.stage!=='introduce'||item.introducedIds.length>=p.letters.length)return state;
  const id=p.letters[item.introducedIds.length].id;
  const after={...item,introducedIds:[...item.introducedIds,id]};
  const index=after.introducedIds.length;
  return change(state,packId,after,index===p.letters.length?{packId,stage:'listen_name',index:0}:{packId,stage:'introduce',index},now);
}
export interface PackAnswerResult{correct:boolean;scored:boolean;next:AlphabetPackProgress;}
export function scorePackAudioChoice(
  state:AlphabetPackProgress,packId:string,kind:AlphabetAudioKind,letterId:string,answer:string,now=Date.now(),
):PackAnswerResult {
  const pack=CZECH_ALPHABET_PACK_BY_ID.get(packId),item=current(state,packId);
  const stage=kind==='letter_name'?'listen_name':'match_sound';
  const completed=kind==='letter_name'?item.nameCompletedIds:item.soundCompletedIds;
  const prompt=pack?.letters[completed.length]?.id;
  if(!pack||!prompt||prompt!==letterId||item.introducedIds.length!==pack.letters.length
    ||state.last?.packId!==packId||state.last.stage!==stage||!availableAlphabetAudio(prompt,kind)){
    return {correct:false,scored:false,next:state};
  }
  const correct=answer===prompt;
  const mistakes=item.mistakeCounts[prompt]??0;
  const after:PackProgress={
    ...item,mistakeCounts:correct?item.mistakeCounts:{...item.mistakeCounts,[prompt]:mistakes+1},
    firstTryCorrectIds:correct&&mistakes===0?[...new Set([...item.firstTryCorrectIds,prompt])]:item.firstTryCorrectIds,
    ...(kind==='letter_name'?{nameCompletedIds:correct?[...completed,prompt]:completed}:
      {soundCompletedIds:correct?[...completed,prompt]:completed}),
  };
  const nextCount=correct?completed.length+1:completed.length;
  const nextStage=nextCount===pack.letters.length?(kind==='letter_name'?'match_sound':'report'):stage;
  const isLast=nextStage==='report';
  const finishedAt=isLast&&after.nameCompletedIds.length===pack.letters.length&&after.soundCompletedIds.length===pack.letters.length
    ?now:after.finishedAt;
  const next=change(state,packId,{...after,finishedAt},
    {packId,stage:nextStage,index:isLast?0:nextStage===stage?nextCount:0},now);
  return {correct,scored:true,next};
}
export function packReport(state:AlphabetPackProgress,packId:string){
  const pack=CZECH_ALPHABET_PACK_BY_ID.get(packId),p=current(state,packId);
  return {
    visualIntroduced:p.introducedIds.length,total:pack?.letters.length??0,
    nameRecognized:p.nameCompletedIds.length,soundMatched:p.soundCompletedIds.length,
    firstTryCorrect:p.firstTryCorrectIds.length,
    problemLetters:pack?.letters.filter(l=>p.mistakeCounts[l.id]>0).map(l=>l.id)??[],
    practiceWords:pack?.letters.map(l=>({id:l.id,cs:l.exampleCs,mn:l.exampleMn}))??[],
    hasAiAssessment:false as const,
    completed:packIsCompleted(state,packId),
  };
}
