"""Build auditable CBA guessing pools from public, factual snapshots.

--refresh-registration renders the normal official public website and reads its
visible tables. No private/encrypted API, credential, or decryption is used.
--refresh-sina follows public season forms and public player links (3 workers).
Normal builds are offline. Registration is never converted into game appearances.
"""
from __future__ import annotations

import argparse
import copy
import concurrent.futures
import csv
import html
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "config"
AS_OF = "2026-10-04"
REGISTRY_URL = "https://www.cbaleague.com/#/news-register/detail/6a72fc344a"
SINA_INDEX = "https://cba.sports.sina.com.cn/cba/stats/playerstats/"
REGISTRY_FILE = CONFIG / "guess-cba-registration-snapshot.json"
SINA_FILE = CONFIG / "guess-cba-source-snapshot.json"
OUTPUT = CONFIG / "guess-cba-expansion.json"
IDENTITY_FILE = CONFIG / "guess-cba-identity-crosswalk.json"
IDENTITY_CANDIDATES = CONFIG / "guess-cba-identity-candidates.json"
METRICS = ["teamCount", "playoffAppearances", "finalsAppearances", "pointsPerGame", "mvpCount"]
EASY_NAMES = set("姚明 易建联 王治郅 巴特尔 朱芳雨 刘炜 王仕鹏 胡卫东 孙军 巩晓彬 李楠 刘玉栋 杜锋 李群 陈江华 孙悦 马布里 麦克格雷迪 麦蒂 胡金秋 孙铭徽 赵继伟 张镇麟 付豪 赵睿 周琦 曾凡博 胡明轩 徐杰 郭艾伦 陈盈骏 王哲林 高诗岩 陶汉林 贺希宁 沈梓捷 吴前 姜伟泽 姜宇星 翟晓川 范子铭 周鹏 阿不都沙拉木 张宁 原帅 齐麟 杨瀚森 林书豪 王少杰 廖三宁".split())
# Publicly discovered archive URLs, supplementing the season form starting in 2005.
ARCHIVE_PROFILES = {"1967": "胡卫东", "185": "孙军", "153": "巴特尔"}
TEAM_NAMES = {"宁波富邦":"宁波", "浙江广厦":"广厦", "辽宁沈阳三生":"辽宁", "山西汾酒":"山西", "广州龙狮":"广州", "山东山高":"山东", "福建浔兴":"福建", "四川锦城":"四川", "浙江稠州":"浙江", "天津荣钢":"天津", "广东宏远":"广东", "北京控股":"北控", "北京首钢":"北京", "上海久事":"上海", "吉林东北虎":"吉林", "青岛国信海天":"青岛", "江苏肯帝亚":"江苏", "南京同曦":"同曦", "深圳新世纪":"深圳", "新疆广汇":"新疆"}
# Exact full name + full birth date checked on both public profiles, 2026-10-04.
# Height disagreements are retained as unknown after merging, never averaged.
SINA_REDIRECTS = {"7619":"4533", "7726":"7051", "7536":"7077", "7229":"1377", "7769":"7257", "7683":"7262", "7744":"7295"}
SINA_REDIRECTS.update({"7396":"7622", "7601":"7519"})
MERGE_BIRTH_DATES = {"4533":"1992-05-26", "7051":"1997-07-30", "7077":"1996-08-22", "1377":"1990-02-10", "7257":"1997-02-21", "7262":"1996-04-10", "7295":"1996-11-09"}
MERGE_BIRTH_DATES.update({"7622":"1996-12-21", "7519":"1994-07-19"})
# Ambiguous/reused IDs are excluded, not silently attributed to a different person.
QUARANTINE_IDS = {"1":"旧赛季李群/球队合计链接目前指向达米扬·多森", "115":"旧赛季索引球队名称与球员档案身份不一致", "38":"旧赛季索引莱杰·奥科萨与刘景档案身份不一致", "119":"旧赛季索引奥卡佛·尤克与克里斯档案身份不一致", "7014":"同名新旧档案出生日期不完整，暂仅保留当前档案7855", "7296":"同名孟天艺档案出生日期互相冲突，暂仅保留7179", "4860":"同名苏若禹旧档案生日缺失，暂仅保留1781", "4629":"同名张辉旧档案日期不完整，暂仅保留7571", "6956":"同名洛伦佐·布朗日期不完整，暂仅保留6953", "6742":"同名桑尼资料待身份去重，暂仅保留1978", "4856":"同名王薪凯旧档案生日缺失，暂仅保留7618", "7294":"同名于晓辉档案待身份去重，暂仅保留7205", "7044":"同名张稀然档案生日缺失，暂仅保留7042", "5020":"同名辛格尔顿档案资料缺失，暂仅保留1754", "271":"同名王斌档案资料缺失，暂仅保留974", "89":"同名朱峰档案资料缺失，暂仅保留175"}


def clean(value):
    return html.unescape(re.sub(r"<[^>]*>", "", value)).strip()


def fetch(url):
    with urllib.request.urlopen(url, timeout=25) as response:
        data = response.read()
    return data.decode("gb18030", errors="strict")


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")


def refresh_registration(node):
    javascript = r'''
import {chromium, browserOptions} from './app/tests/browser-runtime.mjs';
const browser = await chromium.launch(browserOptions);
const context = await browser.newContext();
try {
  const home = await context.newPage();
  await home.goto('https://www.cbaleague.com/#/news-register/detail/6a72fc344a', {waitUntil:'networkidle',timeout:45000});
  const names = new Set(['宁波富邦','浙江广厦','辽宁沈阳三生','山西汾酒','广州龙狮','山东山高','福建浔兴','四川锦城','浙江稠州','天津荣钢','广东宏远','北京控股','北京首钢','上海久事','吉林东北虎','青岛国信海天','江苏肯帝亚','南京同曦','深圳新世纪','新疆广汇']);
  const links = await home.locator('a').evaluateAll(nodes => nodes.map(n=>({team:n.textContent.trim(),url:n.href})), null);
  const teams = links.filter(link => names.has(link.team));
  if (teams.length !== 20) throw Error('Official index must contain exactly 20 team links');
  const results = [];
  let cursor = 0;
  async function worker() {
    const page = await context.newPage();
    while (cursor < teams.length) {
      const team = teams[cursor++];
      await page.goto(team.url,{waitUntil:'networkidle',timeout:45000});
      await page.getByText('更新时间', {exact:false}).first().waitFor({timeout:10000});
      const text = await page.locator('body').innerText();
      const title = text.split('\n').find(line=>line.includes('2026-2027赛季CBA联赛国内球员注册信息（'));
      const rows = await page.locator('table tr').evaluateAll(nodes => nodes.map(n=>[...n.querySelectorAll('td')].map(c=>c.innerText.trim())).filter(c=>/^\d+$/.test(c[0]||'') && c.length >= 7));
      if (!rows.length || !title) throw Error('Missing visible roster table: '+team.team);
      results.push({...team,title,updated:text.match(/更新时间[：:]\s*([^\n]+)/)?.[1]||null,players:rows.map(c=>({name:c[1].replace(/\s+/g,''),completed:c.some(v=>v.includes('注册完成')),preRegistered:c.some(v=>v.includes('预注册')),note:c.at(-1),loanTo:c.at(-1).match(/租借至(.+)/)?.[1]||null}))});
      console.error(team.team+': '+rows.length+' official table rows');
    }
    await page.close();
  }
  await Promise.all([worker(),worker()]);
  console.log(JSON.stringify({version:'1.0',asOf:'2026-10-04',season:'2026-27',scope:'国内球员注册公示，不含外援；只纳入已注册完成、非预注册记录。',indexUrl:'https://www.cbaleague.com/#/news-register/detail/6a72fc344a',teams:results.sort((a,b)=>a.team.localeCompare(b.team,'zh'))}));
} finally { await browser.close(); }
'''
    process = subprocess.run([node, "--input-type=module", "-e", javascript], cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
    if process.stderr:
        print(process.stderr, file=sys.stderr)
    if process.returncode:
        raise RuntimeError("Official public-table rendering failed; previous snapshot preserved")
    snapshot = json.loads(process.stdout)
    assert len(snapshot["teams"]) == 20
    write_json(REGISTRY_FILE, snapshot)


def parse_profile(page, player_id):
    def field(pattern):
        match = re.search(pattern, page)
        return clean(match.group(1)) if match else None
    name = field(r"<title>([^_<]+)")
    if not name or "提示信息" in name:
        raise ValueError("No reliable profile identity")
    birth = field(r"生日：([0-9-]+)")
    height = field(r"身高：([0-9.]+)cm")
    position = field(r"位置：([^<]+)") or ""
    year = int(birth[:4]) if birth and re.fullmatch(r"\d{4}(?:-\d{1,2}){0,2}", birth) else None
    cm = round(float(height)) if height else None
    if year and not 1940 <= year <= 2012:
        year = None
    if cm is not None and not 150 <= cm <= 240:
        cm = None
    appearances = []
    # Some old archives put CBA rows under a China heading. Check the row's own
    # league label rather than relabelling national-team competitions as CBA.
    for row in re.findall(r"<tr\b[^>]*>(.*?)</tr>", page, re.S):
        cells = [clean(cell) for cell in re.findall(r"<td\b[^>]*>(.*?)</td>", row, re.S)]
        if len(cells) < 3 or not re.fullmatch(r"CBA联赛\d{2}-\d{2}", cells[0]) or not re.fullmatch(r"\d+", cells[2]) or int(cells[2]) <= 0:
            continue
        start = int(cells[0][-5:-3]); end = int(cells[0][-2:])
        end = (1900 if start >= 95 else 2000) + end + (100 if end < start else 0)
        if 1996 <= end <= 2026 and cells[1]:
            appearances.append({"season":end,"teamId":"CBA:"+cells[1],"league":"CBA","games":int(cells[2]),"evidence":"season-games","sourceId":"cba-sina-profile-"+player_id})
    return {"name":name,"birthYear":year,"birthDate":birth,"heightCm":cm,"positions":[code for label,code in [("后卫","G"),("前锋","F"),("中锋","C")] if label in position],"appearances":appearances}


def refresh_sina(skip_profiles=False):
    index = fetch(SINA_INDEX)
    options = re.search(r'<select[^>]*name="qleagueid"[^>]*>(.*?)</select>', index, re.S)
    if not options:
        raise RuntimeError("Public season form missing; previous snapshot preserved")
    seasons = re.findall(r'<option value="(\d+)">(\d{2}-\d{2})</option>', options.group(1))
    assert len(seasons) >= 20
    people, sources, counts = {}, [], {}

    def season_rows(item):
        league_id, label = item
        url = SINA_INDEX + "?qleagueid=" + league_id + "&qround=0"
        page = fetch(url)
        found = re.search(r"bo\.id\('league'\)\.value=\"(\d+)\"",page)
        if not found or found.group(1) != league_id:
            raise RuntimeError("Season selector mismatch: " + label)
        result = []
        for row in re.findall(r"<tr\b[^>]*>(.*?)</tr>", page,re.S):
            cells = [clean(cell) for cell in re.findall(r"<td\b[^>]*>(.*?)</td>", row,re.S)]
            link = re.search(r'/cba/player/show/(\d+)/[^>]*>(.*?)</a>', row,re.S)
            if link and len(cells) >= 4 and re.fullmatch(r"\d+",cells[3]) and int(cells[3]) > 0:
                result.append({"id":link.group(1),"name":clean(link.group(2)),"season":2000+int(label[-2:]),"team":cells[2],"games":int(cells[3])})
        return label,url,result

    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        for label,url,records in executor.map(season_rows,seasons):
            source_id = "cba-sina-season-"+label
            counts[label] = len(records)
            sources.append({"id":source_id,"title":"新浪CBA赛季出场表："+label,"url":url,"asOf":AS_OF,"note":"公开统计表全部赛段；仅取正出场数、同一行球队和赛季。空表不代表该赛季无人出场。"})
            for row in records:
                person = people.setdefault(row["id"],{"names":[],"appearances":[]})
                person["names"].append(row["name"])
                person["appearances"].append({"season":row["season"],"teamId":"CBA:"+row["team"],"league":"CBA","games":row["games"],"evidence":"season-games","sourceId":source_id})
            print(f"CBA {label}: {len(records)} positive appearance rows",flush=True)
    team_url = "https://cba.sports.sina.com.cn/cba/team/all/"
    for player_id,name in re.findall(r'/cba/player/show/(\d+)/?"[^>]*>([^<]+)</a>',fetch(team_url)):
        people.setdefault(player_id,{"names":[],"appearances":[]})["names"].append(clean(name))
    for player_id,name in ARCHIVE_PROFILES.items():
        people.setdefault(player_id,{"names":[],"appearances":[]})["names"].append(name)
    for person in people.values():
        person["names"] = sorted(set(person["names"]))
    print(f"CBA unique linked identities: {len(people)}",flush=True)
    previous = json.loads(SINA_FILE.read_text(encoding="utf-8")) if SINA_FILE.exists() else {}
    old_profiles = previous.get("profiles",{})
    profiles, errors = dict(old_profiles), {}
    candidates = [item for item in people if item not in profiles]

    def profile(player_id):
        try:
            value = parse_profile(fetch(f"https://cba.sports.sina.com.cn/cba/player/show/{player_id}/"), player_id)
            return player_id,value,None
        except Exception as error:
            return player_id,None,str(error)

    if not skip_profiles:
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            for number,(player_id,value,error) in enumerate(executor.map(profile,candidates),1):
                if error:
                    errors[player_id] = error
                else:
                    profiles[player_id] = value
                if number % 100 == 0:
                    print(f"CBA profiles {number}/{len(candidates)}",flush=True)
    snapshot = {"version":"1.0","asOf":AS_OF,"seasonCounts":counts,"sources":sources,"people":people,"profiles":profiles,"profileErrors":errors,"teamIndexUrl":team_url}
    write_json(SINA_FILE,snapshot)


def coverage(scope=None, note="未取得完整同口径生涯统计；未知不是零。"):
    return {"scope":scope,"throughSeason":None,"complete":False,"coversRecordedCareer":False,"note":note}


def audit_identity_candidates(min_id, max_id, output, only_ids=None):
    """Read only a bounded, manually reviewed candidate list; never surname-match."""
    candidates = json.loads(IDENTITY_CANDIDATES.read_text(encoding="utf-8"))["candidates"]
    normalize = lambda name:re.sub(r"[^a-z]","",unicodedata.normalize("NFKD",name).encode("ascii","ignore").decode().lower())
    nba_names = {}
    with (ROOT / "data/raw/kaggle_nba_aba_baa/csv/Player Career Info.csv").open(encoding="utf-8-sig",newline="") as handle:
        for row in csv.DictReader(handle):
            nba_names.setdefault(normalize(row["player"]),[]).append(row)
    existing = json.loads(SINA_FILE.read_text(encoding="utf-8"))["profiles"]
    spelling = {"Joe Young":"Joseph Young", "Derrick Walton":"Derrick Walton Jr.","Johnny O'Bryant":"Johnny O'Bryant III", "Pooh Jeter":"Eugene Jeter"}
    def check(item):
        player_id,english = item
        options = nba_names.get(normalize(english),[]) or nba_names.get(normalize(spelling.get(english,english)),[])
        record = {"sinaId":player_id,"englishName":english,"name":existing.get(player_id,{}).get("name"),"sourceURL":f"https://cba.sports.sina.com.cn/cba/player/show/{player_id}/","asOf":AS_OF}
        if not options:
            return record | {"status":"nba-name-not-found","note":"候选英文全名在NBA出场身份档案不存在，未合并；这不证明从未签约或参加季前赛。"}
        try:
            profile = parse_profile(fetch(record["sourceURL"]),player_id)
        except Exception as error:
            return record | {"status":"source-unavailable","note":str(error)}
        birth = profile.get("birthDate")
        if birth and re.fullmatch(r"\d{4}-\d{1,2}-\d{1,2}",birth):
            year,month,day = map(int,birth.split("-"))
            birth = f"{year:04}-{month:02}-{day:02}"
        record |= {"sinaBirthDate":birth,"heightCm":profile.get("heightCm"),"name":profile.get("name"),"nbaCandidates":[{"nbaId":r["player_id"],"englishName":r["player"],"nbaBirthDate":r["birth_date"],"heightCm":round(float(r["ht_in_in"])*2.54) if r["ht_in_in"] else None} for r in options]}
        matches = [r for r in options if r["birth_date"] == birth]
        if len(matches)==1:
            row = matches[0]
            return record | {"status":"verified","nbaId":row["player_id"],"englishName":row["player"],"nbaBirthDate":row["birth_date"],"basis":"manually-reviewed-name-and-complete-birth-date","note":"逐名人工审查译名候选，公开新浪档案完整出生日期与精确NBA全名的出生日期一致；不是同姓模糊匹配。"}
        return record | {"status":"incomplete-date" if not birth or len(birth)<10 else "conflicting-date","note":"候选仅供进一步核验；缺少一致的完整生日，暂未自动合并。"}
    rejected_hypotheses = {"1044","2487","5036","7612"}
    selected = [(key,name) for key,name in candidates.items() if key not in rejected_hypotheses and min_id<=int(key)<=max_id and (not only_ids or key in only_ids)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        rows = list(executor.map(check,selected))
    write_json(output,{"version":"1.0","asOf":AS_OF,"scope":"有界人工候选核验，不能视为全部跨联赛身份已解析。","rows":rows})
    print(json.dumps({"checked":len(rows),"verified":sum(r["status"]=="verified" for r in rows),"output":str(output)},ensure_ascii=False))


def apply_identity_audits():
    """Promote only reviewed facts. Candidate inputs are not a build dependency."""
    identity = json.loads(IDENTITY_FILE.read_text(encoding="utf-8"))
    by_id = {row["sinaId"]:row for row in identity["players"]}
    audits = {}
    for filename in ["guess-cba-identity-audit-highids.json","guess-cba-identity-audit-lowids.json","guess-cba-identity-audit-supplement.json"]:
        for row in json.loads((CONFIG/filename).read_text(encoding="utf-8"))["rows"]:
            audits[row["sinaId"]] = row
    # Independently read reports resolve these well-known identities despite the
    # Sina archive only retaining a birth year. No missing day is manufactured.
    reviewed = {
        "6929":("https://www.espn.com.au/nba/story/_/id/17681576/how-nba-players-seldom-know-retire","ESPN确认Carlos Boozer加盟广东，匹配新浪广东出场、1981出生年和206cm；新浪未提供完整生日。"),
        "6949":("https://www.nba.com/pelicans/news/pelicans-sign-josh-smith","鹈鹕官方签约公告确认Josh Smith的四川履历，匹配新浪完整译名、1985出生年和206cm。"),
        "7069":("https://www.si.com/nba/cavaliers/nba/cavaliers/nba-amico/big-man-jefferson-to-play-in-china","公开报道确认Al Jefferson效力新疆，匹配新浪完整译名、1985出生年和208cm，不与Cory Jefferson合并。"),
        "7254":("https://www.fiba.basketball/en/news/what-we-should-know-about-the-cbas-return-to-action","FIBA明确OJ Mayo效力辽宁，匹配新浪辽宁出场及1987出生年，不根据Mayo姓氏单独推断。"),
        "6975":("https://www.nba.com/wizards/wizards-sign-ty-lawson","奇才官方公告确认Ty Lawson山东履历，匹配新浪完整译名、1987出生年及山东出场。"),
        "6931":("https://www.nba.com/celtics/news/pressrelease/boston-celtics-sign-guerschon-yabusele","凯尔特人官方公告确认Guerschon Yabusele上海履历，匹配新浪亚布塞莱身份和出生年。"),
        "6848":("https://www.nba.com/news/greg-oden-working-student-coach-ohio-state-portland-trail-blazers","NBA官方报道确认Greg Oden在中国打球；新浪完整译名、1988年1月出生与NBA身份对应。")
    }
    for player_id,(url,note) in reviewed.items():
        row = audits[player_id]
        assert len(row["nbaCandidates"])==1
        row.update(row["nbaCandidates"][0])
        row.update({"status":"verified","basis":"unique-name-and-verified-cross-league-career","sourceURL":url,"note":note})
    # Explicit duplicate archive profiles, linked via a fully named profile
    # already confirmed by its complete NBA birth date. Preserve date conflicts.
    archive_links = {
        "7599":("7487","格雷格·门罗与旧档案7487完整译名、出生年及208cm一致；新档案生日为6月3日，旧档案与NBA为6月4日。显式合并同人但保留生日冲突。"),
        "7595":("7470","摩西·赖特与已核实7470为同一完整译名；新档案生日1970-01-01是明显占位值，身高206cm与NBA对应，不把占位日期写入背景字段。"),
        "7102":("7628","阿奇-古德温旧档案缺生日；与新档案7628完整译名对应，后者经完整生日确认NBA Archie Goodwin。没有基于Goodwin姓氏泛化合并。")
    }
    for player_id,(known_id,note) in archive_links.items():
        known = audits[known_id]
        assert known["status"]=="verified"
        row = audits[player_id]
        row.update({key:known[key] for key in ["nbaId","englishName","nbaBirthDate"]})
        row.update({"status":"verified","basis":"explicit-duplicate-profile-linked-to-verified-full-name","sourceURL":f"https://cba.sports.sina.com.cn/cba/player/show/{known_id}/","note":note})
    for player_id,row in audits.items():
        if row["status"] != "verified" or player_id in by_id:
            continue
        assert row.get("nbaId") and row.get("nbaBirthDate")
        by_id[player_id] = {"sinaId":player_id,"nbaId":row["nbaId"],"englishName":row["englishName"],"chineseName":row["name"],"sinaBirthDate":row.get("sinaBirthDate"),"nbaBirthDate":row["nbaBirthDate"],"basis":row["basis"],"note":row.get("note","完整姓名与完整出生日期核对一致。")}
        if row.get("sourceURL"):
            by_id[player_id]["sourceURL"] = row["sourceURL"]
    # Reject incorrect candidate hypotheses instead of presenting them as
    # unresolved evidence that these different people share an identity.
    rejected = {"1044","2487","5036","7612","140","1393","1402","1453","7030","1027"}
    unresolved = [{"sinaId":key,"name":row.get("name"),"status":row["status"],"note":"跨联赛身份线索不足或档案有冲突，保留独立来源身份，未作为已验证映射。"} for key,row in audits.items() if row["status"]!="verified" and key not in rejected and key not in by_id]
    identity["players"] = list(by_id.values())
    identity["resolutionSummary"] = {"asOf":AS_OF,"reviewedCandidates":len(audits),"verifiedNbaMappings":len(by_id),"unresolvedCount":len(unresolved),"unresolved":unresolved,"rejectedCandidateIds":sorted(key for key in rejected if audits.get(key,{}).get("status")!="verified"),"complete":False,"note":"仅合并逐人核实的跨联赛身份；剩余候选因资料缺失或冲突暂保留，不承诺全部跨联赛身份彻底去重。未经核验的候选英文身份不公开为事实。"}
    write_json(IDENTITY_FILE,identity)
    print(json.dumps({"verifiedMappings":len(by_id),"unresolved":len(unresolved)},ensure_ascii=False))


def refresh_current_links():
    snapshot = json.loads(SINA_FILE.read_text(encoding="utf-8"))
    page = fetch("https://cba.sports.sina.com.cn/cba/team/all/")
    snapshot["currentIndexLinks"] = [{"id":player_id,"name":clean(name)} for player_id,name in re.findall(r'/cba/player/show/(\d+)/?"[^>]*>([^<]+)</a>',page)]
    write_json(SINA_FILE,snapshot)


def build():
    archive = json.loads(SINA_FILE.read_text(encoding="utf-8"))
    registry = json.loads(REGISTRY_FILE.read_text(encoding="utf-8"))
    identity = json.loads(IDENTITY_FILE.read_text(encoding="utf-8"))
    identity_rows = {"cba-sina-"+row["sinaId"]:row for row in identity["players"]}
    # Check exact NBA IDs and dates against the original local identity archive
    # when available. The checked-in factual crosswalk supports offline builds.
    nba_file = ROOT / identity["nbaSource"]["localFile"]
    if nba_file.exists():
        with nba_file.open(encoding="utf-8-sig",newline="") as handle:
            nba_people = {row["player_id"]:row for row in csv.DictReader(handle)}
        for row in identity_rows.values():
            assert row["nbaId"] in nba_people, "Unknown NBA identity: " + row["nbaId"]
            assert row["nbaBirthDate"] == nba_people[row["nbaId"]]["birth_date"]
    active_name_ids = {}
    for item in archive.get("currentIndexLinks",[]):
        active_name_ids.setdefault(item["name"],set()).add(SINA_REDIRECTS.get(item["id"],item["id"]))
    sources = archive["sources"].copy()
    sources.append(identity["nbaSource"] | {"asOf":identity["asOf"],"note":identity["method"]})
    registered = {}
    excluded = []
    for team in registry["teams"]:
        source_id = "cba-official-registration-" + team["url"].rsplit("/",1)[-1]
        sources.append({"id":source_id,"title":team["title"],"url":team["url"],"asOf":AS_OF,"note":"官网公开名单更新时间："+str(team["updated"])+"；注册和实际出场是两种独立证据。"})
        for player in team["players"]:
            if not player["completed"] or player["preRegistered"]:
                excluded.append({"name":player["name"],"team":team["team"],"reason":"不是已完成的普通注册记录"})
                continue
            target_team = player["loanTo"] or team["team"]
            registered.setdefault(player["name"],[]).append({"season":2027,"teamId":"CBA:"+TEAM_NAMES.get(target_team,target_team),"team":TEAM_NAMES.get(target_team,target_team),"sourceId":source_id,"updatedAt":team["updated"],"scope":"2026–27国内球员注册","status":"注册完成","note":player["note"]})
    players = []
    matched_names = set()
    for player_id,entry in archive["people"].items():
        if player_id in QUARANTINE_IDS:
            continue
        profile = archive["profiles"].get(player_id,{})
        name = profile.get("name") or entry["names"][0]
        aliases = sorted(set(entry["names"]+[name]))
        official_matches = [candidate for candidate in aliases if candidate in registered]
        if len(official_matches) > 1:
            raise ValueError("Ambiguous official-name match: " + name)
        canonical_id = SINA_REDIRECTS.get(player_id,player_id)
        registration = registered.get(official_matches[0],[]) if official_matches and active_name_ids.get(official_matches[0],{canonical_id}) == {canonical_id} else []
        if registration:
            matched_names.update(official_matches)
        # Explicit name matches are safe only when a Sina identity is unique. A
        # second archive identity with that name is rejected below for review.
        appearance_map = {}
        # Index aliases must plausibly identify the linked profile. For conflicting
        # labels use only the profile's own correctly labelled CBA history rows.
        normalized = lambda text:re.sub(r"[·.\-\s]","",text)
        identity_consistent = not profile or any(normalized(n) and (normalized(n) in normalized(name) or normalized(name) in normalized(n)) for n in entry["names"])
        for item in (entry["appearances"] if identity_consistent else []) + profile.get("appearances",[]):
            appearance_map[(item["season"],item["teamId"])] = item
        appearances = sorted(appearance_map.values(),key=lambda item:(item["season"],item["teamId"]))
        birth_year = profile.get("birthYear")
        if birth_year and appearances and any(not 13 <= item["season"]-birth_year <= 50 for item in appearances):
            birth_year = None  # includes Unix-epoch placeholder birthdays in old archives
        height = profile.get("heightCm")
        if height is not None and not 150 <= height <= 240:
            height = None
        if not appearances and not registration:
            continue
        profile_source = "cba-sina-profile-"+player_id
        source_url = f"https://cba.sports.sina.com.cn/cba/player/show/{player_id}/"
        sources.append({"id":profile_source,"title":"新浪CBA球员公开档案："+name,"url":source_url,"asOf":AS_OF,"note":"身高、出生年、位置为档案事实；只取历史表正出场数，不使用页头赛季推断现役。缺失资料保留未知。"})
        source_ids = sorted({profile_source,*[item["sourceId"] for item in appearances],*[item["sourceId"] for item in registration]})
        team_ids = sorted({item["teamId"] for item in appearances})
        easy = bool(set(aliases)&EASY_NAMES) and player_id not in {"7362"}
        pools = (["cba-history"] if appearances else []) + (["cba-active"] if registration else []) + (["cba-easy"] if easy else []) + ["global"]
        player = {"id":"cba-sina-"+player_id,"directoryId":None,"name":name,"chineseName":name,"aliases":aliases,"pools":pools,"birthYear":profile.get("birthYear"),"heightCm":profile.get("heightCm"),"positions":profile.get("positions",[]),"teams":[{"id":value,"name":value.split(":",1)[1]} for value in team_ids],"teamsComplete":False,"teamsScope":"CBA已核实实际出场球队","country":None,"firstSeasonYear":None,"firstSeasonScope":None,"sourceIds":source_ids,"sourceURLs":[source_url],"asOf":AS_OF,"fieldSources":{key:[profile_source] if profile.get(key) else [] for key in ["birthYear","heightCm","positions"]},"notes":["历史池仅代表全部已收录、具有正出场证据的球员，不宣称全史完整。","现役以2026–27官方国内注册快照为准，不含尚未核实的外援；注册不等于已在该赛季出场。","不以最早存档赛季冒充职业首秀；CBA生涯指标无完整同口径核验时保留未知。"],"appearances":appearances,"seasonYears":sorted({item["season"] for item in appearances}),"careerStartYear":None,"careerEndYear":None,"registrationEvidence":registration,"poolMembership":{"cba-history":{"eligible":bool(appearances),"basis":"verified-positive-appearances"},"cba-active":{"eligible":bool(registration),"basis":"official-domestic-completed-registration","season":"2026-27","asOf":AS_OF},"cba-easy":{"eligible":bool(set(aliases)&EASY_NAMES),"basis":"editorial-famous-selection","note":"编辑主观精选，不是官方知名度排名。"}},"appearanceCoverage":{"verifiedOnly":True,"complete":False,"scope":"CBA公开正出场数记录","throughSeason":max((item["season"] for item in appearances),default=None),"note":"公开赛季索引与个人历史表，不以注册或生涯连续区间补齐出场。"}}
        for key in METRICS:
            player[key] = None
        player["metricCoverage"] = {key:coverage() for key in METRICS}
        player["metricCoverage"]["seasonYears"] = coverage("CBA",player["appearanceCoverage"]["note"])
        player["metricScope"] = {key:None for key in METRICS} | {"seasonYears":"CBA"}
        for key in METRICS+["firstSeasonYear","careerStartYear","careerEndYear","country"]:
            player["fieldSources"][key] = []
        for key in ["teams","appearances","seasonYears"]:
            player["fieldSources"][key] = sorted({item["sourceId"] for item in appearances})
        players.append(player)
        player["birthYear"], player["heightCm"] = birth_year, height
        player["poolMembership"]["cba-easy"]["eligible"] = easy
    redirects = {key:row["nbaId"] for key,row in identity_rows.items()}
    by_id = {player["id"]:player for player in players}
    for old,new in SINA_REDIRECTS.items():
        old_id,new_id = "cba-sina-"+old,"cba-sina-"+new
        if old_id not in by_id or new_id not in by_id:
            continue
        prior,canonical = by_id[old_id],by_id[new_id]
        assert prior["birthYear"] == canonical["birthYear"]
        assert re.sub(r"[·\-]","",prior["name"]) == re.sub(r"[·\-]","",canonical["name"]) or (old,new)==("7601","7519")
        canonical["aliases"] = sorted(set(canonical["aliases"]+prior["aliases"]))
        canonical["pools"] = sorted(set(canonical["pools"]+prior["pools"]))
        canonical["sourceIds"] = sorted(set(canonical["sourceIds"]+prior["sourceIds"]))
        canonical["sourceURLs"] = sorted(set(canonical["sourceURLs"]+prior["sourceURLs"]))
        for key in canonical["fieldSources"]:
            canonical["fieldSources"][key] = sorted(set(canonical["fieldSources"][key]+prior["fieldSources"].get(key,[])))
        canonical["appearances"] = sorted({(item["season"],item["teamId"]):item for item in canonical["appearances"]+prior["appearances"]}.values(),key=lambda item:(item["season"],item["teamId"]))
        canonical["seasonYears"] = sorted({item["season"] for item in canonical["appearances"]})
        canonical["teams"] = sorted({item["id"]:item for item in canonical["teams"]+prior["teams"]}.values(),key=lambda item:item["id"])
        canonical["registrationEvidence"] = list({(item["sourceId"],item["teamId"]):item for item in canonical["registrationEvidence"]+prior["registrationEvidence"]}.values())
        canonical["appearanceCoverage"]["throughSeason"] = max(canonical["seasonYears"],default=None)
        for key in canonical["poolMembership"]:
            canonical["poolMembership"][key]["eligible"] = key in canonical["pools"]
        if prior["heightCm"] != canonical["heightCm"]:
            canonical["heightCm"] = None
            canonical["notes"].append("重复档案身高冲突，未选边或取平均，保留未知。")
        canonical["notes"].append("两个新浪档案经完整姓名与完整出生日期"+MERGE_BIRTH_DATES[new]+"核对为同一人，显式合并。")
        redirects[old_id] = new_id
    players = [player for player in players if player["id"].removeprefix("cba-sina-") not in SINA_REDIRECTS]
    duplicate_registered_names = [name for name in matched_names if sum(name in player["aliases"] and bool(player["registrationEvidence"]) for player in players)>1]
    if duplicate_registered_names:
        raise ValueError("Official registry requires identity review: " + str(duplicate_registered_names))
    # New registered rookies may have no historical archive. Their name and
    # registration are known; all unverified bio/appearance fields stay unknown.
    missing_registered = sorted(set(registered)-matched_names)
    for name in missing_registered:
        registration = registered[name]
        source_ids = sorted({item["sourceId"] for item in registration})
        player = {"id":"cba-registered-"+name,"directoryId":None,"name":name,"chineseName":name,"aliases":[name],"pools":["cba-active","global"],"birthYear":None,"heightCm":None,"positions":[],"teams":[],"teamsComplete":False,"teamsScope":"CBA已核实实际出场球队","country":None,"firstSeasonYear":None,"firstSeasonScope":None,"sourceIds":source_ids,"sourceURLs":[next(s["url"] for s in sources if s["id"]==source_ids[0])],"asOf":AS_OF,"fieldSources":{key:[] for key in METRICS+["birthYear","heightCm","positions","teams","firstSeasonYear","seasonYears","careerStartYear","careerEndYear","country","appearances"]},"notes":["官方国内注册名单已核实，尚无匹配的生涯档案；未知资料不编造。","注册记录不转换为出场证据，因此限定实际出场年份/球队的题目不会抽到无出场资料者。"],"appearances":[],"seasonYears":[],"careerStartYear":None,"careerEndYear":None,"registrationEvidence":registration,"poolMembership":{"cba-active":{"eligible":True,"basis":"official-domestic-completed-registration","season":"2026-27","asOf":AS_OF}},"appearanceCoverage":{"verifiedOnly":True,"complete":False,"scope":"CBA","throughSeason":None,"note":"注册不是实际出场证据。"},"metricCoverage":{key:coverage() for key in METRICS},"metricScope":{key:None for key in METRICS}}
        player["metricCoverage"]["seasonYears"] = coverage("CBA")
        player["metricScope"]["seasonYears"] = "CBA"
        for key in METRICS:
            player[key] = None
        players.append(player)
    for player in players:
        if player["id"] not in identity_rows:
            continue
        row = identity_rows[player["id"]]
        player["aliases"] = sorted(set(player["aliases"]+[row["englishName"],row["chineseName"]]+row.get("aliases",[])))
        player["identityEvidence"] = row | {"asOf":identity["asOf"],"nbaIdentitySourceId":identity["nbaSource"]["id"]}
        player["sourceIds"].append(identity["nbaSource"]["id"])
        player["notes"].append("跨联赛身份经过显式核对："+row["englishName"]+"；"+row.get("note","姓名和完整出生日期一致。"))
        if row.get("sourceURL"):
            source_id = "cba-nba-identity-"+row["sinaId"]
            sources.append({"id":source_id,"title":"NBA/CBA身份履历交叉核验："+row["englishName"],"url":row["sourceURL"],"asOf":identity["asOf"],"note":row["note"]})
            player["sourceIds"].append(source_id)
            player["sourceURLs"].append(row["sourceURL"])
    assert len([p for p in players if "cba-active" in p["pools"]]) == len(registered)
    assert all(sum(name in p["aliases"] and "cba-active" in p["pools"] for p in players)==1 for name in registered)
    assert not any(row["name"] in p["aliases"] for row in excluded for p in players if "cba-active" in p["pools"])
    pool_defs = [("cba-active","CBA 现役 · 国内注册","2026–27赛季20队国内球员已完成注册快照；不含未核实的外援、不把预注册当作正式注册。"),("cba-history","CBA 全部已收录","全部已收录、具有CBA实际出场证据的历史球员；不是CBA全史完备名单。"),("cba-easy","CBA 简单 · 知名球星","编辑主观挑选较熟悉的历史和现役球员；不表示实力或人气排名。")]
    pools = [{"id":key,"name":name,"description":description,"count":sum(key in p["pools"] for p in players)} for key,name,description in pool_defs]
    return {"version":"1.0","dataAsOf":AS_OF,"meta":{"identityResolution":identity.get("resolutionSummary",{"complete":False,"verifiedNbaMappings":len(identity_rows),"note":"仅合并逐人确认的身份，不宣称跨联赛全部身份已解析。"}),"registrationSeason":"2026-27","registeredTeams":20,"registrationScope":"官方国内球员注册，不含外援；快照非实时","officialRegisteredPeople":len(registered),"unmatchedRegisteredBios":missing_registered,"excludedRegistrationRows":excluded,"quarantinedArchiveIds":QUARANTINE_IDS,"historicalComplete":False,"seasonIndexRows":archive["seasonCounts"],"profileCount":len(archive["profiles"]),"profileErrors":archive["profileErrors"],"simpleSelection":"主观编辑精选，部分早期名将将由主数据中已有官方事实记录合并。","note":"新浪公开统计为非官方事实资料，仅保存姓名、必要背景字段、赛季球队正出场数；不保存整篇文章、原网页或照片。"},"pools":pools,"sources":sources,"players":players,"identityRedirects":redirects}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--refresh-registration", action="store_true")
    parser.add_argument("--refresh-sina", action="store_true")
    parser.add_argument("--skip-profiles", action="store_true")
    parser.add_argument("--refresh-current-links", action="store_true")
    parser.add_argument("--node", default=shutil.which("node"))
    parser.add_argument("--audit-identities", action="store_true")
    parser.add_argument("--apply-identity-audits", action="store_true")
    parser.add_argument("--min-id", type=int, default=5000)
    parser.add_argument("--max-id", type=int, default=9999)
    parser.add_argument("--audit-output", default="guess-cba-identity-audit-highids.json")
    parser.add_argument("--audit-ids", help="Optional comma-separated source IDs for a bounded supplement")
    args = parser.parse_args()
    if args.apply_identity_audits:
        apply_identity_audits()
        sys.exit(0)
    if args.audit_identities:
        if Path(args.audit_output).name != args.audit_output:
            parser.error("--audit-output must be a filename within config")
        audit_identity_candidates(args.min_id,args.max_id,CONFIG/args.audit_output,set(args.audit_ids.split(",")) if args.audit_ids else None)
        sys.exit(0)
    if args.refresh_registration:
        if not args.node:
            parser.error("--node is required to render public registration pages")
        refresh_registration(args.node)
    if args.refresh_sina:
        refresh_sina(args.skip_profiles)
    if args.refresh_current_links:
        refresh_current_links()
    result = build()
    assert len({p["id"] for p in result["players"]}) == len(result["players"])
    source_ids = {source["id"] for source in result["sources"]}
    assert all(set(player["sourceIds"]) <= source_ids for player in result["players"])
    assert all(item["games"]>0 and item["sourceId"] in source_ids for player in result["players"] for item in player["appearances"])
    write_json(OUTPUT,result)
    print(json.dumps({"players":len(result["players"]),"pools":result["pools"],"unmatchedRegisteredBios":result["meta"]["unmatchedRegisteredBios"]},ensure_ascii=False))
