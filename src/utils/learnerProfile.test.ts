import test from 'node:test';
import assert from 'node:assert/strict';
import { getQaStatusLabelMn, resolveCuratedCzechForm } from './learnerProfile';

test('resolveCuratedCzechForm resolves masculine/feminine variants strictly for learner_self items', () => {
  const selfItem = {
    agreementType: 'learner_self' as const,
    variants: {
      masculine: 'Jsem Mongol.',
      feminine: 'Jsem Mongolka.',
    },
  };
  assert.equal(resolveCuratedCzechForm(selfItem, 'masculine'), 'Jsem Mongol.');
  assert.equal(resolveCuratedCzechForm(selfItem, 'feminine'), 'Jsem Mongolka.');
});

test('resolveCuratedCzechForm preserves character dialogue gender regardless of learner gender', () => {
  const charItem = {
    agreementType: 'character_self' as const,
    personaGender: 'feminine' as const,
    variants: {
      masculine: 'Pracoval jsem v Praze.',
      feminine: 'Pracovala jsem v Praze.',
    },
  };
  assert.equal(resolveCuratedCzechForm(charItem, 'masculine'), 'Pracovala jsem v Praze.');
  assert.equal(resolveCuratedCzechForm(charItem, 'feminine'), 'Pracovala jsem v Praze.');
});

test('resolveCuratedCzechForm returns fixed string for invariant items and honest draft QA label', () => {
  assert.equal(
    resolveCuratedCzechForm({ agreementType: 'invariant', fixed: 'Dobrý den.' }, 'feminine'),
    'Dobrý den.'
  );
  assert.equal(getQaStatusLabelMn('draft_ai'), 'Ноорог · QA хүлээгдэж буй');
  assert.equal(getQaStatusLabelMn('native_approved'), 'Баталгаажсан');
});
