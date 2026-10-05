// node --test app/tests/static-build.test.mjs
// Set GOAT_STATIC_BROWSER=1 to additionally exercise the /repository/ build in Playwright.
import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, mkdtemp, cp, rm, readdir, symlink, lstat} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {PROJECT_ROOT, STATIC_FILES, buildStaticSite, transformAsset, versionAssetUrls, assertPortable, auditPublicJson, resolveOutput} from '../../scripts/16_build_static_site.mjs';

let fixture, result;
before(async () => {
  fixture = await mkdtemp(path.join(os.tmpdir(), 'true-goat-static-test-'));
  for (const [source] of STATIC_FILES) {
    const destination = path.join(fixture, source);
    await mkdir(path.dirname(destination), {recursive: true});
    await cp(path.join(PROJECT_ROOT, source), destination);
  }
  result = await buildStaticSite({projectRoot: fixture});
});
after(async () => {
  if (!fixture) return;
  const expectedPrefix = path.join(path.resolve(os.tmpdir()), 'true-goat-static-test-');
  assert.ok(path.resolve(fixture).startsWith(expectedPrefix));
  assert.equal((await lstat(fixture)).isSymbolicLink(), false);
  // Only this test's freshly created temporary directory is removed.
  await rm(fixture, {recursive: true, force: true});
});

async function fileList(directory, prefix = '') {
  const files = [];
  for (const item of await readdir(directory, {withFileTypes: true})) {
    if (item.isDirectory()) files.push(...await fileList(path.join(directory, item.name), prefix + item.name + '/'));
    else files.push(prefix + item.name);
  }
  return files.sort();
}

test('strict public manifest includes guides and player-library assets, excludes all raw data, caches and tests', async () => {
  assert.equal(result.fileCount, STATIC_FILES.length + 1);
  for (const asset of ['onboarding.mjs', 'onboarding.css', 'welcome.css', 'player-library.mjs', 'player-library.css', 'data/player-catalog.json']) assert.ok(result.files.includes(asset));
  assert.deepEqual(await fileList(result.output), [...STATIC_FILES.map(([, target]) => target), '.nojekyll'].sort());
  assert.ok(result.bytes > 1_000_000);
  assert.ok(!result.files.some(file => /(?:raw|cache|test|\.png|\.xlsx|\.csv)/.test(file)));
});

test('build does not change sources; public JSON and license files remain byte-equivalent', async () => {
  for (const [source, target] of STATIC_FILES) {
    const original = await readFile(path.join(PROJECT_ROOT, source));
    assert.deepEqual(await readFile(path.join(fixture, source)), original, source);
    if (/\.(json|txt)$/.test(target)) assert.deepEqual(await readFile(path.join(result.output, target)), original, target);
  }
});

test('navigation, fetch calls and dynamic profile links become portable relative URLs', async () => {
  const index = await readFile(path.join(result.output, 'index.html'), 'utf8');
  assert.match(index, /href="\.\/index\.html"/);
  assert.match(index, /href="\.\/players\.html"/);
  assert.match(index, /href="\.\/guess\.html"/);
  assert.match(index, /src="\.\/ui\.mjs\?v=[a-f0-9]{12}"/);
  for (const filename of ['ui.mjs', 'players.mjs', 'guess.mjs']) {
    const content = await readFile(path.join(result.output, filename), 'utf8');
    assertPortable(content, filename);
    assert.match(content, /fetch\('\.\/data\//);
  }
  const ui = await readFile(path.join(result.output, 'ui.mjs'), 'utf8');
  assert.match(ui, /\.href='\.\/players\.html\?player='/);
  assert.match(ui, /href="\.\/players\.html\?player=/);
  const directory = await readFile(path.join(result.output, 'players.mjs'), 'utf8');
  assert.match(directory, /href="\.\/index\.html\?player=/);
  const guessing = await readFile(path.join(result.output, 'guess.mjs'), 'utf8');
  assert.match(guessing, /href="\.\/players\.html\?player=/);
  const library = await readFile(path.join(result.output, 'player-library.mjs'), 'utf8');
  assertPortable(library,'player-library.mjs');
  assert.match(library, /fetch\('\.\/data\/player-catalog\.json\?v=[a-f0-9]{12}'\)/);
  assert.match(library, /location\.href='\.\/players\.html\?player='/);
  assert.match(index, /href="\.\/player-library\.css\?v=[a-f0-9]{12}"/);
});

test('release key versions nested imports, data and styles without changing navigation or external URLs', async () => {
  const source = `import './model.mjs'; fetch('./data/players.json?x=1#note'); <a href="./guess.html"> <script src="https://example.com/ui.mjs">`;
  assert.equal(versionAssetUrls(source,'abc123'), `import './model.mjs?v=abc123'; fetch('./data/players.json?x=1&v=abc123#note'); <a href="./guess.html"> <script src="https://example.com/ui.mjs">`);
  const html = await readFile(path.join(result.output,'guess.html'),'utf8');
  const script = await readFile(path.join(result.output,'guess.mjs'),'utf8');
  assert.ok(html.includes(`name="true-goat-release" content="${result.release}"`));
  for (const asset of ['guess-engine.mjs','player-search.mjs','data/guess-players.json']) assert.ok(script.includes(`./${asset}?v=${result.release}`));
});

test('changing only a dataset invalidates the entry scripts and all their dependencies', async () => {
  const target = path.join(fixture,'app/data/experts.json');
  const original = await readFile(target,'utf8');
  try {
    await writeFile(target,original + '\n');
    const changed = await buildStaticSite({projectRoot:fixture,out:'dist-version-test'});
    assert.notEqual(changed.release,result.release);
    const html = await readFile(path.join(changed.output,'guess.html'),'utf8');
    assert.ok(html.includes(`./guess.mjs?v=${changed.release}`));
    assert.ok(!html.includes(`?v=${result.release}`));
  } finally { await writeFile(target,original); }
});

test('external links, data SVG, relative imports, query strings and hash fragments survive unchanged', () => {
  const original = `<a href="https://example.com/a">x</a><link href="data:image/svg+xml,%3Csvg fill='green'/%3E"><script src="./model.mjs"></script>`;
  assert.equal(transformAsset(original, 'sample.html'), original);
  assert.equal(transformAsset(`fetch('/data/players.json?rev=2#test')`, 'sample.mjs'), `fetch('./data/players.json?rev=2#test')`);
  assert.equal(transformAsset(`<a href="/players?player=jordami01#stats">`, 'sample.html'), `<a href="./players.html?player=jordami01#stats">`);
  assert.equal(transformAsset(`import './model.mjs';`, 'sample.mjs'), `import './model.mjs';`);
});

test('unmapped root URLs, unquoted attributes and CSS root URLs fail closed', () => {
  assert.throws(() => transformAsset(`fetch('/private/source.json')`, 'bad.mjs'), /unrecognized/);
  assert.throws(() => transformAsset(`<a href=/players>`, 'bad.html'), /unresolved/);
  assert.throws(() => transformAsset(`body {background:url(/secret.png)}`, 'bad.css'), /unresolved/);
  assert.throws(() => assertPortable(`fetch('/data/players.json')`), /unresolved/);
});

test('JSON privacy preflight rejects local machine paths and malformed JSON', () => {
  for (const local of ['C:\\Users\\private\\file.json', 'D:/private/raw.csv', '/home/private/file.json', 'file:///tmp/private.txt', '\\\\server\\share\\file']) {
    assert.throws(() => auditPublicJson(JSON.stringify({sources: [{local}]}), 'fixture.json'), /possible local filesystem path.*sources\[0\]\.local/);
  }
  assert.throws(() => auditPublicJson('{bad', 'fixture.json'), SyntaxError);
  assert.deepEqual(auditPublicJson('{"source":"data/raw/public.csv","url":"https://example.com/data"}', 'okay.json'), {source:'data/raw/public.csv',url:'https://example.com/data'});
});

test('output paths are confined to dedicated dist directories inside the project', () => {
  assert.equal(resolveOutput(fixture), path.join(fixture, 'dist'));
  assert.equal(resolveOutput(fixture, 'dist-preview'), path.join(fixture, 'dist-preview'));
  for (const out of ['.', '..', '../dist', 'app', 'data', 'scripts', 'dist/other', os.tmpdir()]) {
    assert.throws(() => resolveOutput(fixture, out), /Output must/);
  }
});

test('repeat builds are deterministic and never delete an unexpected existing file', async () => {
  assert.deepEqual(await buildStaticSite({projectRoot:fixture}), result);
  const privateFile = path.join(result.output, 'private-notes.txt');
  await writeFile(privateFile, 'must stay untouched');
  await assert.rejects(buildStaticSite({projectRoot:fixture}), /non-public or unexpected file/);
  assert.equal(await readFile(privateFile, 'utf8'), 'must stay untouched');
  await rm(privateFile);
});

test('unsafe input fails preflight before creating a publication directory', async () => {
  const jsonFile = path.join(fixture, 'app/data/experts.json');
  const previous = await readFile(jsonFile);
  try {
    await writeFile(jsonFile, '{"local":"C:/Users/private/secret"}');
    await assert.rejects(buildStaticSite({projectRoot:fixture, out:'dist-invalid'}), /possible local filesystem path/);
    await assert.rejects(lstat(path.join(fixture, 'dist-invalid')), {code:'ENOENT'});
  } finally { await writeFile(jsonFile, previous); }
});

test('symlinked publication directories are refused', async () => {
  const target = path.join(fixture, 'dist-target');
  const link = path.join(fixture, 'dist-link');
  await mkdir(target);
  await symlink(target, link, process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(buildStaticSite({projectRoot:fixture, out:'dist-link'}), /symlink/);
});

test('all three pages and interactions work below a GitHub Pages style /repository/ prefix', {skip:process.env.GOAT_STATIC_BROWSER !== '1'}, async () => {
  const {chromium} = await import(process.env.GOAT_PLAYWRIGHT_MODULE || 'playwright');
  const browser = await chromium.launch({headless:true, ...(process.env.GOAT_BROWSER_EXECUTABLE ? {executablePath:process.env.GOAT_BROWSER_EXECUTABLE} : {})});
  const requests = [], errors = [];
  const prefix = '/true-goat/';
  const allowed = new Set(result.files);
  const types = {'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8'};
  const server = http.createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    // Simulate a host with obsolete unversioned assets: only this release's
    // scripts, styles and data may load. This includes nested module imports.
    if (/\.(mjs|css|json)$/.test(pathname) && new URL(request.url,'http://localhost').searchParams.get('v') !== result.release) {
      response.writeHead(409); response.end('Unversioned or stale asset'); return;
    }
    requests.push(pathname);
    const file = pathname.startsWith(prefix) ? pathname.slice(prefix.length) || 'index.html' : '';
    if (!allowed.has(file)) {response.writeHead(404);response.end();return;}
    response.writeHead(200, {'Content-Type':types[path.extname(file)] || 'text/plain'});
    response.end(await readFile(path.join(result.output, file)));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}${prefix}`;
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
    await page.goto(base);
    await page.locator('#workspace').waitFor({state:'visible'});
    await page.locator('#onboarding-dialog[open] [data-guide-skip]').first().click();
    assert.equal(await page.locator('[data-coefficient]').count(), 7);
    await page.locator('#target-select').selectOption('jordami01');
    assert.equal(await page.locator('#target-profile-link').getAttribute('href'), './players.html?player=jordami01');
    await page.locator('#open-model').click();
    assert.equal(await page.locator('#dialog-body a[href^="./players.html?player="]').count(), 1);
    await page.keyboard.press('Escape');
    await page.locator('#target-profile-link').click();
    await page.locator('#player-dialog[open]').waitFor();
    assert.equal(await page.locator('#directory-total').textContent(), '300');
    await page.locator('#player-dialog a.button').click();
    await page.locator('#workspace').waitFor({state:'visible'});
    assert.equal(await page.locator('#target-select').inputValue(), 'jordami01');
    await page.locator('.page-nav a[href="./guess.html"]').click();
    await page.locator('#guess-app').waitFor({state:'visible'});
    await page.locator('#onboarding-dialog[open] [data-guide-skip]').first().click();
    assert.equal(await page.locator('[data-pool-card]').count(),7);
    assert.match(await page.locator('#guess-library-summary').innerText(),/6,717/);
    for (const [pool,count] of Object.entries({'nba-easy':152,'nba-active':620,'nba-history':5105,'cba-easy':47,'cba-active':328,'cba-history':1487,global:6717})) {
      await page.locator(`[data-pool-card="${pool}"]`).click();
      assert.equal(await page.locator('#guess-pool').inputValue(),pool);
      assert.equal(await page.locator('[data-pool-card][aria-pressed="true"]').count(),1);
      assert.ok((await page.locator('#guess-pool-count').innerText()).includes(String(count)));
    }
    await page.locator('#guess-pool').selectOption('nba-active');
    assert.equal(await page.locator('[data-pool-card="nba-active"]').getAttribute('aria-pressed'),'true');
    await page.locator('#guess-search').fill('哈登');
    const candidate = page.locator('.guess-option').first();
    assert.match(await candidate.innerText(), /Harden/);
    await candidate.click();
    assert.equal(await page.locator('#guess-attempts').textContent(), '1');
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.goto(base+'guess.html?pool=nba-history');
    await page.locator('#guess-app').waitFor({state:'visible'});
    assert.equal(await page.locator('#guess-pool').inputValue(),'nba-history');
    // Add only after the unchanged default-300 checks above. Exercise actual
    // emitted URLs, the lazy catalog, explicit deep-link preview and shared IDs.
    await page.setViewportSize({width:1440,height:1000});
    await page.goto(base);
    await page.locator('#workspace').waitFor({state:'visible'});
    assert.equal(await page.locator('#target-select option').count(),300);
    const originalLeaderScore=await page.locator('#rank-rows .numeric').first().innerText();
    assert.ok(!requests.includes(prefix+'data/player-catalog.json'),'catalog must remain lazy before picker use');
    await page.click('#open-player-library');
    await page.fill('#player-library-search','Alaa Abdelnaby');
    await page.locator('[data-library-profile="abdelal01"]').click();
    await page.locator('#player-dialog[open]').waitFor();
    assert.ok(page.url().includes(prefix+'players.html?player=abdelal01'));
    assert.equal(await page.locator('#directory-total').innerText(),'300');
    assert.match(await page.locator('#player-dialog-body').innerText(),/尚未加入/);
    await page.click('#add-profile-player');
    assert.equal(await page.locator('#directory-total').innerText(),'301');
    await page.locator('#player-dialog a.button').click();
    await page.locator('#workspace').waitFor({state:'visible'});
    assert.equal(await page.locator('#target-select').inputValue(),'abdelal01');
    assert.equal(await page.locator('#target-select option').count(),301);
    assert.equal(await page.locator('#rank-rows .numeric').first().innerText(),originalLeaderScore);
    assert.match(await page.locator('#target-data-note').innerText(),/用户添加/);
    const sharedState=await page.evaluate(()=>JSON.parse(localStorage.getItem('true-goat-v04')));
    assert.deepEqual(sharedState.customPlayerIds,['abdelal01']);
    await page.goto(base+'#model='+encodeURIComponent(JSON.stringify(sharedState)));
    await page.locator('#workspace').waitFor({state:'visible'});
    assert.equal(await page.locator('#target-select').inputValue(),'abdelal01');
    await page.setViewportSize({width:390,height:844});
    await page.click('#open-player-library');
    await page.fill('#player-library-search','Alaa Abdelnaby');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    assert.ok(await page.locator('#player-library-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
    await page.click('[data-library-toggle="abdelal01"]');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#target-select option').count(),300);
    assert.equal(await page.locator('#target-select').inputValue(),'jordami01');
    assert.ok(requests.every(request => request.startsWith(prefix)), JSON.stringify(requests));
    assert.ok(requests.includes(prefix + 'data/players.json'));
    assert.ok(requests.includes(prefix + 'data/player-directory.json'));
    assert.ok(requests.includes(prefix + 'data/guess-players.json'));
    assert.ok(requests.includes(prefix + 'player-library.mjs'));
    assert.ok(requests.includes(prefix + 'player-library.css'));
    assert.ok(requests.includes(prefix + 'data/player-catalog.json'));
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
