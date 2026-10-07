"""Public Wikidata facts, linked only by exact Basketball-Reference ID (P2685)."""
import json,urllib.parse,urllib.request
from pathlib import Path
query='SELECT ?person ?id ?place ?placeLabel WHERE { ?person wdt:P2685 ?id; wdt:P19 ?place. SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }'
url='https://query.wikidata.org/sparql?'+urllib.parse.urlencode({'query':query,'format':'json'})
req=urllib.request.Request(url,headers={'User-Agent':'TrueGOAT/0.12 (https://github.com/J0ey2ou/true-goat)','Accept':'application/sparql-results+json'})
with urllib.request.urlopen(req,timeout=45) as response:data=json.load(response)
records=[{k:r[k]['value'] for k in ('person','id','place','placeLabel')} for r in data['results']['bindings']]
path=Path(__file__).resolve().parents[1]/'config/custom-birthplaces.json'
path.write_text(json.dumps({'asOf':'2026-10-07','source':'https://www.wikidata.org/','query':query,'records':records},ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
print('Wikidata birthplace facts:',len(records))
