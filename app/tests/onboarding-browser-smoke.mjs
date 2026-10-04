// Run against the local server, or GOAT_TEST_URL=https://host/true-goat/.
// Uses actual first visits: no onboarding completion flag is pre-seeded.
import assert from 'node:assert/strict';
import {chromium, browserOptions} from './browser-runtime.mjs';

const base = new URL(process.env.GOAT_TEST_URL || 'http://127.0.0.1:8766/');
base.pathname = base.pathname.replace(/index\.html$/, '').replace(/\/?$/, '/');
const staticRoutes = process.env.GOAT_TEST_STATIC === '1' || base.pathname !== '/';
const pages = [
  {name:'lab', route:'', ready:'#workspace'},
  {name:'players', route:staticRoutes ? 'players.html' : 'players', ready:'#directory-content'},
  {name:'guess', route:staticRoutes ? 'guess.html' : 'guess', ready:'#guess-app'},
];
const STORAGE = 'true-goat-onboarding-v1';
const browser = await chromium.launch(browserOptions);
const results = [];
const errors = [];
const urlFor = (definition, suffix = '') => new URL(definition.route + suffix, base).href;
const guide = page => page.locator('#onboarding-dialog');
const control = (page, name) => guide(page).locator(`[data-guide-${name}]`).first();

async function check(name, action) {
  try { await action(); results.push({name, passed:true}); console.log('PASS ' + name); }
  catch (error) { results.push({name, passed:false, error:error.message}); console.error('FAIL ' + name + ': ' + error.message); }
}

async function withPage(action, options = {}, initialize) {
  const context = await browser.newContext({viewport:{width:1440, height:1000}, ...options});
  if (initialize) await context.addInitScript(initialize);
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  try { await action(page, context); } finally { await context.close(); }
}

async function ready(page, definition, suffix = '') {
  await page.goto(urlFor(definition, suffix));
  await page.locator(definition.ready).waitFor({state:'visible'});
}

async function waitForMode(page, mode) {
  await page.locator(`#onboarding-dialog[open][data-guide-mode="${mode}"]`).waitFor({state:'visible'});
}

async function skip(page) {
  await control(page, 'skip').click();
  await guide(page).waitFor({state:'hidden'});
}

async function appSnapshot(page) {
  return page.evaluate(key => ({
    storage:Object.fromEntries(Object.keys(localStorage).filter(name => name !== key).sort().map(name => [name, localStorage.getItem(name)])),
    coefficients:[...document.querySelectorAll('[data-coefficient]')].map(element => [element.id, element.value]),
    prior:document.querySelector('#prior-coef')?.value,
    target:document.querySelector('#target-select')?.value,
    attempts:document.querySelector('#guess-attempts')?.textContent,
    guesses:document.querySelector('#guess-history')?.innerHTML,
    directorySearch:document.querySelector('#directory-search')?.value,
    url:location.href,
  }), STORAGE);
}

async function assertBounded(page, label) {
  const bounds = await page.evaluate(() => {
    const dialog = document.querySelector('#onboarding-dialog');
    const rect = dialog.getBoundingClientRect();
    return {
      bodyOverflow:document.documentElement.scrollWidth > innerWidth + 1,
      dialogOverflow:dialog.scrollWidth > dialog.clientWidth + 1,
      left:rect.left, right:rect.right, top:rect.top, bottom:rect.bottom,
      width:innerWidth, height:innerHeight,
    };
  });
  assert.equal(bounds.bodyOverflow, false, label + ': body overflow');
  assert.equal(bounds.dialogOverflow, false, label + ': dialog overflow');
  assert.ok(bounds.left >= -1 && bounds.right <= bounds.width + 1, label + ': dialog horizontally offscreen');
  assert.ok(bounds.top >= -1 && bounds.bottom <= bounds.height + 1, label + ': dialog vertically offscreen');
}

async function walkTour(page, eachStep = async () => {}) {
  await waitForMode(page, 'tour');
  let steps = 0;
  while (await guide(page).isVisible()) {
    assert.equal(await guide(page).getAttribute('data-guide-mode'), 'tour');
    assert.equal(Number(await guide(page).getAttribute('data-guide-step')), steps);
    await eachStep(steps);
    steps += 1;
    assert.ok(steps <= 10, 'tour must have a bounded number of steps');
    if (await control(page, 'next').isVisible()) await control(page, 'next').click();
    else {
      await control(page, 'start').click();
      await guide(page).waitFor({state:'hidden'});
    }
  }
  assert.ok(steps >= 3, 'page tour has at least three useful steps');
  return steps;
}

try {
  for (const definition of pages) {
    await check(`${definition.name}: actual first visit, navigation, skip, revisit and replay`, () => withPage(async page => {
      await ready(page, definition);
      await waitForMode(page, 'overview');
      assert.equal(await guide(page).getAttribute('data-guide-step'), '0');
      assert.ok((await guide(page).getAttribute('aria-labelledby')) || (await guide(page).getAttribute('aria-label')), 'intro has an accessible name');
      const before = await appSnapshot(page);
      await control(page, 'next').click();
      assert.equal(await guide(page).getAttribute('data-guide-step'), '1');
      await control(page, 'back').click();
      assert.equal(await guide(page).getAttribute('data-guide-step'), '0');
      await guide(page).locator('[data-guide-dot="2"]').click();
      assert.equal(await guide(page).getAttribute('data-guide-step'), '2');
      await guide(page).locator('[data-guide-dot="0"]').click();
      await skip(page);
      await page.waitForFunction(key => Boolean(localStorage.getItem(key)), STORAGE);
      assert.ok(await page.evaluate(key => localStorage.getItem(key), STORAGE), 'skip records only a tutorial preference');
      assert.deepEqual(await appSnapshot(page), before, 'overview does not mutate application state');
      await page.reload();
      await page.locator(definition.ready).waitFor({state:'visible'});
      await page.waitForTimeout(400);
      assert.equal(await guide(page).isVisible(), false, 'return visit stays unobstructed');
      const opener = page.locator('[data-open-guide]').first();
      await opener.click();
      await waitForMode(page, 'overview');
      await page.keyboard.press('Escape');
      await guide(page).waitFor({state:'hidden'});
      await page.waitForFunction(() => document.activeElement?.hasAttribute('data-open-guide'));
      assert.equal(await opener.evaluate(element => document.activeElement === element), true, 'closing returns keyboard focus to opener');
    }));

    await check(`${definition.name}: manual page tour finishes without changing saved state`, () => withPage(async page => {
      await ready(page, definition);
      await waitForMode(page, 'overview');
      await skip(page);
      const before = await appSnapshot(page);
      const opener = page.locator('[data-open-tour]').first();
      await opener.click();
      await walkTour(page);
      assert.deepEqual(await appSnapshot(page), before, 'tour must not change coefficients, guesses, filters or URL');
      await page.waitForFunction(() => document.activeElement?.classList.contains('tg-guide-highlight'));
      assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('tg-guide-highlight')), true, 'tour completion focuses the real highlighted entry');
      await opener.click();
      await waitForMode(page, 'tour');
      await page.keyboard.press('Escape');
      await guide(page).waitFor({state:'hidden'});
      assert.deepEqual(await appSnapshot(page), before, 'early tour exit is also non-mutating');
    }));
  }

  await check('dismissal carries across pages without suppressing manual help', () => withPage(async page => {
    await ready(page, pages[0]);
    await waitForMode(page, 'overview');
    await skip(page);
    await page.waitForFunction(key => Boolean(localStorage.getItem(key)), STORAGE);
    for (const definition of pages.slice(1)) {
      await ready(page, definition);
      await page.waitForTimeout(400);
      assert.equal(await guide(page).isVisible(), false, 'one introduction per browser, not per page');
      await page.locator('[data-open-guide]').first().click();
      await waitForMode(page, 'overview');
      await page.keyboard.press('Escape');
      await guide(page).waitFor({state:'hidden'});
    }
  }));

  await check('overview completion highlights the real entry; keyboard focus stays within modal', () => withPage(async page => {
    await ready(page, pages[0]);
    await waitForMode(page, 'overview');
    const before = await appSnapshot(page);
    for (let index = 0; index < 16; index += 1) {
      await page.keyboard.press(index % 4 === 3 ? 'Shift+Tab' : 'Tab');
      assert.equal(await guide(page).evaluate(dialog => dialog.contains(document.activeElement)), true, 'Tab cannot escape the modal');
    }
    await control(page, 'next').click();
    await control(page, 'next').click();
    assert.equal(await guide(page).getAttribute('data-guide-step'), '2');
    await control(page, 'start').click();
    await guide(page).waitFor({state:'hidden'});
    await page.waitForFunction(() => document.activeElement?.id === 'expert-select' && document.activeElement.classList.contains('tg-guide-highlight'));
    assert.equal(await page.locator('#expert-select').evaluate(element => document.activeElement === element && element.classList.contains('tg-guide-highlight')), true);
    assert.deepEqual(await appSnapshot(page), before, 'complete guided experience is non-mutating');
    await page.reload();
    await page.locator('#workspace').waitFor({state:'visible'});
    await page.waitForTimeout(400);
    assert.equal(await guide(page).isVisible(), false, 'completed guide does not return');
  }));

  await check('first-visit player detail and shared model deep links remain unobstructed', async () => {
    await withPage(async page => {
      await ready(page, pages[1], '?player=jordami01');
      await page.locator('#player-dialog[open]').waitFor({state:'visible'});
      await page.waitForTimeout(400);
      assert.equal(await guide(page).isVisible(), false, 'intro must not cover linked player dossier');
      assert.match(await page.locator('#player-dialog-title').innerText(), /乔丹|Jordan/);
      await page.keyboard.press('Escape');
      await page.locator('#player-dialog').waitFor({state:'hidden'});
      await page.locator('[data-open-guide]').first().click();
      await waitForMode(page, 'overview');
      await skip(page);
    });
    await withPage(async page => {
      await ready(page, pages[0]);
      await waitForMode(page, 'overview');
      await skip(page);
      const model = await page.evaluate(() => JSON.parse(localStorage.getItem('true-goat-v04')));
      model.coefficients.peak = 3.21;
      const fresh = await browser.newContext();
      try {
        const linked = await fresh.newPage();
        linked.on('pageerror', error => errors.push(error.message));
        linked.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        await ready(linked, pages[0], '#model=' + encodeURIComponent(JSON.stringify(model)));
        await linked.waitForTimeout(400);
        assert.equal(await guide(linked).isVisible(), false, 'intro must not cover shared model');
        assert.equal(await linked.locator('#coef-peak').inputValue(), '3.21');
      } finally { await fresh.close(); }
    });
  });

  await check('reduced-motion preference disables guide animation', () => withPage(async page => {
    await ready(page, pages[0]);
    await waitForMode(page, 'overview');
    for (let step = 0; step < 3; step += 1) {
      const animated = await guide(page).evaluate(dialog => dialog.getAnimations({subtree:true}).filter(animation => animation.playState === 'running' && Number(animation.effect?.getTiming().duration) > 0).length);
      assert.equal(animated, 0, 'no running animation under reduced-motion at step ' + step);
      if (step < 2) await control(page, 'next').click();
    }
    await skip(page);
  }, {reducedMotion:'reduce'}));

  await check('blocked localStorage does not prevent guest onboarding or gameplay', () => withPage(async page => {
    await ready(page, pages[2]);
    await waitForMode(page, 'overview');
    await skip(page);
    await page.locator('[data-open-tour]').first().click();
    await walkTour(page);
    assert.equal(await page.locator('#guess-attempts').innerText(), '0');
    await page.locator('#guess-search').fill('哈登');
    assert.match(await page.locator('.guess-option').first().innerText(), /Harden/);
    await page.locator('.guess-option').first().click();
    assert.equal(await page.locator('#guess-attempts').innerText(), '1');
  }, {}, () => {
    for (const method of ['getItem', 'setItem', 'removeItem']) {
      Object.defineProperty(Storage.prototype, method, {configurable:true, value() { throw new DOMException('Storage unavailable for test', 'SecurityError'); }});
    }
  }));

  for (const width of [360, 390, 768, 1024, 1440]) {
    await check(`${width}px: all page intros and all tour steps stay inside the viewport`, async () => {
      for (const definition of pages) {
        await withPage(async page => {
          await ready(page, definition);
          await waitForMode(page, 'overview');
          for (let step = 0; step < 3; step += 1) {
            await assertBounded(page, `${definition.name} overview ${step}`);
            if (step < 2) await control(page, 'next').click();
          }
          await skip(page);
          await page.locator('[data-open-tour]').first().click();
          await walkTour(page, step => assertBounded(page, `${definition.name} tour ${step}`));
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'closing guide leaves page width unchanged');
        }, {viewport:{width, height:900}});
      }
    });
  }

  await check('all contexts have no page errors or console errors', async () => assert.deepEqual(errors, []));
} finally { await browser.close(); }

console.log(JSON.stringify({results, errors}, null, 2));
if (results.some(result => !result.passed) || errors.length) process.exitCode = 1;
