"""Build the record explorer from auditable local snapshots; never infer missing stats.

--refresh-cba fetches public season tables (3 workers), retaining factual cells only.
NBA games are partitioned by season and gzip-compressed for on-demand static hosting.
"""
from __future__ import annotations
import argparse, concurrent.futures, csv, datetime as dt, gzip, html, json, math, re, urllib.request
from collections import defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'app/data'
RAW=ROOT/'data/raw/kaggle_nba_aba_baa/csv'
OLD=ROOT/'data/raw/kaggle_nba_all_time/csv'
CACHE=ROOT/'config/custom-cba-seasons.json'
ASOF='2026-10-07'
def load(p):return json.loads(p.read_text(encoding='utf-8'))
def num(v):
    try:
        n=float(v)
        return n if math.isfinite(n) else None
    except (ValueError,TypeError):return None
def clean(s):return html.unescape(re.sub('<[^>]+>','',s)).strip()
def rows(p):
    with p.open(encoding='utf-8-sig',newline='') as f:yield from csv.DictReader(f)
def save(name,data,zipped=False):
    body=(json.dumps(data,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n').encode()
    (OUT/name).write_bytes(gzip.compress(body,compresslevel=9,mtime=0) if zipped else body)
    return len(body)
def refresh_cba():
    sources=load(ROOT/'config/guess-cba-source-snapshot.json')['sources']
    sources=[s for s in sources if s['id'].startswith('cba-sina-season-')]
    def one(s):
        req=urllib.request.Request(s['url'],headers={'User-Agent':'TrueGOAT-public-season-facts/1.0'})
        with urllib.request.urlopen(req,timeout=25) as response:raw=response.read()
        body=raw.decode('gb18030')
        league=re.search(r'qleagueid=(\d+)',s['url']).group(1)
        if not re.search(r'bo\.id\(\x27league\x27\)\.value="'+league+'"',body):raise ValueError('Season selector mismatch')
        records=[]
        for tr in re.findall(r'<tr\b[^>]*>(.*?)</tr>',body,re.S):
            cells=[clean(x) for x in re.findall(r'<td\b[^>]*>(.*?)</td>',tr,re.S)]
            link=re.search(r'/cba/player/show/(\d+)/',tr)
            if link and len(cells)==18 and (num(cells[3]) or 0)>0:
                records.append({'id':link.group(1),'name':cells[1],'team':cells[2],'games':num(cells[3]),
                    'points':num(cells[4]),'rebounds':num(cells[8]),'assists':num(cells[11]),
                    'steals':num(cells[12]),'blocks':num(cells[14]),'efficiency':num(cells[17]),
                    'threes':num(cells[6].split('-')[0])})
        print(s['id'],len(records),flush=True)
        return {'season':2000+int(s['id'][-2:]),'url':s['url'],'records':records}
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:seasons=list(pool.map(one,sources))
    CACHE.write_text(json.dumps({'asOf':ASOF,'seasons':seasons},ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')

def build():
    guess=load(OUT/'guess-players.json');catalog=load(OUT/'player-catalog.json')
    bios={p['id']:p.get('background',{}) for p in catalog['players']}
    birthplaces=defaultdict(list)
    bp=ROOT/'config/custom-birthplaces.json'
    if bp.exists():
        for r in load(bp)['records']:birthplaces[r['id'].split('/')[-1]].append(r)
    people=[]
    for p in guess['players']:
        pools=[x for x in p['pools'] if x in ('nba-active','nba-history','cba-active','cba-history')]
        bio=bios.get(p['id'],{});places=birthplaces[p['id']]
        unique={r['place'] for r in places};place=places[0] if len(unique)==1 else {}
        if pools:people.append({k:p.get(k) for k in ('id','name','chineseName','aliases','heightCm','positions')}|{'pools':pools,'birthDate':bio.get('birthDate'),'weightKg':bio.get('weightKg'),'college':bio.get('college'),'birthplace':place.get('placeLabel'),'birthplaceId':place.get('place'),'bioSource':place.get('person')})
    people.sort(key=lambda p:p['id']);ids={p['id']:i for i,p in enumerate(people)}
    nba_ids={p['id'] for p in people if 'nba-history' in p['pools']}
    teams={t['id']:t['name'] for p in guess['players'] for t in p.get('teams',[])}
    totals=defaultdict(list);advanced={}
    for r in rows(RAW/'Player Totals.csv'):
        if r['lg'] in ('NBA','BAA') and r['player_id'] in nba_ids and (num(r['g']) or 0)>0:
            totals[(r['player_id'],int(r['season']))].append(r)
    for r in rows(RAW/'Advanced.csv'):
        if r['lg'] in ('NBA','BAA'):advanced[(r['player_id'],int(r['season']),r['team'])]=r
    seasons=[]
    for (pid,year),group in totals.items():
        combined=[r for r in group if re.fullmatch(r'TOT|\d+TM',r['team'])]
        # One combined row per player-season. Team-specific queries intentionally
        # exclude traded seasons: combined statistics must not be assigned to a stint.
        if len(group)>1 and not combined:continue
        r=(combined or group)[0];g=num(r['g']);a=advanced.get((pid,year,r['team']),{})
        row={'p':ids[pid],'year':year,'date':str(year),'team':None if combined else 'NBA:'+r['team'],'games':g,'age':num(r['age']),'phase':'rs'}
        for key,col in [('points','pts'),('rebounds','trb'),('assists','ast'),('steals','stl'),('blocks','blk'),('threes','x3p'),('minutes','mp')]:
            value=num(r.get(col));row[key]=round(value/g,5) if value is not None else None
        for key,col in [('fgPct','fg_percent'),('efgPct','e_fg_percent')]:
            v=num(r.get(col));row[key]=round(v*100,5) if v is not None else None
        for key,col in [('tsPct','ts_percent'),('per','per'),('bpm','bpm'),('usgPct','usg_percent')]:
            v=num(a.get(col));row[key]=round(v*(100 if key=='tsPct' else 1),5) if v is not None else None
        seasons.append(row)
    seasons.sort(key=lambda r:(r['year'],r['p']))
    save('custom-nba-seasons.json',{'rows':seasons})
    cba=[];cba_sources={};unmatched=0
    players={p['id']:p for p in guess['players']};redirects=guess.get('identityRedirects',{})
    # Resolve archived Sina IDs only through already-reviewed canonical identities.
    if CACHE.exists():
        for season in load(CACHE)['seasons']:
            year=season['season'];cba_sources[str(year)]=season['url']
            for r in season['records']:
                old='cba-sina-'+r['id'];pid=redirects.get(old,old)
                if not isinstance(pid,str) or pid not in ids:unmatched+=1;continue
                p=players[pid];team='CBA:'+r['team']
                if not any(a['season']==year and a['teamId']==team and a.get('games',0)>0 for a in p.get('appearances',[])):unmatched+=1;continue
                cba.append({k:r[k] for k in ('points','rebounds','assists','steals','blocks','threes','efficiency','games')}|{'p':ids[pid],'year':year,'date':str(year),'team':team,'age':None,'phase':'all'})
    # Duplicated player-season identities are quarantined rather than combining rounded averages.
    counts=defaultdict(int)
    for r in cba:counts[(r['p'],r['year'])]+=1
    cba=[r for r in cba if counts[(r['p'],r['year'])]==1];cba.sort(key=lambda r:(r['year'],r['p']))
    save('custom-cba-seasons.json',{'rows':cba})
    schedule={r['Game Reference']:r for r in rows(OLD/'schedule.csv') if r['League'] in ('NBA','BAA')}
    columns=['p','game','team','points','rebounds','assists','steals','blocks','threes','minutes','fgPct','tsPct','efgPct','gameScore','bpm','usgPct','age']
    files=[];total_games=0;total_rows=0;births={}
    for i,p in enumerate(people):
        try:births[i]=dt.date.fromisoformat(p.get('birthDate') or '')
        except ValueError:pass
    for year in range(1947,2025):
        file=OLD/'boxscores_by_year'/f'{"BAA" if year<=1949 else "NBA"}_{year-1}-{year}_basic.csv'
        adv=file.with_name(file.name.replace('_basic','_advanced'));amap={}
        if adv.exists():
            for r in rows(adv):
                if r['Period']=='game':amap[(r['Game Reference'],r['Player Reference'])]=r
        games=[];gids={};records=[];seen=set();skipped=0
        for r in rows(file):
            if r['Period']!='game' or r['Player Reference'] not in nba_ids or num(r['PTS']) is None:continue
            ref=r['Game Reference'];s=schedule.get(ref);pid=ids[r['Player Reference']];pair=(ref,pid)
            if not s or r['Team'] not in (s['Home'],s['Visitor']) or pair in seen:skipped+=1;continue
            seen.add(pair)
            if ref not in gids:
                gids[ref]=len(games);games.append({'id':ref,'date':s['Date'],'home':'NBA:'+s['Home'],'away':'NBA:'+s['Visitor'],'phase':'po' if s['Playoffs']=='True' else 'rs','homePlayers':[],'awayPlayers':[]})
            game=games[gids[ref]];team='NBA:'+r['Team'];game['homePlayers' if team==game['home'] else 'awayPlayers'].append(pid)
            mp=r['MP'].split(':');mins=round(int(mp[0])+int(mp[1])/60,4) if len(mp)==2 else num(r['MP'])
            a=amap.get((ref,r['Player Reference']),{});pts=num(r['PTS']);fga=num(r['FGA']);fta=num(r['FTA']);fg=num(r['FG']);three=num(r['3P'])
            row={'p':pid,'game':gids[ref],'team':team,'points':pts,'minutes':mins}
            for key,col in [('rebounds','TRB'),('assists','AST'),('steals','STL'),('blocks','BLK'),('threes','3P')]:row[key]=num(r[col])
            row['fgPct']=round(100*fg/fga,5) if fg is not None and fga else None
            row['tsPct']=round(100*pts/(2*(fga+0.44*fta)),5) if fga is not None and fta is not None and fga+0.44*fta>0 else None
            row['efgPct']=round(100*(fg+0.5*three)/fga,5) if fg is not None and three is not None and fga else None
            for key,col in [('bpm','BPM'),('usgPct','USG%')]:row[key]=num(a.get(col))
            score=[(1,'PTS'),(.4,'FG'),(-.7,'FGA'),(-.4,'FTA'),(.4,'FT'),(.7,'ORB'),(.3,'DRB'),(1,'STL'),(.7,'AST'),(.7,'BLK'),(-.4,'PF'),(-1,'TOV')]
            row['gameScore']=round(sum(w*num(r[c]) for w,c in score),5) if all(num(r[c]) is not None for _,c in score) else None
            day=dt.date.fromisoformat(game['date']);b=births.get(pid)
            row['age']=day.year-b.year-((day.month,day.day)<(b.month,b.day)) if b else None
            records.append([row.get(k) for k in columns])
        records.sort(key=lambda r:(games[r[1]]['date'],r[0]));name=f'custom-nba-games-{year}.json.gz'
        save(name,{'columns':columns,'games':games,'rows':records},True)
        files.append({'year':year,'file':name,'rows':len(records),'games':len(games),'bytes':(OUT/name).stat().st_size,'skipped':skipped})
        total_games+=len(games);total_rows+=len(records);print('NBA games',year,len(records),flush=True)
    manifest={'version':'1.0','asOf':ASOF,'players':people,'teams':teams,'gameFiles':files,'cbaSources':cba_sources,
        'coverage':{'nbaSeasons':[min(r['year'] for r in seasons),max(r['year'] for r in seasons)],'nbaSeasonRows':len(seasons),'nbaGameRows':total_rows,'nbaGames':total_games,'nbaGameYears':[1947,2024],
        'cbaSeasons':sorted({r['year'] for r in cba}),'cbaSeasonRows':len(cba),'cbaQuarantined':unmatched,'historicalComplete':False},
        'sources':[{'name':'NBA season snapshot / Sumitro Datta','url':'https://www.kaggle.com/datasets/sumitrodatta/nba-aba-baa-stats'},
        {'name':'NBA game snapshot / Gonzalo Gigena','url':'https://github.com/gonzalo-gigena/nba-datasets'},
        {'name':'CBA season tables / Sina','url':'https://cba.sports.sina.com.cn/cba/stats/playerstats/'}]}
    save('custom-manifest.json',manifest);print(json.dumps(manifest['coverage']),flush=True)
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--refresh-cba',action='store_true');args=parser.parse_args()
    if args.refresh_cba:refresh_cba()
    build()
