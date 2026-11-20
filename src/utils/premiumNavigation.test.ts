import assert from 'node:assert/strict';
import test from 'node:test';
import { PREMIUM_NAV_ORDER, PREMIUM_NAV_LABELS, premiumNavTarget, premiumNavSelected } from './premiumNavigation';
import { L01_WORKING_SOURCE } from '../data/l01WorkingSource';

test('five real sections with AI third and no fabricated sixth item', () => {
  assert.deepEqual(PREMIUM_NAV_ORDER, ['home','read','ai','cards','menu']);
  assert.equal(PREMIUM_NAV_ORDER[2], 'ai');
  assert.deepEqual(PREMIUM_NAV_ORDER.map(id=>PREMIUM_NAV_LABELS[id]), ['Үе давах','Унших','AI','Карт','Цэс']);
  assert.equal(new Set(PREMIUM_NAV_ORDER).size, 5);
});

test('each premium navigation button routes to an existing learner screen', () => {
  assert.deepEqual(premiumNavTarget('home'), {activeTab:'today'});
  assert.deepEqual(premiumNavTarget('read'), {activeTab:'story'});
  assert.deepEqual(premiumNavTarget('ai'), {activeTab:'learn',learnSubTab:'ai'});
  assert.deepEqual(premiumNavTarget('cards'), {activeTab:'review'});
  assert.deepEqual(premiumNavTarget('menu'), {activeTab:'profile'});
});

test('AI tab is selected only for AI-teacher subview and lesson content remains accessible', () => {
  assert.equal(premiumNavSelected('learn','ai'),'ai');
  assert.equal(premiumNavSelected('learn','mission'),'home');
  assert.equal(premiumNavSelected('today','mission'),'home');
  assert.equal(premiumNavSelected('story','ai'),'read');
  assert.equal(premiumNavSelected('review','mission'),'cards');
  assert.equal(premiumNavSelected('profile','ai'),'menu');
});

test('home shows the real canonical L01 lesson, not an English textbook or invented course progress', () => {
  assert.equal(L01_WORKING_SOURCE.lessonId,'CZ-A0-M01-L01');
  assert.equal(L01_WORKING_SOURCE.titleMn,'Мэндлэх, нэрээ хэлэх, нэр асуух');
  assert.equal(L01_WORKING_SOURCE.exercises.length,6);
  assert.equal(L01_WORKING_SOURCE.publishAllowed,false);
});
