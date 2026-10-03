/**
 * Pure shared player-name search. Alias data is merged at build time.
 * Translations/nicknames are search labels, never unique player identities.
 */
export function normalizeSearch(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/(\p{Script=Han})([a-z0-9])/gu, '$1 $2')
    .replace(/([a-z0-9])(\p{Script=Han})/gu, '$1 $2')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

const compact = value => value.replace(/\s+/g, '');
const strings = value => Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
const hasHan = value => /\p{Script=Han}/u.test(value);

// At most one insertion, deletion, substitution or adjacent transposition.
// Only long Latin words use this; Chinese characters and initials stay literal.
function oneEditAway(left, right) {
  if (!/^[a-z]{4,}$/.test(left) || !/^[a-z]{4,}$/.test(right)) return false;
  if (Math.abs(left.length - right.length) > 1) return false;
  if (left === right) return true;
  if (left.length === right.length) {
    const changed = [];
    for (let i = 0; i < left.length; i++) if (left[i] !== right[i]) changed.push(i);
    if (changed.length === 1) return true;
    return changed.length === 2 && changed[1] === changed[0] + 1
      && left[changed[0]] === right[changed[1]] && left[changed[1]] === right[changed[0]];
  }
  const shorter = left.length < right.length ? left : right;
  const longer = left.length < right.length ? right : left;
  let i = 0, j = 0, skipped = false;
  while (i < shorter.length && j < longer.length) {
    if (shorter[i] === longer[j]) { i++; j++; }
    else { if (skipped) return false; skipped = true; j++; }
  }
  return true;
}

function teamLabels(player) {
  const teams = [...(Array.isArray(player.teams) ? player.teams : []),
    ...(Array.isArray(player.background?.teams) ? player.background.teams : [])];
  return teams.flatMap(team => typeof team === 'string' ? [team]
    : team && typeof team === 'object' ? [team.name, team.fullName, team.id, team.abbreviation].filter(value => typeof value === 'string') : []);
}

function fieldsFor(player, includeTeams) {
  const values = [player.name, player.chineseName, player.id, ...strings(player.aliases),
    ...(includeTeams ? teamLabels(player) : [])];
  return [...new Set(values.filter(value => typeof value === 'string' && value.trim()).map(normalizeSearch))];
}

function scorePlayer(player, query, terms, includeTeams) {
  const fields = fieldsFor(player, includeTeams);
  const joinedQuery = compact(query);
  if (fields.some(field => compact(field) === joinedQuery)) return 1000;
  if (fields.some(field => compact(field).startsWith(joinedQuery))) return 800;
  if (joinedQuery.length >= 3 || hasHan(joinedQuery)) {
    if (fields.some(field => compact(field).includes(joinedQuery))) return 700;
  }
  const words = fields.flatMap(field => field.split(' '));
  let score = 0;
  for (const term of terms) {
    const joinedTerm = compact(term);
    if (fields.some(field => compact(field) === joinedTerm) || words.includes(term)) { score += 80; continue; }
    if (hasHan(term)) {
      if (!fields.some(field => compact(field).includes(joinedTerm))) return 0;
      score += 50;
      continue;
    }
    if (words.some(word => term.length <= 2 ? word.startsWith(term) : word.includes(term))) { score += 40; continue; }
    if (words.some(word => oneEditAway(term, word))) { score += 10; continue; }
    return 0;
  }
  // The minimum term match determines validity; full-name / exact-alias matches
  // always rank above multi-token, partial and fuzzy matches.
  return Math.min(600, score);
}

/**
 * Returns original player objects ordered by relevance; never mutates input.
 * Empty query returns all players. Ambiguous names/aliases retain every match.
 * includeTeams preserves directory team-name lookup without widening game search.
 */
export function searchPlayers(players, query, {limit = Infinity, includeTeams = false} = {}) {
  if (!Array.isArray(players)) return [];
  const candidates = players.filter(player => player && typeof player === 'object');
  const normalized = normalizeSearch(query);
  const maximum = limit === Infinity ? Infinity : Math.max(0, Math.floor(Number(limit) || 0));
  if (!normalized) return candidates.slice(0, maximum);
  const terms = normalized.split(' ');
  return candidates.map((player, index) => ({player, index, score:scorePlayer(player, normalized, terms, includeTeams)}))
    .filter(item => item.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, maximum)
    .map(item => item.player);
}
