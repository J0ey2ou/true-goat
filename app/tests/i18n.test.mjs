import test from 'node:test';
import assert from 'node:assert/strict';
import {t,registerNames,LANGUAGES} from '../i18n.mjs';
test('three locales cover key flows and preserve numbers and symbols',()=>{
  assert.deepEqual(LANGUAGES,['zh-CN','zh-TW','en']);
  assert.equal(t('猜球员','en'),'Guess the Player');
  assert.equal(t('球员库','zh-TW'),'球員庫');
  assert.equal(t('猜球员','zh-CN'),'猜球员');
  assert.equal(t('MVP 2 / 8 ↑','en'),'MVP 2 / 8 ↑');
  for(const text of ['账号 / 对战','小抄辅导','放弃本局 · 揭晓答案','NBA 简单·知名球星'])assert.doesNotMatch(t(text,'en'),/[\u3400-\u9fff]/);
});
test('search nicknames such as The Answer cannot rewrite UI sentences',()=>{
  registerNames([{name:'Allen Iverson',chineseName:'阿伦·艾弗森',aliases:['答案']}]);
  assert.equal(t('八次机会，找到答案','en'),'Eight guesses. One player');
  assert.equal(t('阿伦·艾弗森','en'),'Allen Iverson');
  assert.doesNotMatch(t('答案与搜索同时受限制','en'),/Iverson/);
});
