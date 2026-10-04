import assert from 'node:assert/strict';
import { chromium,browserOptions } from './browser-runtime.mjs';
const base=process.env.GOAT_TEST_URL || 'http://127.0.0.1:8765';
const browser=await chromium.launch(browserOptions),contexts=[],errors=[],results=[];
const first={id:'librarytest01',name:'Library Test Player',chineseName:'扩展测试球员',aliases:['扩展绰号'],firstSeason:2024,lastSeason:2025,position:'G',era:'2020s',careerRS:{games:10,ppg:20,metricCoverageGames:{points:10}},coverage:{sources:['fixture-source'],notes:['自动化测试夹具，不是真实球员资料。']},model:{components:{},rankings:{}}};
const fixture={players:[first,{id:'jordami01',name:'Michael Jordan'},...Array.from({length:70},(_,i)=>({id:'libraryfixture'+i,name:'Fixture Player '+i,model:{components:{}}}))],sources:[{id:'fixture-source',title:'测试来源',url:'https://www.nba.com/stats'}]};
async function context({blocked=false,real=false}={}){
  const ctx=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});contexts.push(ctx);
  await ctx.addInitScript(({blocked})=>{if(location.origin==='null')return;for(const page of ['lab','directory','guess'])localStorage.setItem('true-goat-onboarding-v2:'+page,JSON.stringify({version:2,page,seen:true}));if(blocked)Storage.prototype.setItem=function(){throw new DOMException('Test storage denial','SecurityError');};},{blocked});
  if(!real)await ctx.route('**/data/player-catalog.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixture)}));
  ctx.on('page',page=>page.on('pageerror',e=>errors.push(e.message)));
  return ctx;
}
async function test(name,fn){try{await fn();results.push({name,passed:true});console.log('PASS '+name);}catch(error){results.push({name,passed:false,error:error.stack});console.error('FAIL '+name+': '+error.message);}}
const ready=page=>page.locator('#workspace').waitFor({state:'visible'});
const state=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('true-goat-v04')));
let page,ctx,defaultScore,saved;
try{
  ctx=await context();page=await ctx.newPage();let catalogRequests=0;page.on('request',r=>{if(r.url().endsWith('/data/player-catalog.json'))catalogRequests++;});
  await test('default 300 and baseline stay unchanged; catalog is lazy',async()=>{
    await page.goto(base);await ready(page);assert.equal(catalogRequests,0);assert.equal(await page.locator('#target-select option').count(),300);defaultScore=await page.locator('#rank-rows .numeric').first().innerText();
  });
  await test('picker caps DOM at 40 and protects default players',async()=>{
    await page.click('#open-player-library');await page.locator('.library-player').first().waitFor();assert.equal(await page.locator('.library-player').count(),40);assert.equal(catalogRequests,1);
    await page.fill('#player-library-search','Michael Jordan');assert.equal(await page.locator('[data-library-toggle="jordami01"]').isDisabled(),true);
  });
  await test('alias search adds catalog-backed player without changing base scores',async()=>{
    await page.fill('#player-library-search','扩展绰号');await page.click('[data-library-toggle="librarytest01"]');assert.equal(await page.locator('#target-select option').count(),301);await page.keyboard.press('Escape');
    assert.equal(await page.locator('#rank-rows .numeric').first().innerText(),defaultScore);assert.deepEqual((await state(page)).customPlayerIds,['librarytest01']);
  });
  await test('uncomputed dimensions stay unscored, then real raw module can score',async()=>{
    await page.selectOption('#target-select','librarytest01');assert.match(await page.locator('#target-summary').innerText(),/未评分/);assert.equal(await page.locator('#find-weights').isDisabled(),true);
    await page.check('#advanced-enabled');await page.check('#module-enabled-rs_ppg');assert.doesNotMatch(await page.locator('#target-summary').innerText(),/未评分/);assert.match(await page.locator('#target-data-note').innerText(),/用户添加/);saved=await state(page);
    assert.equal(saved.targetId,'librarytest01');await page.locator('#target-summary [data-score-player]').click();assert.match(await page.locator('#dialog-body').innerText(),/常规赛场均得分/);await page.keyboard.press('Escape');
  });
  await test('refresh restores selected catalog IDs and advanced raw model',async()=>{
    await page.reload();await ready(page);assert.equal(await page.locator('#target-select option').count(),301);assert.equal(await page.locator('#target-select').inputValue(),'librarytest01');assert.equal(await page.locator('#module-enabled-rs_ppg').isChecked(),true);
  });
  await test('directory uses shared selection and distinguishes custom eligibility',async()=>{
    const directory=await ctx.newPage();await directory.goto(base+'/players');await directory.locator('#directory-content').waitFor({state:'visible'});assert.equal(await directory.locator('#directory-total').innerText(),'301');await directory.selectOption('#filter-pool','custom');assert.equal(await directory.locator('.dir-player-row').count(),1);
    await directory.click('[data-player="librarytest01"]');assert.match(await directory.locator('#player-dialog-body').innerText(),/并非 A\/B\/C/);assert.equal(await directory.locator('#player-dialog-body a[href="https://www.nba.com/stats"]').count(),1);await directory.keyboard.press('Escape');
    await directory.click('#open-player-library');await directory.fill('#player-library-search','扩展绰号');await directory.click('[data-library-toggle="librarytest01"]');await page.waitForFunction(()=>document.querySelectorAll('#target-select option').length===300);assert.equal(await page.locator('#target-select').inputValue(),'jordami01');await directory.close();
  });
  await test('shared model loads catalog before restoring custom target; unknown IDs excluded',async()=>{
    const fresh=await context(),shared=await fresh.newPage();await shared.goto(base+'/#model='+encodeURIComponent(JSON.stringify({...saved,customPlayerIds:['librarytest01','invented01','jordami01','librarytest01']})));await ready(shared);assert.equal(await shared.locator('#target-select').inputValue(),'librarytest01');assert.deepEqual((await state(shared)).customPlayerIds,['librarytest01']);assert.equal(await shared.locator('#target-select option').count(),301);
    await shared.close();
  });
  await test('unselected directory deep link previews evidence, then explicitly adds',async()=>{
    const fresh=await context(),preview=await fresh.newPage();await preview.goto(base+'/players?player=librarytest01');await preview.locator('#player-dialog[open]').waitFor();assert.equal(await preview.locator('#directory-total').innerText(),'300');assert.match(await preview.locator('#player-dialog-body').innerText(),/尚未加入/);await preview.click('#add-profile-player');assert.equal(await preview.locator('#directory-total').innerText(),'301');await preview.locator('#player-dialog-body a[href^="/?player="]').click();await ready(preview);assert.equal(await preview.locator('#target-select').inputValue(),'librarytest01');await preview.close();
  });
  await test('unselected lab deep link waits for explicit confirmation',async()=>{
    const fresh=await context(),preview=await fresh.newPage();await preview.goto(base+'/?player=librarytest01');await ready(preview);await preview.locator('[data-library-toggle="librarytest01"]').waitFor();assert.equal(await preview.locator('#target-select option').count(),300);await preview.click('[data-library-toggle="librarytest01"]');await preview.keyboard.press('Escape');assert.equal(await preview.locator('#target-select').inputValue(),'librarytest01');await preview.close();
  });
  await test('blocked storage keeps current-page selection usable',async()=>{
    const fresh=await context({blocked:true}),blocked=await fresh.newPage();await blocked.goto(base);await ready(blocked);await blocked.click('#open-player-library');await blocked.fill('#player-library-search','扩展绰号');await blocked.click('[data-library-toggle="librarytest01"]');assert.equal(await blocked.locator('#target-select option').count(),301);assert.match(await blocked.locator('#custom-player-summary').innerText(),/存储不可用/);await blocked.close();
  });
  await test('mobile picker and both pages fit 360/390/768 widths; keyboard works',async()=>{
    for(const width of [360,390,768]){await page.setViewportSize({width,height:900});await page.click('#open-player-library');await page.fill('#player-library-search','扩展绰号');const button=page.locator('[data-library-toggle="librarytest01"]');await button.focus();await page.keyboard.press('Enter');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(await page.locator('#player-library-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1));await page.keyboard.press('Escape');assert.equal(await page.locator('#player-library-dialog').isVisible(),false);}
  });
  await test('published real catalog supports sourced additions and honest missing scores',async()=>{
    const catalog=await(await fetch(base+'/data/player-catalog.json')).json();assert.ok(catalog.players.length>=5217);
    const realContext=await context({real:true}),actual=await realContext.newPage();await actual.goto(base+'/players?player=abdelal01');await actual.locator('#player-dialog[open]').waitFor();assert.match(await actual.locator('#player-dialog-title').innerText(),/Alaa Abdelnaby/);assert.equal(await actual.locator('#directory-total').innerText(),'300');assert.ok(await actual.locator('#player-dialog-body a[href^="https://www.kaggle.com/"]').count());
    await actual.click('#add-profile-player');assert.equal(await actual.locator('#directory-total').innerText(),'301');await actual.locator('#player-dialog-body a[href^="/?player="]').click();await ready(actual);assert.equal(await actual.locator('#target-select').inputValue(),'abdelal01');assert.match(await actual.locator('#target-data-note').innerText(),/中性填补/);
    const newcomer=catalog.players.find(p=>!p.catalogOriginal&&Object.values(p.model.components).every(v=>v===null));assert.ok(newcomer);await actual.goto(base+'/?player='+newcomer.id);await ready(actual);await actual.locator('[data-library-toggle="'+newcomer.id+'"]').click();await actual.keyboard.press('Escape');assert.match(await actual.locator('#target-summary').innerText(),/未评分/);await actual.close();
  });
  await test('no runtime exceptions',()=>assert.deepEqual(errors,[]));
}finally{for(const ctx of contexts)await ctx.close();await browser.close();}
console.log(JSON.stringify({passed:results.filter(r=>r.passed).length,total:results.length,results},null,2));
if(results.some(r=>!r.passed))process.exitCode=1;
