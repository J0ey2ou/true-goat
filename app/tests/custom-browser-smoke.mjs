import assert from 'node:assert/strict';import http from 'node:http';import path from 'node:path';import {readFile,mkdir} from 'node:fs/promises';
import {chromium,browserOptions} from './browser-runtime.mjs';import {buildStaticSite} from '../../scripts/16_build_static_site.mjs';
const built=await buildStaticSite({out:'dist-custom-test'}),allowed=new Set(built.files);
const server=http.createServer(async(req,res)=>{const name=new URL(req.url,'http://test').pathname.replace(/^\/true-goat\//,'');if(!allowed.has(name)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.gz':'application/gzip'})[path.extname(name)]||'text/plain');res.end(await readFile(path.join(built.output,name)));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/true-goat/`;
const browser=await chromium.launch(browserOptions);const errors=[];
try{
  const context=await browser.newContext({viewport:{width:1440,height:1050}});await context.addInitScript(()=>{try{localStorage.setItem('true-goat-language:v1','zh-CN');}catch{}});
  context.on('requestfailed',r=>console.log('Request failed',r.url(),r.failure()));
  context.on('page',p=>p.on('pageerror',e=>console.log('Page error:',e.message)));
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'custom.html');await page.locator('#custom-app:not([hidden])').waitFor();
  assert.match(await page.locator('#custom-selected').innerText(),/Michael Jordan/);assert.equal(await page.locator('#custom-pool option').count(),4);
  await page.locator('#custom-run').click();await page.locator('.custom-card').waitFor({timeout:60000});assert.match(await page.locator('.custom-card').innerText(),/目标名次/);
  await page.locator('#custom-explore').click();await page.locator('.custom-card').first().waitFor({timeout:60000});assert.ok(await page.locator('.custom-card').count()>1);
  await page.locator('#custom-discovery').click();await page.locator('.custom-card').waitFor();assert.equal(await page.locator('.custom-card').getAttribute('data-first'),'true');
  await page.locator('#custom-unit').selectOption('game');await page.locator('#custom-search').fill('詹姆斯');await page.locator('#custom-options button').filter({hasText:'LeBron James'}).click();
  await page.evaluate(()=>{const Original=window.Worker;window.Worker=class extends Original{constructor(...args){super(...args);this.addEventListener('message',e=>{if(e.data.type==='error')console.error('Worker:',e.data.message);});}};});page.on('console',m=>{if(m.type()==='error')console.log(m.text());});
  await page.locator('#custom-mode').selectOption('streak');await page.locator('#custom-run').click();await page.locator('.custom-card').waitFor({timeout:60000});assert.match(await page.locator('.custom-card').innerText(),/连续/);
  await page.locator('#language-picker').selectOption('en');assert.doesNotMatch(await page.locator('.custom-card').innerText(),/[\u3400-\u9fff]/);
  await page.locator('#custom-pool').selectOption('cba-history');assert.equal(await page.locator('#custom-unit option[value=game]').evaluate(el=>el.disabled),true);assert.equal(await page.locator('#custom-opponent').isDisabled(),true);
  await page.locator('#custom-search').fill('易建联');await page.locator('#custom-options button').first().click();await page.locator('#custom-run').click();await page.locator('.custom-card').waitFor();
  await page.locator('#report-data-error').click();await page.locator('[name=subject]').fill('Yi Jianlian / points');await page.locator('[name=wrong]').fill('Incorrect number');await page.locator('[name=correct]').fill('Correct number');await page.locator('[name=source]').fill('https://example.org/boxscore');
  await page.evaluate(()=>{window.open=(url)=>{window.__reportDraft=url;return null;};});await page.locator('#feedback-form button[type=submit]').click();
  assert.match(await page.evaluate(()=>window.__reportDraft),/^https:\/\/github.com\/J0ey2ou\/true-goat\/issues\/new\?/);assert.match(await page.locator('#feedback-status').innerText(),/not been submitted/);await page.locator('#feedback-close').click();
  await mkdir('output/custom-qa',{recursive:true});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'output/custom-qa/desktop.png'});await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await page.screenshot({path:'output/custom-qa/mobile.png'});
  await page.locator('#language-picker').selectOption('zh-TW');assert.equal(await page.locator('html').getAttribute('lang'),'zh-TW');
  for(const file of ['index.html','players.html','guess.html']){await page.goto(base+file);await page.locator('#report-data-error').waitFor();assert.equal(await page.locator('nav a[href="./custom.html"]').count(),1);assert.equal(await page.locator('#report-data-error').evaluate(el=>getComputedStyle(el).position),'fixed');
    for(const width of [390,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,file+' overflow');assert.equal(await page.locator('.topbar').evaluate(el=>{const r=el.getBoundingClientRect();return [...el.querySelectorAll('nav a')].every(a=>a.getBoundingClientRect().bottom<=r.bottom+1)}),true,file+' header');}}
  assert.deepEqual(errors,[]);console.log('PASS: fourth-page navigation, 4 pools, season/game/streak queries, automatic qualifiers, source evidence, CBA guards, three languages, report validation & GitHub draft, fixed reporting on all pages and mobile layout.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
