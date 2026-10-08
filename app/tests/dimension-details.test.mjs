import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { DIMENSIONS } from '../model.mjs';
import { auditDimension, referencePercentile, rankDimension, dimensionDetailsMarkup } from '../dimension-details.mjs';
import { radarMarkup } from '../score-charts.mjs';

const json=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const [audit,original,catalog]=await Promise.all([json('../data/dimension-audit.json'),json('../../data/processed/goat_model_v0_2_web.json'),json('../data/player-catalog.json')]);

test('all published original dimensions reconstruct from real inputs and frozen percentiles',()=>{
  assert.equal(audit.referenceCount,300);let compared=0;
  for(const player of original.players)for(const {key} of DIMENSIONS){
    const detail=auditDimension(player,key,audit),published=player.components[key+'_score'];
    if(!Number.isFinite(published)){assert.equal(detail.reconstructed,null);continue;}
    assert.ok(Math.abs(detail.reconstructed-published)<0.00011,player.player_id+' '+key+': '+detail.reconstructed+' vs '+published);
    assert.ok(Math.abs(detail.items.reduce((sum,x)=>sum+x.effectiveWeight,0)-1)<1e-12);compared++;
  }
  assert.ok(compared>2000);
});

test('every extended NBA dimension matches the existing extension percentile convention',()=>{
  let compared=0;
  for(const profile of catalog.players){const player=profile.model;if(!player?.extension)continue;
    for(const {key} of DIMENSIONS){const result=auditDimension(player,key,audit),expected=player.components[key+'_score'];
      if(expected===null){assert.equal(result.reconstructed,null,player.player_id+' '+key);continue;}
      assert.ok(Math.abs(result.reconstructed-expected)<1e-8,player.player_id+' '+key);compared++;
    }
  }
  assert.ok(compared>10000);
});

test('missing is never a zero percentile, ties and new values follow frozen rank rules',()=>{
  assert.equal(referencePercentile(null,[1,2,2,4]),null);
  assert.equal(referencePercentile(2,[1,2,2,4]),0.625);
  assert.equal(referencePercentile(3,[1,2,2,4]),0.75);
  assert.equal(referencePercentile(0,[1,2,2,4]),0);
  assert.equal(referencePercentile(5,[1,2,2,4]),1);
  const empty=auditDimension({player_id:'unknown',components:{}},'peak',audit);assert.equal(empty.reconstructed,null);assert.equal(empty.observedWeight,0);assert.ok(empty.items.every(x=>x.raw===null&&x.points===null));
});

test('dimension rank is independent of model contribution and preserves rank under search and pagination',()=>{
  const rows=[{player_id:'a',player_name:'Alice',components:{peak_score:90}},{player_id:'b',player_name:'Bob',components:{peak_score:90}},{player_id:'c',player_name:'Carol',chineseName:'卡萝',components:{peak_score:50}},{player_id:'d',player_name:'Dave',components:{peak_score:null}}];
  assert.deepEqual(rankDimension(rows,'peak').rows.map(p=>p.dimensionRank),[1,1,3,null]);
  const page=rankDimension(rows,'peak',{page:2,pageSize:2});assert.deepEqual(page.rows.map(p=>p.player_id),['c','d']);assert.equal(page.pages,2);
  assert.equal(rankDimension(rows,'peak',{query:'卡萝'}).rows[0].dimensionRank,3);
  assert.equal(rankDimension(rows,'peak',{query:'missing'}).total,0);
});

test('detail shows original and adjusted scores with the actual coefficient; radar exposes keyboard actions',()=>{
  const player={...original.players[0],rawComponents:original.players[0].components,components:{...original.players[0].components,regular_season_score:88}};
  const markup=dimensionDetailsMarkup({player,key:'regular_season',audit,coefficient:2});
  assert.match(markup,/7\.6000 分/);assert.match(markup,/career_ppg/);assert.match(markup,/基础维度指数/);assert.match(markup,/当前有效指数/);
  assert.match(dimensionDetailsMarkup({player,key:'regular_season',audit,coefficient:2,disabled:true}),/0\.0000 分/);
  const radar=radarMarkup(player);assert.equal((radar.match(/class="radar-interactive" role="button" tabindex="0"/g)||[]).length,14);assert.equal((radar.match(/data-dimension="/g)||[]).length,21);
});
