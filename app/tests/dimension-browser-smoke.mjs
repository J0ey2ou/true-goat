import assert from 'node:assert/strict';
import { chromium,browserOptions } from './browser-runtime.mjs';
import { scorePlayer } from '../model.mjs';

const base=process.env.GOAT_TEST_URL||'http://127.0.0.1:8765';
const browser=await chromium.launch(browserOptions);
const context=await browser.newContext({viewport:{width:1440,height:1000}});
await context.addInitScript(()=>{localStorage.setItem('true-goat-language:v1','zh-CN');localStorage.setItem('true-goat-onboarding-v2:lab',JSON.stringify({version:2,page:'lab',seen:true}));});
const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
const ready=()=>page.locator('#workspace').waitFor({state:'visible',timeout:60000});
const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('true-goat-v04')));
try{
  await page.goto(base);await ready();
  assert.ok(Number(await page.locator('.hero-number').innerText())>6000);
  assert.ok(await page.locator('#rank-rows tr').count()<=50);
  await page.click('#desc-peak');await page.locator('.dimension-inputs').waitFor();
  assert.match(await page.locator('#dialog-title').innerText(),/巅峰.*计算组成/);
  assert.equal(await page.locator('.dimension-inputs tbody tr').count(),4);
  assert.match(await page.locator('.dimension-equation').last().innerText(),/重算/);
  assert.equal(await page.locator('#dimension-ranking-rows tr').count(),25);
  await page.click('#dimension-next');assert.match(await page.locator('#dimension-page').innerText(),/^2 /);
  await page.fill('#dimension-ranking-search','Stephen Curry');assert.equal(await page.locator('#dimension-ranking-rows tr').count(),1);
  await page.locator('#dimension-ranking-rows [data-dimension-player="curryst01"]').click();
  assert.equal(await page.locator('.dimension-detail').getAttribute('data-active-player'),'curryst01');
  await page.click('[data-dimension-back]');await page.locator('.score-radar g[data-dimension="regular_season"]').last().focus();await page.keyboard.press('Enter');
  await page.locator('.dimension-inputs').waitFor();assert.match(await page.locator('#dialog-title').innerText(),/常规赛/);assert.match(await page.locator('.opponent-detail').innerText(),/对手含金量/);
  await page.keyboard.press('Escape');await page.click('#target-summary [data-score-player]');await page.locator('.radar-values summary').click();await page.locator('.radar-values [data-dimension="team_success"]').click();
  assert.match(await page.locator('.opponent-detail').innerText(),/冠军系数/);
  for(const width of [390,360]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert.equal(await page.locator('#model-dialog').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);}
  await page.setViewportSize({width:1440,height:1000});await page.keyboard.press('Escape');
  const withOpponent=await page.locator('#target-summary .target-score').innerText();assert.equal((await state()).opponentEnabled,true);
  await page.uncheck('#opponent-enabled');const withoutOpponent=await page.locator('#target-summary .target-score').innerText();assert.notEqual(withOpponent,withoutOpponent);assert.equal((await state()).opponentEnabled,false);
  const settings=await state(),raw=(await(await fetch(base+'/data/players.json')).json()).players.find(p=>p.player_id===settings.targetId);
  assert.match(withoutOpponent,new RegExp(scorePlayer(raw,settings.coefficients,settings.priorCoefficient).score.toFixed(2).replace('.','\\.')));
  await page.reload();await ready();assert.equal(await page.locator('#opponent-enabled').isChecked(),false);assert.equal(await page.locator('#target-summary .target-score').innerText(),withoutOpponent);
  await page.check('#opponent-enabled');assert.equal(await page.locator('#target-summary .target-score').innerText(),withOpponent);
  await page.selectOption('#rank-league','CBA');await page.selectOption('#rank-coverage','profile');assert.ok(await page.locator('#rank-rows tr').count()<=50);assert.match(await page.locator('#rank-rows').innerText(),/未评分/);
  await page.locator('#rank-rows [data-score-player]').first().click();await page.locator('.radar-values summary').click();await page.locator('.radar-values [data-dimension="regular_season"]').click();
  assert.match(await page.locator('.dimension-detail').innerText(),/没有可审计/);assert.match(await page.locator('.dimension-equation').last().innerText(),/无法重算/);
  assert.deepEqual(errors,[]);
  console.log('PASS dimension sidebar, radar, raw audit, full-library ranks, search, pagination, missing data, opponent toggle/persistence and mobile layout');
}finally{await browser.close();}
