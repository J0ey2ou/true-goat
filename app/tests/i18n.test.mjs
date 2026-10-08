import test from 'node:test';
import assert from 'node:assert/strict';
import {t,registerNames,LANGUAGES} from '../i18n.mjs';
import {readFileSync} from 'node:fs';
import {decoratePlayerIdentity,playerNameLabel,playerNameNote} from '../player-localization.mjs';
import {dimensionDetailsMarkup} from '../dimension-details.mjs';
import {applyOpponentContext,opponentContextMarkup} from '../opponent-context.mjs';
const json=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
test('three locales cover key flows and preserve numbers and symbols',()=>{
  assert.deepEqual(LANGUAGES,['zh-CN','zh-TW','en']);
  assert.equal(t('猜球员','en'),'Guess the Player');
  assert.equal(t('球员库','zh-TW'),'球員庫');
  assert.equal(t('猜球员','zh-CN'),'猜球员');
  assert.equal(t('MVP 2 / 8 ↑','en'),'MVP 2 / 8 ↑');
  for(const text of ['账号 / 对战','小抄辅导','放弃本局 · 揭晓答案','NBA 简单·知名球星'])assert.doesNotMatch(t(text,'en'),/[\u3400-\u9fff]/);
});
test('reviewed identity labels cover the original 300 without changing source facts',()=>{
  const players=json('../data/player-directory.json').players;
  const decorated=players.map(decoratePlayerIdentity);
  assert.equal(decorated.filter(p=>p.chineseName).length,300);
  for(let i=0;i<players.length;i++){
    assert.equal(decorated[i].name,players[i].name);
    assert.equal(decorated[i].id,players[i].id);
    assert.equal(decorated[i].careerRS,players[i].careerRS);
  }
  const lebron=decorated.find(p=>p.id==='jamesle01');
  assert.equal(playerNameLabel(lebron),'勒布朗·詹姆斯');
  registerNames(decorated);
  assert.equal(t('勒布朗·詹姆斯','en'),'LeBron James');
  assert.equal(t(t('勒布朗·詹姆斯','zh-TW'),'en'),'LeBron James');
  registerNames([{player_id:'abdulka01',player_name:'Kareem Abdul-Jabbar',chineseName:'卡里姆·贾巴尔'}]);
  assert.equal(t('卡里姆·贾巴尔','en'),'Kareem Abdul-Jabbar');
});
test('unknown original names remain intact and unverified translations are explicit',()=>{
  const original={id:'unverified',name:'先未知',chineseName:'先未知',aliases:['Unknown Nickname']};
  registerNames([original,{id:'short-label',name:'Josh Akognon',chineseName:'约什'}]);
  assert.equal(t('先未知','en'),'先未知');
  assert.equal(playerNameLabel(original,'en'),'先未知');
  assert.match(playerNameNote(original,'en'),/unverified/);
  assert.equal(playerNameLabel({id:'unverified-latin',name:'Unlisted Player'}),'Unlisted Player');
  assert.match(playerNameNote({name:'Unlisted Player'}),/未核实/);
  assert.doesNotMatch(t('约什·布恩','en'),/Akognon/);
  assert.equal(t('Chicago Bulls','zh-CN'),'芝加哥公牛');
  assert.equal(t('Los Angeles Lakers','zh-TW'),'洛杉磯湖人');
  assert.equal(t('Chicago Bulls','en'),'Chicago Bulls');
});
test('cross-league coverage explanations translate completely without altering IDs',()=>{
  const players=json('../data/guess-players.json').players;
  registerNames(players);
  for(const player of players)for(const note of player.notes||[])assert.doesNotMatch(t(note,'en'),/[\u3400-\u9fff]/,player.id+': '+note);
});
test('dimension input tables and opponent formulas are fully available in English',()=>{
  const payload=json('../../data/processed/goat_model_v0_2_web.json');
  const audit=json('../data/dimension-audit.json');
  const player=applyOpponentContext(payload.players,json('../data/opponent-context.json')).find(p=>p.player_id==='jordami01');
  for(const key of ['regular_season','peak','longevity','playoffs','awards','defense','team_success']){
    const html=dimensionDetailsMarkup({player,key,audit,opponentMarkup:opponentContextMarkup(player,key)});
    for(const chunk of html.replace(/<[^>]*>/g,'\n').split('\n'))assert.doesNotMatch(t(chunk,'en'),/[\u3400-\u9fff]/,key+': '+chunk);
  }
});
test('search nicknames such as The Answer cannot rewrite UI sentences',()=>{
  registerNames([{name:'Allen Iverson',chineseName:'阿伦·艾弗森',aliases:['答案']}]);
  assert.equal(t('八次机会，找到答案','en'),'Eight guesses. One player');
  assert.equal(t('阿伦·艾弗森','en'),'Allen Iverson');
  assert.doesNotMatch(t('答案与搜索同时受限制','en'),/Iverson/);
});
