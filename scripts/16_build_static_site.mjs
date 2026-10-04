// Build the public-only app for any static host, including GitHub Pages /repo/ paths.
// Run: node scripts/16_build_static_site.mjs [--out dist-preview]
import { readFile, writeFile, mkdir, readdir, lstat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const STATIC_FILES = Object.freeze([
  ['app/index.html', 'index.html'],
  ['app/players.html', 'players.html'],
  ['app/guess.html', 'guess.html'],
  ['app/style.css', 'style.css'],
  ['app/layout.css', 'layout.css'],
  ['app/players.css', 'players.css'],
  ['app/guess.css', 'guess.css'],
  ['app/onboarding.css', 'onboarding.css'],
  ['app/welcome.css', 'welcome.css'],
  ['app/onboarding.mjs', 'onboarding.mjs'],
  ['app/themes.css', 'themes.css'],
  ['app/themes.mjs', 'themes.mjs'],
  ['app/modules.css', 'modules.css'],
  ['app/modules.mjs', 'modules.mjs'],
  ['app/score-charts.mjs', 'score-charts.mjs'],
  ['app/ui.mjs', 'ui.mjs'],
  ['app/model.mjs', 'model.mjs'],
  ['app/players.mjs', 'players.mjs'],
  ['app/guess.mjs', 'guess.mjs'],
  ['app/guess-engine.mjs', 'guess-engine.mjs'],
  ['app/player-search.mjs', 'player-search.mjs'],
  ['app/data/experts.json', 'data/experts.json'],
  ['app/data/player-directory.json', 'data/player-directory.json'],
  ['app/data/guess-players.json', 'data/guess-players.json'],
  ['data/processed/goat_model_v0_2_web.json', 'data/players.json'],
  ['THIRD_PARTY_NOTICES.txt', 'THIRD_PARTY_NOTICES.txt'],
  ['licenses/GONZALO_MIT.txt', 'licenses/GONZALO_MIT.txt'],
  ['licenses/BRESCOU_MIT.txt', 'licenses/BRESCOU_MIT.txt'],
  ['licenses/FIVETHIRTYEIGHT_CC_BY_4.0.txt', 'licenses/FIVETHIRTYEIGHT_CC_BY_4.0.txt'],
].map(entry => Object.freeze(entry)));

const ROUTES = new Map([
  ['/', './index.html'], ['/players', './players.html'], ['/players/', './players.html'],
  ['/guess', './guess.html'], ['/guess/', './guess.html'],
  ...STATIC_FILES.map(([, destination]) => ['/' + destination, './' + destination]),
]);
const rootUrlContext = /((?:\b(?:href|src|action)\s*=\s*|\bfetch\s*\(\s*|\bnew\s+URL\s*\(\s*|\bfrom\s+|\bimport\s*(?:\(\s*)?))(["'`])(\/(?!\/)[^"'`\s<>]*)/g;

export function relativeRoute(value, filename = 'asset') {
  const split = value.search(/[?#]/);
  const route = split < 0 ? value : value.slice(0, split);
  const suffix = split < 0 ? '' : value.slice(split);
  if (!ROUTES.has(route)) throw new Error(`${filename}: unrecognized root-relative URL ${route}`);
  return ROUTES.get(route) + suffix;
}

export function transformAsset(source, filename) {
  // Handles HTML attributes, fetch strings, .href assignments, and links inside JS templates.
  // Only the known local URL map is changed. HTTPS URLs, imports and data: SVGs stay intact.
  const result = source.replace(rootUrlContext, (_, context, quote, value) => context + quote + relativeRoute(value, filename));
  assertPortable(result, filename);
  return result;
}

export function assertPortable(source, filename = 'asset') {
  const checks = [
    new RegExp(rootUrlContext.source),
    /\b(?:href|src|action)\s*=\s*\/(?!\/)/i,
    /\burl\(\s*["']?\/(?!\/)/i,
  ];
  if (checks.some(pattern => pattern.test(source))) {
    throw new Error(`${filename}: unresolved root-relative URL; add an explicit mapping before publishing`);
  }
}

export function auditPublicJson(source, filename) {
  const value = JSON.parse(source);
  const visit = (item, pointer) => {
    if (typeof item === 'string') {
      // Report the field, not its potentially sensitive contents. Relative source citations are allowed.
      if (/(?:^|[\s"'=])(?:[A-Za-z]:[\\/]|file:\/\/\/|\\\\[^\\])|\/(?:Users|home|mnt|tmp)\//i.test(item)) {
        throw new Error(`${filename}: possible local filesystem path at ${pointer}; review before publishing`);
      }
    } else if (Array.isArray(item)) item.forEach((entry, index) => visit(entry, `${pointer}[${index}]`));
    else if (item && typeof item === 'object') Object.entries(item).forEach(([key, entry]) => visit(entry, `${pointer}.${key}`));
  };
  visit(value, '$');
  return value;
}

async function statOrNull(target) {
  try { return await lstat(target); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

export function resolveOutput(projectRoot, requested = 'dist') {
  const root = path.resolve(projectRoot);
  const output = path.resolve(root, requested);
  const relative = path.relative(root, output);
  // Only a dedicated, direct-child dist or dist-* directory may receive generated files.
  if (!/^dist(?:-[a-z0-9_-]+)?$/i.test(relative)) {
    throw new Error('Output must be a direct child named dist or dist-* inside this project');
  }
  return output;
}

async function validateExistingOutput(output) {
  const allowed = new Set([...STATIC_FILES.map(([, destination]) => destination), '.nojekyll']);
  const stat = await statOrNull(output);
  if (!stat) return;
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('Output must be a real directory, not a symlink or file');
  const visit = async (directory, prefix = '') => {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      const relative = prefix + entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Refusing symbolic link in output: ${relative}`);
      if (entry.isDirectory() && ['data', 'licenses'].includes(relative)) await visit(path.join(directory, entry.name), relative + '/');
      else if (!entry.isFile() || !allowed.has(relative)) {
        throw new Error(`Output contains a non-public or unexpected file: ${relative}. Choose a new dist-* directory; nothing was deleted.`);
      }
    }
  };
  await visit(output);
}

export async function buildStaticSite({projectRoot = PROJECT_ROOT, out = 'dist'} = {}) {
  const root = await realpath(projectRoot);
  const output = resolveOutput(root, out);
  await validateExistingOutput(output);
  // Validate every input before writing anything. The source tree is never edited.
  const files = [];
  for (const [source, destination] of STATIC_FILES) {
    const inputPath = path.join(root, source);
    const inputReal = await realpath(inputPath);
    const relative = path.relative(root, inputReal);
    if (relative.startsWith('..' + path.sep) || relative === '..' || path.isAbsolute(relative)) {
      throw new Error(`${source}: input resolves outside the project`);
    }
    const original = await readFile(inputPath, 'utf8');
    const content = destination.endsWith('.json')
      ? (auditPublicJson(original, source), original)
      : /\.(?:html|mjs|css)$/.test(destination) ? transformAsset(original, source) : original;
    files.push({destination, content});
  }
  files.push({destination: '.nojekyll', content: ''});
  for (const file of files) {
    await mkdir(path.dirname(path.join(output, file.destination)), {recursive: true});
    await writeFile(path.join(output, file.destination), file.content, 'utf8');
  }
  return {
    output,
    fileCount: files.length,
    bytes: files.reduce((total, file) => total + Buffer.byteLength(file.content), 0),
    files: files.map(file => file.destination),
  };
}

async function main(args) {
  let out = 'dist';
  if (args.length) {
    if (args.length !== 2 || args[0] !== '--out' || !args[1]) {
      throw new Error('Usage: node scripts/16_build_static_site.mjs [--out dist-preview]');
    }
    out = args[1];
  }
  const result = await buildStaticSite({out});
  console.log(`Static site ready: ${result.output}`);
  console.log(`${result.fileCount} public files; ${result.bytes.toLocaleString('en-US')} bytes. No raw data, caches, tests, or screenshots included.`);
  console.log('Entry pages: index.html / players.html / guess.html. Relative URLs support both / and /repository/ hosting.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
