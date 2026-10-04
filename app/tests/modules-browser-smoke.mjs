import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium,browserOptions } from './browser-runtime.mjs';
import { DIMENSIONS,rankPlayers } from '../model.mjs';
import { MODULES,rankWithModules } from '../modules.mjs';
const base=process.env.GOAT_TEST_URL||'http://127.0.0.1:8765';
const browser=await chromium.launch(browserOptions);
const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
await context.addInitScript(()=>localStorage.setItem('true-goat-onboarding-v2:lab',JSON.stringify({version:2,page:'lab',seen:true})));
const page=await context.newPage(),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const payload=await(await fetch(base+'/data/players.json')).json();
const profiles=await(await fetch(base+'/data/player-directory.json')).json();
const directory=new Map(profiles.players.map(p=>[p.id,p]));
const ready=()=>page.locator('#workspace').waitFor({state:'visible'});
const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('true-goat-v04')));
const expected=s=>rankWithModules(payload.players,s.coefficients,s.priorCoefficient,s.advanced,directory);
const range=async(id,value)=>page.locator('#'+id).evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},String(value));
async function test(name,fn){try{await fn();results.push({name,passed:true});console.log('PASS '+name);}catch(e){results.push({name,passed:false,error:e.stack});console.error('FAIL '+name+': '+e.message);}}
async function matchesRanking(){const s=await state(),rows=expected(s);assert.equal(await page.locator('#rank-rows tr').first().getAttribute('data-player'),rows[0].player_id);assert.equal(await page.locator('#rank-rows .numeric').first().innerText(),rows[0].score.toFixed(2));}
try{
  await page.goto(base);await ready();
  await test('default remains basic with all module controls hidden',async()=>{
    assert.equal(await page.locator('#advanced-enabled').isChecked(),false);assert.equal(await page.locator('#module-builder').isVisible(),false);
    assert.equal(await page.locator('.module-card').count(),MODULES.length);await matchesRanking();
  });
  await test('score click opens keyboard-accessible radar and exact signed contribution table',async()=>{
    const button=page.locator('#rank-rows [data-score-player]').first();await button.focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('.score-radar').count(),1);assert.equal(await page.locator('.signed-track').count(),7);assert.match(await page.locator('#dialog-body').innerText(),/不是得分占比/);
    await page.keyboard.press('Escape');await page.locator('#podium [data-score-player]').first().click();assert.equal(await page.locator('.score-radar').count(),1);await page.keyboard.press('Escape');
    await page.locator('#target-summary [data-score-player]').click();assert.equal(await page.locator('.score-radar').count(),1);await page.keyboard.press('Escape');
  });
  await test('select raw module, adjust its coefficient and remove a base module immediately',async()=>{
    const before=await state();await page.check('#advanced-enabled');await page.check('#module-enabled-rs_ppg');await range('module-range-rs_ppg',3.5);await page.uncheck('#base-enabled-regular_season');
    const after=await state();assert.equal(after.advanced.modules.rs_ppg.coefficient,3.5);assert.ok(after.advanced.disabledBase.includes('regular_season'));assert.deepEqual(after.coefficients,before.coefficients);await matchesRanking();
    assert.equal(await page.locator('#coef-regular_season').isDisabled(),true);assert.equal(await page.locator('#find-weights').isDisabled(),true);assert.match(await page.locator('#suggestions').innerText(),/自动建议.*暂停/);
  });
  await test('honor and interaction terms have definitions and visible overlap warning',async()=>{
    await page.check('#module-enabled-honors');await page.check('#module-enabled-mvp');await page.check('#module-enabled-peak_playoffs');
    assert.match(await page.locator('#module-warnings').innerText(),/重复计入/);await page.locator('#module-card-peak_playoffs summary').click();assert.match(await page.locator('#module-card-peak_playoffs').innerText(),/负负得正/);await matchesRanking();
  });
  await test('actual advanced formula and export match ranking and contribution graph',async()=>{
    await page.click('#open-model');assert.match(await page.locator('#dialog-title').innerText(),/高级模块/);assert.match(await page.locator('.model-active-formula').innerText(),/3.500/);
    const download=page.waitForEvent('download');await page.click('#export-model');const file=await download,exported=JSON.parse(await readFile(await file.path(),'utf8')),s=await state();
    assert.deepEqual(exported.advanced,s.advanced);assert.equal(exported.module_registry_version,1);
    assert.equal(Object.hasOwn(exported.target_details,'dataScore'),false);assert.equal(Object.hasOwn(exported.target_details,'contributions'),false);
    assert.equal(exported.target_details.score,50+Object.values(exported.target_details.activeTermContributions).reduce((sum,value)=>sum+value,0));
    assert.match(exported.target_details.fieldDefinitions.basicDimensionsScoreIncludingIntercept,/不是高级模型总分/);const rows=expected(s);
    for(let i=0;i<20;i++){assert.equal(exported.top20[i].player_id,rows[i].player_id);assert.equal(exported.top20[i].score,rows[i].score);}
    assert.equal(exported.target_details.score,50+exported.target_details.termDetails.reduce((sum,t)=>sum+t.contribution,0));
    await page.click('#modal-score');assert.equal(await page.locator('.contribution-bar-row').count(),exported.target_details.termDetails.length);await page.keyboard.press('Escape');
  });
  await test('reload and share hash preserve complete independent module state',async()=>{
    const s=await state();await page.reload();await ready();assert.deepEqual(await state(),s);await matchesRanking();
    await page.goto(base+'/#model='+encodeURIComponent(JSON.stringify(s)));await ready();assert.deepEqual(await state(),s);await matchesRanking();
    await page.locator('#module-number-rs_ppg').fill('2.25');await page.locator('#module-number-rs_ppg').press('Tab');await page.reload();await ready();assert.equal((await state()).advanced.modules.rs_ppg.coefficient,2.25);
  });
  await test('turn advanced off returns exact saved basic formula without deleting module choices',async()=>{
    const before=await state();await page.uncheck('#advanced-enabled');const after=await state();assert.deepEqual(after.coefficients,before.coefficients);assert.deepEqual(after.advanced.modules,before.advanced.modules);
    const rows=rankPlayers(payload.players,after.coefficients,after.priorCoefficient);assert.equal(await page.locator('#rank-rows .numeric').first().innerText(),rows[0].score.toFixed(2));assert.equal(await page.locator('#find-weights').isDisabled(),false);
    await page.check('#advanced-enabled');await matchesRanking();
  });
  await test('mobile advanced controls and both chart dialogs have no horizontal page overflow',async()=>{
    for(const width of [390,360]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
      await page.locator('#rank-rows [data-score-player]').first().click();assert.equal(await page.evaluate(()=>{const d=document.querySelector('#model-dialog');return d.scrollWidth>d.clientWidth+1;}),false);await page.keyboard.press('Escape');
      await page.click('#open-model');assert.equal(await page.evaluate(()=>{const d=document.querySelector('#model-dialog');return d.scrollWidth>d.clientWidth+1;}),false);await page.keyboard.press('Escape');}
  });
  await test('reset clears advanced to basic default and no page errors',async()=>{
    await page.click('#reset');assert.equal((await state()).advanced.enabled,false);assert.deepEqual(errors,[]);
  });
}finally{await browser.close();}
console.log(JSON.stringify({results,errors},null,2));if(results.some(r=>!r.passed)||errors.length)process.exitCode=1;
