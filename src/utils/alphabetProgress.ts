import {
  ALPHABET_LESSON_STEP_COUNT,
  CZECH_ALPHABET_BY_ID,
  CZECH_ALPHABET_DATA_VERSION,
  CZECH_ALPHABET_LETTERS,
} from '../data/czechAlphabetCourse';

export type LetterLearningStatus = 'unseen' | 'in_progress' | 'seen';
export interface LetterLearningProgress {
  completedSteps: number[];
  visited: boolean;
  completedAt: number | null;
}
export interface AlphabetResumeTarget {
  letterId: string;
  step: number;
}
export interface AlphabetProgressState {
  schema: 1;
  datasetVersion: string;
  letters: Record<string, LetterLearningProgress>;
  lastVisited: AlphabetResumeTarget | null;
  updatedAt: number;
}
export const ALPHABET_STORAGE_KEY = 'ahoj_czech_alphabet_visual_v1';

const VALID_STEPS = Array.from({ length:ALPHABET_LESSON_STEP_COUNT },(_,i)=>i);

export function newAlphabetProgress(): AlphabetProgressState {
  return {
    schema:1, datasetVersion:CZECH_ALPHABET_DATA_VERSION,
    letters:{}, lastVisited:null, updatedAt:0,
  };
}
export function validLetterId(value: string): boolean {
  return CZECH_ALPHABET_BY_ID.has(value);
}
export function getLetterStatus(state: AlphabetProgressState, letterId: string): LetterLearningStatus {
  const data = state.letters[letterId];
  if (data?.completedAt && data.completedSteps.length === ALPHABET_LESSON_STEP_COUNT) return 'seen';
  return data?.visited ? 'in_progress' : 'unseen';
}
export function alphabetSeenCount(state: AlphabetProgressState): number {
  return CZECH_ALPHABET_LETTERS.filter(x=>getLetterStatus(state,x.id)==='seen').length;
}
export function alphabetLessonAction(status: LetterLearningStatus): string {
  return status === 'seen' ? 'Энэ үсгийг давтах' :
    status === 'in_progress' ? 'Үргэлжлүүлэх' : 'Энэ үсгийг сурах';
}
export function getAlphabetContinueTarget(state: AlphabetProgressState): AlphabetResumeTarget | null {
  const last = state.lastVisited;
  if(last && validLetterId(last.letterId) && Number.isInteger(last.step)
      && last.step>=0 && last.step<ALPHABET_LESSON_STEP_COUNT) {
    return last;
  }
  const firstIncomplete = CZECH_ALPHABET_LETTERS.find(letter=>getLetterStatus(state,letter.id)!=='seen');
  if (!firstIncomplete) return null; // Alphabet visually completed; curriculum may continue to greetings.
  const done = state.letters[firstIncomplete.id]?.completedSteps ?? [];
  const firstMissing = VALID_STEPS.find(x=>!done.includes(x)) ?? 0;
  return {letterId:firstIncomplete.id,step:firstMissing};
}
export function openAlphabetLetter(
  state: AlphabetProgressState,letterId: string,repeat = false,now = Date.now(),
): AlphabetProgressState {
  if (!validLetterId(letterId)) return state;
  const prior = state.letters[letterId] ?? {visited:false,completedSteps:[],completedAt:null};
  const step = repeat ? 0 : VALID_STEPS.find(x=>!prior.completedSteps.includes(x)) ?? 0;
  return {
    ...state,letters:{...state.letters,[letterId]:{...prior,visited:true}},
    lastVisited:{letterId,step},updatedAt:now,
  };
}
export function moveAlphabetStep(
  state: AlphabetProgressState,letterId: string,step: number,now = Date.now(),
): AlphabetProgressState {
  if(!validLetterId(letterId)||!Number.isInteger(step)||step<0||step>=ALPHABET_LESSON_STEP_COUNT)return state;
  const prior = state.letters[letterId] ?? {visited:false,completedSteps:[],completedAt:null};
  return {
    ...state,letters:{...state.letters,[letterId]:{...prior,visited:true}},
    lastVisited:{letterId,step},updatedAt:now,
  };
}
export function completeAlphabetStep(
  state: AlphabetProgressState,letterId: string,step: number,now = Date.now(),
): AlphabetProgressState {
  if (!validLetterId(letterId)||!Number.isInteger(step)||step<0||step>=ALPHABET_LESSON_STEP_COUNT
      ||state.lastVisited?.letterId !==letterId ||state.lastVisited.step !==step) return state;
  const prior = state.letters[letterId] ?? {visited:true,completedSteps:[],completedAt:null};
  const completedSteps = [...new Set([...prior.completedSteps,step])].sort((a,b)=>a-b);
  const allDone = completedSteps.length === ALPHABET_LESSON_STEP_COUNT;
  const nextStep = step < ALPHABET_LESSON_STEP_COUNT-1
    ? step+1
    : VALID_STEPS.find(x=>!completedSteps.includes(x));
  const nextLetters = {
    ...state.letters,[letterId]: {
      completedSteps,visited:true,completedAt: allDone ? (prior.completedAt ?? now) : null,
    },
  };
  const next = {...state,letters:nextLetters,updatedAt:now};
  if (nextStep !== undefined) return {...next,lastVisited:{letterId,step:nextStep}};
  const nextLetter = CZECH_ALPHABET_LETTERS.find(x=>getLetterStatus(next,x.id)!=='seen');
  return {...next,lastVisited:nextLetter?{letterId:nextLetter.id,step:0}:null};
}
export function skipAlphabetStep(
  state: AlphabetProgressState,letterId: string,step: number,now=Date.now(),
): AlphabetProgressState {
  if(state.lastVisited?.letterId!==letterId||state.lastVisited.step!==step)return state;
  const after = step === ALPHABET_LESSON_STEP_COUNT-1
    ? VALID_STEPS.find(x=>!state.letters[letterId]?.completedSteps.includes(x))??step : step+1;
  return moveAlphabetStep(state,letterId,after,now);
}

export function parseAlphabetProgress(value: unknown): AlphabetProgressState | null {
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const input=value as Partial<AlphabetProgressState>;
  if(input.schema!==1||input.datasetVersion!==CZECH_ALPHABET_DATA_VERSION)return null;
  const letters: Record<string,LetterLearningProgress>={};
  if (input.letters&&typeof input.letters==='object'&&!Array.isArray(input.letters)) {
    for (const [id,item] of Object.entries(input.letters)) {
      if(!validLetterId(id)||!item||typeof item!=='object'||Array.isArray(item))continue;
      const p = item as LetterLearningProgress;
      const completedSteps = Array.isArray(p.completedSteps)
        ? [...new Set(p.completedSteps.filter((i):i is number=>Number.isInteger(i)&&i>=0&&i<ALPHABET_LESSON_STEP_COUNT))].sort((a,b)=>a-b)
        : [];
      const visited = p.visited===true || completedSteps.length>0;
      const completedAt=completedSteps.length===ALPHABET_LESSON_STEP_COUNT&&typeof p.completedAt==='number'&&Number.isFinite(p.completedAt)&&p.completedAt>0?p.completedAt:null;
      letters[id]={visited,completedSteps,completedAt};
    }
  }
  const last=input.lastVisited;
  const lastVisited=last&&typeof last==='object'&&validLetterId(last.letterId)
    && Number.isInteger(last.step)&&last.step>=0&&last.step<ALPHABET_LESSON_STEP_COUNT
    ? {letterId:last.letterId,step:last.step}:null;
  return {schema:1,datasetVersion:CZECH_ALPHABET_DATA_VERSION,letters,lastVisited,
    updatedAt:typeof input.updatedAt==='number'&&Number.isFinite(input.updatedAt)&&input.updatedAt>=0?input.updatedAt:0};
}

export function loadAlphabetProgress(): AlphabetProgressState {
  if(typeof localStorage==='undefined')return newAlphabetProgress();
  try{
    const value=localStorage.getItem(ALPHABET_STORAGE_KEY);
    return value?(parseAlphabetProgress(JSON.parse(value))??newAlphabetProgress()):newAlphabetProgress();
  }catch{return newAlphabetProgress();}
}

export function saveAlphabetProgress(state: AlphabetProgressState): boolean {
  if(typeof localStorage==='undefined')return false;
  try{
    const sanitized=parseAlphabetProgress(state);
    if(!sanitized)return false;
    localStorage.setItem(ALPHABET_STORAGE_KEY,JSON.stringify(sanitized));
    return true;
  }catch{return false;}
}
