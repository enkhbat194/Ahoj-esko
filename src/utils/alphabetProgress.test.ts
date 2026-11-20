import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ALPHABET_LESSON_STEP_COUNT,
  CZECH_ALPHABET_LETTERS,
  CZECH_ALPHABET_BY_ID,
  letterOptions,
  maskLetterInExample,
  isCzechLetterResponse,
} from '../data/czechAlphabetCourse';
import {
  newAlphabetProgress, alphabetSeenCount, alphabetLessonAction,
  getLetterStatus, getAlphabetContinueTarget, openAlphabetLetter,
  completeAlphabetStep, skipAlphabetStep, parseAlphabetProgress,
  moveAlphabetStep,
} from './alphabetProgress';
import { L01_WORKING_SOURCE } from '../data/l01WorkingSource';

test('all 42 Czech alphabet entries exist in official order with CH after H', () => {
  assert.equal(CZECH_ALPHABET_LETTERS.length,42);
  assert.equal(new Set(CZECH_ALPHABET_LETTERS.map(x=>x.id)).size,42);
  const order=CZECH_ALPHABET_LETTERS.map(x=>x.id);
  assert.equal(order.indexOf('CH'),order.indexOf('H')+1);
  assert.equal(order[order.indexOf('CH')+1],'I');
  for (const letter of CZECH_ALPHABET_LETTERS) {
    assert.equal(CZECH_ALPHABET_BY_ID.get(letter.id)?.exampleCs,letter.exampleCs);
    assert.ok(letter.exampleCs.toLocaleLowerCase('cs-CZ').includes(letter.lower),letter.id);
    assert.equal(maskLetterInExample(letter).includes('＿'),true,letter.id);
    const options=letterOptions(letter.id);
    assert.equal(options.length,4,letter.id);
    assert.equal(new Set(options).size,4,letter.id);
    assert.ok(options.includes(letter.id),letter.id);
  }
  assert.equal(ALPHABET_LESSON_STEP_COUNT,7);
  assert.equal(maskLetterInExample(CZECH_ALPHABET_BY_ID.get('CH')!),'＿léb');
  assert.equal(isCzechLetterResponse(' Ř ', 'Ř'),true);
  assert.equal(isCzechLetterResponse('r','Ř'),false);
  assert.equal(isCzechLetterResponse('ů','Ú'),false);
});

test('initial entry points to A/1; per-letter status is never credited for a visit only', () => {
  let s=newAlphabetProgress();
  assert.deepEqual(getAlphabetContinueTarget(s),{letterId:'A',step:0});
  assert.equal(getLetterStatus(s,'A'),'unseen');
  assert.equal(alphabetLessonAction('unseen'),'Энэ үсгийг сурах');
  s=openAlphabetLetter(s,'A',false,100);
  assert.equal(getLetterStatus(s,'A'),'in_progress');
  assert.equal(alphabetSeenCount(s),0);
  assert.equal(alphabetLessonAction('in_progress'),'Үргэлжлүүлэх');
});

test('seven-step answer gate: step 7 alone and skipping cannot mark completed', () => {
  let s=openAlphabetLetter(newAlphabetProgress(),'A',false,100);
  s=skipAlphabetStep(s,'A',0,110);
  assert.deepEqual(s.lastVisited,{letterId:'A',step:1});
  assert.deepEqual(s.letters.A?.completedSteps,[]);
  assert.equal(getLetterStatus(s,'A'),'in_progress');
  s=moveAlphabetStep(s,'A',6,120);
  s=completeAlphabetStep(s,'A',6,130);
  assert.equal(alphabetSeenCount(s),0);
  assert.deepEqual(s.lastVisited,{letterId:'A',step:0});
  assert.deepEqual(s.letters.A?.completedSteps,[6]);
  for (let step=0;step<=5;step++) {
    s=completeAlphabetStep(s,'A',step,200+step);
  }
  assert.equal(getLetterStatus(s,'A'),'seen');
  assert.equal(alphabetSeenCount(s),1);
  assert.deepEqual(getAlphabetContinueTarget(s),{letterId:'Á',step:0});
  assert.equal(alphabetLessonAction('seen'),'Энэ үсгийг давтах');
});

test('resume after reload keeps exact Czech letter and step, rejects fake progress',()=>{
  let s=newAlphabetProgress();
  s=openAlphabetLetter(s,'Ř',false,10);
  s=completeAlphabetStep(s,'Ř',0,11);
  s=completeAlphabetStep(s,'Ř',1,12);
  assert.deepEqual(getAlphabetContinueTarget(s),{letterId:'Ř',step:2});
  const parsed=parseAlphabetProgress(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(parsed?.lastVisited,{letterId:'Ř',step:2});
  assert.deepEqual(parsed?.letters['Ř']?.completedSteps,[0,1]);
  assert.equal(parseAlphabetProgress({...s,datasetVersion:'other-schema'}),null);
  assert.equal(parseAlphabetProgress({...s,schema:2}),null);
  const corrupted=parseAlphabetProgress({
    ...s, letters:{fake:{completedSteps:[0,1,2,3,4,5,6],completedAt:1,visited:true},
      A:{completedSteps:[999,-3,1,1,'bad'],completedAt:123,visited:true}},
    lastVisited:{letterId:'fake',step:99},
  });
  assert.ok(corrupted);
  assert.equal(corrupted.lastVisited,null);
  assert.equal(corrupted.letters.fake,undefined);
  assert.deepEqual(corrupted.letters.A.completedSteps,[1]);
  assert.equal(corrupted.letters.A.completedAt,null);
});

test('after all 42 seven-step visual modules, continue moves to greeting; no fake audio grade',()=>{
  const s=newAlphabetProgress();
  for(const l of CZECH_ALPHABET_LETTERS) {
    s.letters[l.id]={visited:true,completedAt:123,completedSteps:[0,1,2,3,4,5,6]};
  }
  assert.equal(alphabetSeenCount(s),42);
  assert.equal(getAlphabetContinueTarget(s),null);
  assert.equal(L01_WORKING_SOURCE.lessonId,'CZ-A0-M01-L01');
  assert.equal(L01_WORKING_SOURCE.qaStatus,'draft_ai');
  assert.equal(L01_WORKING_SOURCE.publishAllowed,false);
});

test('a seen letter can be reviewed through ALL seven steps without losing earlier completion',()=>{
  let s=openAlphabetLetter(newAlphabetProgress(),'A',false,100);
  for(let step=0;step<7;step++)s=completeAlphabetStep(s,'A',step,200+step);
  assert.equal(getLetterStatus(s,'A'),'seen');
  const oldCompletedAt=s.letters.A.completedAt;
  s=openAlphabetLetter(s,'A',true,500);
  assert.deepEqual(s.lastVisited,{letterId:'A',step:0});
  for(let step=0;step<7;step++){
    s=completeAlphabetStep(s,'A',step,600+step);
    if(step<6){
      assert.deepEqual(s.lastVisited,{letterId:'A',step:step+1},
        'Repeating a completed letter must not immediately jump to the catalog');
      assert.equal(getLetterStatus(s,'A'),'seen');
    }
  }
  assert.equal(s.letters.A.completedAt,oldCompletedAt);
  assert.equal(alphabetSeenCount(s),1);
  assert.deepEqual(getAlphabetContinueTarget(s),{letterId:'Á',step:0});
});
