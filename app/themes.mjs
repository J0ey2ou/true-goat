import './feedback.mjs';
// Appearance is independent of model coefficients, player pools and game progress.
export const THEME_STORAGE_KEY = 'true-goat-theme:v1';
export const DEFAULT_THEME = 'aurora';
export const THEMES = Object.freeze([
  Object.freeze({id:'aurora', name:'极光赛场', description:'紫蓝极光 × 电光青', color:'#111b49'}),
  Object.freeze({id:'court', name:'日落球场', description:'热烈橙光 × 深红球场', color:'#351827'}),
  Object.freeze({id:'ocean', name:'碧海之上', description:'明亮湖蓝 × 深海青', color:'#072c45'}),
  Object.freeze({id:'rose', name:'玫瑰霓虹', description:'莓果粉红 × 浓郁紫夜', color:'#381534'}),
  Object.freeze({id:'ivory', name:'奶油晴空', description:'浅色暖白 × 鲜明钴蓝', color:'#f5efe4'}),
  Object.freeze({id:'forest', name:'经典森林', description:'原版深绿 × 青柠点缀', color:'#111411'}),
]);

export function normalizeTheme(value) {
  return THEMES.some(theme => theme.id === value) ? value : DEFAULT_THEME;
}

export function readTheme(storage) {
  try { return normalizeTheme(storage?.getItem(THEME_STORAGE_KEY)); }
  catch { return DEFAULT_THEME; }
}

function browserStorage() {
  try { return globalThis.localStorage; } catch { return undefined; }
}

export function initThemes(doc = globalThis.document, storage = browserStorage()) {
  if (!doc?.querySelector('.topbar') || doc.getElementById('open-theme')) return;
  let active = readTheme(storage);
  const trigger = doc.createElement('button');
  trigger.id = 'open-theme';
  trigger.type = 'button';
  trigger.className = 'theme-trigger button outline';
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-controls', 'theme-dialog');
  trigger.innerHTML = '<i aria-hidden="true"></i><span>皮肤</span>';
  const topbar = doc.querySelector('.topbar');
  let actions = topbar.querySelector('.top-actions');
  if (!actions) {
    actions = doc.createElement('div');
    actions.className = 'top-actions';
    topbar.append(actions);
  }
  actions.append(trigger);
  topbar.classList.add('has-theme-picker');

  const dialog = doc.createElement('dialog');
  dialog.id = 'theme-dialog';
  dialog.className = 'theme-dialog';
  dialog.setAttribute('aria-labelledby', 'theme-dialog-title');
  dialog.setAttribute('aria-describedby', 'theme-dialog-description');
  dialog.innerHTML = `<div class="theme-dialog-head"><div><div class="eyebrow">MAKE IT YOUR COURT</div><h2 id="theme-dialog-title">为你的主场换个颜色。</h2></div><button type="button" class="close-button" data-close-theme aria-label="关闭皮肤选择">×</button></div><p id="theme-dialog-description">即时预览，全站通用。只改变外观，不改变评分或游戏线索的含义。</p><div class="theme-options" role="group" aria-label="选择网站皮肤">${THEMES.map(theme => `<button type="button" class="theme-option" data-theme-option="${theme.id}" aria-pressed="false"><span class="theme-preview" data-preview="${theme.id}" aria-hidden="true"><i></i><b></b><em></em></span><span class="theme-option-info"><strong>${theme.name}</strong><span class="theme-check" aria-hidden="true">✓</span><small>${theme.description}</small></span></button>`).join('')}</div><p id="theme-status" class="theme-status" role="status" aria-live="polite"></p><p class="theme-footnote">偏好仅保存在此浏览器，无需账号；其他设备需另行选择。</p><button type="button" class="button primary theme-done" data-close-theme>就用这个配色 <span aria-hidden="true">✓</span></button>`;
  doc.body.append(dialog);
  const status = dialog.querySelector('#theme-status');

  function apply(value, persist = false) {
    active = normalizeTheme(value);
    const theme = THEMES.find(item => item.id === active);
    doc.documentElement.dataset.theme = active;
    doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.color);
    for (const option of dialog.querySelectorAll('[data-theme-option]')) {
      option.setAttribute('aria-pressed', String(option.dataset.themeOption === active));
    }
    trigger.setAttribute('aria-label', `切换皮肤，当前：${theme.name}`);
    let saved = true;
    if (persist) {
      try {
        if (!storage) saved = false;
        else storage.setItem(THEME_STORAGE_KEY, active);
      } catch { saved = false; }
    }
    status.textContent = `当前：${theme.name}${persist ? saved ? ' · 已保存，三个页面同步生效。' : ' · 浏览器限制了存储，本页仍可正常预览。' : ' · 点击卡片即时切换。'}`;
  }

  trigger.addEventListener('click', () => {
    if (dialog.open) return;
    dialog.showModal();
    dialog.querySelector(`[data-theme-option="${active}"]`).focus({preventScroll:true});
  });
  dialog.addEventListener('click', event => {
    const option = event.target.closest('[data-theme-option]');
    if (option) apply(option.dataset.themeOption, true);
    if (event.target.closest('[data-close-theme]')) dialog.close();
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    }
  });
  dialog.addEventListener('close', () => trigger.focus({preventScroll:true}));
  doc.defaultView?.addEventListener('storage', event => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) apply(readTheme(storage));
  });
  apply(active);
  return {apply, dialog, trigger};
}

if (typeof document !== 'undefined') initThemes();
