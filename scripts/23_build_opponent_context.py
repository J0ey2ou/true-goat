"""Reproducible same-season opposition model from retained appearance snapshots.

No online refresh, invented matchups, title counts or global GOAT feedback.
Run with Python's standard library only.
"""
import bisect
import csv
import gzip
import json
import math
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'app/data'

# Retained game snapshots label some non-league games as regular season.
# NBA's published play-in calendars and 2023 Cup schedule identify exclusions.
PLAY_IN_WINDOWS = {2020:('2020-08-15','2020-08-16'),2021:('2021-05-18','2021-05-21'),2022:('2022-04-12','2022-04-15'),2023:('2023-04-11','2023-04-14'),2024:('2024-04-16','2024-04-19')}


def eligible_game(game,year):
    window=PLAY_IN_WINDOWS.get(year)
    if window and window[0]<=game['date']<=window[1]:return False
    if game['date']=='2023-12-09' and {game['home'],game['away']}=={'NBA:LAL','NBA:IND'}:return False
    return game['phase'] in ['rs','po']


def percentile(values, value):
    if value is None or not values:
        return None
    return 100 * (bisect.bisect_left(values, value) + bisect.bisect_right(values, value)) / (2 * len(values))


def propagate(base, edges, damping=.2):
    """Convex contraction: unique fixed point, no order-dependent updates."""
    values = dict(base)
    for iteration in range(60):
        updated = {}
        for person, value in base.items():
            neighbors = edges.get(person, {})
            mass = sum(neighbors.values())
            opposition = sum(values[q] * w for q, w in neighbors.items()) / mass if mass else value
            updated[person] = (1 - damping) * value + damping * opposition
        error = max((abs(updated[p] - values[p]) for p in base), default=0)
        values = updated
        if error < 1e-8:
            return values, iteration + 1, error
    raise ValueError('Opposition propagation failed to converge')


def champion_teams():
    text = (ROOT / 'data/raw/nba_champions_official.md').read_text(encoding='utf-8')
    with (ROOT / 'data/raw/kaggle_nba_aba_baa/csv/Team Abbrev.csv').open(encoding='utf-8-sig', newline='') as file:
        lookup = {(int(r['season']), r['team']): 'NBA:' + r['abbreviation'] for r in csv.DictReader(file) if r['lg'] in ['NBA', 'BAA']}
    result = {}
    for season, name in re.findall(r'(?m)^(\d{4}-\d{2})\s*—\s*\*\*([^*]+)\*\*\s*def\.', text):
        year = int(season[:4]) + 1
        if (year, name.strip()) in lookup:
            result[year] = lookup[year, name.strip()]
    return result


def build():
    manifest = json.loads((DATA / 'custom-manifest.json').read_text(encoding='utf-8'))
    by_year = defaultdict(dict)
    for row in json.loads((DATA / 'custom-nba-seasons.json').read_text(encoding='utf-8'))['rows']:
        if row['phase'] == 'rs':
            assert row['p'] not in by_year[row['year']], 'Use one aggregate season per player'
            by_year[row['year']][row['p']] = row
    champions = champion_teams()
    histories = defaultdict(lambda: {'seasons': [], 'championships': []})
    audits = []
    for year in range(1947, 2025):
        season = by_year[year]
        min_games = max(10, .25 * max(r['games'] for r in season.values()))
        metrics = [('points', .5), ('assists', .2), ('rebounds', .15), ('tsPct', .15)]
        refs = {key: sorted(r[key] for r in season.values() if r['games'] >= min_games and r.get(key) is not None) for key, _ in metrics}
        base, scoring = {}, {}
        for person, row in season.items():
            if row.get('points') is None:
                continue  # Scoring quality is unknown, not a zero percentile.
            terms = [(percentile(refs[key], row.get(key)), weight) for key, weight in metrics]
            terms = [(v, w) for v, w in terms if v is not None]
            if not terms:
                continue
            reliability = min(1, row['games'] / min_games)
            base[person] = 50 + reliability * (sum(v*w for v,w in terms)/sum(w for _,w in terms)-50)
            scoring_percentile=percentile(refs['points'],row['points'])
            if scoring_percentile is None:
                del base[person]
                continue
            scoring[person] = 50 + reliability * (scoring_percentile-50)
        snapshot = json.loads(gzip.decompress((DATA / f'custom-nba-games-{year}.json.gz').read_bytes()))
        columns = {key: i for i, key in enumerate(snapshot['columns'])}
        appearances = defaultdict(lambda: defaultdict(list))
        for row in snapshot['rows']:
            if not eligible_game(snapshot['games'][row[columns['game']]],year):
                continue
            # Rows are actual appearances. A recorded 0-minute row is excluded.
            minutes = row[columns['minutes']]
            if minutes == 0:
                continue
            appearances[row[columns['game']]][row[columns['team']]].append((row[columns['p']], minutes))
        edges = defaultdict(lambda: defaultdict(float))
        matches = []
        for game_index, teams in appearances.items():
            game = snapshot['games'][game_index]
            for team, own in teams.items():
                opponent = game['away'] if team == game['home'] else game['home']
                other = teams.get(opponent, [])
                minutes_known = all(m is not None and m > 0 for _, m in other)
                weights = {p: m if minutes_known else 1 for p,m in other}
                total = sum(weights.values())
                known = {p: w for p,w in weights.items() if p in base}
                coverage = sum(known.values())/total if total else 0
                own_ids = [p for p,_ in own]
                matches.append((game['phase'], team, opponent, own_ids, known, coverage, minutes_known))
                if game['phase'] == 'rs' and coverage >= .8:
                    mass = sum(known.values())
                    for p in own_ids:
                        if p in base:
                            for q,w in known.items():
                                if p != q:
                                    edges[p][q] += w / mass
        ratings, iterations, residual = propagate(base, edges)
        ranks = {p:1+sum(v > ratings[p]+1e-9 for v in ratings.values()) for p in ratings}
        ordered = sorted(ratings.values())
        quality = {p:.5*scoring[p]+.5*percentile(ordered, ratings[p]) for p in base}
        # Compare every postseason path with its own season's regular-season
        # opposition baseline; no raw scoring comparison across eras.
        regular_samples=[]
        for phase, _, _, _, other, coverage, _ in matches:
            if phase == 'rs' and coverage >= .8:
                regular_samples.append(sum(quality[p]*w for p,w in other.items())/sum(other.values()))
        reference = sum(regular_samples)/len(regular_samples) if regular_samples else None
        aggregates = defaultdict(lambda: {'games':0,'coveredGames':0,'strengthSum':0,'ppgSum':0,'equalWeightGames':0,'opponents':defaultdict(lambda:[0,0]),'teams':defaultdict(lambda:[0,0])})
        for phase, team, opponent, own, other, coverage, minutes_known in matches:
            mass=sum(other.values())
            strength=sum(quality[p]*w for p,w in other.items())/mass if mass else None
            ppg=sum(season[p]['points']*w for p,w in other.items())/mass if mass else None
            for p in own:
                record=aggregates[p,phase,team]
                record['games']+=1
                if coverage < .8 or reference is None:
                    continue
                record['coveredGames']+=1
                record['strengthSum']+=strength
                record['ppgSum']+=ppg
                record['equalWeightGames']+=not minutes_known
                record['teams'][opponent][0]+=1
                record['teams'][opponent][1]+=strength
                for q,w in other.items():
                    record['opponents'][q][0]+=w/mass
                    record['opponents'][q][1]+=1
        for (p,phase,team),a in aggregates.items():
            n=a['coveredGames']
            own=manifest['players'][p]
            leaders=sorted(a['opponents'],key=lambda q:(-a['opponents'][q][0],manifest['players'][q]['id']))[:8]
            record={'year':year,'phase':phase,'team':team,'games':a['games'],'coveredGames':n,'strength':a['strengthSum']/n if n else None,'reference':reference,'opponentPpg':a['ppgSum']/n if n else None,'equalWeightGames':a['equalWeightGames'],
                'topOpponents':[{'id':manifest['players'][q]['id'],'name':manifest['players'][q]['name'],'ppg':season[q]['points'],'rank':ranks[q],'poolSize':len(ranks),'quality':quality[q],'exposure':a['opponents'][q][0],'meetings':a['opponents'][q][1]} for q in leaders],
                'opponentTeams':[{'team':t,'games':v[0],'strength':v[1]/v[0]} for t,v in sorted(a['teams'].items())]}
            histories[own['id']]['seasons'].append(record)
            if phase == 'po' and team == champions.get(year):
                # Actual appearances for the champion in that postseason,
                # not an inferred ring recipient or an entire-team résumé.
                coverage=n/a['games']
                factor=max(.75,min(1.25,1+.5*(record['strength']-reference)/100*coverage)) if n and reference is not None else 1
                histories[own['id']]['championships'].append({**record,'factor':factor})
        audits.append({'year':year,'players':len(base),'reference':reference,'iterations':iterations,'residual':residual,'excludedNonLeagueGames':sum(not eligible_game(g,year) for g in snapshot['games'])})
    # Keep full title paths, but aggregate career phases for fast browser load.
    # The builder reproduces every season from the retained source snapshots.
    for history in histories.values():
        summaries={}
        for phase in ['rs','po']:
            rows=[s for s in history['seasons'] if s['phase']==phase]
            if not rows:continue
            n=sum(s['coveredGames'] for s in rows)
            games=sum(s['games'] for s in rows)
            if not n:
                summaries[phase]=None
                continue
            average=lambda key:sum(s[key]*s['coveredGames'] for s in rows if s['coveredGames'])/n
            leaders=sorted([{**o,'year':s['year']} for s in rows for o in s['topOpponents']],key=lambda o:(-o['exposure'],-o['quality']))[:8]
            summaries[phase]={'games':games,'coveredGames':n,'strength':average('strength'),'reference':average('reference'),'opponentPpg':average('opponentPpg'),'coverage':n/games,
                'equalWeightGames':sum(s['equalWeightGames'] for s in rows),'firstSeason':min(s['year'] for s in rows),'lastSeason':max(s['year'] for s in rows),'topOpponents':leaders}
        history['phases']=summaries
        del history['seasons']
    # Deterministic precision and ordering keep the public file reviewable.
    def rounded(value):
        if isinstance(value,float):return round(value,6)
        if isinstance(value,dict):return {k:rounded(v) for k,v in value.items()}
        if isinstance(value,list):return [rounded(v) for v in value]
        return value
    result={'version':1,'throughSeason':2024,'method':'same-season-opponents-v1','meta':{'playerCount':len(histories),'gameWindow':[1947,2024],'minimumOpponentCoverage':.8,'damping':.2,'note':'Actual opposing appearances, not direct defenders. Play-in games and the 2023 Cup final are excluded. Frozen same-season rankings; no current GOAT-rank feedback. Missing leagues and 2025–26 remain unadjusted.'},'sources':manifest['sources']+[{'name':'NBA champions','url':'https://www.nba.com/news/history-nba-champions'},{'name':'NBA Play-In history','url':'https://www.nba.com/news/play-in-tournament-history'},{'name':'NBA 2023–24 schedule and Cup final scope','url':'https://pr.nba.com/2023-24-nba-regular-season-schedule/'}],'seasonAudit':audits,'players':dict(sorted(histories.items()))}
    (DATA/'opponent-context.json').write_text(json.dumps(rounded(result),ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    print(f'Built opposition context for {len(histories)} players; seasons 1947–2024')


if __name__ == '__main__':
    build()
