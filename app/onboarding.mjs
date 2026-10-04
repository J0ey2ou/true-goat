/** A read-only introduction: demos never invoke the ranking or game engines. */
export const STORAGE_KEY = 'true-goat-onboarding-v2';
const PAGE_SCOPES = ['lab', 'directory', 'guess'];

export function onboardingStorageKey(page = 'lab') {
  if (!PAGE_SCOPES.includes(page)) throw new TypeError('Unknown onboarding page');
  return `${STORAGE_KEY}:${page}`;
}

function browserStorage() {
  try { return globalThis.localStorage; } catch { return undefined; }
}

export function readOnboardingState(storage = browserStorage(), page = 'lab') {
  try {
    const state = JSON.parse(storage?.getItem(onboardingStorageKey(page)) ?? 'null');
    return state?.seen === true && state.version === 2 && state.page === page ? state : null;
  } catch { return null; }
}

export function markOnboardingSeen(reason = 'dismissed', storage = browserStorage(), page = 'lab') {
  const key = onboardingStorageKey(page);
  const state = { version: 2, page, seen: true, reason, seenAt: new Date().toISOString() };
  try { storage?.setItem(key, JSON.stringify(state)); } catch { /* Private browsing may block storage. */ }
  return state;
}

const PAGE_INTROS = {
  lab: {
    label: '排名实验室 / 定义你的伟大', title: '没有标准答案，只有你的标准。',
    description: '从评论员观点出发，独立调整每个系数。你更看重巅峰、荣誉，还是漫长生涯？排名会随之重新计算。',
    takeaway: '这是加性模型，不是百分比分配：调大一项，不会挤掉其他项。', demo: 'model',
  },
  directory: {
    label: '球员库 / 看懂排名背后', title: '先认识球员，再比较伟大。',
    description: '球员库展示 300 位候选人的入选路径、履历、荣誉与数据来源。搜索熟悉的名字，把判断建立在事实之上。',
    takeaway: '入选不等于高排名；不同年份与统计口径，会在档案中说明。', demo: 'directory',
  },
  guess: {
    label: '猜球员 / 换一种方式认识篮球', title: '八次机会，用线索找到他。',
    description: '进入猜球员，选择 NBA、CBA 或全球男子精选池。支持中文、英文和绰号搜索，每次有效提交后都会得到属性反馈。',
    takeaway: '无需账号即可体验。可以限定实际出场赛季与球队；猜测进度保存在当前浏览器。', demo: 'guess',
  },
};

const PAGE_TOURS = {
  lab: {
    page: 'lab', startLabel: '开始调整模型 →',
    ready: '#workspace', label: '排名实验室', primary: '#expert-select',
    steps: [
      { title: '选一个起点，不是选一个答案。', description: '先看看评论员观点。这里的系数是根据其公开排序拟合的解释性近似，并不是评论员亲自公布的评分公式。', target: '#expert-select', targetLabel: '评论员观点选择器', tip: '你可以从一个预设开始，再形成自己的标准。' },
      { title: '拉一个系数，看看谁上升。', description: '七个维度与大众参考系数彼此独立。系数 1 表示该项指数比基准高 10 分时，总分加 1 分；系数不是百分比，不需要凑成 100。', target: '#sliders input[type="range"]', fallback: '#sliders', targetLabel: '独立系数滑杆', tip: '先只改一项，最容易看懂排名为何变化。' },
      { title: '带着一个球星来做实验。', description: '在「让谁更靠前？」中选择你关注的球员，查看哪些系数对他更有利。建议改变评价标准，不修改球员数据，也不保证任何人一定第一。', target: '#target-select', targetLabel: '目标球员选择器', tip: '选择目标后，可对照排名、分差与建议理解模型。' },
      { title: '每一分，都有来处。', description: '顶部「查看我的模型」会展示最终公式、逐项贡献和简明解释。模型分不是百分制，可以高于 100，也可以低于 0。', target: '#open-model', targetLabel: '查看我的模型按钮', tip: '点击后自行打开模型窗口；本导览不会替你更改任何设置。' },
    ],
  },
  directory: {
    page: 'directory', startLabel: '浏览球员档案 →',
    ready: '#directory-content', label: '球员库', primary: '#directory-search',
    steps: [
      { title: '从一个熟悉的名字开始。', description: '输入中文名、英文名或球队，再按位置、主要年代与入选路径筛选。筛选只影响列表，不改变实验室的候选池。', target: '#directory-search', targetLabel: '姓名与球队搜索', tip: '试试乔丹、Curry 或 BOS；也可以随时清除筛选。' },
      { title: '这份名单，不是实力榜。', description: '列表按英文姓名排列，展示生涯赛季、位置、年代与入选路径。荣誉、数据、共识三个入口允许重合，人数不能简单相加。', target: '#directory-list', targetLabel: '球员列表', tip: '浏览列表或翻页，找到想进一步了解的球员。' },
      { title: '打开档案，把结论对照数据。', description: '点击任意球员可以查看履历、统计、荣誉和数据覆盖情况。档案中还可以跳到实验室，为这位球员调整你的评级模型。', target: '#directory-list .dir-player-row', fallback: '#directory-list', targetLabel: '第一条球员档案入口', tip: '本导览只定位入口，不替你打开档案或修改筛选。' },
    ],
  },
  guess: {
    page: 'guess', startLabel: '开始猜球员 →',
    ready: '#guess-app', label: '猜球员', primary: '#guess-pool',
    steps: [
      { title: '先选范围，再选挑战方式。', description: 'NBA、CBA 与全球男子精选池分别出题。每日挑战在北京时间零点更新；自由练习可以换题。名单是精选样本，不是完整联赛名单。', target: '#guess-pool', targetLabel: '球员池选择器', tip: '首次体验推荐 NBA 池，从你熟悉的球员开始。' },
      { title: '赛季与球队，真正限定出题范围。', description: '题目球员必须在所选赛季范围内实际出场；同时指定球队时，还需在相应赛季为该队出场。球队选项随 NBA、CBA 与国际池切换，缺少可核实记录的球员不会进入筛选题池。', target: '#guess-year-from', targetLabel: '出题赛季与球队筛选', tip: '设置好范围后应用筛选，开启符合条件的新一局；搜索候选和答案使用同一个范围。' },
      { title: '中文、英文、绰号，都可以。', description: '在 NBA 池可试着搜索「哈登」或「大胡子」。输入不会扣次数，点击候选或回车提交才算一次有效猜测；重复或无效提交不扣次数。', target: '#guess-search', targetLabel: '猜球员搜索框', tip: '若搜索不到熟悉的名字，检查他是否符合当前生效的赛季和球队范围。' },
      { title: '读懂颜色，也读懂箭头。', description: '绿色表示一致，黄色表示接近或集合重合。↑ 表示答案更大，↓ 表示更小；「未知」表示资料不足或不可比较，不代表 0。', target: '.guess-legend', targetLabel: '线索图例', tip: 'NBA 生涯指标有不同数据截止年，详情见右侧规则与口径。' },
      { title: '逐步缩小范围，八次找到本人。', description: '每次提交后，在猜测记录中比较基本资料与生涯指标。全部属性相同也不等于猜中，最终以球员身份为准。', target: '#guess-history', fallback: '#guess-search', targetLabel: '猜测记录区域', tip: '这里的演示不会消耗机会、改变答案或写入任何猜测。' },
    ],
  },
};

function demoMarkup(kind) {
  if (kind === 'model') return `<div class="tg-guide-demo tg-guide-demo-model" aria-label="加性模型示意：基准 50 分，加巅峰贡献 6 分，加荣誉贡献 4 分，共 60 分。此处不是实际球员评分。"><span class="tg-guide-demo-label">加性计算 · 示意</span><div class="tg-guide-equation" aria-hidden="true"><div><b>50</b><span>基准分</span></div><i>+</i><div class="tg-guide-term"><b>6</b><span>巅峰贡献</span></div><i>+</i><div class="tg-guide-term tg-guide-term-later"><b>4</b><span>荣誉贡献</span></div><i>=</i><div class="tg-guide-sum"><b>60</b><span>模型分</span></div></div><div class="tg-guide-demo-bars" aria-hidden="true"><span>巅峰系数</span><i><b></b></i><span>独立调整</span><span>荣誉系数</span><i><b></b></i><span>保持不变</span></div><p>贡献逐项相加，系数不合计为 100%。</p></div>`;
  if (kind === 'directory') return `<div class="tg-guide-demo tg-guide-demo-directory" aria-label="球员档案结构示意，包括履历、入选路径、数据与来源。"><span class="tg-guide-demo-label">认识你的候选池 · 示意</span><div class="tg-guide-dossier"><div class="tg-guide-avatar" aria-hidden="true">G.</div><div><strong>不止一个名字</strong><span>每一位候选，都有可查看的背景</span></div><span class="tg-guide-dossier-arrow" aria-hidden="true">↗</span></div><div class="tg-guide-file-grid"><div><span>01</span><strong>球员履历</strong><small>年代 · 位置 · 球队</small></div><div><span>02</span><strong>入选路径</strong><small>荣誉 · 数据 · 共识</small></div><div><span>03</span><strong>数据来源</strong><small>覆盖范围 · 统计口径</small></div></div></div>`;
  return `<div class="tg-guide-demo tg-guide-demo-guess" aria-label="虚构线索示意：位置 G 一致，身高 201 厘米接近且答案更高，MVP 次数未知。不会提交猜测。"><span class="tg-guide-demo-label">读懂下一步 · 虚构线索示意</span><div class="tg-guide-clues" aria-hidden="true"><div class="tg-guide-clue-match"><span>位置</span><b>G</b><small>一致</small></div><div class="tg-guide-clue-near"><span>身高</span><b>201 ↑</b><small>答案更高</small></div><div class="tg-guide-clue-unknown"><span>MVP 次数</span><b>—</b><small>未知 ≠ 零</small></div></div><p>演示不会消耗机会，也不会改变本局答案。</p></div>`;
}

function pageConfiguration(document) {
  if (document.body.classList.contains('guess-page')) return PAGE_TOURS.guess;
  if (document.body.classList.contains('player-directory')) return PAGE_TOURS.directory;
  return PAGE_TOURS.lab;
}

function visible(element) {
  return Boolean(element?.isConnected && !element.closest('[hidden]') && element.getClientRects().length);
}

export function initOnboarding(document = globalThis.document) {
  if (!document?.body || document.getElementById('onboarding-dialog')) return;
  const window = document.defaultView;
  const config = pageConfiguration(document);
  const dialog = document.createElement('dialog');
  dialog.id = 'onboarding-dialog';
  dialog.className = 'tg-guide';
  dialog.setAttribute('aria-labelledby', 'tg-guide-title');
  dialog.setAttribute('aria-describedby', 'tg-guide-description');
  dialog.innerHTML = `<div class="tg-guide-top"><span class="tg-guide-brand">TRUE GOAT <i>/ 快速上手</i></span><button type="button" class="tg-guide-close" data-guide-skip aria-label="关闭导览">×</button></div><div id="tg-guide-content"></div><div class="tg-guide-bottom"><div id="tg-guide-progress" class="tg-guide-progress" aria-label="导览进度"></div><div class="tg-guide-actions"><button type="button" class="tg-guide-button tg-guide-back" data-guide-back>上一步</button><button type="button" class="tg-guide-button tg-guide-next" data-guide-next>继续 →</button><button type="button" class="tg-guide-button tg-guide-start" data-guide-start>开始探索 →</button></div></div><div class="tg-guide-foot"><button type="button" data-guide-skip>跳过，直接使用</button><span>随时从页面「动画导览」重看</span></div>`;
  document.body.append(dialog);
  let mode = 'overview';
  let index = 0;
  let opener = null;
  let pendingTarget = null;
  let closeReason = 'dismissed';
  let openedInSession = false;
  let stopWaiting = () => {};
  let removeHighlight = () => {};
  const steps = () => mode === 'overview' ? [PAGE_INTROS[config.page]] : config.steps;
  const $ = selector => dialog.querySelector(selector);
  const otherDialogOpen = () => [...document.querySelectorAll('dialog[open]')].some(item => item !== dialog);

  function render(announce = false) {
    const step = steps()[index];
    const overview = mode === 'overview';
    dialog.dataset.guideMode = mode;
    dialog.dataset.guidePage = config.page;
    dialog.dataset.guideStep = String(index);
    $('#tg-guide-content').innerHTML = `<div class="tg-guide-heading"><span class="tg-guide-kicker">${overview ? step.label : `${config.label} / ${String(index + 1).padStart(2, '0')} 步上手`}</span><h2 id="tg-guide-title" tabindex="-1">${step.title}</h2><p id="tg-guide-description">${step.description}</p></div>${overview ? demoMarkup(step.demo) : `<div class="tg-guide-tour-card"><span class="tg-guide-demo-label">现在去找</span><div><b aria-hidden="true">${String(index + 1).padStart(2, '0')}</b><strong>${step.targetLabel}</strong><span aria-hidden="true">↗</span></div><p>点击「带我试试」后，将定位并高亮实际入口。<br>不会替你操作，也不会更改现有设置。</p></div>`}<p class="tg-guide-takeaway"><span aria-hidden="true">↗</span>${overview ? step.takeaway : step.tip}</p>`;
    $('#tg-guide-progress').innerHTML = steps().map((_, stepIndex) => `<button type="button" data-guide-dot="${stepIndex}" aria-label="查看第 ${stepIndex + 1} 步" ${stepIndex === index ? 'aria-current="step"' : ''}><span></span></button>`).join('') + `<span class="tg-guide-count" aria-live="polite">${index + 1} / ${steps().length}</span>`;
    $('[data-guide-back]').disabled = index === 0;
    $('[data-guide-back]').hidden = overview;
    $('#tg-guide-progress').hidden = overview;
    $('[data-guide-next]').hidden = index === steps().length - 1;
    $('[data-guide-start]').hidden = overview && index !== steps().length - 1;
    $('[data-guide-start]').textContent = overview ? config.startLabel : '带我试试 ↗';
    dialog.scrollTop = 0;
    if (announce) $('#tg-guide-title').focus({ preventScroll: true });
  }

  function locateTarget(selector, fallback) {
    const target = document.querySelector(selector);
    if (visible(target) && !target.disabled) return target;
    const alternate = fallback && document.querySelector(fallback);
    return visible(alternate) && !alternate.disabled ? alternate : null;
  }

  function highlight(target) {
    if (!visible(target)) return;
    removeHighlight();
    const hadTabIndex = target.hasAttribute('tabindex');
    const naturallyFocusable = target.matches('a[href], button, input, select, textarea, [tabindex]');
    if (!naturallyFocusable) target.setAttribute('tabindex', '-1');
    target.classList.add('tg-guide-highlight');
    target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center', inline: 'nearest' });
    target.focus({ preventScroll: true });
    let timer;
    removeHighlight = () => {
      window.clearTimeout(timer);
      target.classList.remove('tg-guide-highlight');
      if (!hadTabIndex && !naturallyFocusable) target.removeAttribute('tabindex');
      removeHighlight = () => {};
    };
    timer = window.setTimeout(removeHighlight, 5000);
  }

  function open(nextMode, trigger) {
    if (otherDialogOpen() || dialog.open || typeof dialog.showModal !== 'function') return;
    mode = nextMode;
    index = 0;
    opener = trigger ?? document.activeElement;
    pendingTarget = null;
    closeReason = 'dismissed';
    render();
    stopWaiting();
    removeHighlight();
    dialog.showModal();
    openedInSession = true;
    $('#tg-guide-title').focus({ preventScroll: true });
  }

  dialog.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-guide-skip')) { closeReason = 'skipped'; dialog.close(); }
    if (button.hasAttribute('data-guide-next')) { index = Math.min(index + 1, steps().length - 1); render(true); }
    if (button.hasAttribute('data-guide-back')) { index = Math.max(index - 1, 0); render(true); }
    if (button.hasAttribute('data-guide-dot')) { index = Number(button.dataset.guideDot); render(true); }
    if (button.hasAttribute('data-guide-start')) {
      const step = steps()[index];
      pendingTarget = mode === 'overview' ? locateTarget(config.primary) : locateTarget(step.target, step.fallback);
      closeReason = mode === 'overview' || index === steps().length - 1 ? 'completed' : 'exploring';
      dialog.close();
    }
  });
  // Native modal dialogs make the page inert, but some browsers briefly send
  // focus to browser chrome/body when Tab wraps. Keep our small control set
  // explicitly cyclic, including when focus starts on the non-tabbable title.
  dialog.addEventListener('keydown', event => {
    if (!dialog.open || event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
    const controls = [...dialog.querySelectorAll('button, a[href], input, select, textarea, [tabindex]')]
      .filter(element => visible(element) && !element.disabled && element.tabIndex >= 0);
    event.preventDefault();
    if (!controls.length) { $('#tg-guide-title').focus({ preventScroll: true }); return; }
    const current = controls.indexOf(document.activeElement);
    const next = current < 0 ? (event.shiftKey ? controls.length - 1 : 0)
      : (current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
    controls[next].focus();
  });
  dialog.addEventListener('cancel', () => { closeReason = 'skipped'; });
  dialog.addEventListener('close', () => {
    markOnboardingSeen(closeReason, browserStorage(), config.page);
    const target = pendingTarget;
    pendingTarget = null;
    if (target) highlight(target);
    else if (visible(opener) && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
  });
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-open-guide], [data-open-tour]');
    if (!trigger) return;
    open(trigger.hasAttribute('data-open-tour') ? 'tour' : 'overview', trigger);
  });

  // Do not intercept shared models / player links or compete with an existing dialog.
  const deepLink = window.location.hash.startsWith('#model') || new URLSearchParams(window.location.search).has('player');
  if (readOnboardingState(browserStorage(), config.page) || deepLink || otherDialogOpen()) return;
  let observer;
  let timeout;
  stopWaiting = () => { observer?.disconnect(); window.clearTimeout(timeout); };
  const tryAutomaticOpen = () => {
    if (openedInSession || readOnboardingState(browserStorage(), config.page) || otherDialogOpen()) { stopWaiting(); return; }
    if (visible(document.querySelector(config.ready))) { stopWaiting(); open('overview', null); }
  };
  observer = new window.MutationObserver(tryAutomaticOpen);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'open'] });
  // If loading fails or is slow, leave the real error/loading state unobstructed.
  timeout = window.setTimeout(stopWaiting, 8000);
  tryAutomaticOpen();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initOnboarding(), { once: true });
  else initOnboarding();
}
