import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const routes = {
  '/i18n.mjs': ['i18n.mjs', 'text/javascript; charset=utf-8'],
  '/i18n-en.mjs': ['i18n-en.mjs', 'text/javascript; charset=utf-8'],
  '/opencc-cn2t.mjs': ['opencc-cn2t.mjs', 'text/javascript; charset=utf-8'],
  '/opencc-t2cn.mjs': ['opencc-t2cn.mjs', 'text/javascript; charset=utf-8'],
  '/guess-coach.mjs': ['guess-coach.mjs', 'text/javascript; charset=utf-8'],
  '/i18n.css': ['i18n.css', 'text/css; charset=utf-8'],
  '/licenses/OPENCC_MIT.txt': ['../licenses/OPENCC_MIT.txt', 'text/plain; charset=utf-8'],
  '/licenses/OPENCC_APACHE.txt': ['../licenses/OPENCC_APACHE.txt', 'text/plain; charset=utf-8'],
  '/THIRD_PARTY_NOTICES.txt': ['../THIRD_PARTY_NOTICES.txt', 'text/plain; charset=utf-8'],
  '/licenses/GONZALO_MIT.txt': ['../licenses/GONZALO_MIT.txt', 'text/plain; charset=utf-8'],
  '/licenses/BRESCOU_MIT.txt': ['../licenses/BRESCOU_MIT.txt', 'text/plain; charset=utf-8'],
  '/licenses/FIVETHIRTYEIGHT_CC_BY_4.0.txt': ['../licenses/FIVETHIRTYEIGHT_CC_BY_4.0.txt', 'text/plain; charset=utf-8'],
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
  '/onboarding.css': ['onboarding.css', 'text/css; charset=utf-8'],
  '/welcome.css': ['welcome.css', 'text/css; charset=utf-8'],
  '/onboarding.mjs': ['onboarding.mjs', 'text/javascript; charset=utf-8'],
  '/themes.css': ['themes.css', 'text/css; charset=utf-8'],
  '/themes.mjs': ['themes.mjs', 'text/javascript; charset=utf-8'],
  '/modules.css': ['modules.css', 'text/css; charset=utf-8'],
  '/modules.mjs': ['modules.mjs', 'text/javascript; charset=utf-8'],
  '/score-charts.mjs': ['score-charts.mjs', 'text/javascript; charset=utf-8'],
  '/layout.css': ['layout.css', 'text/css; charset=utf-8'],
  '/players': ['players.html', 'text/html; charset=utf-8'],
  '/players/': ['players.html', 'text/html; charset=utf-8'],
  '/players.css': ['players.css', 'text/css; charset=utf-8'],
  '/players.mjs': ['players.mjs', 'text/javascript; charset=utf-8'],
  '/guess': ['guess.html', 'text/html; charset=utf-8'],
  '/guess/': ['guess.html', 'text/html; charset=utf-8'],
  '/guess.css': ['guess.css', 'text/css; charset=utf-8'],
  '/guess.mjs': ['guess.mjs', 'text/javascript; charset=utf-8'],
  '/guess-engine.mjs': ['guess-engine.mjs', 'text/javascript; charset=utf-8'],
  '/online.mjs': ['online.mjs', 'text/javascript; charset=utf-8'],
  '/online-config.mjs': ['online-config.mjs', 'text/javascript; charset=utf-8'],
  '/online.css': ['online.css', 'text/css; charset=utf-8'],
  '/player-search.mjs': ['player-search.mjs', 'text/javascript; charset=utf-8'],
  '/player-library.mjs': ['player-library.mjs', 'text/javascript; charset=utf-8'],
  '/player-library.css': ['player-library.css', 'text/css; charset=utf-8'],
  '/data/player-catalog.json': ['data/player-catalog.json', 'application/json; charset=utf-8'],
  '/data/guess-players.json': ['data/guess-players.json', 'application/json; charset=utf-8'],
  '/data/guess-extra-metrics.json': ['data/guess-extra-metrics.json', 'application/json; charset=utf-8'],
  '/data/player-directory.json': ['data/player-directory.json', 'application/json; charset=utf-8'],
  '/ui.mjs': ['ui.mjs', 'text/javascript; charset=utf-8'],
  '/model.mjs': ['model.mjs', 'text/javascript; charset=utf-8'],
  '/data/players.json': ['../data/processed/goat_model_v0_2_web.json', 'application/json; charset=utf-8'],
  '/data/experts.json': ['data/experts.json', 'application/json; charset=utf-8'],
};
const server = http.createServer(async (req, res) => {
  let pathname;
  try { pathname = new URL(req.url, 'http://localhost').pathname; }
  catch { res.writeHead(400); res.end('Bad request'); return; }
  const route = Object.hasOwn(routes, pathname) ? routes[pathname] : null;
  if (!route || !['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(404); res.end('Not found'); return;
  }
  try {
    const body = await readFile(path.resolve(root, route[0]));
    res.writeHead(200, {
      'Content-Type': route[1], 'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://qtfmrczwxinizmqgkebh.supabase.co wss://qtfmrczwxinizmqgkebh.supabase.co; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) {
    res.writeHead(503, {'Content-Type': 'text/plain; charset=utf-8'});
    res.end('文件未准备好。请运行 scripts/13_build_expert_presets.py、scripts/14_build_player_directory.py 和 scripts/15_build_guess_players.py 后重试。');
    console.error(error.message);
  }
});
server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
server.listen(Number(process.env.GOAT_PORT || 8765), '127.0.0.1', () => {
  console.log(`True GOAT Lab → http://127.0.0.1:${server.address().port}`);
  console.log('Local only. Ctrl+C to stop. Original datasets are read-only.');
});
