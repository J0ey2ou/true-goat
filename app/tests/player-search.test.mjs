import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeSearch, searchPlayers} from '../player-search.mjs';

const dictionary = JSON.parse(readFileSync(new URL('../../config/player-aliases.json', import.meta.url), 'utf8'));
const payload = JSON.parse(readFileSync(new URL('../data/guess-players.json', import.meta.url), 'utf8'));
const raw = payload.players;
const resolvedId = id => payload.identityRedirects?.[id] || id;
const players = raw.map(player => ({...player, ...dictionary.players[player.id]}));
const first = query => searchPlayers(players, query)[0]?.id;
const ids = query => searchPlayers(players, query).map(player => player.id);

test('reviewed alias dictionary survives expanded and merged identities without inventing translations', () => {
  assert.equal(Object.keys(dictionary.players).length, 347);
  for (const [id,alias] of Object.entries(dictionary.players)) {
    const player=raw.find(p=>p.id===resolvedId(id));
    assert.ok(player,id);
    assert.match(alias.chineseName, /\p{Script=Han}/u);
    assert.ok(Array.isArray(alias.aliases));
    assert.ok(player.chineseName===alias.chineseName || player.aliases.includes(alias.chineseName));
  }
  assert.equal(new Set(raw.map(player => player.id)).size, raw.length);
});

test('Harden is found by Chinese, short name, nickname, typo and English', () => {
  for (const query of ['哈登', '詹姆斯·哈登', '大胡子', '登哥', 'James Harden', 'jame harden', 'THE BEARD', 'ha deng', 'hadeng']) {
    assert.equal(first(query), 'hardeja01', query);
  }
});

test('CP3 and PG13 are not confused', () => {
  assert.equal(first('CP3'), 'paulch01');
  assert.equal(first('泡椒'), 'georgpa01');
  assert.equal(first('PG13'), 'georgpa01');
  assert.ok(!ids('泡椒').includes('paulch01'));
});

test('common Chinese aliases and historical names work', () => {
  for (const [query, id] of Object.entries({
    黑曼巴:'bryanko01', 小皇帝:'jamesle01', 石佛:'duncati01', 约老师:'jokicni01',
    库昊:'curryst01', 大鲨鱼:'onealsh01', 字母哥:'antetgi01', 答案:'iversal01',
    小卡:'leonaka01', 卡哇伊:'leonaka01', 德鲁大叔:'irvinky01', 神龟:'westbru01',
    獭兔:'tatumja01', 东奇契:'doncilu01', 利指导:'lillada01', 大帝:'embiijo01',
    'Ron Artest':'artesro01', 'Lew Alcindor':'abdulka01'
  })) assert.equal(first(query), id, query);
});

test('punctuation, full-width characters, accent marks and spaces normalize', () => {
  assert.equal(normalizeSearch('  ＪＯＫＩĆ —  '), 'jokic');
  for (const query of ['nikola jokic', 'Nikola Jokić', 'NIKOLAJOKIC']) assert.equal(first(query), 'jokicni01');
  assert.equal(first('t-mac'), 'mcgratr01');
  assert.equal(first('ＳＨＡＱ'), 'onealsh01');
  assert.equal(first('Shaquille Oneal'), 'onealsh01');
  assert.equal(first('Luka Doncic'), 'doncilu01');
});

test('CBA Pinyin can include spaces, accents, reverse order or no spaces', () => {
  for (const query of ['Xu Jie', 'xujie', 'Xú Jié', 'Jie Xu', '徐中锋']) assert.equal(first(query), 'cba-sina-7047');
  assert.equal(first('chen ying-chun'), 'cba-sina-6986');
  assert.equal(first('zhaijiwei'), 'cba-sina-4017'); // One Latin typo is intentional tolerance.
  assert.equal(first('zhao jiwei'), 'cba-sina-4017');
});

test('Chinese and English mixed queries search across labels', () => {
  for (const query of ['哈登 harden', '哈登Harden', 'Harden哈登']) assert.equal(first(query), 'hardeja01');
  assert.equal(first('徐杰 xu'), 'cba-sina-7047');
});

test('known duplicate nicknames and surnames retain distinct identities', () => {
  assert.ok(ids('大鸟').includes('birdla01'));
  assert.ok(ids('大鸟').includes('cba-sina-4369'));
  assert.ok(ids('保罗').includes('paulch01'));
  assert.ok(ids('保罗').includes('georgpa01'));
  assert.ok(ids('乔丹').includes('jordami01'));
  assert.ok(ids('乔丹').includes('jordade01'));
  assert.equal(first('乔丹'), 'jordami01');
});

test('limited English spelling tolerance covers one edit or adjacent swap', () => {
  assert.equal(first('james haden'), 'hardeja01');
  assert.equal(first('james hrad en'), undefined);
  assert.equal(first('james hadren'), 'hardeja01');
  assert.equal(first('jokci'), 'jokicni01');
});

test('Chinese typos and short initials are never guessed fuzzily', () => {
  assert.ok(!ids('哈等').includes('hardeja01'));
  assert.ok(!ids('约老帅').includes('jokicni01'));
  assert.equal(first('kd'), 'duranke01');
  assert.ok(!ids('kc').includes('duranke01'));
});

test('exact and partial text matches outrank fuzzy matches', () => {
  const fixture = [
    {id:'fuzzy',name:'James Harden',aliases:[]},
    {id:'exact',name:'James Haden',aliases:[]},
    {id:'partial',name:'James Haden Junior',aliases:[]}
  ];
  assert.deepEqual(searchPlayers(fixture, 'James Haden').map(player => player.id), ['exact','partial','fuzzy']);
});

test('empty query, limit and input object identity are preserved without mutation', () => {
  const snapshot = JSON.stringify(players);
  assert.equal(searchPlayers(players,'')[0], players[0]);
  assert.equal(searchPlayers(players,'',{limit:2}).length, 2);
  assert.equal(searchPlayers(players,'',{limit:0}).length, 0);
  assert.equal(searchPlayers(players,'a',{limit:1}).length, 1);
  assert.deepEqual(searchPlayers(null,'a'), []);
  assert.equal(JSON.stringify(players), snapshot);
});

test('team search is opt-in and does not contaminate player name lookup', () => {
  const player = {id:'fixture',name:'Known Player',teams:[{id:'BOS',name:'Boston Celtics'}]};
  assert.deepEqual(searchPlayers([player],'Celtics'), []);
  assert.deepEqual(searchPlayers([player],'Celtics',{includeTeams:true}), [player]);
});

test('EuroLeague selections have searchable Chinese editorial transliterations', () => {
  assert.equal(first('富尼耶'), resolvedId('euro-evan-fournier'));
  assert.equal(first('帕帕尼古拉乌'), resolvedId('euro-kostas-papanikolaou'));
  assert.equal(first('韦津科夫'), resolvedId('euro-sasha-vezenkov'));
});

test('all reviewed translated names and a deterministic expanded sample retrieve their exact identity', () => {
  const ids=new Set(Object.keys(dictionary.players).map(resolvedId));
  const sample=players.filter((p,i)=>ids.has(p.id) || i%67===0);
  for (const player of sample) assert.ok(searchPlayers(players, player.chineseName || player.name).some(result => result.id === player.id), player.id);
});
