import assert from 'node:assert/strict';
import {chromium, browserOptions} from './browser-runtime.mjs';
import {THEMES, THEME_STORAGE_KEY, DEFAULT_THEME} from '../themes.mjs';

const base = new URL(process.env.GOAT_TEST_URL || 'http://127.0.0.1:8766/');
base.pathname = base.pathname.replace(/index\.html$/, '').replace(/\/?$/, '/');
const staticRoutes = process.env.GOAT_TEST_STATIC === '1' || base.pathname !== '/';
const pages = [
  {name:'lab', route:'', ready:'#workspace'},
  {name:'directory', route:staticRoutes ? 'players.html' : 'players', ready:'#directory-content'},
  {name:'guess', route:staticRoutes ? 'guess.html' : 'guess', ready:'#guess-app'},
];
const browser = await chromium.launch(browserOptions);
const context = await browser.newContext({viewport:{width:1440, height:1000}});
await context.addInitScript(() => {
  for (const page of ['lab','directory','guess']) localStorage.setItem(`true-goat-onboarding-v2:${page}`, JSON.stringify({version:2, page, seen:true}));
});
const page = await context.newPage();
page.setDefaultTimeout(12000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
let passed = 0;
async function check(name, action) { await action(); passed++; console.log('PASS ' + name); }
async function ready(definition) {
  await page.goto(new URL(definition.route, base).href);
  await page.locator(definition.ready).waitFor({state:'visible'});
  await page.locator('#open-theme').waitFor({state:'visible'});
}
async function choose(id) {
  if (!await page.locator('#theme-dialog').isVisible()) await page.locator('#open-theme').click();
  await page.locator(`[data-theme-option="${id}"]`).click();
  await page.waitForFunction(() => {
    const color = getComputedStyle(document.documentElement).getPropertyValue('--lime').trim().slice(1);
    const expected = [0,2,4].map(index => parseInt(color.slice(index,index + 2),16)).join(', ');
    return getComputedStyle(document.querySelector('.theme-done')).backgroundColor === `rgb(${expected})`;
  });
}
async function close() { await page.keyboard.press('Escape'); await page.locator('#theme-dialog').waitFor({state:'hidden'}); }
async function applicationSnapshot() {
  return page.evaluate(key => ({
    storage:Object.fromEntries(Object.keys(localStorage).filter(name => name !== key).sort().map(name => [name,localStorage.getItem(name)])),
    scores:document.querySelector('#rank-rows')?.textContent,
    coefficients:[...document.querySelectorAll('[data-coefficient]')].map(input => input.value),
    guesses:document.querySelector('#guess-history')?.textContent,
    pool:document.querySelector('#guess-pool')?.value,
  }), THEME_STORAGE_KEY);
}
async function assertContrast(selectors, minimum = 4.5) {
  const results = await page.evaluate(selectors => {
    const rgb = text => (text.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const luminance = text => rgb(text).map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((total,value,index) => total + value * [.2126,.7152,.0722][index], 0);
    return selectors.flatMap(selector => [...document.querySelectorAll(selector)].filter(node => node.getBoundingClientRect().width).map(node => {
      const foreground = getComputedStyle(node).color;
      let parent = node, background;
      while (parent) {
        background = getComputedStyle(parent).backgroundColor;
        if (!background.startsWith('rgba') && background !== 'transparent') break;
        parent = parent.parentElement;
      }
      const colors = [luminance(foreground), luminance(background)].sort((a,b) => b-a);
      return {selector, text:node.textContent.slice(0,35), ratio:(colors[0]+.05)/(colors[1]+.05)};
    }));
  }, selectors);
  for (const result of results) assert.ok(result.ratio >= minimum, JSON.stringify(result));
}

try {
  await ready(pages[0]);
  await check('first visit uses a vivid default with six selectable skins', async () => {
    assert.equal(await page.locator('html').getAttribute('data-theme'), DEFAULT_THEME);
    assert.equal(await page.locator('[data-theme-option]').count(), 6);
  });
  for (const definition of pages) {
    await ready(definition);
    const snapshot = await applicationSnapshot();
    for (const theme of THEMES) {
      await check(`${definition.name}: ${theme.id} applies real colors and preserves application state`, async () => {
        await choose(theme.id);
        assert.equal(await page.locator('html').getAttribute('data-theme'), theme.id);
        assert.equal(await page.locator('[data-theme-option][aria-pressed="true"]').count(), 1);
        assert.equal(await page.locator(`[data-theme-option="${theme.id}"]`).getAttribute('aria-pressed'), 'true');
        assert.equal(await page.evaluate(key => localStorage.getItem(key), THEME_STORAGE_KEY), theme.id);
        assert.deepEqual(await applicationSnapshot(), snapshot);
        await assertContrast(['#theme-dialog-description', '.theme-option-info strong', '.theme-option-info small', '#theme-status', '.theme-done']);
        await close();
        await assertContrast(['.panel h2', '.hint', '.guess-rules strong', '.guess-metric-notes summary', '#guess-search', '.coef-number', '.dir-filters input']);
      });
    }
    for (const width of [360,390,768,1024,1440]) {
      await check(`${definition.name}: ${width}px header and skin dialog stay aligned`, async () => {
        await page.setViewportSize({width,height:900});
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
        assert.equal(overflow, false, 'page overflow');
        for (const selector of ['.brand','#open-theme', 'nav[aria-label="主导航"]']) {
          const bounds = await page.locator(selector).boundingBox();
          assert.ok(bounds.x >= -1 && bounds.x + bounds.width <= width + 1, selector + ' outside screen');
        }
        await page.locator('#open-theme').click();
        const bounds = await page.locator('#theme-dialog').boundingBox();
        assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width);
        assert.equal(await page.locator('#theme-dialog').evaluate(node => node.scrollWidth > node.clientWidth + 1), false);
        await close();
        assert.equal(await page.locator('#open-theme').evaluate(node => document.activeElement === node), true);
      });
    }
  }
  await check('selection survives reload and navigation across all three pages', async () => {
    await choose('rose'); await close();
    for (const definition of pages) {
      await ready(definition);
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'rose');
    }
    await page.reload();
    await page.locator('#open-theme').waitFor();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'rose');
  });
  await check('another open tab synchronizes preference through the storage event', async () => {
    const other = await context.newPage();
    await other.goto(base.href);
    await other.locator('#open-theme').waitFor();
    await choose('court'); await close();
    await other.waitForFunction(() => document.documentElement.dataset.theme === 'court');
    await other.close();
  });
  await check('guess clue colors and values retain their meaning in light mode', async () => {
    await ready(pages[2]);
    await page.locator('#guess-search').fill('哈登');
    await page.locator('.guess-option[data-id="hardeja01"]').click();
    await page.locator('.guess-cell').first().waitFor();
    const colors = () => page.locator('.guess-cell').evaluateAll(nodes => nodes.map(node => ({text:node.textContent,background:getComputedStyle(node).backgroundColor,border:getComputedStyle(node).borderColor})));
    const before = await colors();
    await choose('ivory'); await close();
    assert.deepEqual(await colors(), before);
    await assertContrast(['.guess-cell .cell-value']);
  });
  await check('light model chart, coefficient inputs and guide remain readable', async () => {
    await ready(pages[0]);
    await page.locator('.score-trigger').first().click();
    await page.locator('#model-dialog').waitFor({state:'visible'});
    assert.equal(await page.locator('.score-radar').count(), 1);
    await assertContrast(['#dialog-body p','.contribution-bar-row b','.score-modal-summary strong']);
    await page.keyboard.press('Escape');
    await page.locator('[data-open-guide]').click();
    await page.locator('#onboarding-dialog').waitFor({state:'visible'});
    await assertContrast(['.tg-guide-heading>p','.tg-guide-equation b','.tg-guide-takeaway','.tg-guide-foot>span','.tg-guide-start']);
    await page.keyboard.press('Escape');
  });
  await check('theme remains usable with denied browser storage', async () => {
    const restricted = await browser.newContext();
    await restricted.addInitScript(() => Object.defineProperty(window,'localStorage',{get() {throw new Error('disabled for test');}}));
    const restrictedPage = await restricted.newPage();
    await restrictedPage.goto(base.href);
    await restrictedPage.locator('#open-theme').waitFor();
    if (await restrictedPage.locator('#onboarding-dialog').isVisible()) await restrictedPage.keyboard.press('Escape');
    await restrictedPage.locator('#open-theme').click();
    await restrictedPage.locator('[data-theme-option="ocean"]').click();
    assert.equal(await restrictedPage.locator('html').getAttribute('data-theme'),'ocean');
    assert.match(await restrictedPage.locator('#theme-status').innerText(), /限制了存储/);
    await restricted.close();
  });
  await check('no runtime or resource errors', async () => assert.deepEqual(errors, []));
  console.log(JSON.stringify({passed},null,2));
} finally { await browser.close(); }
