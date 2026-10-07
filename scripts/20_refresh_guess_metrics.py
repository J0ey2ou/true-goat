"""Refresh factual postseason records and export optional guessing metrics.

--refresh reads public ESPN daily scoreboards and game summaries. Existing
NBA/BAA history is preserved; incomplete refreshes never overwrite public data.
"""
from __future__ import annotations
import argparse, concurrent.futures, copy, csv, datetime, gzip, json, re, unicodedata, urllib.request
from collections import defaultdict
from pathlib import Path
import pandas as pd

ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'config/guess-postseason-2026.json'
RAW=ROOT/'data/raw/kaggle_nba_aba_baa/csv'
OLD=ROOT/'data/raw/kaggle_nba_all_time/csv'
AS_OF='2026-10-07'
SOURCE='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/'

def load(path): return json.loads(path.read_text(encoding='utf-8'))
def num(value):
    try: return float(value) if value not in ('',None) else None
    except (ValueError,TypeError): return None
def norm(name): return re.sub('[^a-z]','',unicodedata.normalize('NFKD',name).encode('ascii','ignore').decode().lower())
def fetch(url):
    req=urllib.request.Request(url,headers={'Accept':'application/json','User-Agent':'TrueGOAT-factual-data-update/1.0'})
    with urllib.request.urlopen(req,timeout=25) as response: data=response.read()
    if data[:2]==b'\x1f\x8b': data=gzip.decompress(data)
    result=json.loads(data)
    if 'error' in result or result.get('code',200)!=200: raise ValueError('Source did not return usable facts: '+url)
    return result
def parallel(fn,items):
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: return list(pool.map(fn,items))
def refresh():
    dates=[]
    for year in (2025,2026):
        day=datetime.date(year,4,10)
        while day<=datetime.date(year,6,25): dates.append(day.strftime('%Y%m%d'));day+=datetime.timedelta(days=1)
    boards=parallel(lambda day:fetch(SOURCE+'scoreboard?dates='+day),dates)
    events={}
    for board in boards:
        for event in board.get('events',[]):
            comp=event['competitions'][0]
            note=' '.join(row.get('headline','') for row in comp.get('notes',[]))
            if event.get('season',{}).get('type')!=3 or 'play-in' in note.lower(): continue
            if not re.search(r'round|final',note,re.I): continue
            if not comp.get('status',{}).get('type',{}).get('completed'): continue
            events[event['id']]={'id':event['id'],'season':event['season']['year'],'date':event['date'],'note':note}
    for year in (2025,2026):
        count=sum(e['season']==year for e in events.values())
        if not 60<=count<=105: raise ValueError(f'{year}: incomplete playoff calendar ({count} games)')
    summaries=parallel(lambda event:fetch(SOURCE+'summary?event='+event['id']),list(events.values()))
    games=[]
    for summary in summaries:
        event=events[str(summary['header']['id'])]
        comp=summary['header']['competitions'][0]
        finals=bool(re.search(r'^NBA Finals\b',event['note'],re.I))
        contestants=comp['competitors']
        winner=next((c['team']['displayName'] for c in contestants if c.get('winner')),None)
        records=[]
        for team in summary.get('boxscore',{}).get('players',[]):
            for group in team.get('statistics',[]):
                labels=group.get('labels',[])
                for row in group.get('athletes',[]):
                    stats=dict(zip(labels,row.get('stats',[])))
                    minutes=num(stats.get('MIN'))
                    if row.get('didNotPlay') or minutes is None or minutes<=0: continue
                    records.append({'espnId':row['athlete']['id'],'name':row['athlete']['displayName'],'team':team['team']['displayName']})
        if not records or not winner: raise ValueError('Missing completed box score '+event['id'])
        games.append({**event,'finals':finals,'winner':winner,'players':records})
    for year in (2025,2026):
        finals=[g for g in games if g['season']==year and g['finals']]
        if not 4<=len(finals)<=7: raise ValueError('Incomplete Finals calendar')
        wins=defaultdict(int)
        for game in finals: wins[game['winner']]+=1
        if max(wins.values())!=4: raise ValueError('Finals winner not resolved')
    CACHE.write_text(json.dumps({'asOf':AS_OF,'source':SOURCE,'games':games},ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    print('Retained factual postseason games:',len(games),flush=True)

def build():
    data=load(ROOT/'app/data/guess-players.json');facts=load(CACHE)
    index=defaultdict(set)
    people={p['id']:p for p in data['players']}
    for p in data['players']:
        for label in [p['name']]+p.get('aliases',[]):
            if label: index[norm(label)].add(p['id'])
    post=defaultdict(set);final=defaultdict(set);new_champs=defaultdict(set);unmatched=[]
    champions={}
    for year in (2025,2026):
        finals=[g for g in facts['games'] if g['season']==year and g['finals']]
        wins=defaultdict(int)
        for g in finals: wins[g['winner']]+=1
        champions[year]=max(wins,key=wins.get)
    for game in facts['games']:
        for row in game['players']:
            candidates=index[norm(row['name'])]
            # Reviewed official NBA identities: Nate/Jeenathan is the 1999-born
            # player, not his 1950-born namesake; Tillman also appears without Sr.
            if row['name']=='Nate Williams':
                assert people['willije02']['birthYear']==1999
                candidates={'willije02'}
            elif row['name']=='Xavier Tillman':
                assert people['tillmxa01']['birthYear']==1999
                candidates={'tillmxa01'}
            if len(candidates)!=1:
                unmatched.append(row['name']);continue
            pid=next(iter(candidates));post[pid].add(game['season'])
            if game['finals']:
                final[pid].add(game['season'])
                if row['team']==champions[game['season']]:new_champs[pid].add(game['season'])
    if unmatched: raise ValueError('Review unmatched identities before updating: '+repr(sorted(set(unmatched))))
    for p in data['players']:
        if 'nba-history' not in p['pools']: continue
        for key,field,new in [('playoffAppearances','playoffSeasonYears',post),('finalsAppearances','finalsSeasonYears',final)]:
            years=sorted(set(p.get(field,[]))|new[p['id']]);p[field]=years
            coverage=p['metricCoverage'][key]
            if coverage.get('complete'):
                p[key]=len(years);coverage.update(throughSeason=2026,coversRecordedCareer=True,note='实际至少出场一场的赛季数；不含附加赛，统一截至2025–26。')
            p['fieldSources'][key]=list(dict.fromkeys(p['fieldSources'].get(key,[])+['espn-postseason-2025-2026']))
            p['sourceIds']=list(dict.fromkeys(p['sourceIds']+['espn-postseason-2025-2026']))
    # Optional statistics use one row per player-season: combined traded rows
    # take precedence over team stints, preventing doubled totals.
    regular=defaultdict(list)
    with (RAW/'Player Totals.csv').open(encoding='utf-8-sig',newline='') as stream:
        for row in csv.DictReader(stream):
            if row['lg'] in ('NBA','BAA') and int(row['season'])<=2026 and (num(row['g']) or 0)>0:regular[(row['player_id'],row['season'])].append(row)
    career=defaultdict(list)
    for (pid,year),rows in regular.items():
        combined=[r for r in rows if re.fullmatch(r'TOT|\d+TM',r['team'],re.I)]
        career[pid].extend(combined[:1] if combined else rows)
    awards={}
    with (ROOT/'data/processed/awards.csv').open(encoding='utf-8-sig',newline='') as stream:awards={r['player_id']:r for r in csv.DictReader(stream)}
    # Existing sourced profiles cover rings for the original selection. Additional
    # players retain unknown championship totals until a complete roster source exists.
    directory=load(ROOT/'app/data/player-directory.json')
    profiles={p['id']:p for p in directory['players']}
    definitions={
      'championshipCount':{'scope':'NBA/BAA 冠军球队赛季记录','throughSeason':2026,'note':'来源赛季球队记录与历届冠军匹配的赛季数；不等同于戒指授予名单，也不作为季后赛实际出场证明。当前仅已核实原档案有此项。','sourceIds':['nba-champions-official','nba-champion-season-records']},
      'dpoyCount':{'scope':'NBA DPOY','throughSeason':2026,'note':'常规赛最佳防守球员获奖次数；奖项始于1982–83。','sourceIds':['nba-dpoy-official']},
      'finalsMvpCount':{'scope':'NBA FMVP','throughSeason':2026,'note':'总决赛MVP获奖次数；奖项始于1969。','sourceIds':['nba-fmvp-official']},
      'allStarCount':{'scope':'NBA 全明星入选','throughSeason':2026,'note':'按届去重的入选次数，不等于实际出场次数。','sourceIds':['nba-allstar-selections']},
    }
    for key,col in [('assistsPerGame','ast'),('reboundsPerGame','trb'),('stealsPerGame','stl'),('blocksPerGame','blk')]:definitions[key]={'scope':'NBA/BAA 常规赛','throughSeason':2026,'note':'生涯总量÷实际出场数；缺少年份保留未知。','sourceIds':['nba-career-games']}
    extra={}
    for p in data['players']:
        pid=p['id'];values={key:None for key in definitions};complete=[]
        if 'nba-history' in p['pools']:
            for key,col in [('assistsPerGame','ast'),('reboundsPerGame','trb'),('stealsPerGame','stl'),('blocksPerGame','blk')]:
                rows=career[pid]
                if rows and all(num(r.get(col)) is not None for r in rows):
                    values[key]=round(sum(float(r[col]) for r in rows)/sum(float(r['g']) for r in rows),1);complete.append(key)
            for key,col in [('dpoyCount','dpoy'),('finalsMvpCount','finals_mvp')]:
                # Complete official winner tables were already reconciled to the
                # original award universe. Non-winners outside it are genuine zero.
                values[key]=int(float(awards.get(pid,{}).get(col,0)));complete.append(key)
            if p.get('allStarSelections') is not None:values['allStarCount']=p['allStarSelections'];complete.append('allStarCount')
            profile=profiles.get(pid)
            if profile and profile.get('awards',{}).get('championships') is not None:
                values['championshipCount']=profile['awards']['championships'];complete.append('championshipCount')
        if any(v is not None for v in values.values()):extra[pid]={**values,'completeFields':complete}
    data['version']='2.1';data['dataAsOf']=AS_OF
    data['meta']['postseasonThrough']=2026;data['meta']['postseasonUpdatedAt']=AS_OF
    data['meta']['metricNote']='NBA/BAA球队数按franchise沿革去重；常规赛、MVP及已核实季后赛/总决赛实际出场赛季截至2025–26。2025与2026季后赛以逐场实际出场记录补齐，不计附加赛。不同联赛或快照不直接比较，CBA/国际未知不当作0。'
    data['meta']['metricCoverage']={key:sum(p.get(key) is not None for p in data['players']) for key in ['teamCount','playoffAppearances','finalsAppearances','pointsPerGame','mvpCount']}
    sources=[{'id':'espn-postseason-2025-2026','title':'ESPN 2025、2026季后赛赛程与逐场技术统计','url':'https://www.espn.com/nba/scoreboard','asOf':AS_OF,'note':'只计入完成比赛中实际出场者；不含附加赛。'},
      {'id':'nba-champions-official','title':'NBA历届冠军与原档案冠军赛季统计','url':'https://www.nba.com/news/history-nba-champions','asOf':'2026-08-15'},
      {'id':'nba-dpoy-official','title':'NBA历届DPOY','url':'https://www.nba.com/news/history-defensive-player-of-the-year-winners','asOf':'2026-08-15'},
      {'id':'nba-fmvp-official','title':'NBA历届FMVP','url':'https://www.nba.com/news/history-finals-mvp-award-winners','asOf':'2026-08-15'},
      {'id':'nba-champion-season-records','title':'NBA/BAA赛季球队记录与官方冠军名单匹配','url':'https://www.kaggle.com/datasets/sumitrodatta/nba-aba-baa-stats','asOf':'2026-08-15','note':'冠军赛季数沿用已核实原档案；不表示戒指授予或季后赛实际出场。'}]
    ids={s['id'] for s in sources};data['sources']=[s for s in data['sources'] if s['id'] not in ids]+sources
    for source in data['sources']:
        suffix='；2024–25与2025–26另用ESPN逐场记录补齐。'
        if source['id'] in ['nba-playoff-games','nba-finals-games'] and suffix not in source['note']:source['note']+=suffix
    exported={'version':'2.1','asOf':AS_OF,'definitions':definitions,'players':extra}
    (ROOT/'app/data/guess-players.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    (ROOT/'app/data/guess-extra-metrics.json').write_text(json.dumps(exported,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    print(json.dumps({'players':len(people),'postseasonGames':len(facts['games']),'extraProfiles':len(extra),'postseasonThrough':2026},ensure_ascii=False))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--refresh',action='store_true');args=parser.parse_args()
    if args.refresh:refresh()
    build()
