import { searchPlayers } from './player-search.mjs';

export const CUSTOM_PLAYERS_KEY = 'true-goat-custom-players:v1';
const DIMENSION_KEYS = ['regular_season','peak','longevity','playoffs','awards','defense','team_success'];
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function sanitizeSelectedIds(value, catalogIds, baseIds = new Set()) {
  const items = Array.isArray(value) ? value : [];
  return [...new Set(items.filter(id => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(id) && !baseIds.has(id) && (!catalogIds || catalogIds.has(id))))];
}
export function normalizeCatalog(payload) {
  const unique = new Map();
  for (const item of Array.isArray(payload?.players) ? payload.players : []) {
    const profile = {...(item.profile || {}),...item};
    const id = profile.id || profile.model?.player_id;
    const name = profile.name || profile.model?.player_name;
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(id) || typeof name !== 'string' || !name.trim() || unique.has(id)) continue;
    const incoming = profile.model || {};
    profile.id = id; profile.name = name;
    profile.teams = Array.isArray(profile.teams) ? profile.teams.map(team=>typeof team==='object'&&team ? {...team,abbreviation:team.abbreviation || team.code} : team) : [];
    profile.model = {...incoming,player_id:id,player_name:name,chineseName:profile.chineseName,aliases:profile.aliases || [],position:profile.position || incoming.position || '',era:profile.era || incoming.era || '',components:Object.fromEntries(DIMENSION_KEYS.map(key=>[key+'_score',Number.isFinite(incoming.components?.[key+'_score']) ? incoming.components[key+'_score'] : null])),rankings:{...(incoming.rankings || {}),public_prior_score:Number.isFinite(incoming.rankings?.public_prior_score) ? incoming.rankings.public_prior_score : null},customPlayer:true};
    profile.customPlayer = true;
    profile.eligibility = {...profile.eligibility,pools:{},custom:true};
    unique.set(id,profile);
  }
  return {players:[...unique.values()],meta:payload?.meta || {},sources:Array.isArray(payload?.sources) ? payload.sources : []};
}
export function readCustomIds(storage) {
  try { const stored = JSON.parse(storage.getItem(CUSTOM_PLAYERS_KEY) || 'null'); return sanitizeSelectedIds(Array.isArray(stored) ? stored : stored?.ids); }
  catch { return []; }
}
import { registerNames } from './i18n.mjs';
export function mergeSelectedPlayers(basePlayers, selectedPlayers, idKey = 'id') {
  registerNames(selectedPlayers);
  const existing = new Set(basePlayers.map(p=>p[idKey]));
  return [...basePlayers,...selectedPlayers.filter(p=>!existing.has(p[idKey]) && (existing.add(p[idKey]),true))];
}

/** Catalog is fetched only when needed; only catalog-backed IDs may be selected. */
export function createPlayerLibrary({baseIds, onChange = ()=>{}, onPreview, mount = document.getElementById('player-library-mount')}) {
  const fixedIds = new Set(baseIds), selected = new Set();
  let catalog = null, catalogMap = new Map(), loading = null, storage = null, temporary = false, focusId = null;
  try { storage = window.localStorage; } catch {}
  let initialIds = readCustomIds(storage);
  let initialResolved = initialIds.length === 0;
  const bar = document.createElement('section'); bar.className = 'player-library-bar';
  bar.innerHTML = '<div><strong>把你想讨论的球员加入进来</strong><p id="custom-player-summary">默认 '+fixedIds.size+' 位不变；从有出处的扩展档案中自选，不手填虚构数据。</p></div><button id="open-player-library" class="button outline" type="button">添加 / 管理球员 ＋</button>';
  mount?.append(bar);
  const dialog = document.createElement('dialog'); dialog.id='player-library-dialog';dialog.className='player-library-dialog';dialog.setAttribute('aria-labelledby','player-library-title');
  dialog.innerHTML='<div class="library-head"><div><div class="eyebrow">YOUR PLAYER UNIVERSE</div><h2 id="player-library-title">添加你想比较的球员</h2></div><button id="close-player-library" class="close-button" type="button" aria-label="关闭添加球员">×</button></div><p class="library-intro">默认样本保留不动；加入的球员会同步到排名实验室和球员库。未计算的七维指数保持缺失，可在高级模式使用已核实的原始统计模块。</p><label class="library-search-label" for="player-library-search">中文名 / 英文名 / 绰号 / 球队</label><input id="player-library-search" type="search" autocomplete="off" placeholder="从扩展档案中找一位球员"><label class="library-selected-filter"><input id="library-selected-only" type="checkbox">只看我添加的球员</label><p id="player-library-status" class="library-status" role="status"></p><div id="player-library-results" class="library-results"></div>';
  document.body.append(dialog);
  const el=id=>document.getElementById(id);
  const ids=()=>[...selected];
  const profiles=()=>ids().map(id=>catalogMap.get(id)).filter(Boolean);
  function summary() { el('custom-player-summary').textContent='默认 '+fixedIds.size+' 位 + 自选 '+selected.size+' 位 · '+(temporary?'浏览器存储不可用，仅本次页面有效。':'只在当前浏览器保存；两个页面共用同一份选择。'); }
  function emit() { summary();onChange({ids:ids(),profiles:profiles(),models:profiles().map(p=>p.model),catalog}); }
  function save() { try { if(!storage)throw new Error('unavailable');storage.setItem(CUSTOM_PLAYERS_KEY,JSON.stringify({v:1,ids:ids()}));temporary=false; }catch{temporary=true;} }
  async function ensureCatalog() {
    if(catalog)return catalog;
    if(!loading)loading=(async()=>{const response=await fetch('/data/player-catalog.json');if(!response.ok)throw new Error('扩展球员档案载入失败，请稍后重试（HTTP '+response.status+'）。');catalog=normalizeCatalog(await response.json());if(!catalog.players.length)throw new Error('扩展档案没有可用球员。');registerNames(catalog.players);catalogMap=new Map(catalog.players.map(p=>[p.id,p]));return catalog;})().catch(error=>{catalog=null;throw error;}).finally(()=>{loading=null;});
    return loading;
  }
  function render() {
    summary(); if(!catalog)return;
    const candidates=el('library-selected-only').checked ? profiles() : catalog.players;
    const query=el('player-library-search').value;
    const matches=searchPlayers(candidates,query,{includeTeams:true});
    const visible=matches.slice(0,40);
    el('player-library-status').textContent=(focusId?'这是一位扩展档案球员，请确认资料后点击「加入比较」。 ':'')+'匹配 '+matches.length+' 位，显示前 '+visible.length+' 位；已添加 '+selected.size+' 位。'+(temporary?' 保存不可用，仅本页有效。':'');
    el('player-library-results').innerHTML=visible.map(p=>{const fixed=fixedIds.has(p.id),added=selected.has(p.id),known=DIMENSION_KEYS.filter(key=>Number.isFinite(p.model.components[key+'_score'])).length;return '<article class="library-player"><div class="library-player-copy"><strong>'+esc(p.chineseName || p.name)+'</strong><span>'+esc(p.chineseName?p.name:'')+'</span><small>'+esc([p.position,p.firstSeason&&p.lastSeason?p.firstSeason+'–'+p.lastSeason:p.era].filter(Boolean).join(' · '))+' · '+(fixed?'默认评级样本':known?'七维可用 '+known+'/7':'七维未计算；可用原始模块')+'</small></div><div class="library-player-actions"><button type="button" class="text-button" data-library-profile="'+esc(p.id)+'">档案与来源 ↗</button><button type="button" class="button '+(added?'outline':'primary')+'" data-library-toggle="'+esc(p.id)+'" '+(fixed?'disabled':'')+' aria-label="'+(fixed?'默认保留':added?'移除':'加入比较')+' '+esc(p.name)+'">'+(fixed?'默认保留':added?'移除':'加入比较 ＋')+'</button></div></article>';}).join('') || '<p class="library-empty">没有匹配的档案。试试英文姓名；没有可靠档案的球员不能自行编造添加。</p>';
  }
  async function replaceIds(values,{persist=true}={}) {
    const requested=sanitizeSelectedIds(values,undefined,fixedIds);
    if(requested.length)await ensureCatalog();
    selected.clear();sanitizeSelectedIds(requested,new Set(catalogMap.keys()),fixedIds).forEach(id=>selected.add(id));
    initialIds=ids();initialResolved=true;if(persist)save();emit();if(dialog.open)render();return ids();
  }
  async function open({playerId}={}) {
    focusId=playerId || null;el('library-selected-only').checked=false;
    if(!dialog.open)dialog.showModal();el('player-library-search').focus();
    el('player-library-status').textContent='正在按需载入扩展档案…';
    try {await ensureCatalog();if(!initialResolved)await replaceIds(initialIds,{persist:false});if(playerId){const p=catalogMap.get(playerId);el('player-library-search').value=p?.name || playerId;}else el('player-library-search').value='';render();if(playerId&&!catalogMap.has(playerId))el('player-library-status').textContent='这个球员 ID 不在已核实扩展档案中；没有添加或伪造资料。';}
    catch(error){el('player-library-status').textContent=error.message;el('player-library-results').innerHTML='<p class="library-empty">默认球员仍可使用。关闭后重新打开可重试。</p>';}
  }
  el('open-player-library').onclick=()=>open();el('close-player-library').onclick=()=>dialog.close();
  el('player-library-search').oninput=()=>{focusId=null;render();};el('library-selected-only').onchange=render;
  el('player-library-results').onclick=async event=>{
    const toggle=event.target.closest('[data-library-toggle]'),preview=event.target.closest('[data-library-profile]');
    if(toggle){const id=toggle.dataset.libraryToggle;if(fixedIds.has(id)||!catalogMap.has(id))return;selected.has(id)?selected.delete(id):selected.add(id);initialIds=ids();initialResolved=true;save();emit();focusId=null;render();(dialog.querySelector('[data-library-toggle="'+id+'"]') || el('player-library-search')).focus();}
    if(preview){const id=preview.dataset.libraryProfile;if(onPreview){dialog.close();onPreview(catalogMap.get(id));}else location.href='/players?player='+encodeURIComponent(id);}
  };
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
  window.addEventListener('storage',async event=>{if(event.key!==CUSTOM_PLAYERS_KEY&&event.key!==null)return;try{await replaceIds(readCustomIds(storage),{persist:false});}catch{el('custom-player-summary').textContent='其他标签的球员选择暂未载入；请打开添加球员重试。';}});
  summary();
  return {ids,profiles,open,ensureCatalog,replaceIds,catalog:()=>catalog,get:id=>catalogMap.get(id),has:id=>selected.has(id),isDefault:id=>fixedIds.has(id),add:async id=>replaceIds([...ids(),id]),remove:async id=>replaceIds(ids().filter(value=>value!==id)),initialize:()=>initialIds.length?replaceIds(initialIds,{persist:false}):Promise.resolve([]),close:()=>dialog.close()};
}
