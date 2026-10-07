// Two isolated browser accounts against the real SQL referee in a local database.
// Auth and transport are test doubles: no cloud accounts, email or ladder writes.
import {readFile} from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import {buildStaticSite} from './16_build_static_site.mjs';
const {PGlite}=await import(process.env.GOAT_PGLITE_MODULE || '@electric-sql/pglite');
const {chromium}=await import(process.env.GOAT_PLAYWRIGHT_MODULE || 'playwright');
const db=new PGlite();
let browser,server;
try {
  await db.exec(`create role anon;create role authenticated;create schema auth;
    create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
  await db.exec(await readFile('supabase/migrations/202610070001_arena.sql','utf8'));
  const source=JSON.parse(await readFile('app/data/guess-players.json','utf8'));
  const sample=source.players.filter(p=>['jordami01','jamesle01','curryst01'].includes(p.id));
  for(const p of sample)await db.query('insert into goat_private.players values($1,$2,$3)',[p.id,source.version,p]);
  const users=[{id:'11111111-1111-4111-8111-111111111111',email:'alpha@example.test'},
    {id:'22222222-2222-4222-8222-222222222222',email:'beta@example.test'}];
  for(const user of users)await db.query('insert into auth.users(id) values($1)',[user.id]);
  const sessions=users.map((user,i)=>({access_token:'test-access-'+i,refresh_token:'test-refresh-'+i,user}));
  const methods={goat_profile:['p_name'],goat_lobby:['p_pool','p_action','p_code'],goat_state:['p_match'],
    goat_guess:['p_match','p_player'],goat_leave:['p_match'],goat_leaderboard:[]};
  let queue=Promise.resolve();
  const exclusive=fn=>{const pending=queue.then(fn);queue=pending.catch(()=>{});return pending;};
  const result=await buildStaticSite();
  const allowed=new Set(result.files);
  const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
  server=http.createServer(async(req,res)=>{
    const file=new URL(req.url,'http://localhost').pathname.replace(/^\/true-goat\//,'')||'index.html';
    if(!allowed.has(file)){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'text/plain'});
    res.end(await readFile(path.join(result.output,file)));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}/true-goat/guess.html`;
  browser=await chromium.launch({headless:true,...(process.env.GOAT_BROWSER_EXECUTABLE?{executablePath:process.env.GOAT_BROWSER_EXECUTABLE}:{})});
  const errors=[];
  const pages=[];
  for(let i=0;i<2;i++){
    const context=await browser.newContext({viewport:{width:1200,height:950}});
    await context.route('https://qtfmrczwxinizmqgkebh.supabase.co/**',async route=>{
      const request=route.request();
      const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'apikey,authorization,content-type','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS'};
      if(request.method()==='OPTIONS'){await route.fulfill({status:204,headers});return;}
      const endpoint=new URL(request.url()).pathname;
      const body=request.postDataJSON()||{};
      let data,status=200;
      try{
        if(endpoint==='/auth/v1/signup'){
          assert.equal(body.email,users[i].email);
          await exclusive(()=>db.query('update auth.users set raw_user_meta_data=$1 where id=$2',[body.data,users[i].id]));
          data=sessions[i];
        }else if(endpoint==='/auth/v1/settings')data={mailer_autoconfirm:true};
        else if(endpoint==='/auth/v1/token')data=sessions[i];
        else if(endpoint==='/auth/v1/user')data=users[i];
        else if(endpoint==='/auth/v1/logout')data={};
        else{
          const name=endpoint.split('/').at(-1),keys=methods[name];
          if(!keys)throw Error('Unexpected test RPC: '+name);
          data=await exclusive(()=>db.transaction(async tx=>{
            const signed=request.headers().authorization==='Bearer '+sessions[i].access_token;
            await tx.exec('set local role '+(signed?'authenticated':'anon'));
            await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[signed?users[i].id:'']);
            const placeholders=keys.map((_,n)=>'$'+(n+1)).join(',');
            return (await tx.query(`select public.${name}(${placeholders}) as value`,keys.map(key=>body[key]??null))).rows[0].value;
          }));
        }
      }catch(error){status=400;data={message:error.message};}
      await route.fulfill({status,headers,contentType:'application/json',body:JSON.stringify(data)});
    });
    await context.routeWebSocket('**/realtime/v1/websocket**',socket=>socket.onMessage(()=>{}));
    const page=await context.newPage();pages.push(page);
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base);
    await page.locator('#guess-app').waitFor({state:'visible'});
    await page.locator('#onboarding-dialog[open] [data-guide-skip]').first().click();
    await page.locator('#online-panel>summary').click();
    await page.locator('#online-register-tab').click();
    await page.locator('#online-email').fill(users[i].email);
    await page.locator('#online-password').fill('isolated-test-password');
    await page.locator('#online-name').fill(i?'测试乙':'测试甲');
    await page.locator('#online-auth-submit').click();
    await page.locator('#online-lobby').waitFor({state:'visible'});
    assert.match(await page.locator('#online-profile').innerText(),/1000 分/);
    await page.locator('#online-pool').selectOption('nba-easy');
  }
  const [host,guest]=pages;
  // A single-player custom clue must not enter online games.
  await host.locator('#guess-clues-enabled').check();
  await host.locator('[data-guess-clue][value="assistsPerGame"]').check();
  await host.locator('#online-ranked').click();
  await host.locator('#online-result').filter({hasText:'等待对手'}).waitFor();
  await guest.locator('#online-ranked').click();
  await host.locator('#online-search-area').waitFor({state:'visible'});
  const stored=(await exclusive(()=>db.query("select id from public.goat_matches where state='playing'"))).rows[0];
  const answer=(await exclusive(()=>db.query('select player_id from goat_private.answers where match_id=$1',[stored.id]))).rows[0].player_id;
  const wrong=sample.find(p=>p.id!==answer);
  const guess=async(page,player)=>{
    await page.locator('#online-search').fill(player.name);
    await page.locator(`[data-online-player="${player.id}"]`).click();
    await page.locator('#online-submit').click();
  };
  await guess(host,wrong);
  await host.locator('#online-history .online-guess').waitFor();
  assert.equal(await host.locator('#online-history .online-feedback>div').count(),10);
  await guest.locator('#online-progress .online-tiles').waitFor();
  assert.equal(await guest.locator('#online-history .online-guess').count(),0);
  assert.equal(await guest.locator('#online-progress .online-tiles i').count(),10);
  assert.ok(!(await guest.locator('#online-progress').innerText()).includes(wrong.name));
  await guest.reload();
  await guest.locator('#online-search-area').waitFor({state:'visible'});
  assert.equal(await guest.locator('#online-history .online-guess').count(),0);
  await guess(guest,sample.find(p=>p.id===answer));
  await guest.locator('#online-result').filter({hasText:'你赢了'}).waitFor();
  await host.locator('#online-result').filter({hasText:'对手获胜'}).waitFor();
  await guest.locator('#online-profile').filter({hasText:'1012 分'}).waitFor();
  await host.locator('#online-profile').filter({hasText:'988 分'}).waitFor();
  for(const page of pages)await page.locator('#online-dismiss').click();
  await host.locator('#online-create').click();
  await host.locator('#online-result').filter({hasText:'等待对手'}).waitFor();
  const friendly=(await exclusive(()=>db.query("select room_code from public.goat_matches where state='waiting'"))).rows[0];
  await guest.locator('#online-room-code').fill(friendly.room_code);
  await guest.locator('#online-join-form button').click();
  await host.locator('#online-search-area').waitFor({state:'visible'});
  host.once('dialog',dialog=>dialog.accept());
  await host.locator('#online-leave').click();
  await guest.locator('#online-result').filter({hasText:'好友房不计积分'}).waitFor();
  assert.match(await guest.locator('#online-profile').innerText(),/1012 分/);
  await guest.locator('#online-ranking>summary').click();
  await guest.locator('#online-leaderboard tbody tr').first().waitFor();
  assert.equal(await guest.locator('#online-leaderboard tbody tr').count(),2);
  await guest.setViewportSize({width:390,height:844});
  assert.equal(await guest.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  assert.deepEqual(errors,[]);
  console.log('PASS: two browser registrations, ranked matching, fixed ten clues, private opponent progress, reload recovery, server Elo, friendly room, forfeit, ladder and mobile layout (isolated database).');
}finally{
  if(browser)await browser.close();
  if(server)await new Promise(resolve=>server.close(resolve));
  await db.close();
}
