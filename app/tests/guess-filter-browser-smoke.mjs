import assert from 'node:assert/strict';
import {chromium,browserOptions} from './browser-runtime.mjs';
import {eligiblePlayers,matchingAppearances,teamsForPool,filterKey} from '../guess-engine.mjs';
const base=(process.env.GOAT_TEST_URL || 'http://127.0.0.1:8766').replace(/\/$/,'');
const browser=await chromium.launch(browserOptions), errors=[],checks=[];
const context=await browser.newContext({viewport:{width:1440,height:1000}});
await context.route('https://qtfmrczwxinizmqgkebh.supabase.co/**',route=>route.fulfill({status:200,contentType:'application/json',body:route.request().url().includes('/settings')?'{"mailer_autoconfirm":true}':route.request().url().includes('goat_arena_info')?'{"maxPlayers":5}':'[]'}));
await context.addInitScript(()=>localStorage.setItem('true-goat-onboarding-v2:guess',JSON.stringify({version:2,page:'guess',seen:true})));
const page=await context.newPage(); page.setDefaultTimeout(15000);
page.on('pageerror',error=>errors.push(error.message));
const check=(label,value)=>{assert.ok(value,label);checks.push(label);};
let data;
async function currentRound(){
  const pref=await page.evaluate(()=>JSON.parse(localStorage.getItem('true-goat-guess:preferences:v2')));
  const key=`true-goat-guess:v2:${data.version}:${pref.mode}:${pref.pool}:${encodeURIComponent(filterKey(pref.filtersByPool[pref.pool]))}`;
  return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
}
async function setFilters(from='',to='',teamId=''){
  if(!await page.locator('#guess-settings-dialog').evaluate(el=>el.open))await page.locator('#guess-open-settings').click();
  await page.locator('#guess-tab-range').click();
  await page.locator('#guess-year-from').fill(String(from));
  await page.locator('#guess-year-to').fill(String(to));
  await page.locator('#guess-team').selectOption(teamId);
  if(await page.locator('#guess-filter-apply').isEnabled())await page.locator('#guess-filter-apply').click();
  else await page.locator('#guess-settings-close').click();
  return currentRound();
}
async function checkAnswer(label){
  const round=await currentRound(), candidates=eligiblePlayers(data.players,round.pool,round.filters);
  check(label,candidates.some(p=>p.id===round.answerId));
  check(label+' uses same-row evidence',matchingAppearances(data.players.find(p=>p.id===round.answerId),round.pool,round.filters).length>0);
  return round;
}
try{
  await page.goto(base+(new URL(base).pathname === '/' ? '/guess' : '/guess.html'));await page.locator('#guess-app').waitFor();await page.locator('#guess-pool').selectOption('nba-history');
  data=await page.evaluate(async()=>await(await fetch('./data/guess-players.json')).json());
  for(const pool of data.pools){
    await page.locator('#guess-pool').selectOption(pool.id);
    const selected=await currentRound();
    check(`${pool.id} selects a member and independent storage`,selected.pool===pool.id && data.players.some(p=>p.id===selected.answerId&&p.pools.includes(pool.id)) && selected.guesses.length===0);
    check(`${pool.id} shows actual count`,(await page.locator('#guess-pool-count').textContent()).includes(String(pool.count)));
  }
  await page.locator('#guess-pool').selectOption('cba-active');
  const registrationOnly=await setFilters(2027,2027);
  check('current CBA registration alone cannot create a 2027 question',registrationOnly.status==='empty' && registrationOnly.answerId===null);
  await setFilters();
  await page.locator('#guess-pool').selectOption('nba-active');
  await setFilters(2026,2026);
  await checkAnswer('current NBA pool still requires actual play when a year is applied');
  const rookie=data.players.find(p=>p.pools.includes('nba-active')&&!p.pools.includes('nba-history'));
  check('unplayed current newcomer is excluded by season range',!eligiblePlayers(data.players,'nba-active',{from:2026,to:2026}).some(p=>p.id===rookie.id));
  await setFilters();
  await page.locator('#guess-pool').selectOption('nba-history');
  const original=await currentRound();
  check('NBA options only include verified NBA/BAA teams',(await page.locator('#guess-team option').evaluateAll(es=>es.map(e=>e.value))).filter(Boolean).every(id=>id.startsWith('NBA:')));
  await setFilters(2000,2000);
  const year2000=await checkAnswer('daily answer actually played in selected season');
  check('retirement gap cannot select Jordan',year2000.answerId!=='jordami01');
  await page.locator('#guess-search').fill('Michael Jordan');
  check('search uses same eligibility as answer',await page.locator('#guess-options').isHidden());
  await page.reload();await page.locator('#guess-app').waitFor();
  check('applied years and daily answer survive reload',(await currentRound()).answerId===year2000.answerId && await page.locator('#guess-year-from').inputValue()==='2000');
  await setFilters(2010,2010,'NBA:LAL');
  const lakers=await checkAnswer('joint year and team actually constrain answer');
  await page.locator('#guess-search').fill('LeBron James');
  check('LeBron later Lakers stint cannot qualify for 2010 Lakers',await page.locator('#guess-options').isHidden() && lakers.answerId!=='jamesle01');
  const eligible=eligiblePlayers(data.players,'nba-history',lakers.filters), wrong=eligible.find(p=>p.id!==lakers.answerId);
  await page.locator('#guess-search').fill(wrong.name);await page.locator(`.guess-option[data-id="${wrong.id}"]`).click();
  check('filtered round accepts eligible guess',(await currentRound()).guesses.length===1);
  await setFilters(2000,2000);
  check('different ranges have isolated progress',(await currentRound()).guesses.length===0);
  await setFilters(2010,2010,'NBA:LAL');
  check('returning range restores exact answer and guesses',(await currentRound()).answerId===lakers.answerId && (await currentRound()).guesses[0]===wrong.id);
  await page.locator('#guess-open-settings').click();
  await page.locator('#guess-year-from').fill('2020');
  check('invalid pending range blocks apply and guessing',await page.locator('#guess-filter-apply').isDisabled() && await page.locator('#guess-search').isDisabled());
  await page.locator('#guess-filter-cancel').click();
  check('cancel preserves applied range and progress',(await currentRound()).guesses.length===1 && await page.locator('#guess-year-from').inputValue()==='2010');
  await page.locator('#guess-settings-close').click();
  await setFilters(1850,1850);
  const empty=await currentRound();
  check('zero candidates never falls back to unrelated answer',empty.status==='empty' && empty.answerId===null && await page.locator('#guess-search').isDisabled() && await page.locator('#guess-result').isHidden());
  check('empty state explains evidence limitation',(await page.locator('#guess-history').innerText()).includes('已核实'));
  await setFilters();
  check('unrestricted range restores original daily question',(await currentRound()).answerId===original.answerId);
  await page.locator('#guess-pool').selectOption('cba-history');
  const cbaOptions=await page.locator('#guess-team option').evaluateAll(es=>es.map(e=>e.value).filter(Boolean));
  check('CBA options exclude all NBA and Euro teams',cbaOptions.length>0 && cbaOptions.every(id=>id.startsWith('CBA:')));
  const yao=data.players.find(p=>p.id==='mingya01'),cbaYao=yao.appearances.find(row=>row.league==='CBA');
  await setFilters(cbaYao.season,cbaYao.season,cbaYao.teamId);
  const yaoRound=await checkAnswer('CBA scoped evidence qualifies Yao at Shanghai');
  check('Shanghai evidence is not inferred from Houston seasons',eligiblePlayers(data.players,'cba-history',yaoRound.filters).some(p=>p.id==='mingya01'));
  const revealed=data.players.find(p=>p.id===yaoRound.answerId);await page.locator('#guess-search').fill(revealed.name);await page.locator(`.guess-option[data-id="${revealed.id}"]`).click();
  check('revealed answer shows exact eligibility proof',(await currentRound()).status==='won' && await page.locator('.guess-proof li').count()>0);
  await page.locator('#guess-result-review').click();
  await page.locator('[data-mode="practice"]').click();
  check('practice reroll availability reflects actual range size',await page.locator('#guess-new').isDisabled()===(eligiblePlayers(data.players,'cba-history',yaoRound.filters).length<2));
  await setFilters(2003,2003,cbaYao.teamId);
  check('Yao NBA seasons cannot count as CBA seasons',(await currentRound()).answerId!=='mingya01');
  await page.locator('#guess-pool').selectOption('global');
  const globalOptions=await page.locator('#guess-team option').evaluateAll(es=>es.map(e=>e.value).filter(Boolean));
  check('global options match collected leagues',globalOptions.length>cbaOptions.length && globalOptions.length===teamsForPool(data.players,'global').length);
  const euro=data.players.find(p=>p.appearances.some(row=>row.league==='EuroLeague')), appearance=euro.appearances.find(row=>row.league==='EuroLeague');
  await setFilters(appearance.season,appearance.season,appearance.teamId);
  await checkAnswer('international team/year selects actual verified appearance');
  for(let turn=0;turn<4;turn++){
    if(await page.locator('#guess-new').isEnabled())await page.locator('#guess-new').click();
    await checkAnswer(`practice reroll ${turn} respects same range`);
  }
  for(const width of [360,390,768,1024,1440]){
    await page.setViewportSize({width,height:900});
    check(`${width}px filters stay aligned without horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth && [...document.querySelectorAll('.guess-year-filter input,.guess-year-filter select,.guess-filter-actions button')].filter(e=>!e.hidden).every(e=>{const r=e.getBoundingClientRect();return r.left>=0 && r.right<=innerWidth;})));
  }
  check('no browser errors',errors.length===0);
  console.log(JSON.stringify({passed:checks.length,checks,errors},null,2));
}finally{await browser.close();}
