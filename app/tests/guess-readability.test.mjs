import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {teamDetailsMarkup} from '../guess.mjs';

const data = JSON.parse(await readFile(new URL('../data/guess-players.json',import.meta.url),'utf8'));
const player = id => data.players.find(item => item.id === id);

test('Durant details expose every recorded team without truncating names',() => {
  const durant = player('duranke01'), markup = teamDetailsMarkup(durant,data.sources);
  assert.equal((markup.match(/class="guess-team-record"/g) || []).length,durant.teams.length);
  for (const team of durant.teams) assert.ok(markup.includes(`<h3>${team.name}</h3>`));
  assert.match(markup,/Houston Rockets/);
  assert.match(markup,/当前口径内的球队名单标记完整/);
  assert.match(markup,/更名或搬迁可能分列/);
});

test('verified seasons are individual records, never interpolated across gaps',() => {
  const markup = teamDetailsMarkup(player('jordami01'),data.sources);
  assert.ok(markup.includes('<li>1992–93</li>'));
  assert.ok(markup.includes('<li>1994–95</li>'));
  assert.ok(!markup.includes('<li>1993–94</li>'));
  const yao = teamDetailsMarkup(player('mingya01'),data.sources);
  assert.match(yao,/球队名单可能不完整/);
  const cba = yao.split('data-team-id="CBA:上海"')[1].split('</li>')[0];
  assert.ok(cba.includes('2001–02'));
  assert.ok(!cba.includes('1997–98'));
});

test('missing actual appearances remain unknown and roster membership is not inferred',() => {
  const newcomer = data.players.find(item => item.nbaRoster && !item.appearances.length);
  assert.ok(newcomer);
  const markup = teamDetailsMarkup(newcomer,data.sources);
  assert.match(markup,/暂无已核实的球队经历/);
  assert.ok(!markup.includes(newcomer.nbaRoster.teamName));
  const partial = teamDetailsMarkup({teams:[{id:'test',name:'Recorded team'}],teamsComplete:false,appearances:[]});
  assert.match(partial,/暂无可核实的逐赛季出场记录/);
  assert.match(partial,/未收录不等于从未效力/);
});

test('details escape source content and allow only HTTP(S) evidence links',() => {
  const markup = teamDetailsMarkup({teams:[{id:'test',name:'<script>alert(1)</script>'}],appearances:[
    {teamId:'test',season:2025,league:'NBA',evidence:'season-games',games:2,sourceId:'good'},
    {teamId:'test',season:2026,league:'NBA',evidence:'season-games',games:0,sourceId:'bad'},
    {teamId:'test',season:2024,league:'NBA',evidence:'dated-performance',sourceId:'bad'},
    {teamId:'test',season:2023,league:'NBA',evidence:'roster',sourceId:'good'},
  ]},[{id:'good',title:'<source>',url:'https://example.com/evidence'},{id:'bad',title:'bad',url:'javascript:alert(1)'}]);
  assert.ok(!markup.includes('<script>'));
  assert.ok(markup.includes('&lt;script&gt;'));
  assert.ok(markup.includes('href="https://example.com/evidence"'));
  assert.ok(!markup.includes('javascript:'));
  assert.ok(!markup.includes('<li>2025–26</li>'));
  assert.ok(!markup.includes('<li>2022–23</li>'));
  assert.ok(markup.includes('<li>2023–24</li>'));
});

test('team details are confined to submitted guesses and native accessible dialogs',async () => {
  const source = await readFile(new URL('../guess.mjs',import.meta.url),'utf8');
  const html = await readFile(new URL('../guess.html',import.meta.url),'utf8');
  assert.match(source,/if \(!round\?\.guesses\.includes\(id\)\) return/);
  const detailsCode = source.slice(source.indexOf('export function teamDetailsMarkup'),source.indexOf('function renderHistory'));
  assert.ok(!detailsCode.includes('round.answerId'));
  assert.match(source,/type="button" class="guess-cell guess-team-cell/);
  assert.match(source,/aria-haspopup="dialog"/);
  assert.match(source,/teamDialogTrigger\?\.isConnected/);
  assert.match(html,/<dialog id="guess-team-dialog"[^>]+aria-labelledby="guess-team-dialog-title"/);
});
