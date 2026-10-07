// Full interaction test below a GitHub Pages-style repository prefix.
// Separate browser contexts and stubbed cloud reads; no real accounts or matches.
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {chromium,browserOptions} from './browser-runtime.mjs';
import {buildStaticSite} from '../../scripts/16_build_static_site.mjs';
const built=await buildStaticSite({out:'dist-language-test'}),allowed=new Set(built.files);
const server=http.createServer(async(req,res)=>{
  const file=new URL(req.url,'http://test').pathname.replace(/^\/true-goat\//,'');
  if(!allowed.has(file)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'text/plain');
  res.end(await readFile(path.join(built.output,file)));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}/true-goat/`;
const browser=await chromium.launch(browserOptions),errors=[];
try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.route('https://qtfmrczwxinizmqgkebh.supabase.co/**',route=>route.fulfill({status:200,contentType:'application/json',body:route.request().url().includes('arena_info')?'{"maxPlayers":5}':route.request().url().includes('/settings')?'{"mailer_autoconfirm":true}':'[]'}));
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  const navigate=file=>page.goto(base+file);
  async function skipIntro(){await page.locator('#onboarding-dialog[open]').waitFor();await page.locator('[data-guide-skip]').first().click();}
  const savedRounds=()=>page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('true-goat-guess:v2:')).map(k=>[k,localStorage.getItem(k)])));
  await navigate('guess.html');
  await page.locator('#language-dialog[open]').waitFor();assert.equal(await page.locator('[data-language]').count(),3);
  assert.equal(await page.locator('#onboarding-dialog[open]').count(),0,'language choice precedes the intro');
  await page.locator('[data-language="en"]').click();await skipIntro();await page.locator('#guess-app:not([hidden])').waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'),'en');
  assert.equal(await page.locator('#guess-open-settings').innerText(),'⚙ Settings');
  const answer=Object.values(await savedRounds()).map(JSON.parse)[0].answerId;
  const source=JSON.parse(await readFile('app/data/guess-players.json','utf8'));
  const chosen=source.players.filter(p=>p.pools.includes('nba-easy')&&p.id!==answer&&['harden','jordan','curry'].some(q=>p.name.toLowerCase().includes(q))).slice(0,2);
  for(const player of chosen){await page.locator('#guess-search').fill(player.name);await page.locator(`.guess-option[data-id="${player.id}"]`).click();}
  assert.deepEqual(await page.locator('#guess-history [data-guessed]').evaluateAll(nodes=>nodes.map(n=>n.dataset.guessed)),chosen.map(p=>p.id).reverse());
  assert.match(await page.locator('.guess-order').first().innerText(),/^02/);
  await page.locator('#guess-coach-open').click();await page.locator('[data-coach-key="birthYear"]').waitFor();
  assert.equal(await page.locator('.guess-coach-grid article').count(),10);
  assert.doesNotMatch(await page.locator('#guess-coach-body').innerText(),/[\u3400-\u9fff]/);
  await page.screenshot({path:'output/language-qa/notebook-desktop.png'});
  await page.locator('#guess-coach-close').click();
  const before=await savedRounds();
  await page.locator('#language-picker').selectOption('zh-TW');await page.waitForFunction(()=>document.documentElement.lang==='zh-TW');
  assert.match(await page.locator('h1').innerText(),/八次機會/);
  await page.locator('#guess-search').fill('羅斯');assert.ok(await page.locator('.guess-option').count()>0,'traditional Chinese search finds Rose');
  await page.locator('#language-picker').selectOption('en');assert.deepEqual(await savedRounds(),before,'switching language preserves every round');
  assert.equal(await page.locator('#guess-search').inputValue(),'羅斯','typed input is not translated');
  await page.locator('#guess-search').fill('');
  await page.locator('#guess-give-up').click();await page.locator('#guess-give-up-cancel').click();assert.equal(await page.locator('#guess-search').isDisabled(),false);
  await page.locator('#guess-give-up').click();await page.locator('#guess-give-up-confirm').click();
  await page.locator('#guess-result-dialog[open]').waitFor();assert.match(await page.locator('#guess-result-title').innerText(),/Given up/);
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.locator('#guess-result-next').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),'next-round action stays visible');
  await page.screenshot({path:'output/language-qa/result-mobile.png'});await page.setViewportSize({width:1440,height:1000});
  const givenUp=Object.values(await savedRounds()).map(JSON.parse).find(r=>r.answerId===answer);assert.equal(givenUp.abandoned,true);assert.equal(givenUp.guesses.length,2);
  await page.reload();await page.locator('#guess-result-dialog[open]').waitFor();assert.equal(await page.locator('#guess-search').isDisabled(),true);
  await page.locator('#guess-result-next').click();await page.waitForFunction(()=>new URL(location.href).searchParams.get('mode')==='practice');
  await page.locator('#guess-app:not([hidden])').waitFor();assert.equal(await page.locator('#guess-attempts').innerText(),'0');
  assert.ok(Object.values(await savedRounds()).map(JSON.parse).some(r=>r.mode==='daily'&&r.abandoned));
  await page.locator('#guess-open-settings').click();await page.locator('#guess-tab-online').click();assert.equal(await page.locator('#online-register-tab').innerText(),'Create account');
  await page.locator('#guess-tab-clues').click();await page.locator('#guess-clues-enabled').check();await page.locator('[data-guess-clue][value="assistsPerGame"]').check();
  await page.locator('#guess-settings-close').click();
  await navigate('index.html');await page.locator('#workspace:not([hidden])').waitFor();await skipIntro();
  assert.equal(await page.locator('#language-dialog[open]').count(),0,'language preference follows navigation');
  assert.equal((await page.locator('#open-model').innerText()).replace(/\s+/g,' '),'View my model ↗');
  await page.locator('#open-model').click();assert.doesNotMatch(await page.locator('#dialog-body').innerText(),/[\u3400-\u9fff]/);await page.locator('#close-dialog').click();
  await page.locator('.score-trigger').first().click();assert.doesNotMatch(await page.locator('#dialog-body').innerText(),/[\u3400-\u9fff]/);await page.locator('#close-dialog').click();
  await navigate('players.html');await page.locator('#directory-content:not([hidden])').waitFor();await skipIntro();
  await page.locator('.dir-player-row').first().click();assert.doesNotMatch(await page.locator('#player-dialog-body').innerText(),/[\u3400-\u9fff]/);await page.locator('#close-player-dialog').click();
  await page.locator('#language-picker').selectOption('zh-CN');assert.equal(await page.locator('#directory-heading').innerText(),'找到你想了解的球员');
  await page.locator('#language-picker').selectOption('en');
  await mkdir('output/language-qa',{recursive:true});
  for(const file of ['index.html','players.html','guess.html']){
    await navigate(file);await page.waitForSelector(file==='index.html'?'#workspace:not([hidden])':file==='players.html'?'#directory-content:not([hidden])':'#guess-app:not([hidden])');
    await page.setViewportSize({width:390,height:844});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,file+' mobile overflow');
    await page.screenshot({path:'output/language-qa/'+file.replace('.html','')+'-mobile.png',fullPage:false});
    await page.setViewportSize({width:1440,height:1000});
  }
  const linked=await browser.newContext(),linkedPage=await linked.newPage();await linkedPage.goto(base+'players.html?player=jordami01');
  await linkedPage.locator('#language-dialog[open]').waitFor();assert.equal(await linkedPage.locator('#player-dialog[open]').count(),0);
  await linkedPage.locator('[data-language="en"]').click();await linkedPage.locator('#player-dialog[open]').waitFor();assert.equal(await linkedPage.locator('#player-dialog-title').innerText(),'Michael Jordan');await linked.close();
  const blocked=await browser.newContext();await blocked.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('blocked');};Storage.prototype.setItem=()=>{throw Error('blocked');};});
  const blockedPage=await blocked.newPage();await blockedPage.goto(base+'index.html');await blockedPage.locator('[data-language="en"]').click();await blockedPage.locator('#onboarding-dialog[open]').waitFor();assert.equal(await blockedPage.locator('html').getAttribute('lang'),'en');await blocked.close();
  assert.deepEqual(errors,[]);console.log('PASS: first-visit choice, all three locales/pages, traditional search, dynamic dialogs, state preservation, newest-first history, notebook, give-up/reload/next, mobile layout, blocked storage; static prefix '+built.release);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
