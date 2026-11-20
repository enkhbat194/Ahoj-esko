import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CZECH_ALPHABET_PACKS,CZECH_ALPHABET_PACK_BY_ID,
  APPROVED_ALPHABET_AUDIO,approvedAlphabetAudio,isPackAudioReady,
  spellingRequiresWordContext,CONTEXT_REQUIRED_SPELLINGS,
} from '../data/czechAlphabetPacks';
import { CZECH_ALPHABET_LETTERS } from '../data/czechAlphabetCourse';
import {
  emptyPackProgress,getPackContinueTarget,introduceNextLetter,lettersIntroducedCount,
  openPack,packIntroducedCount,packIsCompleted,packReport,packsPassedCount,
  safePackProgress,scorePackAudioChoice,
} from './alphabetPackProgress';

test('9 packs have 4 or 5 letters each, in exact canonical Czech alphabet order',()=>{
  assert.equal(CZECH_ALPHABET_PACKS.length,9);
  assert.ok(CZECH_ALPHABET_PACKS.every(p=>p.letters.length>=4&&p.letters.length<=5));
  assert.deepEqual(CZECH_ALPHABET_PACKS.flatMap(p=>p.letters.map(x=>x.id)),
    CZECH_ALPHABET_LETTERS.map(x=>x.id));
  assert.deepEqual(CZECH_ALPHABET_PACKS[0].letters.map(x=>x.id),['A','Á','B','C','Č']);
  assert.equal(CZECH_ALPHABET_PACKS.flatMap(p=>p.letters).length,42);
  assert.equal(CZECH_ALPHABET_PACK_BY_ID.get('CZ-ALPHA-P03')?.letters[3].id,'CH');
});

test('pack intro is one sequential 4–5-letter learning unit; not 7 steps per letter',()=>{
  let s=emptyPackProgress();
  assert.deepEqual(getPackContinueTarget(s),{packId:'CZ-ALPHA-P01',stage:'introduce',index:0});
  s=openPack(s,'CZ-ALPHA-P01',100);
  assert.equal(s.last?.index,0);
  for(let i=0;i<5;i++){
    const before=lettersIntroducedCount(s);
    s=introduceNextLetter(s,'CZ-ALPHA-P01',200+i);
    assert.equal(lettersIntroducedCount(s),before+1);
    assert.equal(packIntroducedCount(s,'CZ-ALPHA-P01'),i+1);
    assert.equal(packIsCompleted(s,'CZ-ALPHA-P01'),false);
  }
  assert.deepEqual(s.last,{packId:'CZ-ALPHA-P01',stage:'listen_name',index:0});
  assert.equal(packsPassedCount(s),0);
  const report=packReport(s,'CZ-ALPHA-P01');
  assert.equal(report.visualIntroduced,5);
  assert.equal(report.nameRecognized,0);
  assert.equal(report.soundMatched,0);
  assert.equal(report.hasAiAssessment,false);
  assert.equal(report.completed,false);
});

test('no Gemini approved audio => no fake listening score, AI report or completion',()=>{
  assert.equal(APPROVED_ALPHABET_AUDIO.length,0);
  const pack=CZECH_ALPHABET_PACKS[0];
  assert.equal(isPackAudioReady(pack,'letter_name'),false);
  assert.equal(isPackAudioReady(pack,'sound_in_word'),false);
  assert.equal(approvedAlphabetAudio('A','letter_name'),undefined);
  let s=openPack(emptyPackProgress(),pack.id);
  for(let i=0;i<pack.letters.length;i++)s=introduceNextLetter(s,pack.id);
  const result=scorePackAudioChoice(s,pack.id,'letter_name','A','A');
  assert.equal(result.scored,false);
  assert.equal(result.correct,false);
  assert.deepEqual(result.next,s);
  assert.equal(packIsCompleted(s,pack.id),false);
  assert.equal(packReport(s,pack.id).hasAiAssessment,false);
});

test('unseen packs can be visually previewed without falsely completing earlier blocked audio test',()=>{
  let s=openPack(emptyPackProgress(),'CZ-ALPHA-P01');
  for(let i=0;i<5;i++)s=introduceNextLetter(s,'CZ-ALPHA-P01');
  s=openPack(s,'CZ-ALPHA-P02');
  assert.deepEqual(s.last,{packId:'CZ-ALPHA-P02',stage:'introduce',index:0});
  assert.equal(packsPassedCount(s),0);
  s=introduceNextLetter(s,'CZ-ALPHA-P02');
  assert.deepEqual(getPackContinueTarget(s),{packId:'CZ-ALPHA-P02',stage:'introduce',index:1});
});

test('all nine packs visually introduced still means zero completed listening groups',()=>{
  let s=emptyPackProgress();
  for(const p of CZECH_ALPHABET_PACKS) {
    s=openPack(s,p.id);
    for(let i=0;i<p.letters.length;i++)s=introduceNextLetter(s,p.id);
  }
  assert.equal(lettersIntroducedCount(s),42);
  assert.equal(packsPassedCount(s),0);
  assert.equal(getPackContinueTarget(s)?.stage,'listen_name');
  assert.equal(getPackContinueTarget(s)?.packId,CZECH_ALPHABET_PACKS[8].id);
  assert.equal(safePackProgress(JSON.parse(JSON.stringify(s)))?.last?.packId,CZECH_ALPHABET_PACKS[8].id);
});

test('pack backup validates schema, sound claims, IDs, unsafe data',()=>{
  const bad=emptyPackProgress();
  assert.equal(safePackProgress({...bad,schema:1}),null);
  assert.equal(safePackProgress({...bad,sourceVersion:'incompatible'}),null);
  const corrupt=safePackProgress({
    ...bad,packs:{
      'bad-pack':{introducedIds:['A'],nameCompletedIds:[],soundCompletedIds:[]},
      'CZ-ALPHA-P01':{
        introducedIds:['A','bad','A','Á'],
        nameCompletedIds:['C','bad'],
        soundCompletedIds:[],
        firstTryCorrectIds:['C','bad'],
        mistakeCounts:{'C':2,'bad':88},
        finishedAt:100,
      },
    },
    last:{packId:'bad-pack',stage:'introduce',index:0},
    earlierVisualFamiliarIds:['A','bad','A'],
  });
  assert.ok(corrupt);
  assert.equal(corrupt.last,null);
  assert.equal(corrupt.packs['bad-pack'],undefined);
  assert.deepEqual(corrupt.packs['CZ-ALPHA-P01'].introducedIds,['A','Á']);
  assert.equal(corrupt.packs['CZ-ALPHA-P01'].finishedAt,null);
  assert.deepEqual(corrupt.earlierVisualFamiliarIds,['A']);
});

test('Ú/Ů and I/Y spelling is contextual; do not assert unique sound-only answers',()=>{
  assert.equal(CONTEXT_REQUIRED_SPELLINGS.length,3);
  for(const letter of ['Ú','Ů','I','Y','Í','Ý']) {
    assert.equal(spellingRequiresWordContext(letter),true,letter);
  }
  for(const letter of ['A','Á','C','Č','Ř','CH']) {
    assert.equal(spellingRequiresWordContext(letter),false,letter);
  }
  assert.equal(CZECH_ALPHABET_PACKS[7].letters[0].id,'Ú');
  assert.equal(CZECH_ALPHABET_PACKS[7].letters[1].id,'Ů');
});
