import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PROJECT_DRIVE_FOLDER_ID,
  extractDriveFolderId,
  parseDriveCurriculumText,
} from './driveCurriculumParser';

test('extractDriveFolderId extracts folder IDs from Drive URLs and raw IDs', () => {
  assert.equal(
    extractDriveFolderId('https://drive.google.com/drive/u/2/folders/1TFTOQHQK7JKQFhueBI8LURbxRIdROhYj'),
    DEFAULT_PROJECT_DRIVE_FOLDER_ID
  );
  assert.equal(
    extractDriveFolderId('1TFTOQHQK7JKQFhueBI8LURbxRIdROhYj'),
    DEFAULT_PROJECT_DRIVE_FOLDER_ID
  );
  assert.equal(extractDriveFolderId('not a valid id!'), null);
});

test('parseDriveCurriculumText parses JSON, CSV, and dash-separated Czech-Mongolian lines cleanly', () => {
  const csvSample = [
    'czechWord,phoneticHint,mongolianWord,czechSentence,mongolianSentence,topicId',
    'Káva,Каава,Кофе,Dám si jednu kávu.,Би нэг кофе авъя.,cafe',
  ].join('\n');
  const csvParsed = parseDriveCurriculumText(csvSample, 'lessons.csv');
  assert.equal(csvParsed.detectedFormat, 'csv');
  assert.equal(csvParsed.cards.length, 1);
  assert.equal(csvParsed.cards[0].topicId, 'cafe');
  assert.equal(csvParsed.cards[0].czechWord, 'Káva');

  const lineSample = 'Dobrý den — Сайн байна уу\nDěkuji — Баярлалаа';
  const lineParsed = parseDriveCurriculumText(lineSample, 'notes.txt');
  assert.equal(lineParsed.detectedFormat, 'lines');
  assert.equal(lineParsed.cards.length, 2);

  const jsonSample = JSON.stringify({
    cards: [{ czechWord: 'Jízdenka', mongolianWord: 'Тасалбар', topicId: 'transport' }],
  });
  const jsonParsed = parseDriveCurriculumText(jsonSample, 'backup.json');
  assert.equal(jsonParsed.detectedFormat, 'json');
  assert.equal(jsonParsed.cards[0].topicId, 'transport');
});

test('Drive JSON and CSV preserve explicit canonical content IDs without changing QA status', () => {
  const json = parseDriveCurriculumText(JSON.stringify({
    cards: [{
      canonicalId: 'CZ-A0-M01-L01-PH001',
      czechWord: 'Dobrý den.',
      mongolianWord: 'Сайн байна уу.',
      qaStatus: 'native_approved',
    }],
  }), 'content.json');
  assert.equal(json.cards[0]?.canonicalId, 'CZ-A0-M01-L01-PH001');
  assert.equal('qaStatus' in json.cards[0], false, 'unverified Drive imports cannot grant approval');

  const csv = [
    'czechWord,phoneticHint,mongolianWord,czechSentence,mongolianSentence,topicId,canonicalId',
    'Ahoj.,Ахой,Сайн уу.,Ahoj.,Сайн уу.,greetings,CZ-A0-M01-L01-PH002',
  ].join('\n');
  const result = parseDriveCurriculumText(csv, 'cards.csv');
  assert.equal(result.cards.length, 1);
  assert.equal(result.cards[0]?.canonicalId, 'CZ-A0-M01-L01-PH002');
});

test('audio request manifest is not interpreted as Czech vocabulary', () => {
  const audioManifest = [
    'request_id,source_id,cs_exact,mn_context,lesson_id',
    'AF-001,CZ-A0-M01-L01-PH001,Dobrý den.,Сайн байна уу.,CZ-A0-M01-L01',
  ].join('\n');
  const result = parseDriveCurriculumText(audioManifest, 'audio_requests.csv');
  assert.equal(result.cards.length, 0);
  assert.equal(result.detectedFormat, 'unstructured');
});
