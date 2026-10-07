import {ONLINE_CONFIG} from './online-config.mjs';
import {t} from './i18n.mjs';
export function presenceCount(state){return [...state.values()].filter(refs=>refs.size>0).length;}
export function mergePresence(state,payload,full=false){
  if(full){state.clear();for(const [key,item] of Object.entries(payload||{}))state.set(key,new Set((item.metas||[]).map(m=>m.phx_ref)));return;}
  for(const [key,item] of Object.entries(payload?.joins||{})){const refs=state.get(key)||new Set();for(const m of item.metas||[])refs.add(m.phx_ref);state.set(key,refs);}
  for(const [key,item] of Object.entries(payload?.leaves||{})){const refs=state.get(key);if(refs){for(const m of item.metas||[])refs.delete(m.phx_ref);if(!refs.size)state.delete(key);}}
}
export function initPresence(mount){
  let key=crypto.randomUUID();const day=new Date().toISOString().slice(0,10);
  try{const old=JSON.parse(localStorage.getItem('true-goat-presence:v1'));if(old?.day===day&&typeof old.key==='string')key=old.key;else localStorage.setItem('true-goat-presence:v1',JSON.stringify({day,key}));}catch{}
  mount.innerHTML='<strong id="online-presence-count">在线人数：连接中…</strong><small>猜球员页面在线浏览器去重估计，含游客；不是匹配队列人数。</small>';
  const label=mount.querySelector('strong'),state=new Map();let ws,timer,retry,watchdog,stopped=false,delay=1000,known=false;
  const render=()=>label.textContent=known?t('实时在线约')+' '+presenceCount(state)+' '+t('人'):t('在线人数暂不可用');
  const unavailable=()=>{known=false;render();};document.addEventListener('goat:language-change',render);
  function connect(){
    if(stopped)return;clearTimeout(retry);state.clear();const topic='realtime:goat-public-lobby-v1';let ref=0,joinRef;
    ws=new WebSocket(ONLINE_CONFIG.url.replace('https:','wss:')+'/realtime/v1/websocket?apikey='+encodeURIComponent(ONLINE_CONFIG.publishableKey)+'&vsn=1.0.0');
    function send(event,payload,channel=topic){if(ws.readyState===1){const id=String(++ref);ws.send(JSON.stringify({topic:channel,event,payload,ref:id}));return id;}}
    watchdog=setTimeout(()=>{unavailable();ws.close();},15000);
    ws.onopen=()=>{joinRef=send('phx_join',{config:{broadcast:{self:false},presence:{key,enabled:true},postgres_changes:[],private:false}});timer=setInterval(()=>{send('heartbeat',{},'phoenix');clearTimeout(watchdog);watchdog=setTimeout(()=>{unavailable();ws.close();},15000);},25000);};
    ws.onmessage=event=>{try{const m=JSON.parse(event.data);if(m.event==='phx_reply'&&m.payload?.status==='ok'){
      clearTimeout(watchdog);if(m.ref===joinRef)send('presence',{type:'presence',event:'track',payload:{page:'guess'}});
    }else if(m.event==='phx_reply'&&m.payload?.status==='error'){stopped=true;unavailable();ws.close();}
    if(m.event==='presence_state'||m.event==='presence_diff'){mergePresence(state,m.payload,m.event==='presence_state');known=true;render();delay=1000;}
    if(['phx_error','phx_close'].includes(m.event)){unavailable();ws.close();}
    }catch{unavailable();}};
    ws.onerror=unavailable;ws.onclose=()=>{clearInterval(timer);clearTimeout(watchdog);unavailable();if(!stopped){retry=setTimeout(connect,delay);delay=Math.min(delay*2,30000);}};
  }
  connect();window.addEventListener('pagehide',()=>{stopped=true;clearTimeout(retry);clearTimeout(watchdog);clearInterval(timer);ws?.close();});
  window.addEventListener('pageshow',e=>{if(e.persisted){stopped=false;connect();}});
}
