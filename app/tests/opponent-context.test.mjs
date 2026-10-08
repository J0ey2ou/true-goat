import test from 'node:test';
import assert from 'node:assert/strict';
import {applyOpponentContext,summarizePhase,opponentContextMarkup} from '../opponent-context.mjs';
import {scorePlayer} from '../model.mjs';
import {readFileSync} from 'node:fs';
const player={player_id:'a',components:{regular_season_score:70,playoffs_score:80,team_success_score:60}};
const season={year:2000,phase:'rs',games:80,coveredGames:60,strength:80,reference:60,opponentPpg:20,equalWeightGames:0,topOpponents:[]};
const payload={throughSeason:2024,players:{a:{seasons:[season,{...season,phase:'po'}],championships:[{factor:1.15}]}}};
test('stronger same-era opposition raises the actual score and weaker opposition lowers it',()=>{
  const [strong]=applyOpponentContext([player],payload);
  assert.ok(scorePlayer(strong,{regular_season:2}).score>scorePlayer(player,{regular_season:2}).score);
  const [weak]=applyOpponentContext([player],{players:{a:{seasons:[{...season,strength:40}],championships:[]}}});
  assert.ok(scorePlayer(weak,{regular_season:2}).score<scorePlayer(player,{regular_season:2}).score);
  assert.ok(strong.components.team_success_score>player.components.team_success_score);
});
test('switching off restores exact scores; repeated application and roster expansion are invariant',()=>{
  const [once]=applyOpponentContext([player],payload),[twice]=applyOpponentContext([once],payload);
  assert.deepEqual(once,twice);
  assert.deepEqual(applyOpponentContext([once],payload,{enabled:false})[0].components,player.components);
  assert.deepEqual(applyOpponentContext([player,{player_id:'unseen',components:{}}],payload)[0],once);
});
test('missing dimensions and missing leagues are never fabricated, zero settings stay tied',()=>{
  const [missing]=applyOpponentContext([{player_id:'a',components:{regular_season_score:null}}],payload);
  assert.equal(missing.components.regular_season_score,null);
  assert.equal(scorePlayer(missing,{regular_season:1}).score,null);
  assert.equal(scorePlayer(missing,{}).score,50);
  const [unknown]=applyOpponentContext([{...player,player_id:'cba'}],payload);
  assert.deepEqual(unknown.components,player.components);
  assert.equal(unknown.opponentContext.available,false);
});
test('adjustment is bounded and phase aggregation weights actual covered games',()=>{
  const p=applyOpponentContext([player],{players:{a:{seasons:[{...season,strength:100,reference:0,coveredGames:80}],championships:Array.from({length:100},()=>({factor:1.25}))}}},{strength:2})[0];
  assert.equal(p.components.regular_season_score,86);
  assert.equal(p.components.team_success_score,76);
  const x=summarizePhase([season,{...season,coveredGames:20,strength:40}],'rs');
  assert.equal(x.strength,70);assert.equal(x.coveredGames,80);assert.equal(x.games,160);
  const incomplete=summarizePhase([season,{...season,strength:null,coveredGames:0}],'rs');
  assert.equal(incomplete.games,160);assert.equal(incomplete.coverage,60/160);
});
test('opposition details disclose limits, same-season ranking and missing paths',()=>{
  const [p]=applyOpponentContext([player],{players:{a:{seasons:[season],championships:[]}}});
  assert.match(opponentContextMarkup(p,'regular_season'),/0.8 × B/);
  assert.match(opponentContextMarkup(p,'team_success'),/不等于零次总冠军/);
  assert.equal(opponentContextMarkup(p,'defense'),'');
});
test('published opponent evidence preserves verified title seasons and excludes self opponents',()=>{
  const data=JSON.parse(readFileSync(new URL('../data/opponent-context.json',import.meta.url),'utf8'));
  assert.equal(data.players.jamesle01.phases.rs.games,1492,'NBA regular appearances through 2024, excluding play-ins and Cup final');
  assert.deepEqual(data.players.jordami01.championships.map(s=>s.year),[1991,1992,1993,1996,1997,1998]);
  assert.deepEqual(data.players.jamesle01.championships.map(s=>s.year),[2012,2013,2016,2020]);
  for(const [id,entry] of Object.entries(data.players)){
    for(const phase of Object.values(entry.phases).filter(Boolean)){
      assert.ok(phase.coverage>0&&phase.coverage<=1);
      assert.ok(phase.coveredGames<=phase.games);
      assert.ok(phase.topOpponents.every(p=>p.id!==id&&p.rank>=1&&p.rank<=p.poolSize));
    }
    assert.ok(entry.championships.every(s=>s.year<=2024&&s.factor>=.75&&s.factor<=1.25));
  }
});
