/** Independent additive model. Coefficients never normalize or rebalance. */
export const DIMENSIONS = Object.freeze([
  { key: 'regular_season', label: '常规赛表现', short: '常规赛', description: '职业生涯常规赛的得分、组织、篮板、效率和时代内表现。' },
  { key: 'peak', label: '巅峰统治力', short: '巅峰', description: '最强 1、3、5、7 个赛季的综合表现；更看重最高水平。' },
  { key: 'longevity', label: '生涯长度', short: '长青', description: '出场、时间、精英赛季和累计贡献；更看重长期积累。' },
  { key: 'playoffs', label: '季后赛表现', short: '季后赛', description: '季后赛出场、巅峰、时代内表现、胜场与效率；资料覆盖截至 2024 年。' },
  { key: 'awards', label: '个人荣誉', short: '荣誉', description: 'MVP、FMVP、最佳阵容和其他个人荣誉。' },
  { key: 'defense', label: '防守贡献', short: '防守', description: '防守贡献指标、防守奖项与防守最佳阵容；历史记录覆盖不同。' },
  { key: 'team_success', label: '团队成就', short: '冠军', description: '总冠军与总决赛经历；不是个人能力的直接因果指标。' },
]);

const KEYS = DIMENSIONS.map(({ key }) => key);
const COUNT = KEYS.length;
const TIE_SCALE = 1e9;
const finite = (value) => typeof value === 'number' && Number.isFinite(value);
const clamp = (value, min = 0, max = 10) => finite(value) ? Math.min(max, Math.max(min, value)) : min;
const scoreKey = (value) => finite(value) ? Math.round(value * TIE_SCALE) : null;
const zeroCoefficients = () => Object.fromEntries(KEYS.map((key) => [key, 0]));

/** Each coefficient is independent, within [0, 10]; absent/invalid inputs mean 0. */
export function sanitizeCoefficients(coefficients = {}) {
  return Object.fromEntries(KEYS.map((key) => [key, clamp(coefficients?.[key])]));
}

/** Changing one coefficient leaves all other coefficients exactly unchanged. */
export function setCoefficient(coefficients, key, value) {
  const result = sanitizeCoefficients(coefficients);
  if (KEYS.includes(key)) result[key] = clamp(value);
  return result;
}

function evaluatePlayer(player, coefficients, priorCoefficient) {
  const contributions = zeroCoefficients();
  const imputedDimensions = [];
  let observedMass = 0;
  let activeMass = priorCoefficient;
  for (const key of KEYS) {
    const coefficient = coefficients[key];
    if (coefficient <= 0) continue;
    activeMass += coefficient;
    const value = player?.components?.[`${key}_score`];
    if (!finite(value)) {
      // Neutral component 50 means a centered contribution of 0, not raw score 0.
      imputedDimensions.push(key);
      continue;
    }
    observedMass += coefficient;
    contributions[key] = coefficient * ((value - 50) / 10);
  }
  const priorScore = finite(player?.rankings?.public_prior_score) ? player.rankings.public_prior_score : null;
  const priorMissing = priorScore === null;
  if (!priorMissing) observedMass += priorCoefficient;
  const priorContribution = priorMissing ? 0 : priorCoefficient * ((priorScore - 50) / 10);
  const dataScore = 50 + Object.values(contributions).reduce((sum, value) => sum + value, 0);
  // A deliberate all-zero model is meaningful (everyone tied at intercept).
  const score = activeMass > 0 && observedMass === 0 ? null : dataScore + priorContribution;
  return { score, dataScore, priorScore, priorContribution, contributions, intercept: 50,
    coverage: activeMass > 0 ? observedMass / activeMass : 1,
    imputedDimensions, priorMissing, priorCoefficient };
}

export function scorePlayer(player, coefficients, priorCoefficient = 0) {
  return evaluatePlayer(player, sanitizeCoefficients(coefficients), clamp(priorCoefficient));
}

export function rankPlayers(players = [], coefficients, priorCoefficient = 0) {
  const safe = sanitizeCoefficients(coefficients);
  const gamma = clamp(priorCoefficient);
  const rows = players.map((player) => ({ ...player, ...evaluatePlayer(player, safe, gamma) }));
  rows.sort((a, b) => {
    const aKey = scoreKey(a.score);
    const bKey = scoreKey(b.score);
    if (aKey !== bKey) {
      if (aKey === null) return 1;
      if (bKey === null) return -1;
      return bKey - aKey;
    }
    return String(a.player_name ?? '').localeCompare(String(b.player_name ?? ''), 'en') || String(a.player_id ?? '').localeCompare(String(b.player_id ?? ''), 'en');
  });
  let previousKey = null;
  let previousRank = null;
  return rows.map((row, index) => {
    const key = scoreKey(row.score);
    const rank = key === null ? null : key === previousKey ? previousRank : index + 1;
    previousKey = key;
    previousRank = rank;
    return { ...row, rank };
  });
}

/** Counterfactual +/-0.5 changes to ONE coefficient; the prior stays fixed. */
export function advisePlayer(players, targetId, coefficients, priorCoefficient = 0) {
  const safe = sanitizeCoefficients(coefficients);
  const baseline = rankPlayers(players, safe, priorCoefficient);
  const target = baseline.find((row) => row.player_id === targetId);
  if (!target || target.rank === null) return [];
  const others = baseline.filter((row) => row.player_id !== targetId && row.rank !== null);
  const leader = others[0];
  const previous = [...others].reverse().find((row) => row.rank < target.rank) ?? leader;
  const suggestions = [];
  for (const dimension of DIMENSIONS) {
    for (const direction of [1, -1]) {
      const value = clamp(safe[dimension.key] + direction * 0.5);
      if (Math.abs(value - safe[dimension.key]) < 1e-12) continue;
      const nextCoefficients = setCoefficient(safe, dimension.key, value);
      const next = rankPlayers(players, nextCoefficients, priorCoefficient);
      const nextTarget = next.find((row) => row.player_id === targetId);
      if (nextTarget.rank === null) continue;
      const nextPrevious = previous && next.find((row) => row.player_id === previous.player_id);
      const nextLeader = leader && next.find((row) => row.player_id === leader.player_id);
      const gapGain = previous && finite(nextPrevious?.score) ? (nextTarget.score - nextPrevious.score) - (target.score - previous.score) : 0;
      const leaderGapGain = leader && finite(nextLeader?.score) ? (nextTarget.score - nextLeader.score) - (target.score - leader.score) : 0;
      const rankGain = target.rank - nextTarget.rank;
      const change = value - safe[dimension.key];
      const result = rankGain > 0 ? `上升 ${rankGain} 位` : rankGain < 0 ? `下降 ${-rankGain} 位` : '名次不变';
      suggestions.push({
        key: dimension.key, direction, coefficients: nextCoefficients, rank: nextTarget.rank, rankGain, gapGain, leaderGapGain,
        score: nextTarget.score, from: safe[dimension.key], to: value, change,
        referenceId: previous?.player_id ?? null, referenceName: previous?.player_name ?? null,
        description: `${direction > 0 ? '提高' : '降低'}${dimension.label}系数 ${Math.abs(change).toFixed(2)}，其他系数保持不变：${result}${previous ? `；相对 ${previous.player_name} 的分差${gapGain >= 0 ? '改善' : '恶化'} ${Math.abs(gapGain).toFixed(2)} 分` : ''}。`,
      });
    }
  }
  return suggestions.sort((a, b) => b.rankGain - a.rankGain || b.gapGain - a.gapGain || a.key.localeCompare(b.key));
}

function squaredDistance(a, b) {
  return KEYS.reduce((total, key) => total + (a[key] - b[key]) ** 2, 0);
}

/** Reproducible finite search over [0,10]^7, NOT a global optimality claim. */
export function searchImprovement(players, targetId, coefficients, priorCoefficient = 0) {
  const safe = sanitizeCoefficients(coefficients);
  const gamma = clamp(priorCoefficient);
  const targetIndex = players.findIndex((player) => player.player_id === targetId);
  if (targetIndex < 0) return null;
  const matrix = players.map((player) => KEYS.map((key) => finite(player?.components?.[`${key}_score`]) ? (player.components[`${key}_score`] - 50) / 10 : null));
  const priors = players.map((player) => finite(player?.rankings?.public_prior_score) ? (player.rankings.public_prior_score - 50) / 10 : null);
  const scores = new Float64Array(players.length);
  function assess(candidate) {
    const vector = KEYS.map((key) => candidate[key]);
    const activeMass = vector.reduce((sum, value) => sum + value, gamma);
    for (let i = 0; i < matrix.length; i++) {
      let score = 50;
      let observedMass = 0;
      for (let j = 0; j < COUNT; j++) {
        if (matrix[i][j] === null || vector[j] <= 0) continue;
        score += matrix[i][j] * vector[j];
        observedMass += vector[j];
      }
      if (priors[i] !== null) {
        score += gamma * priors[i];
        observedMass += gamma;
      }
      scores[i] = activeMass > 0 && observedMass === 0 ? NaN : score;
    }
    const targetScore = scores[targetIndex];
    if (!finite(targetScore)) return { rank: null, score: null, gap: null, tieCount: 0 };
    const targetKey = scoreKey(targetScore);
    let rank = 1;
    let tieCount = 1;
    let bestOther = -Infinity;
    for (let i = 0; i < scores.length; i++) {
      if (i === targetIndex || !finite(scores[i])) continue;
      if (scoreKey(scores[i]) > targetKey) rank++;
      if (scoreKey(scores[i]) === targetKey) tieCount++;
      bestOther = Math.max(bestOther, scores[i]);
    }
    return { rank, score: targetScore, gap: bestOther === -Infinity ? 0 : targetScore - bestOther, tieCount };
  }
  const initial = assess(safe);
  let best = { ...initial, coefficients: safe, distance: 0 };
  let draws = 1;
  function consider(raw) {
    const candidate = sanitizeCoefficients(raw);
    // Do not recommend switching off the whole model to manufacture a first-place tie.
    if (gamma === 0 && KEYS.every((key) => candidate[key] === 0)) return;
    const result = assess(candidate);
    draws++;
    if (result.rank === null) return;
    const distance = Math.sqrt(squaredDistance(candidate, safe));
    if (best.rank === null || result.rank < best.rank || (result.rank === best.rank && (result.gap > best.gap + 1e-9 || (Math.abs(result.gap - best.gap) <= 1e-9 && distance < best.distance)))) {
      best = { ...result, coefficients: candidate, distance };
    }
  }
  consider(Object.fromEntries(KEYS.map((key) => [key, 10 / COUNT])));
  for (let i = 0; i < COUNT; i++) {
    const axis = zeroCoefficients();
    axis[KEYS[i]] = 10;
    consider(axis);
    for (let j = i + 1; j < COUNT; j++) {
      const edge = zeroCoefficients();
      edge[KEYS[i]] = 10;
      edge[KEYS[j]] = 10;
      consider(edge);
    }
    consider(setCoefficient(safe, KEYS[i], safe[KEYS[i]] + 0.5));
    consider(setCoefficient(safe, KEYS[i], safe[KEYS[i]] - 0.5));
    consider(setCoefficient(safe, KEYS[i], 0));
    consider(setCoefficient(safe, KEYS[i], 10));
  }
  let seed = 0x4e424147;
  const random = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return ((seed >>> 0) + 0.5) / 4294967296;
  };
  for (let draw = 0; draw < 256; draw++) {
    const cube = Object.fromEntries(KEYS.map((key) => [key, random() * 10]));
    consider(cube);
    for (const fraction of [0.25, 0.5, 0.75]) {
      consider(Object.fromEntries(KEYS.map((key) => [key, safe[key] * (1 - fraction) + cube[key] * fraction])));
    }
  }
  const improved = best.rank !== null && (initial.rank === null || best.rank < initial.rank || (best.rank === initial.rank && best.gap > initial.gap + 1e-9));
  return { ...best, draws, improved, priorCoefficient: gamma, baselineRank: initial.rank, baselineScore: initial.score,
    rankGain: initial.rank === null || best.rank === null ? 0 : initial.rank - best.rank,
    gapGain: initial.gap === null || best.gap === null ? 0 : best.gap - initial.gap,
    method: 'deterministic-finite-search', isGlobalOptimum: false };
}
