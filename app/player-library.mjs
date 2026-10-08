import { searchPlayers } from './player-search.mjs';
import { registerNames } from './i18n.mjs';
import { decoratePlayerIdentity } from './player-localization.mjs';
import { mergeGlobalCatalog, validPlayerId, playerCoverage, playerLeagues, leagueLabels, coverageLabels } from './global-catalog.mjs';

export const CUSTOM_PLAYERS_KEY = 'true-goat-custom-players:v1';
const DIMENSION_KEYS = ['regular_season','peak','longevity','playoffs','awards','defense','team_success'];
const PAGE_SIZE=40;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function sanitizeSelectedIds(value, catalogIds, baseIds = new Set()) {
  const items = Array.isArray(value) ? value : [];
  return [...new Set(items.filter(id => validPlayerId(id) && !baseIds.has(id) && (!catalogIds || catalogIds.has(id))))];
}
export function normalizeCatalog(payload) {
  const unique = new Map();
  for (const item of Array.isArray(payload?.players) ? payload.players : []) {
    const profile = decoratePlayerIdentity({...(item.profile || {}),...item});
    const id = profile.id || profile.model?.player_id;
    const name = profile.name || profile.model?.player_name;
    if (!validPlayerId(id) || typeof name !== 'string' || !name.trim() || unique.has(id)) continue;
    const incoming = profile.model || {};
    profile.id = id; profile.name = name;
    profile.teams = Array.isArray(profile.teams) ? profile.teams.map(team=>typeof team==='object'&&team ? {...team,abbreviation:team.abbreviation || team.code} : team) : [];
    profile.leagues=playerLeagues(profile);
    profile.dataCoverage=playerCoverage(profile);
    profile.model = {...incoming,player_id:id,player_name:name,chineseName:profile.chineseName,englishName:profile.englishName,aliases:profile.aliases || [],leagues:profile.leagues,dataCoverage:profile.dataCoverage,position:profile.position || incoming.position || '',era:profile.era || incoming.era || '',components:{...incoming.components,...Object.fromEntries(DIMENSION_KEYS.map(key=>[key+'_score',Number.isFinite(incoming.components?.[key+'_score']) ? incoming.components[key+'_score'] : null]))},rankings:{...(incoming.rankings || {}),public_prior_score:Number.isFinite(incoming.rankings?.public_prior_score) ? incoming.rankings.public_prior_score : null},customPlayer:true};
    profile.customPlayer = true;
    profile.eligibility = {...profile.eligibility,pools:{},custom:true};
    unique.set(id,profile);
  }
  return {players:[...unique.values()],meta:payload?.meta || {},sources:Array.isArray(payload?.sources) ? payload.sources : [],identityRedirects:payload?.identityRedirects||{}};
}
export function readCustomIds(storage) {
  try { const stored = JSON.parse(storage.getItem(CUSTOM_PLAYERS_KEY) || 'null'); return sanitizeSelectedIds(Array.isArray(stored) ? stored : stored?.ids); }
  catch { return []; }
}
export function mergeSelectedPlayers(basePlayers, selectedPlayers, idKey = 'id') {
  registerNames(selectedPlayers);
  const existing = new Set(basePlayers.map(p=>p[idKey]));
  return [...basePlayers,...selectedPlayers.filter(p=>!existing.has(p[idKey]) && (existing.add(p[idKey]),true))];
}

/** All sourced profiles are available by default. Legacy selections become favorites. */
export function createPlayerLibrary({baseIds, onChange = ()=>{}, onPreview, mount = document.getElementById('player-library-mount')}) {
  const fixedIds = new Set(baseIds), selected = new Set();
  let catalog = null, catalogMap = new Map(), loading = null, storage = null, temporary = false, page=1;
  try { storage = window.localStorage; } catch {}
  let initialIds = readCustomIds(storage);
  const bar = document.createElement('section'); bar.className = 'player-library-bar';
  bar.innerHTML = '<div><strong>全球球员 · 全部已收录档案</strong><p id="custom-player-summary">正在载入跨联赛球员档案…</p></div><button id="open-player-library" class="button outline" type="button">浏览全球球员 / 收藏</button>';
  mount?.append(bar);
  const dialog = document.createElement('dialog'); dialog.id='player-library-dialog';dialog.className='player-library-dialog';dialog.setAttribute('aria-labelledby','player-library-title');
  dialog.innerHTML='<div class="library-head"><div><div class="eyebrow">GLOBAL PLAYER LIBRARY</div><h2 id="player-library-title">浏览全球已收录球员</h2></div><button id="close-player-library" class="close-button" type="button" aria-label="关闭球员库">×</button></div><p class="library-intro">已收录档案自动进入球员库与排名实验室。仅有基础档案者可以检索，缺失评分保持未知。当前覆盖 NBA / BAA、CBA 与 EuroLeague 的已核实来源，尚非全球完整名单。</p><label class="library-search-label" for="player-library-search">中文名 / 英文名 / 绰号 / 球队</label><input id="player-library-search" type="search" autocomplete="off" placeholder="搜索全部已收录球员"><div class="library-filters"><label>联赛<select id="library-league"><option value="">全部联赛</option>'+Object.entries(leagueLabels).map(([id,label])=>'<option value="'+id+'">'+label+'</option>').join('')+'</select></label><label>数据覆盖<select id="library-coverage"><option value="">全部数据覆盖</option>'+Object.entries(coverageLabels).map(([id,label])=>'<option value="'+id+'">'+label+'</option>').join('')+'</select></label></div><label class="library-selected-filter"><input id="library-selected-only" type="checkbox">只看我的收藏</label><p id="player-library-status" class="library-status" role="status"></p><div id="player-library-results" class="library-results"></div><div class="library-pagination"><button id="library-prev" class="button outline" type="button">← 上一页</button><span id="library-page" aria-live="polite"></span><button id="library-next" class="button outline" type="button">下一页 →</button></div>';
  document.body.append(dialog);
  const el=id=>document.getElementById(id);
  const ids=()=>[...selected];
  const profiles=()=>catalog?.players.filter(player=>!fixedIds.has(player.id)) || [];
  function summary() { el('custom-player-summary').textContent=(catalog?'已收录 '+catalog.players.length+' 位 · NBA / BAA '+(catalog.meta.leagues?.NBA||0)+' · CBA '+(catalog.meta.leagues?.CBA||0)+' · EuroLeague '+(catalog.meta.leagues?.EuroLeague||0)+'（跨联赛人数可重叠）':'档案尚未载入')+' · 收藏 '+selected.size+' 位。'+(temporary?'浏览器存储不可用，收藏仅本页有效。':'已保存的自选名单继续作为收藏；全部档案均可检索。'); }
  function emit() { summary();const available=profiles();onChange({ids:ids(),profiles:available,models:available.map(p=>p.model),catalog}); }
  function save() { try { if(!storage)throw new Error('unavailable');storage.setItem(CUSTOM_PLAYERS_KEY,JSON.stringify({v:1,ids:ids()}));temporary=false; }catch{temporary=true;} }
  async function ensureCatalog() {
    if(catalog)return catalog;
    if(!loading)loading=(async()=>{
      const responses=await Promise.all([fetch('/data/player-catalog.json'),fetch('/data/global-player-index.json')]);
      for(const response of responses)if(!response.ok)throw new Error('全球球员档案载入失败，请稍后重试（HTTP '+response.status+'）。');
      const [nba,global]=await Promise.all(responses.map(response=>response.json()));
      catalog=normalizeCatalog(mergeGlobalCatalog(nba,global));
      if(!catalog.players.length)throw new Error('球员库没有可用档案。');
      registerNames(catalog.players);catalogMap=new Map(catalog.players.map(p=>[p.id,p]));return catalog;
    })().catch(error=>{catalog=null;throw error;}).finally(()=>{loading=null;});
    return loading;
  }
  function render() {
    summary(); if(!catalog)return;
    const candidates=catalog.players.filter(player=>(!el('library-selected-only').checked||selected.has(player.id))&&(!el('library-league').value||player.leagues.includes(el('library-league').value))&&(!el('library-coverage').value||player.dataCoverage===el('library-coverage').value));
    const matches=searchPlayers(candidates,el('player-library-search').value,{includeTeams:true});
    const pages=Math.max(1,Math.ceil(matches.length/PAGE_SIZE));page=Math.max(1,Math.min(page,pages));
    const visible=matches.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
    el('player-library-status').textContent='匹配 '+matches.length+' 位 · 收藏 '+selected.size+' 位。所有已收录球员都可直接查看与比较；无可用评分数据者不参与得分排名。';
    el('library-page').textContent=page+' / '+pages;el('library-prev').disabled=page===1;el('library-next').disabled=page===pages;
    el('player-library-results').innerHTML=visible.map(p=>{const added=selected.has(p.id);return '<article class="library-player"><div class="library-player-copy"><strong>'+esc(p.chineseName || p.name)+'</strong><span>'+esc(p.chineseName&&p.chineseName!==p.name?p.name:'')+'</span><small>'+esc([p.leagues.map(league=>leagueLabels[league]).join(' / '),p.position,p.firstSeason&&p.lastSeason?p.firstSeason+'–'+p.lastSeason:p.era,coverageLabels[p.dataCoverage]].filter(Boolean).join(' · '))+'</small></div><div class="library-player-actions"><button type="button" class="text-button" data-library-profile="'+esc(p.id)+'">档案与来源 ↗</button><button type="button" class="button '+(added?'outline':'primary')+'" data-library-toggle="'+esc(p.id)+'" aria-pressed="'+added+'" aria-label="'+(added?'取消收藏':'收藏')+' '+esc(p.name)+'">'+(added?'取消收藏':'收藏 ☆')+'</button></div></article>';}).join('') || '<p class="library-empty">没有匹配的已收录档案。试试其他姓名或清除筛选条件。</p>';
  }
  async function replaceIds(values,{persist=true}={}) {
    await ensureCatalog();
    const requested=(Array.isArray(values)?values:[]).map(id=>catalog.identityRedirects[id]||id);
    selected.clear();sanitizeSelectedIds(requested,new Set(catalogMap.keys())).forEach(id=>selected.add(id));
    initialIds=ids();if(persist)save();emit();if(dialog.open)render();return ids();
  }
  async function open({playerId}={}) {
    el('library-selected-only').checked=false;el('library-league').value='';el('library-coverage').value='';page=1;
    if(!dialog.open)dialog.showModal();el('player-library-search').focus();el('player-library-status').textContent='正在载入全球球员档案…';
    try {await ensureCatalog();await replaceIds(initialIds,{persist:false});const id=catalog.identityRedirects[playerId]||playerId;el('player-library-search').value=playerId?(catalogMap.get(id)?.name || playerId):'';render();if(playerId&&!catalogMap.has(id))el('player-library-status').textContent='这个球员不在当前已核实档案中。';}
    catch(error){el('player-library-status').textContent=error.message;el('player-library-results').innerHTML='<p class="library-empty">基础球员仍可使用。关闭后重新打开可重试。</p>';}
  }
  el('open-player-library').onclick=()=>open();el('close-player-library').onclick=()=>dialog.close();
  el('player-library-search').oninput=()=>{page=1;render();};
  for(const id of ['library-selected-only','library-league','library-coverage'])el(id).onchange=()=>{page=1;render();};
  el('library-prev').onclick=()=>{page--;render();};el('library-next').onclick=()=>{page++;render();};
  el('player-library-results').onclick=event=>{
    const toggle=event.target.closest('[data-library-toggle]'),preview=event.target.closest('[data-library-profile]');
    if(toggle){const id=toggle.dataset.libraryToggle;if(!catalogMap.has(id))return;selected.has(id)?selected.delete(id):selected.add(id);initialIds=ids();save();emit();render();(dialog.querySelector('[data-library-toggle="'+CSS.escape(id)+'"]') || el('player-library-search')).focus();}
    if(preview){const id=preview.dataset.libraryProfile;if(onPreview){dialog.close();onPreview(catalogMap.get(id));}else location.href='/players?player='+encodeURIComponent(id);}
  };
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
  window.addEventListener('storage',async event=>{if(event.key!==CUSTOM_PLAYERS_KEY&&event.key!==null)return;try{await replaceIds(readCustomIds(storage),{persist:false});}catch{el('custom-player-summary').textContent='其他标签的收藏暂未载入；请打开球员库重试。';}});
  summary();
  return {ids,profiles,open,ensureCatalog,replaceIds,catalog:()=>catalog,get:id=>catalogMap.get(catalog?.identityRedirects[id]||id),has:id=>catalogMap.has(catalog?.identityRedirects[id]||id)||fixedIds.has(id),isFavorite:id=>selected.has(id),isDefault:id=>fixedIds.has(id),add:async id=>replaceIds([...ids(),id]),remove:async id=>replaceIds(ids().filter(value=>value!==id)),initialize:()=>replaceIds(initialIds,{persist:false}),close:()=>dialog.close()};
}
