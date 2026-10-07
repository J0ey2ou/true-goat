import {ONLINE_CONFIG} from './online-config.mjs';
import {ATTRIBUTES,playersInPool} from './guess-engine.mjs';
import {searchPlayers} from './player-search.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SESSION='true-goat-online:session:v1';
const statusNames={correct:'一致',close:'接近',wrong:'不同',unknown:'未知'};
export function tier(rating){return rating>=1800?'大师':rating>=1500?'钻石':rating>=1250?'黄金':rating>=1000?'白银':'青铜';}
export function opponentProgress(match,myId){const host=match.host_id===myId;return {name:host?match.guest_name:match.host_name,attempts:host?match.guest_attempts:match.host_attempts,state:host?match.guest_state:match.host_state,tiles:host?match.guest_tiles:match.host_tiles};}

export function initOnline({players,pools,dataVersion}) {
  const mount=document.getElementById('online-mount');if(!mount)return;
  let session=null,profile=null,match=null,ready=false,busy=false,refreshing=false,ws=null,heartbeat=null,register=false,selected=null,serverOffset=0;
  try{session=JSON.parse(localStorage.getItem(SESSION)||'null');}catch{}
  mount.innerHTML=`<details id="online-panel" class="online-panel panel"><summary><span>在线 1v1 · 账号与天梯</span><small id="online-service-status">正在连接…</small></summary><div class="online-inner">
    <p class="online-rules">双方同题，默认 10 项线索、8 次机会、180 秒。先猜中获胜；都未猜中则平局。可看对方次数和颜色进度，不显示对方猜过的名字。天梯胜负由服务器结算；好友房不计积分。</p>
    <div id="online-auth"><div class="online-auth-tabs"><button type="button" id="online-login-tab" aria-pressed="true">登录</button><button type="button" id="online-register-tab" aria-pressed="false">注册账号</button></div>
      <form id="online-auth-form"><label>邮箱<input id="online-email" type="email" autocomplete="email" required></label><label>密码<input id="online-password" type="password" autocomplete="current-password" minlength="8" required></label><label id="online-name-label" hidden>昵称<input id="online-name" maxlength="24" minlength="2" autocomplete="nickname"></label><button type="submit" id="online-auth-submit">登录</button></form><button type="button" id="online-forgot" class="text-button">忘记密码</button></div>
    <div id="online-account" hidden><div class="online-account-head"><strong id="online-profile"></strong><button type="button" id="online-logout">退出登录</button></div><form id="online-profile-form"><label>昵称<input id="online-edit-name" required minlength="2" maxlength="24"></label><button type="submit">保存昵称</button></form></div>
    <div id="online-recovery" hidden><form id="online-recovery-form"><label>设置新密码<input id="online-new-password" type="password" minlength="8" required autocomplete="new-password"></label><button type="submit">更新密码</button></form></div>
    <div id="online-lobby" hidden><label>对战球员池<select id="online-pool">${pools.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></label><div class="online-actions"><button type="button" id="online-ranked">天梯匹配</button><button type="button" id="online-create">创建好友房</button></div><form id="online-join-form"><label>好友房间码<input id="online-room-code" minlength="6" maxlength="6" pattern="[A-Fa-f0-9]{6}" placeholder="6 位房间码" required></label><button type="submit">加入房间</button></form></div>
    <div id="online-match" hidden><div class="online-match-head"><strong id="online-match-title"></strong><span id="online-clock"></span></div><div id="online-progress" class="online-progress"></div><div id="online-search-area"><label>猜哪位球员？<input id="online-search" type="search" autocomplete="off" placeholder="中文、英文或绰号"></label><div id="online-candidates" class="online-candidates"></div><button type="button" id="online-submit" disabled>提交猜测</button></div><div id="online-history"></div><p id="online-result"></p><button type="button" id="online-leave">取消 / 退出本局</button><button type="button" id="online-dismiss" hidden>返回大厅</button></div>
    <p id="online-message" class="online-message" role="status" aria-live="polite"></p><details id="online-ranking"><summary>天梯排行榜</summary><p>初始 1000 分，Elo 系数 K=24；仅统计已结算天梯对局。</p><button type="button" id="online-refresh-board">刷新排行榜</button><div id="online-leaderboard"></div></details>
    <p class="online-privacy">邮箱仅用于账号认证；昵称、积分和天梯战绩会在排行榜展示。单人玩法继续无需登录。</p></div></details>`;
  const $=id=>document.getElementById(id),say=text=>{$('online-message').textContent=text;};
  if(!ONLINE_CONFIG.passwordRecoveryEnabled){
    $('online-forgot').disabled=true;
    $('online-forgot').textContent='邮件找回暂未开通，请妥善保存密码';
    mount.querySelector('.online-privacy').textContent='邮箱仅用于账号登录；暂未开通邮件找回，请妥善保存密码。昵称、积分和天梯战绩会公开展示。单人玩法无需登录。';
  }
  function openOnlineLink(){if(location.hash==='#online-panel'){$('online-panel').open=true;$('online-panel').scrollIntoView({block:'start'});}}
  openOnlineLink();window.addEventListener('hashchange',openOnlineLink);
  function saveSession(value){session=value;try{if(value)localStorage.setItem(SESSION,JSON.stringify(value));else localStorage.removeItem(SESSION);}catch{}}
  async function request(endpoint,body,method='POST',retry=true){
    const headers={'apikey':ONLINE_CONFIG.publishableKey,'Content-Type':'application/json'};
    if(session?.access_token)headers.Authorization='Bearer '+session.access_token;
    const response=await fetch(ONLINE_CONFIG.url+endpoint,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)})});
    const data=await response.json().catch(()=>({}));
    if(response.status===401&&session?.refresh_token&&retry){
      const refresh=await fetch(ONLINE_CONFIG.url+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:ONLINE_CONFIG.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});
      const renewed=await refresh.json();if(!refresh.ok){closeRealtime();saveSession(null);profile=null;match=null;render();throw Error('登录已过期，请重新登录。');}saveSession(renewed);realtime();return request(endpoint,body,method,false);
    }
    if(!response.ok)throw Error(data.msg||data.error_description||data.message||'服务暂时无法连接');
    return data;
  }
  const rpc=(name,body={})=>request('/rest/v1/rpc/'+name,body);
  async function action(fn){if(busy)return;busy=true;mount.setAttribute('aria-busy','true');try{await fn();}catch(error){say(error.message);}finally{busy=false;mount.removeAttribute('aria-busy');}}
  function closeRealtime(){if(heartbeat)clearInterval(heartbeat);heartbeat=null;ws?.close();ws=null;}
  function realtime(){
    closeRealtime();if(!match||match.state==='finished'||match.state==='cancelled'||!session)return;
    const url=ONLINE_CONFIG.url.replace(/^https:/,'wss:')+'/realtime/v1/websocket?apikey='+encodeURIComponent(ONLINE_CONFIG.publishableKey)+'&vsn=1.0.0';
    ws=new WebSocket(url);let ref=0;const topic='realtime:goat:'+match.id;
    const send=(event,payload,channel=topic)=>{if(ws?.readyState===1)ws.send(JSON.stringify({topic:channel,event,payload,ref:String(++ref)}));};
    ws.onopen=()=>{send('phx_join',{config:{broadcast:{self:false},presence:{key:''},postgres_changes:[{event:'UPDATE',schema:'public',table:'goat_matches',filter:'id=eq.'+match.id}]},access_token:session.access_token});heartbeat=setInterval(()=>send('heartbeat',{},'phoenix'),25000);};
    ws.onmessage=event=>{try{const message=JSON.parse(event.data);if(message.event==='postgres_changes')sync();}catch{}};
    ws.onerror=()=>{}; // Polling below keeps progress working if WebSockets drop.
  }
  function accountView(){
    const signed=!!session?.access_token;$('online-auth').hidden=signed;$('online-account').hidden=!signed;$('online-lobby').hidden=!signed||!!match;
    $('online-profile').textContent=profile?`${profile.display_name} · ${tier(profile.rating)} ${profile.rating} 分 · ${profile.played} 场`:'已登录';
    if(profile)$('online-edit-name').value=profile.display_name;
    for(const id of ['online-ranked','online-create'])$(id).disabled=!ready;
    $('online-join-form').querySelector('button').disabled=!ready;
  }
  function accept(next){const previous=match?.id;match=next;if(next?.server_time&&Number.isFinite(Date.parse(next.server_time)))serverOffset=Date.parse(next.server_time)-Date.now();if(next&&previous!==next.id)$('online-panel').open=true;render();if(previous!==match?.id)realtime();if(!match||['finished','cancelled'].includes(match.state))closeRealtime();}
  async function sync(){if(!match||refreshing||busy)return;refreshing=true;try{accept(await rpc('goat_state',{p_match:match.id}));}catch(error){say('进度暂未同步：'+error.message);}finally{refreshing=false;}}
  function render(){
    accountView();$('online-match').hidden=!match;if(!match)return;
    const host=match.host_id===session?.user?.id;const opponent=opponentProgress(match,session?.user?.id);const attempts=host?match.host_attempts:match.guest_attempts;const myState=host?match.host_state:match.guest_state;
    $('online-match-title').textContent=(match.ranked?'天梯':'好友房')+' · '+(pools.find(p=>p.id===match.pool)?.name||match.pool)+(match.state==='waiting'?' · 房间码 '+match.room_code:'');
    $('online-progress').innerHTML=`<div><strong>你 · ${attempts}/8</strong><span>${myState==='exhausted'?'次数已用完':myState==='won'?'已猜中':'推理中'}</span></div><div><strong>${esc(opponent.name||'等待对手')} · ${opponent.attempts}/8</strong><span>${opponent.state==='exhausted'?'次数已用完':opponent.state==='won'?'已猜中':match.state==='waiting'?'等待加入':'推理中'}</span>${(opponent.tiles||[]).map(row=>`<div class="online-tiles">${row.map(status=>`<i class="${esc(status)}" title="${esc(statusNames[status])}"></i>`).join('')}</div>`).join('')}</div>`;
    $('online-search-area').hidden=match.state!=='playing'||myState!=='playing'||match.data_version!==dataVersion;
    if(match.data_version!==dataVersion)say('网页与对战题库版本不同，请刷新网页；仍不一致时请等待题库更新。');
    $('online-history').innerHTML=(match.guesses||[]).map(row=>{const player=players.find(p=>p.id===row.id);return `<article class="online-guess"><strong>${esc(player?.chineseName||player?.name||row.id)}</strong><div class="online-feedback">${row.feedback.map((cell,i)=>{const attr=ATTRIBUTES.find(a=>a.key===cell.key);const value=attr?.key==='teams'?player?.teams?.map(t=>t.name).join(' / '):attr?.key==='positions'?player?.positions?.join(' / '):player?.[cell.key];return `<div class="${esc(cell.status)}"><small>${esc(attr?.label||cell.key)}</small><span>${esc(value??'未知')}${cell.direction==='up'?' ↑':cell.direction==='down'?' ↓':''}</span></div>`;}).join('')}</div></article>`;}).join('');
    $('online-dismiss').hidden=!['finished','cancelled'].includes(match.state);$('online-leave').hidden=['finished','cancelled'].includes(match.state);
    $('online-leave').textContent=match.state==='waiting'?'取消等待':'认输退出';
    $('online-result').textContent=match.state==='finished'?`${match.winner_id===null?'平局':match.winner_id===session?.user?.id?'你赢了！':'对手获胜'} · ${match.ranked?'积分变化 '+(host?match.host_delta:match.guest_delta):'好友房不计积分'} · 答案：${match.answer?.chineseName||match.answer?.name||'—'}`:match.state==='cancelled'?'等待已取消。':match.state==='waiting'?'等待对手加入。同一账号可刷新恢复等待。':'先猜中获胜；刷新页面可恢复本局。';
    if(match.state==='finished'&&profile)rpc('goat_profile').then(p=>{profile=p;accountView();}).catch(()=>{});
    clock();
  }
  function clock(){if(!match)return;const seconds=match.deadline_at?Math.max(0,Math.ceil((Date.parse(match.deadline_at)-Date.now()-serverOffset)/1000)):null;$('online-clock').textContent=match.state==='playing'?`${seconds} 秒`:'默认 10 项线索';}
  async function leaderboard(){const rows=await rpc('goat_leaderboard');$('online-leaderboard').innerHTML=rows.length?`<table><thead><tr><th>名次</th><th>玩家</th><th>积分</th><th>胜 / 负 / 平</th></tr></thead><tbody>${rows.map((row,i)=>`<tr><td>${i+1}</td><td>${esc(row.display_name)}</td><td>${row.rating}</td><td>${row.wins} / ${row.losses} / ${row.draws}</td></tr>`).join('')}</tbody></table>`:'<p>还没有已结算的天梯战绩。</p>';}
  for(const id of ['online-login-tab','online-register-tab'])$(id).onclick=()=>{register=id==='online-register-tab';$('online-name-label').hidden=!register;$('online-name').required=register;$('online-password').autocomplete=register?'new-password':'current-password';$('online-auth-submit').textContent=register?'注册账号':'登录';$('online-login-tab').setAttribute('aria-pressed',String(!register));$('online-register-tab').setAttribute('aria-pressed',String(register));};
  $('online-auth-form').onsubmit=event=>{event.preventDefault();action(async()=>{
    const email=$('online-email').value.trim(),password=$('online-password').value;
    if(register){const name=$('online-name').value.trim();if(name.length<2||name.length>24||/[<>\x00-\x1f]/.test(name))throw Error('昵称需为2–24个可显示字符');const result=await request('/auth/v1/signup?redirect_to='+encodeURIComponent(location.origin+location.pathname),{email,password,data:{display_name:name}});$('online-password').value='';if(!result.access_token){say('注册已提交，请打开邮箱中的确认链接，再登录。');return;}saveSession(result);}
    else{saveSession(await request('/auth/v1/token?grant_type=password',{email,password}));$('online-password').value='';}
    profile=await rpc('goat_profile',{p_name:register?$('online-name').value.trim():null});accountView();say('已登录，可以匹配或创建好友房。');accept(await rpc('goat_lobby',{p_pool:$('online-pool').value,p_action:'resume'}));
  });};
  $('online-logout').onclick=()=>action(async()=>{if(match?.state==='playing'){if(!confirm('退出会认输，确定退出？'))return;await rpc('goat_leave',{p_match:match.id});}else if(match?.state==='waiting')await rpc('goat_leave',{p_match:match.id});await request('/auth/v1/logout',{});closeRealtime();saveSession(null);match=null;profile=null;accountView();$('online-match').hidden=true;say('已退出。');});
  $('online-profile-form').onsubmit=event=>{event.preventDefault();action(async()=>{profile=await rpc('goat_profile',{p_name:$('online-edit-name').value.trim()});accountView();say('昵称已保存。');});};
  $('online-forgot').onclick=()=>action(async()=>{const email=$('online-email').value.trim();if(!$('online-email').checkValidity())throw Error('请先输入有效邮箱');await request('/auth/v1/recover?redirect_to='+encodeURIComponent(location.origin+location.pathname),{email});say('重置邮件已申请，请查看邮箱。');});
  $('online-recovery-form').onsubmit=event=>{event.preventDefault();action(async()=>{await request('/auth/v1/user',{password:$('online-new-password').value},'PUT');$('online-new-password').value='';$('online-recovery').hidden=true;say('密码已更新。');});};
  for(const [id,kind] of [['online-ranked','ranked'],['online-create','create']])$(id).onclick=()=>action(async()=>{if(!ready)throw Error('在线对战正在开通');accept(await rpc('goat_lobby',{p_pool:$('online-pool').value,p_action:kind}));say('');});
  $('online-join-form').onsubmit=event=>{event.preventDefault();action(async()=>{if(!ready)throw Error('在线对战正在开通');accept(await rpc('goat_lobby',{p_pool:$('online-pool').value,p_action:'join',p_code:$('online-room-code').value.toUpperCase()}));say('');});};
  $('online-search').oninput=()=>{selected=null;$('online-submit').disabled=true;const guessed=new Set(match?.guesses?.map(r=>r.id)||[]);const options=match?searchPlayers(playersInPool(players,match.pool),$('online-search').value).filter(p=>!guessed.has(p.id)).slice(0,8):[];$('online-candidates').innerHTML=options.map(p=>`<button type="button" data-online-player="${esc(p.id)}">${esc(p.chineseName||p.name)}${p.chineseName?' · '+esc(p.name):''}</button>`).join('');};
  $('online-candidates').onclick=event=>{const button=event.target.closest('[data-online-player]');if(button){selected=button.dataset.onlinePlayer;$('online-search').value=button.textContent;$('online-candidates').innerHTML='';$('online-submit').disabled=false;}};
  $('online-submit').onclick=()=>action(async()=>{if(!selected||!match||match.data_version!==dataVersion)return;accept(await rpc('goat_guess',{p_match:match.id,p_player:selected}));selected=null;$('online-search').value='';$('online-candidates').innerHTML='';$('online-submit').disabled=true;say('');});
  $('online-leave').onclick=()=>action(async()=>{if(match?.state==='playing'&&!confirm('认输退出会结束本局，确定继续？'))return;accept(await rpc('goat_leave',{p_match:match.id}));});
  $('online-dismiss').onclick=()=>{accept(null);say('');};$('online-refresh-board').onclick=()=>action(leaderboard);
  $('online-ranking').ontoggle=()=>{if($('online-ranking').open&&ready)action(leaderboard);};
  setInterval(()=>{clock();if(match&&!['finished','cancelled'].includes(match.state)&&!document.hidden)sync();},1600);
  window.addEventListener('focus',sync);
  async function boot(){
    try{
      const callback=new URLSearchParams(location.hash.slice(1));
      if(callback.get('access_token')&&callback.get('refresh_token')){saveSession({access_token:callback.get('access_token'),refresh_token:callback.get('refresh_token')});history.replaceState(null,'',location.pathname+location.search);$('online-panel').open=true;$('online-recovery').hidden=callback.get('type')!=='recovery';}
      if(session?.access_token){const user=await request('/auth/v1/user',undefined,'GET');saveSession({...session,user});}
      await rpc('goat_leaderboard');ready=true;$('online-service-status').textContent='注册 · 实时对战 · 天梯';
      try{
        const settings=await request('/auth/v1/settings',undefined,'GET');
        if(settings.mailer_autoconfirm===true&&!ONLINE_CONFIG.passwordRecoveryEnabled)mount.querySelector('.online-privacy').textContent='当前不验证邮箱归属，暂未开通邮件找回，请妥善保存密码。昵称、积分和天梯战绩会公开展示。单人玩法无需登录。';
        if(settings.mailer_autoconfirm===false&&!ONLINE_CONFIG.passwordRecoveryEnabled){
          $('online-register-tab').disabled=true;
          $('online-register-tab').textContent='注册待开放';
          $('online-service-status').textContent='对战已连接 · 注册待配置';
          say('项目仍要求邮箱确认，但公开注册邮件服务尚未开通。已有账号可登录，单人玩法无需账号。');
        }
      }catch{} // Failure to read public settings does not disable game RPCs.
      if(session){profile=await rpc('goat_profile');accept(await rpc('goat_lobby',{p_pool:$('online-pool').value,p_action:'resume'}));}
    }catch(error){$('online-service-status').textContent='连接暂不可用';say('在线服务暂未连通：'+error.message+'。单人玩法不受影响。');}
    accountView();
  }
  boot();
}
