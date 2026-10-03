import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { DIMENSIONS, sanitizeCoefficients, setCoefficient, scorePlayer, rankPlayers, advisePlayer, searchImprovement } from '../model.mjs';

const keys = DIMENSIONS.map(({ key }) => key);
const approximately = (a, b, tolerance = 1e-9) => assert.ok(Math.abs(a - b) <= tolerance, `${a} ≈ ${b}`);
const single = (key, value = 1) => Object.fromEntries(keys.map((entry) => [entry, entry === key ? value : 0]));
const player = (id, values, prior = null) => ({ player_id: id, player_name: id, components: Object.fromEntries(keys.map((key, i) => [`${key}_score`, values[i] ?? null])), rankings: { public_prior_score: prior } });

test('sanitization rejects invalid input, clamps independently, never normalizes, and is immutable', () => {
  const original = { regular_season: 2, peak: 30, longevity: -1, playoffs: NaN, awards: Infinity, defense: '5' };
  const result = sanitizeCoefficients(original);
  assert.equal(result.regular_season, 2);
  assert.equal(result.peak, 10);
  for (const key of ['longevity', 'playoffs', 'awards', 'defense', 'team_success']) assert.equal(result[key], 0);
  assert.equal(original.peak, 30);
  assert.equal(sanitizeCoefficients({ regular_season: 1e308 }).regular_season, 10);
  for (const input of [undefined, null, {}]) assert.deepEqual(sanitizeCoefficients(input), single('nonexistent'));
});

test('changing one coefficient leaves the other six exactly unchanged', () => {
  const initial = sanitizeCoefficients({ regular_season: 3, peak: 2, awards: 1 });
  const result = setCoefficient(initial, 'peak', 7.5);
  assert.equal(result.peak, 7.5);
  for (const key of keys.filter((key) => key !== 'peak')) assert.equal(result[key], initial[key]);
  assert.equal(initial.peak, 2);
  assert.equal(setCoefficient(initial, 'peak', 15).peak, 10);
  assert.equal(setCoefficient(initial, 'peak', -2).peak, 0);
  assert.deepEqual(setCoefficient(initial, 'unknown', 5), initial);
});

test('a coefficient is additive points per 10 component points, without score ceilings', () => {
  const subject = player('A', [80, 70, 60, 90, 100, 75, 65]);
  const baseline = sanitizeCoefficients({ regular_season: 2, peak: 3 });
  const score = scorePlayer(subject, baseline);
  assert.equal(score.score, 62);
  const next = scorePlayer(subject, setCoefficient(baseline, 'regular_season', 2.5));
  approximately(next.score - score.score, 1.5);
  assert.equal(next.contributions.peak, score.contributions.peak);
  const allTen = Object.fromEntries(keys.map((key) => [key, 10]));
  assert.equal(scorePlayer(player('High', Array(7).fill(100)), allTen).score, 400);
  assert.equal(scorePlayer(player('Low', Array(7).fill(0)), allTen).score, -300);
});

test('missing components contribute neutral zero without redistributing coefficients; observed zero is not missing', () => {
  const result = scorePlayer(player('A', [80, null, 0]), { regular_season: 1, peak: 3, longevity: 1 });
  assert.equal(result.dataScore, 48);
  assert.equal(result.contributions.regular_season, 3);
  assert.equal(result.contributions.peak, 0);
  assert.equal(result.contributions.longevity, -5);
  assert.deepEqual(result.imputedDimensions, ['peak']);
  approximately(result.coverage, 0.4);
  assert.equal(scorePlayer(player('A', [80]), single('peak')).score, null);
  assert.equal(scorePlayer(player('Absent', []), single('regular_season')).score, null);
});

test('all-zero coefficients deliberately return the intercept, including entirely missing players', () => {
  for (const subject of [player('A', [90]), player('Absent', [])]) {
    const result = scorePlayer(subject, {});
    assert.equal(result.score, 50);
    assert.equal(result.coverage, 1);
    assert.deepEqual(result.imputedDimensions, []);
  }
  assert.deepEqual(rankPlayers([player('A', [90]), player('B', [])], {}).map(({ rank }) => rank), [1, 1]);
});

test('public prior is an independent additive term, never a blend or data fallback', () => {
  const subject = player('A', [80], 100);
  const before = scorePlayer(subject, single('regular_season'), 0);
  const result = scorePlayer(subject, single('regular_season'), 2);
  assert.equal(result.score, 63);
  assert.equal(result.priorContribution, 10);
  assert.equal(result.contributions.regular_season, before.contributions.regular_season);
  const missing = scorePlayer(player('B', [80]), single('regular_season'), 9);
  assert.equal(missing.score, 53);
  assert.equal(missing.priorMissing, true);
  assert.equal(missing.priorContribution, 0);
  approximately(missing.coverage, 0.1);
  assert.equal(scorePlayer(player('C', [], 70), {}, 2).score, 54);
  assert.equal(scorePlayer(player('D', [], null), {}, 2).score, null);
  assert.equal(scorePlayer(player('E', [80], 0), single('regular_season'), 2).score, 43);
});

test('negative/invalid prior coefficients are sanitized and valid coefficients are capped', () => {
  const subject = player('A', [80], 100);
  for (const gamma of [-1, NaN, Infinity, '2', null]) assert.equal(scorePlayer(subject, single('regular_season'), gamma).score, 53);
  assert.equal(scorePlayer(subject, single('regular_season'), 50).score, 103);
});

test('contributions plus intercept reproduce the score, including negative terms and missing prior', () => {
  for (const prior of [null, 0, 100]) {
    const result = scorePlayer(player('A', [0, 80, null, 10, 100, 60, 50], prior), Object.fromEntries(keys.map((key) => [key, 2])), 3);
    approximately(result.intercept + Object.values(result.contributions).reduce((sum, value) => sum + value, 0) + result.priorContribution, result.score);
  }
});

test('ranking uses stable alphabetical ties, competition ranks, and null scores last', () => {
  const rows = rankPlayers([player('B', [100]), player('A', [100]), player('C', [90]), player('D', [])], single('regular_season'));
  assert.deepEqual(rows.map(({ player_id, rank }) => [player_id, rank]), [['A', 1], ['B', 1], ['C', 3], ['D', null]]);
  assert.deepEqual(rankPlayers([], {}), []);
});

test('each advice changes only one coefficient and matches actual rank and fixed-reference gap', () => {
  const subjects = [player('A', [90, 20, 50, 40, 30, 60, 70], 90), player('B', [30, 90, 60, 50, 50, 60, 70], 80), player('C', [20, 50, 80, 90, 60, 60, 60])];
  const coefficients = sanitizeCoefficients({ regular_season: 2, peak: 1, longevity: 1 });
  const baseline = rankPlayers(subjects, coefficients, 3);
  const oldTarget = baseline.find((row) => row.player_id === 'B');
  const suggestions = advisePlayer(subjects, 'B', coefficients, 3);
  assert.ok(suggestions.length >= 7);
  for (const suggestion of suggestions) {
    approximately(Math.abs(suggestion.change), 0.5);
    for (const key of keys.filter((key) => key !== suggestion.key)) assert.equal(suggestion.coefficients[key], coefficients[key]);
    const next = rankPlayers(subjects, suggestion.coefficients, 3);
    const target = next.find((row) => row.player_id === 'B');
    const beforeRef = baseline.find((row) => row.player_id === suggestion.referenceId);
    const afterRef = next.find((row) => row.player_id === suggestion.referenceId);
    assert.equal(suggestion.rank, target.rank);
    assert.equal(suggestion.rankGain, oldTarget.rank - target.rank);
    approximately(suggestion.gapGain, (target.score - afterRef.score) - (oldTarget.score - beforeRef.score));
  }
  assert.deepEqual(advisePlayer(subjects, 'unknown', coefficients), []);
});

test('finite search is deterministic, honors fixed prior, and returns real additive coefficients', () => {
  const subjects = [player('A', [90, 30, 50, 50, 50, 50, 50], 90), player('B', [30, 100, 50, 50, 50, 50, 50], 80)];
  const coefficients = single('regular_season');
  const result = searchImprovement(subjects, 'B', coefficients, 2);
  assert.equal(result.rank, 1);
  assert.equal(result.improved, true);
  assert.equal(result.isGlobalOptimum, false);
  assert.equal(result.priorCoefficient, 2);
  assert.deepEqual(result, searchImprovement(subjects, 'B', coefficients, 2));
  assert.ok(Object.values(result.coefficients).every((value) => value >= 0 && value <= 10));
  const actual = rankPlayers(subjects, result.coefficients, 2).find((row) => row.player_id === 'B');
  assert.equal(actual.rank, result.rank);
  approximately(actual.score, result.score);
  assert.equal(searchImprovement(subjects, 'unknown', coefficients), null);
});

test('finite search mirrors neutral missing policy and entirely missing null scores', () => {
  const subjects = [player('A', [90, null], 80), player('B', [null, 100], null), player('Missing', [], null)];
  const coefficients = sanitizeCoefficients({ regular_season: 2, peak: 1 });
  const result = searchImprovement(subjects, 'B', coefficients, 2);
  const actual = rankPlayers(subjects, result.coefficients, 2).find((row) => row.player_id === 'B');
  assert.equal(result.rank, actual.rank);
  approximately(result.score, actual.score);
  assert.equal(searchImprovement(subjects, 'Missing', coefficients, 2).rank, null);
});

test('real dataset preserves complete-data balanced baseline and sums all 300 player contributions', async (context) => {
  const dataset = JSON.parse(await readFile(new URL('../../data/processed/goat_model_v0_2_web.json', import.meta.url), 'utf8'));
  const { players, default_user_weights: oldWeights } = dataset;
  const coefficients = Object.fromEntries(keys.map((key) => [key, oldWeights[key] * 10]));
  const ranked = rankPlayers(players, coefficients, 2.5);
  assert.equal(ranked.length, 300);
  for (const row of ranked) {
    assert.ok(Number.isFinite(row.score));
    approximately(row.intercept + Object.values(row.contributions).reduce((a, b) => a + b, 0) + row.priorContribution, row.score);
    if (row.imputedDimensions.length === 0) {
      const previous = keys.reduce((sum, key) => sum + row.components[`${key}_score`] * oldWeights[key], 0);
      approximately(previous, row.dataScore);
    }
  }
  const started = performance.now();
  const suggestions = advisePlayer(players, 'jordami01', coefficients, 2.5);
  const suggestionMs = performance.now() - started;
  const searchStarted = performance.now();
  const result = searchImprovement(players, 'jordami01', coefficients, 2.5);
  const searchMs = performance.now() - searchStarted;
  const target = rankPlayers(players, result.coefficients, 2.5).find((row) => row.player_id === 'jordami01');
  assert.equal(target.rank, result.rank);
  approximately(target.score, result.score);
  assert.ok(suggestions.length > 0);
  context.diagnostic(`300 players: suggestions ${suggestionMs.toFixed(1)} ms; ${result.draws} search draws ${searchMs.toFixed(1)} ms`);
  assert.ok(suggestionMs < 1000);
  assert.ok(searchMs < 1500);
});

test('expert additive presets use the same live scoring formula and preserve published source metadata', async () => {
  const dataset = JSON.parse(await readFile(new URL('../../data/processed/goat_model_v0_2_web.json', import.meta.url), 'utf8'));
  const config = JSON.parse(await readFile(new URL('../data/experts.json', import.meta.url), 'utf8'));
  assert.equal(config.schemaVersion, 4);
  for (const expert of config.experts) {
    assert.ok(expert.source?.url?.startsWith('https://'));
    assert.equal(expert.weights, undefined);
    assert.deepEqual(expert.coefficients, sanitizeCoefficients(expert.coefficients));
    const rows = rankPlayers(dataset.players, expert.coefficients, expert.priorCoefficient);
    for (const sample of expert.fit.rankedPlayers) {
      const actual = rows.find((row) => row.player_id === sample.player_id);
      approximately(actual.score, sample.score, 1e-7);
      assert.equal(actual.rank, sample.allPlayerRank);
    }
  }
});
