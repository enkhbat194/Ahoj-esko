import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import receipts from '../data/courseAudioReceipts.json';
import { L01_DATASET_SHA256 } from '../data/l01WorkingSource';
import { freshProgress, isComplete, parseProgress, progressKey, updateResponse } from './courseProgress';
import { digest, readCourse, starterCourse } from './courseSource';

const first = starterCourse.lessons[0];
test('legacy first-lesson work survives migration; the scene cursor stays in its own lesson', () => {
  const old = {schema: 1, lessonId: first.lessonId, sourceSha256: L01_DATASET_SHA256, stage:'practice',
    responses:{[first.exercises[0].id]:'Нэр'}, sceneId:first.dialogues[1].id, turnIndex:100,
    dialogueRecords:{[first.dialogues[0].turns[0].id]:{attempted:true,response:'',selfCheck:'felt_ready'}, invalid:{attempted:true}}};
  const p = parseProgress(old, first)!;
  assert.equal(p.responses[first.exercises[0].id], 'Нэр');
  assert.equal(p.stage, 'practice');
  assert.equal(p.turnIndex, first.dialogues[1].turns.length);
  assert.equal(Object.keys(p.dialogueRecords).length, 1);
  assert.equal(isComplete(p, first),false);
  assert.equal(parseProgress({...p,lessonId:'other'},first),null);
  assert.equal(progressKey(first.lessonId),'ahoj_cesko_l01_v0920_practice_v1');
});
test('completion requires dialogue, phrases, pronunciation, each own answer and a saved exit', () => {
  const p = freshProgress(first);
  p.exitResponse='Dobrý den'; p.exitAttempted=true;
  assert.equal(isComplete(p,first),false);
  p.finishedScenes=first.dialogues.map(d => d.id); p.practicedPhrases=first.phrases.map(ph => ph.id);
  p.pronunciationPracticed=true;
  p.selfReviewedIds=first.exercises.map(ex=>ex.id);
  for (const ex of first.exercises) p.responses[ex.id]='procvičeno';
  assert.equal(isComplete(p,first),true);
  assert.equal(isComplete(updateResponse(p,first.exercises[0].id,'nová odpověď',first), first), false);
});
test('rejects unpinned course bytes and scoring rules', async () => {
  await assert.rejects(readCourse(new Blob(['{"lessons":[]}'])), /v0.9.20/);
  await assert.rejects(readCourse(new Blob([JSON.stringify({format:'ahoj-private-course-1',source:'{}', contracts:'fake', audio:{}})])),/Дасгалын/);
});
test('private audio receipts keep scope, style and version and exclude the unresolved L01 alias', () => {
  assert.equal(receipts.datasetSha256,L01_DATASET_SHA256);
  assert.equal(new Set(receipts.clips.map(c => c.wavSha256)).size,receipts.clips.length);
  for (const c of receipts.clips) {
    assert.equal(c.model,'gemini-3.8-flash-tts'); assert.equal(c.qa,'AUTO_PASS'); assert.equal(c.publishAllowed,false);
    assert.ok(['learning_slow','natural'].includes(c.style)); assert.match(c.textSha256,/^[0-9a-f]{64}$/);
    assert.ok(c.wavSha256.length===64 && c.voice && c.batch);
    assert.notEqual(c.sourceId,first.lessonId+'-PH011');
  }
});
const ownerFile = process.env.AHOJ_PRIVATE_COURSE;
test('owner pack: every source route, exercise, exit, audio and independent progress record', {skip: !ownerFile}, async () => {
  const bytes = await readFile(ownerFile!);
  const course = await readCourse(new Blob([new Uint8Array(bytes)]));
  assert.equal(course.lessons.length,72);
  assert.equal(course.lessons.filter(l=>l.lessonId.startsWith('CZ-A0')).length,24);
  assert.equal(course.lessons.flatMap(l=>l.phrases).length,431);
  assert.equal(course.lessons.flatMap(l=>l.dialogues).length,144);
  assert.equal(course.lessons.flatMap(l=>l.dialogues.flatMap(d=>d.turns)).length,619);
  assert.equal(course.lessons.flatMap(l=>l.exercises).length,432);
  assert.equal(new Set(course.lessons.map(l=>l.exit.id)).size,72);
  const keys = new Set<string>();
  for (const lesson of course.lessons) {
    const p = freshProgress(lesson);
    p.finishedScenes=lesson.dialogues.map(d=>d.id); p.practicedPhrases=lesson.phrases.map(ph=>ph.id);
    p.pronunciationPracticed=true; p.exitResponse='Odpověď'; p.exitAttempted=true;
    for (const e of lesson.exercises) {
      assert.ok(e.promptMn.trim() && e.proposedAnswer.trim());
      p.responses[e.id]='Odpověď';p.revealedIds.push(e.id);p.selfReviewedIds.push(e.id);
    }
    assert.ok(lesson.exit.situationMn && lesson.exit.missionMn && lesson.exit.rubric.length);
    assert.ok(isComplete(parseProgress(p,lesson)!,lesson));
    keys.add(progressKey(lesson.lessonId));
  }
  assert.equal(keys.size,72);
  const clips=[...course.clips.values()].flat();
  assert.equal(clips.length,receipts.clips.length);
  for (const clip of clips) {
    const wav=await clip.blob.arrayBuffer();
    assert.equal(new TextDecoder().decode(wav.slice(0,4)),'RIFF');
    assert.equal(await digest(wav),clip.receipt.wavSha256);
  }
  const pack=JSON.parse(bytes.toString());
  delete pack.audio[receipts.clips[0].wavSha256];
  await assert.rejects(readCourse(new Blob([JSON.stringify(pack)])), /Аудионы эх/);
});
