import { ENGLISH as BASE_ENGLISH } from './i18n-en.mjs';
import {CUSTOM_ENGLISH} from './i18n-custom-en.mjs';
const ENGLISH={...BASE_ENGLISH,...CUSTOM_ENGLISH};
import { Converter } from './opencc-cn2t.mjs';
import { decoratePlayerIdentity, CHINESE_FIELDS } from './player-localization.mjs';

export const LANGUAGE_KEY = 'true-goat-language:v1';
export const LANGUAGES = Object.freeze(['zh-CN', 'zh-TW', 'en']);
const traditional = Converter({ from: 'cn', to: 'tw' });
const han = /[\u3400-\u9fff]/;
let language = 'zh-CN';
try { const saved = globalThis.localStorage?.getItem(LANGUAGE_KEY); if (LANGUAGES.includes(saved)) language = saved; } catch {}
const names = new Map();
const ambiguousNames = new Set();
const escaped = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const teamFieldPattern=new RegExp(Object.keys(CHINESE_FIELDS).filter(value=>/Hawks|Celtics|Nets|Hornets|Bulls|Cavaliers|Mavericks|Nuggets|Pistons|Warriors|Rockets|Pacers|Clippers|Lakers|Grizzlies|Heat|Bucks|Timberwolves|Pelicans|Knicks|Thunder|Magic|76ers|Suns|Blazers|Kings|Spurs|Raptors|Jazz|Wizards|SuperSonics|Bullets|Nationals|Royals|Braves|Bobcats|Blackhawks/.test(value)).sort((a,b)=>b.length-a.length).map(escaped).join('|'),'g');
const phrases = Object.keys(ENGLISH).sort((a,b) => b.length-a.length);
let phrasePattern = new RegExp(phrases.map(escaped).join('|'), 'g');
let shortNamePattern = null;
const cache = new Map();
export const getLanguage = () => language;
export const translationGaps = () => [...cache].filter(([key,value])=>key.startsWith('en\0')&&han.test(value)&&names.get(key.slice(3))!==value).map(([key])=>key.slice(3));
export function registerNames(players) {
  for (const input of players || []) {
    const player = decoratePlayerIdentity(input);
    const original = player.name || player.player_name;
    if (!original) continue;
    const english = player.englishName || original;
    // Search nicknames are deliberately excluded. Unverified originals are
    // registered too, preventing incidental UI words from corrupting a name.
    for (const label of [original,input.chineseName,input.nameZh,player.chineseName,player.nameZh]) {
      if (typeof label !== 'string' || !han.test(label) || label.length < 2) continue;
      for (const alias of new Set([label,traditional(label)])) {
        const prior = names.get(alias);
        if (prior && !han.test(prior) && !han.test(english) && prior !== english) ambiguousNames.add(alias);
        if (ambiguousNames.has(alias)) names.set(alias,alias);
        else if (!prior || han.test(prior) || !han.test(english)) names.set(alias,english);
      }
    }
  }
  // Two-character names are only translated as whole fields, never as a
  // substring of another player's full name (e.g. 约什·布恩).
  phrasePattern = new RegExp([...new Set([...phrases,...[...names.keys()].filter(name=>name.length>2)])].sort((a,b)=>b.length-a.length).map(escaped).join('|'),'g');
  const shortNames=[...names.keys()].filter(name=>name.length===2);
  shortNamePattern=shortNames.length?new RegExp('(?<![\\p{Script=Han}·•-])(?:'+shortNames.map(escaped).join('|')+')(?![\\p{Script=Han}·•-])','gu'):null;
  cache.clear();
  if (typeof document !== 'undefined') document.dispatchEvent(new Event('goat:translations-ready'));
}
/** UI-only translation. Never changes stored facts, IDs, filter values or user input. */
export function translate(value, locale = language) {
  const source = String(value ?? '');
  const field = CHINESE_FIELDS[source];
  if (locale === 'zh-CN') return field || source.replace(teamFieldPattern,name=>CHINESE_FIELDS[name]);
  if (locale === 'zh-TW') return traditional(field || source.replace(teamFieldPattern,name=>CHINESE_FIELDS[name]));
  if (!han.test(source)) return source;
  const key = locale + '\0' + source;
  if (cache.has(key)) return cache.get(key);
  let result;
  if (locale === 'zh-TW') result = traditional(source);
  else {
    result = names.get(source) ?? source.replace(phrasePattern, phrase => names.get(phrase) ?? ENGLISH[phrase]);
    if(shortNamePattern) result=result.replace(shortNamePattern,name=>names.get(name));
    result=result.replace(/(\d{4})(?:年| years?)(\d{1,2})月(\d{1,2})日(\d{1,2}:\d{2})?/g,(_,y,m,d,time)=>`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}${time?' '+time:''}`)
      .replace(/(\d{1,2})月(\d{1,2})日/g,(match,m,d)=>{const month=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(m)-1];return month?`${month} ${Number(d)}`:match;});
  }
  if (cache.size > 12000) cache.clear();
  cache.set(key, result);
  return result;
}
export const t = translate;

export function initLanguage(doc = globalThis.document) {
  if (!doc?.body || doc.getElementById('language-picker')) return;
  const win = doc.defaultView;
  const records = new WeakMap();
  const attributes = ['aria-label', 'aria-description', 'aria-valuetext', 'title', 'placeholder', 'label', 'data-label', 'alt'];
  const excluded = 'script,style,textarea,[translate="no"],[data-no-translate],#language-dialog';
  function localize(node) {
    if (node.nodeType === 3) {
      if (!node.parentElement || node.parentElement.closest(excluded)) return;
      const current = node.nodeValue, previous = records.get(node);
      const source = previous && current === previous.output ? previous.source : current;
      const output = translate(source);
      records.set(node, { source, output });
      if (current !== output) node.nodeValue = output;
    } else if (node.nodeType === 1 || node.nodeType === 9) {
      if (node.nodeType === 1 && node.matches(excluded)) return;
      if (node.nodeType === 1) {
        let saved = records.get(node);
        if (!saved) { saved = {}; records.set(node, saved); }
        for (const attr of attributes) {
          if (!node.hasAttribute(attr)) continue;
          const current = node.getAttribute(attr), previous = saved[attr];
          const source = previous && current === previous.output ? previous.source : current;
          const output = translate(source); saved[attr] = {source, output};
          if (output !== current) node.setAttribute(attr, output);
        }
      }
      for (const child of node.childNodes) localize(child);
    }
  }
  // Localize newly rendered fragments only; don't rescan the page on each game tick.
  const observer = new win.MutationObserver(mutations => {
    observer.disconnect();
    for (const mutation of mutations) {
      if (mutation.type === 'childList') for (const child of mutation.addedNodes) localize(child);
      else localize(mutation.target);
    }
    observe();
  });
  const observe = () => observer.observe(doc.documentElement, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:attributes});
  const refresh = () => { observer.disconnect(); localize(doc.documentElement); observe(); };
  let actions = doc.querySelector('.top-actions');
  if (!actions) { actions = doc.createElement('div'); actions.className = 'top-actions'; doc.querySelector('.topbar').append(actions); }
  const picker = doc.createElement('label'); picker.className = 'language-control';
  picker.innerHTML = '<span aria-hidden="true">◎</span><select id="language-picker" aria-label="语言 / Language" translate="no"><option value="zh-CN">简体中文</option><option value="zh-TW">繁體中文</option><option value="en">English</option></select>';
  actions.append(picker);
  const select = doc.getElementById('language-picker');
  const dialog = doc.createElement('dialog'); dialog.id = 'language-dialog'; dialog.className = 'language-dialog';
  dialog.setAttribute('aria-labelledby', 'language-title');
  dialog.innerHTML = '<div class="eyebrow">WELCOME TO TRUE GOAT</div><h2 id="language-title">选择语言<br><span lang="en">Choose your language</span></h2><p>選擇你熟悉的語言，開始探索籃球。<br><span lang="en">Make this your court.</span></p><div class="language-choices"><button type="button" data-language="zh-CN" lang="zh-CN"><strong>简体中文</strong><span>进入网站 →</span></button><button type="button" data-language="zh-TW" lang="zh-TW"><strong>繁體中文</strong><span>進入網站 →</span></button><button type="button" data-language="en" lang="en"><strong>English</strong><span>Let’s play →</span></button></div><p class="language-note">随时可在右上角切换 · 隨時可切換<br><span lang="en">You can change this in the top-right corner.</span></p>';
  doc.body.append(dialog);
  function apply(value, persist = true) {
    if (!LANGUAGES.includes(value)) return;
    language = value; doc.documentElement.lang = value; select.value = value;
    if (persist) try { win.localStorage.setItem(LANGUAGE_KEY, value); } catch { /* Selection still works without storage. */ }
    refresh();
    doc.dispatchEvent(new CustomEvent('goat:language-change', {detail:{language:value}}));
  }
  select.addEventListener('change', () => apply(select.value));
  dialog.addEventListener('click', event => {
    const choice = event.target.closest('[data-language]'); if (!choice) return;
    apply(choice.dataset.language); dialog.close();
    doc.dispatchEvent(new Event('goat:language-ready'));
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); apply(language); dialog.close(); doc.dispatchEvent(new Event('goat:language-ready')); });
  win.addEventListener('storage', event => { if(event.key === LANGUAGE_KEY && LANGUAGES.includes(event.newValue)) apply(event.newValue, false); });
  doc.addEventListener('goat:translations-ready', refresh);
  apply(language, false);
  let selected = false; try { selected = LANGUAGES.includes(win.localStorage.getItem(LANGUAGE_KEY)); } catch {}
  if (!selected) dialog.showModal();
  return { apply, refresh, dialog };
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initLanguage(), {once:true});
  else initLanguage();
}
