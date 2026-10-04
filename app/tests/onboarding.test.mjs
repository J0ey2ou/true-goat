import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {STORAGE_KEY, onboardingStorageKey, readOnboardingState, markOnboardingSeen, initOnboarding} from '../onboarding.mjs';

const storage = initial => {
  const values = new Map(Object.entries(initial));
  return {values, getItem:key=>values.get(key) ?? null, setItem:(key,value)=>values.set(key,value)};
};

test('guide can be imported and initialized without a browser', () => {
  assert.doesNotThrow(()=>initOnboarding(null));
});

test('guide completion writes only its own versioned preference, not model or game data', () => {
  const store = storage({'true-goat-v04':'saved model','true-goat-guess:v1':'saved game'});
  assert.equal(readOnboardingState(store), null);
  const marked = markOnboardingSeen('completed', store);
  assert.equal(marked.version, 2);
  assert.equal(marked.page, 'lab');
  assert.equal(marked.seen, true);
  assert.equal(marked.reason, 'completed');
  assert.ok(Number.isFinite(Date.parse(marked.seenAt)));
  assert.deepEqual(readOnboardingState(store), marked);
  assert.equal(store.values.get('true-goat-v04'), 'saved model');
  assert.equal(store.values.get('true-goat-guess:v1'), 'saved game');
  assert.equal(store.values.size, 3);
});

test('invalid or future preference versions never masquerade as completed onboarding', () => {
  for (const value of ['{bad','null','true','[]','{"seen":false}','{"seen":"true"}','{"version":3,"page":"lab","seen":true}','{"version":2,"seen":true}','{"version":2,"page":"directory","seen":true}']) {
    assert.equal(readOnboardingState(storage({[onboardingStorageKey('lab')]:value})), null, value);
  }
  assert.equal(readOnboardingState(storage({[onboardingStorageKey('lab')]:'{"seen":true}'})), null);
});

test('each page remembers only its own introduction; legacy global completion suppresses none', () => {
  const legacy = JSON.stringify({version:1, seen:true, reason:'completed'});
  const store = storage({'true-goat-onboarding-v1':legacy});
  const scopes = ['lab','directory','guess'];
  for (const page of scopes) assert.equal(readOnboardingState(store, page), null);
  for (const [index, page] of scopes.entries()) {
    assert.equal(onboardingStorageKey(page), `${STORAGE_KEY}:${page}`);
    markOnboardingSeen('completed', store, page);
    for (const [otherIndex, otherPage] of scopes.entries()) {
      assert.equal(readOnboardingState(store, otherPage)?.seen === true, otherIndex <= index);
    }
  }
  assert.equal(store.values.get('true-goat-onboarding-v1'), legacy, 'migration keeps the old preference untouched');
  assert.equal(store.values.size, 4);
  assert.throws(()=>onboardingStorageKey('unknown'), TypeError);
});

test('browser storage failures cannot stop guests from closing or using the guide', () => {
  const blocked = {getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
  assert.equal(readOnboardingState(blocked), null);
  assert.equal(markOnboardingSeen('skipped', blocked).seen, true);
  assert.equal(readOnboardingState(null), null);
  assert.equal(markOnboardingSeen('dismissed', null).seen, true);
});

test('all pages retain replay and contextual help outside the first-visit modal', async () => {
  for (const file of ['index.html','players.html','guess.html']) {
    const html = await readFile(new URL('../'+file, import.meta.url),'utf8');
    assert.match(html, /type="button" data-open-guide/);
    assert.match(html, /type="button" data-open-tour/);
    assert.match(html, /src="\/onboarding\.mjs"/);
    assert.match(html, /href="\/onboarding\.css"/);
  }
});
