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
