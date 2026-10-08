import assert from 'node:assert/strict';
import { chromium, browserOptions } from './browser-runtime.mjs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const screenshotPath = name => fileURLToPath(new URL(name, import.meta.url));
import { DIMENSIONS, scorePlayer, rankPlayers } from '../model.mjs';
import {loadLabFixture} from './lab-fixture.mjs';
const browser=await chromium.launch(browserOptions);
const base=process.env.GOAT_TEST_URL||'http://127.0.0.1:8765';
const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
await context.addInitScript(()=>localStorage.setItem('true-goat-language:v1','zh-CN'));
// Dedicated onboarding tests exercise first visits; this suite exercises returning users.
await context.addInitScript(()=>{for(const page of ['lab','directory','guess'])localStorage.setItem('true-goat-onboarding-v2:'+page,JSON.stringify({version:2,page,seen:true}));});
const page=await context.newPage(),errors=[],results=[];
const track=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};
track(page);
const fixture=await loadLabFixture(base),payload=fixture.payload,players=fixture.rawPlayers;
const expertData=await(await fetch(base+'/data/experts.json')).json();
const state=p=>(p||page).evaluate(()=>JSON.parse(localStorage.getItem('true-goat-v04')));
const ready=p=>(p||page).locator('#workspace').waitFor({state:'visible'});
async function setRange(id,value,p=page){await p.locator('#'+id).evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},String(value));}
async function test(name,fn){try{await fn();results.push({name,passed:true});console.log('PASS '+name);}catch(e){results.push({name,passed:false,error:e.message});console.error('FAIL '+name+': '+e.message);}}
async function overflow(p){return p.evaluate(()=>({body:document.documentElement.scrollWidth>innerWidth+1,dialog:[...document.querySelectorAll('dialog[open]')].some(d=>d.scrollWidth>d.clientWidth+1)}));}
try {
  await page.goto(base);await ready();
  await test('initial additive UI and all source-backed fitted presets',async()=>{
    assert.equal(await page.locator('[data-coefficient]').count(),7);
    assert.equal(await page.locator('#expert-select option').count(),expertData.experts.length+1);
    assert.equal((await state()).v,4);
    for(const id of expertData.experts.map(expert=>expert.id)){
      await page.selectOption('#expert-select',id);
      await page.click('#open-source');assert.match(await page.locator('#dialog-body').innerText(),/没有总和约束/);await page.keyboard.press('Escape');
    }
    await page.selectOption('#expert-select','stephen-a-2023');
    await page.screenshot({path:screenshotPath('additive-desktop.png'),fullPage:true});
  });
  await test('single slider and number input leave all other coefficients unchanged',async()=>{
    const before=await state();await setRange('coef-peak',4.25);const after=await state();
    assert.equal(after.coefficients.peak,4.25);
    for(const d of DIMENSIONS)if(d.key!=='peak')assert.equal(after.coefficients[d.key],before.coefficients[d.key]);
    await page.locator('#coef-number-defense').fill('3.125');await page.locator('#coef-number-defense').press('Tab');
    const next=await state();assert.equal(next.coefficients.defense,3.125);assert.equal(next.coefficients.peak,4.25);
    await setRange('prior-coef',2.5);assert.deepEqual((await state()).coefficients,next.coefficients);
  });
  await test('displayed scores and exported additive contributions match the engine',async()=>{
    await page.click('#open-model');assert.match(await page.locator('#dialog-body').innerText(),/z =（维度指数 − 50）÷ 10/);
    await page.locator('#model-dialog').screenshot({path:screenshotPath('additive-model.png')});
    const download=page.waitForEvent('download');await page.click('#export-model');const file=await download;
    const exported=JSON.parse(await readFile(await file.path(),'utf8')),s=await state();
    const expected=rankPlayers(fixture.players(s),s.coefficients,s.priorCoefficient).slice(0,20);
    assert.equal(exported.v,4);assert.equal(exported.intercept,50);
    for(let i=0;i<20;i++){assert.equal(exported.top20[i].player_id,expected[i].player_id);assert.ok(Math.abs(exported.top20[i].score-expected[i].score)<1e-9);}
    await page.keyboard.press('Escape');
  });
  await test('all-zero model is a real additive intercept; scores may exceed 100',async()=>{
    await setRange('prior-coef',0);for(const d of DIMENSIONS)await setRange('coef-'+d.key,0);
    const s=await state(),rows=rankPlayers(players,s.coefficients,0);
    assert.ok(rows.every(p=>p.score===50&&p.rank===1));
    assert.ok((await page.locator('#target-summary').innerText()).includes(players.length+' 位球员并列第 1 名'));
    for(const d of DIMENSIONS)await setRange('coef-'+d.key,10);
    assert.ok(Number(await page.locator('#rank-rows .numeric').first().innerText())>100);
    await page.click('#reset');
  });
  await test('single-coefficient suggestion fulfills advertised rank without changing other terms',async()=>{
    await page.selectOption('#expert-select','balanced');await page.selectOption('#target-select','curryst01');
    const button=page.locator('.suggestion').first();assert.ok(await button.count());
    const predicted=Number((await button.innerText()).match(/预计第 (\d+) 名/)[1]),before=await state();await button.click();const after=await state();
    assert.equal(DIMENSIONS.filter(d=>Math.abs(after.coefficients[d.key]-before.coefficients[d.key])>1e-9).length,1);
    assert.equal(after.priorCoefficient,before.priorCoefficient);
    assert.equal(Number((await page.locator('.target-rank').innerText()).replace('#','').trim()),predicted);
  });
  await test('finite joint search applies the same previewed model',async()=>{
    await page.click('#find-weights');await page.waitForFunction(()=>!document.querySelector('#find-weights').disabled);
    if(await page.locator('#apply-search').count()){
      const text=await page.locator('#search-result').innerText(),predicted=Number(text.match(/→\s*第 (\d+) 名/)[1]);
      await page.click('#apply-search');assert.equal(Number((await page.locator('.target-rank').innerText()).replace('#','').trim()),predicted);
    }else assert.match(await page.locator('#search-result').innerText(),/未找到/);
  });
  await test('missing data is neutral, never redistributed or shown as observed zero',async()=>{
    await setRange('prior-coef',0);for(const d of DIMENSIONS)await setRange('coef-'+d.key,0);
    await setRange('coef-playoffs',2);await page.selectOption('#target-select','wembavi01');
    assert.match(await page.locator('#target-summary').innerText(),/未评分/);
    await setRange('coef-regular_season',1);
    const s=await state(),p=players.find(p=>p.player_id==='wembavi01'),v=scorePlayer(p,s.coefficients,0);
    assert.equal(v.contributions.playoffs,0);assert.ok(v.imputedDimensions.includes('playoffs'));
    assert.equal(v.score,50+(p.components.regular_season_score-50)/10);
    await page.click('#reset');
  });
  await test('player query navigation, global pagination and search',async()=>{
    await page.goto(base+'/?player=bryanko01');await ready();assert.equal(await page.locator('#target-select').inputValue(),'bryanko01');
    assert.match(await page.locator('#target-profile-link').getAttribute('href'),/players\?player=bryanko01/);
    await page.fill('#search','迈克尔·乔丹');assert.equal(await page.locator('#rank-rows tr[data-player="jordami01"]').count(),1);
    await page.fill('#search','');await page.click('#show-all');assert.equal(await page.locator('#rank-rows tr[data-player]').count(),50);assert.ok((await page.locator('#result-count').innerText()).includes(String(players.length)));await page.click('#rank-next');assert.match(await page.locator('#rank-page').innerText(),/^2 \/ /);await page.click('#show-all');
  });
  await test('state survives reload, hash restoration and same-page hash changes',async()=>{
    await setRange('coef-peak',3.21);const s=await state();await page.reload();await ready();assert.deepEqual(await state(),s);
    const p=await context.newPage();track(p);await p.goto(base+'/#model='+encodeURIComponent(JSON.stringify(s)));await ready(p);assert.deepEqual(await state(p),s);
    await setRange('coef-peak',2.22,p);await p.reload();await ready(p);assert.equal((await state(p)).coefficients.peak,2.22);
    const updated={...s,coefficients:{...s.coefficients,peak:1.23}};
    await p.evaluate(hash=>location.hash=hash,'model='+encodeURIComponent(JSON.stringify(updated)));
    await p.waitForFunction(()=>JSON.parse(localStorage.getItem('true-goat-v04')).coefficients.peak===1.23);await p.close();
  });
  await test('legacy percentage state migrates explicitly without deleting the original',async()=>{
    const c=await browser.newContext();const p=await c.newPage();track(p);
    await p.addInitScript(()=>localStorage.setItem('true-goat-onboarding-v2:lab',JSON.stringify({version:2,page:'lab',seen:true})));
    const legacy={v:3,preset:'balanced',weights:payload.default_user_weights,anchor:.25,targetId:'jordami01'};
    await p.addInitScript(s=>localStorage.setItem('true-goat-v03',JSON.stringify(s)),legacy);
    await p.goto(base);await ready(p);const s=await state(p);assert.equal(s.priorCoefficient,2.5);
    for(const d of DIMENSIONS)assert.ok(Math.abs(s.coefficients[d.key]-legacy.weights[d.key]*7.5)<1e-9);
    assert.ok(await p.evaluate(()=>localStorage.getItem('true-goat-v03')));await c.close();
  });
  await test('layout aligns card scores and table columns across desktop/tablet/mobile',async()=>{
    for(const width of [1440,1024,768,390,360]){
      await page.setViewportSize({width,height:950});await page.goto(base);await ready();
      assert.deepEqual(await overflow(page),{body:false,dialog:false},'width '+width);
      const geometry=await page.locator('.podium-score').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().y));
      assert.ok(Math.max(...geometry)-Math.min(...geometry)<1.1,'podium score baselines '+width);
      const columns=await page.locator('.ranking-table').evaluate(t=>[...t.querySelectorAll('thead th')].map((h,i)=>({a:h.getBoundingClientRect().right,b:t.querySelectorAll('tbody tr')[0].children[i].getBoundingClientRect().right})));
      assert.ok(columns.every(c=>Math.abs(c.a-c.b)<1),'header/cell columns '+width);
      await page.click('#open-model');assert.deepEqual(await overflow(page),{body:false,dialog:false},'dialog '+width);await page.keyboard.press('Escape');
      if(width===390){await setRange('coef-peak',2.75);assert.match(await page.locator('#mobile-rank').innerText(),/第 \d+ 名/);await page.screenshot({path:screenshotPath('additive-mobile.png'),fullPage:true});}
    }
  });
  await test('no browser errors',async()=>assert.deepEqual(errors,[]));
} finally {await browser.close();}
console.log(JSON.stringify({results,errors},null,2));
if(results.some(r=>!r.passed)||errors.length)process.exitCode=1;
