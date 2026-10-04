"""Build a small, source-linked offline men's basketball guessing-game pool.

Normal execution uses only retained local JSON/CSV/source snapshots. --refresh-cba explicitly reads the
public Sina CBA profile pages and stores only the few factual fields needed.
It does not access private APIs, credentials, or encrypted CBA response data.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import csv
import html
import json
import re
import unicodedata
import urllib.request
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
APP_DATA = ROOT / "app" / "data"
AS_OF = "2026-10-03"
CBA_CACHE = APP_DATA / "guess-source-cba.json"
APPEARANCE_CACHE = ROOT / "config" / "guess-appearance-evidence.json"
PROCESSED = ROOT / "data" / "processed"
RAW_CSV = ROOT / "data" / "raw" / "kaggle_nba_aba_baa" / "csv"
ALL_TIME = ROOT / "data" / "raw" / "kaggle_nba_all_time" / "csv"
METRICS = ["teamCount", "playoffAppearances", "finalsAppearances", "pointsPerGame", "mvpCount"]
EURO_URL = "https://mediacentre.euroleague.net/uploads/EuroleagueCore/pastmatchups/game18691.pdf"
YAO_URL = "https://www.nba.com/news/legendary-moments-history-houston-rockets-draft-yao-ming-2002"
CBA_SELECTION = "胡金秋 孙铭徽 赵继伟 张镇麟 付豪 赵睿 周琦 曾凡博 胡明轩 徐杰 杜润旺 任骏飞 徐昕 郭艾伦 陈盈骏 王哲林 李弘权 王睿泽 廖三宁 邹雨宸 高诗岩 陶汉林 贺希宁 沈梓捷 吴前 程帅澎 姜伟泽 姜宇星 翟晓川 范子铭 刘晓宇 周鹏".split()
TEAM_IDS = [1, 4, 6, 8, 9, 10, 12, 13, 15, 16, 114, 369]
# Factual transcription of the two clearly labelled roster columns, PDF pp.3-4.
# This is a dated two-club selection, not a claim of global representativeness.
EURO_RECORDS = [
    ("Markus Howard", "G", 178, 1999, "Baskonia"),
    ("Thomas Walkup", "G", 193, 1992, "Olympiacos"),
    ("Frank Ntilikina", "G", 194, 1998, "Olympiacos"),
    ("Keenan Evans", "G", 191, 1996, "Olympiacos"),
    ("Tyson Ward", "F", 198, 1997, "Olympiacos"),
    ("Giannoulis Larentzakis", "G", 196, 1993, "Olympiacos"),
    ("Sasha Vezenkov", "F", 206, 1995, "Olympiacos"),
    ("Tadas Sedekerskis", "F", 206, 1998, "Baskonia"),
    ("Kostas Papanikolaou", "F", 204, 1990, "Olympiacos"),
    ("Matteo Spagnolo", "G", 193, 2003, "Baskonia"),
    ("Tyler Dorsey", "G", 196, 1996, "Olympiacos"),
    ("Trent Forrest", "G", 193, 1998, "Baskonia"),
    ("Alec Peters", "F", 206, 1995, "Olympiacos"),
    ("Nikola Milutinov", "C", 213, 1994, "Olympiacos"),
    ("Kostas Antetokounmpo", "C", 208, 1997, "Olympiacos"),
    ("Donta Hall", "C", 208, 1997, "Olympiacos"),
    ("Shaquielle McKissic", "G", 196, 1990, "Olympiacos"),
    ("Evan Fournier", "F", 200, 1992, "Olympiacos"),
]


def slug(text):
    text = unicodedata.normalize("NFKD", text)
    return re.sub(r"[^a-z0-9]+", "-", text.encode("ascii", "ignore").decode().lower()).strip("-")


def fetch(url):
    with urllib.request.urlopen(url, timeout=20) as response:
        return response.read().decode("gbk", errors="strict")


def rows(path):
    with path.open(encoding="utf-8-sig", newline="") as stream:
        return list(csv.DictReader(stream))


def end_year(label):
    start, end = label.split("-")
    return int(end) if len(end) == 4 else int(start[:2] + end) + (100 if int(end) < int(start[-2:]) else 0)


def parse_cba_appearances(page, source_id):
    """Read only season/team rows with a positive games count, never the profile header.

    Some Sina headers show 2025-26 even for retired players. Their historical
    statistics table carries the actual paired season, team and played games.
    """
    appearances = {}
    section = re.search(r"CBA个人历史数据.*?<tbody>(.*?)</tbody>", page, flags=re.S)
    if not section:
        return []
    for row in re.findall(r"<tr\b[^>]*>(.*?)</tr>", section.group(1), flags=re.S):
        cells = [html.unescape(re.sub(r"<[^>]+>", "", cell)).strip()
                 for cell in re.findall(r"<td\b[^>]*>(.*?)</td>", row, flags=re.S)]
        if len(cells) < 3:
            continue
        season_match = re.fullmatch(r"CBA联赛(\d{2})-(\d{2})", cells[0])
        if not season_match or not re.fullmatch(r"\d+", cells[2]) or int(cells[2]) <= 0:
            continue
        start = int(season_match.group(1))
        year = end_year(("19" if start >= 95 else "20") + "-".join(season_match.groups()))
        if not cells[1] or not 1996 <= year <= 2026:
            continue
        appearance = {"season": year, "teamId": "CBA:" + cells[1], "league": "CBA",
                      "sourceId": source_id, "games": int(cells[2]), "evidence": "season-games"}
        appearances[(year, appearance["teamId"])] = appearance
    return sorted(appearances.values(), key=lambda item: (item["season"], item["teamId"]))


def refresh_cba_appearances():
    """Refresh only factual played-season evidence; retain manual official evidence."""
    cache = json.loads(APPEARANCE_CACHE.read_text(encoding="utf-8"))
    records = json.loads(CBA_CACHE.read_text(encoding="utf-8"))["records"]

    def get_record(record):
        page = fetch(record["sourceUrl"])
        title = re.search(r"<title>([^_<]+)", page)
        if not title or title.group(1) != record["name"]:
            raise ValueError(f"CBA identity mismatch: {record['name']}")
        source_id = record["id"] + "-played-seasons"
        return record, source_id, parse_cba_appearances(page, source_id)

    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        refreshed = list(executor.map(get_record, records))
    source_ids = {source_id for _, source_id, _ in refreshed}
    cache["sources"] = [source for source in cache["sources"] if source["id"] not in source_ids]
    for record, source_id, appearances in refreshed:
        if not appearances:
            raise ValueError(f"No actual historical games found for {record['name']}; old cache preserved")
        cache["sources"].append({"id": source_id, "title": f"新浪CBA历史出场表：{record['name']}",
            "url": record["sourceUrl"], "asOf": "2026-10-04",
            "note": "非官方公开统计表：仅采集 CBA个人历史数据 中场次大于0的赛季、球队、场次；不采用页面标题赛季、近期比赛与档案球队的推断连接，也不插值。"})
        cache["players"][record["id"]] = appearances
    cache["retrievedAt"] = "2026-10-04"
    APPEARANCE_CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def load_nba_appearances(player_ids):
    """A season and its team must come from the SAME actual-appearance row."""
    result = {player_id: {} for player_id in player_ids}
    for row in rows(RAW_CSV / "Player Totals.csv"):
        if row["player_id"] not in result or row["lg"] not in ("NBA", "BAA"):
            continue
        if float(row["g"] or 0) <= 0 or re.fullmatch(r"TOT|\d+TM", row["team"], flags=re.I):
            continue
        appearance = {"season": int(row["season"]), "teamId": "NBA:" + row["team"],
            "league": row["lg"], "sourceId": "nba-career-games", "games": int(float(row["g"])), "evidence": "season-games"}
        result[row["player_id"]][(appearance["season"], appearance["teamId"])] = appearance
    return {player_id: sorted(items.values(), key=lambda item: (item["season"], item["teamId"]))
            for player_id, items in result.items()}


def field_coverage(scope=None, through=None, complete=False, career_complete=False, note="未取得完整可比生涯资料，未知不是 0。"):
    return {"scope": scope, "throughSeason": through, "complete": bool(complete),
            "coversRecordedCareer": bool(career_complete), "note": note}


def load_franchises():
    """Resolve historical abbreviations only within their documented date ranges."""
    records = [row for row in rows(ALL_TIME / "all_time_teams.csv") if "NBA" in row["Lg"] or "BAA" in row["Lg"]]
    last_year = max(end_year(row["To"]) for row in records)
    team_names = {(int(row["season"]), row["abbreviation"]): row["team"]
                  for row in rows(RAW_CSV / "Team Abbrev.csv") if row["lg"] in ("NBA", "BAA")}

    def resolve(code, year):
        matches = set()
        for row in records:
            if row["Team Abbr"] != code or year < end_year(row["From"]):
                continue
            in_range = year <= end_year(row["To"])
            # The archive ends in 2024. Later rows may extend only an unchanged
            # active franchise code AND full team name verified in the newer table.
            unchanged = (year > last_year and end_year(row["To"]) == last_year
                         and row["Status"] == "active" and code == row["Current Abbr"]
                         and team_names.get((year, code)) == row["Franchise"])
            if in_range or unchanged:
                matches.add(row["Current Abbr"])
        return next(iter(matches)) if len(matches) == 1 else None
    assert resolve("SEA", 2008) == resolve("OKC", 2009) == "OKC"
    assert resolve("NJN", 2012) == resolve("BRK", 2013) == "BRK"
    assert resolve("CHH", 2002) == "CHO" and resolve("NOH", 2003) == "NOP"
    assert resolve("BAL", 1970) == "WAS" and resolve("BLB", 1950) == "BLB"
    assert resolve("BAL", 1950) is None
    return resolve


def actual_postseason_seasons(player_ids):
    """Count actual postseason appearances, never mere regular-season roster links.

    The retained schedule identifies Finals (not conference finals). DNP rows
    carry neither minutes nor recorded stats, while early box scores can omit
    minutes despite genuine appearances. Audit every scheduled Finals game.
    """
    schedule = pd.read_csv(ALL_TIME / "schedule.csv", dtype={"Game Reference": "string"})
    schedule = schedule[schedule["League"].isin(["NBA", "BAA"]) & schedule["Playoffs"].eq(True)].copy()
    schedule["year"] = schedule["Season"].map(end_year)
    expected = {int(year): set(group["Game Reference"]) for year, group in schedule.groupby("year")}
    expected_finals = {int(year): set(group["Game Reference"]) for year, group in schedule[schedule["Series"].eq("Finals")].groupby("year")}
    assert set(expected) == set(range(min(expected), max(expected) + 1))
    assert set(expected_finals) == set(expected)
    seasons = {player_id: set() for player_id in player_ids}
    playoff_seasons = {player_id: set() for player_id in player_ids}
    complete_years, complete_playoff_years = set(), set()
    columns = {"Game Reference", "Period", "Player Reference", "MP", "PTS", "TRB", "AST", "Reason"}
    for year, refs in sorted(expected.items()):
        league = "BAA" if year <= 1949 else "NBA"
        path = ALL_TIME / "boxscores_by_year" / f"{league}_{year - 1}-{year}_basic.csv"
        if not path.exists():
            continue
        frame = pd.read_csv(path, usecols=lambda column: column in columns,
                            dtype={"Game Reference": "string", "Player Reference": "string"}, low_memory=False)
        frame = frame[frame["Game Reference"].isin(refs) & frame["Period"].astype(str).str.lower().eq("game")]
        minutes = frame["MP"].astype("string").str.split(":").str[0]
        played = pd.to_numeric(minutes, errors="coerce").gt(0) | frame[[key for key in ("PTS", "TRB", "AST") if key in frame]].notna().any(axis=1)
        if "Reason" in frame:
            played &= frame["Reason"].isna()
        frame = frame[played]
        if refs <= set(frame["Game Reference"]):
            complete_playoff_years.add(year)
        if expected_finals[year] <= set(frame["Game Reference"]):
            complete_years.add(year)
        for player_id in set(frame["Player Reference"]) & player_ids:
            playoff_seasons[player_id].add(year)
        frame = frame[frame["Game Reference"].isin(expected_finals[year])]
        for player_id in set(frame["Player Reference"]) & player_ids:
            seasons[player_id].add(year)
    return seasons, playoff_seasons, complete_years, complete_playoff_years, min(expected), max(expected)


def load_career_metrics(directory):
    ids = {player["id"] for player in directory["players"]}
    regular = rows(PROCESSED / "regular_season_by_season.csv")
    regular = [row for row in regular if float(row["g"] or 0) > 0]
    regular_through = max(int(row["season"]) for row in regular)
    regular_by_id = {player_id: [] for player_id in ids}
    for row in regular:
        if row["player_id"] in ids:
            regular_by_id[row["player_id"]].append(row)
    resolve_franchise = load_franchises()
    stints = {player_id: [] for player_id in ids}
    for row in rows(RAW_CSV / "Player Totals.csv"):
        if row["player_id"] in ids and row["lg"] in ("NBA", "BAA") and float(row["g"] or 0) > 0:
            if not re.fullmatch(r"TOT|\d+TM", row["team"], flags=re.I):
                stints[row["player_id"]].append((row["team"], int(row["season"])))
    po_rows = rows(PROCESSED / "playoffs_by_season.csv")
    po_through = max(int(row["season"]) for row in po_rows)
    finals, playoffs, finals_complete, playoffs_complete, finals_first, finals_through = actual_postseason_seasons(ids)
    assert po_through == finals_through == 2024
    mvp_text = (ROOT / "data" / "raw" / "nba_mvp_official.md").read_text(encoding="utf-8")
    mvp_years = {end_year(label) for label in re.findall(r"(?m)^(\d{4}-\d{2})\s*—", mvp_text)}
    assert mvp_years == set(range(1956, max(mvp_years) + 1)), "MVP winner snapshot has a missing season"
    mvp_through = max(mvp_years)
    result = {}
    for player in directory["players"]:
        player_id = player["id"]
        career = regular_by_id[player_id]
        years = sorted({int(row["season"]) for row in career})
        franchises = {resolve_franchise(code, year) for code, year in stints[player_id]}
        team_complete = bool(franchises) and None not in franchises and {year for _, year in stints[player_id]} == set(years)
        games = sum(int(float(row["g"])) for row in career)
        scoring_complete = all(row["pts"] not in ("", "NA", "NaN") for row in career)
        points = sum(float(row["pts"]) for row in career) if scoring_complete else None
        finals_ok = set(range(max(min(years), finals_first), min(max(years), finals_through) + 1)) <= finals_complete
        playoffs_ok = set(range(max(min(years), finals_first), min(max(years), po_through) + 1)) <= playoffs_complete
        coverage = {
            "teamCount": field_coverage("NBA/BAA", regular_through, team_complete, max(years) <= regular_through,
                "有常规赛实际出场的 NBA/BAA franchise 数；按球队沿革与赛季去重，同队改名/迁址不重复，同队回归不增加；不含 ABA/CBA/海外球队。"),
            "playoffAppearances": field_coverage("NBA/BAA", po_through, playoffs_ok, max(years) <= po_through,
                f"实际至少出场一场 NBA/BAA 季后赛的赛季数，去重赛季；统一截至 {po_through - 1}–{str(po_through)[-2:]}，不是系列赛数或附加赛数；不含之后赛季。"),
            "finalsAppearances": field_coverage("NBA/BAA", finals_through, finals_ok, max(years) <= finals_through,
                f"逐场赛程标记 Finals 且球员实际出场的 NBA/BAA 赛季数；不计 DNP、仅名单成员或分区决赛；统一截至 {finals_through - 1}–{str(finals_through)[-2:]}。"),
            "pointsPerGame": field_coverage("NBA/BAA", regular_through, scoring_complete, max(years) <= regular_through,
                f"NBA/BAA 生涯常规赛总得分 ÷ 实际总出场数，保留一位小数（不是各赛季场均的简单平均）；截至 {regular_through - 1}–{str(regular_through)[-2:]}。"),
            "mvpCount": field_coverage("NBA", mvp_through, True, max(years) <= mvp_through,
                f"NBA 官方常规赛 MVP 获奖次数，奖项始于 1955–56；截至 {mvp_through - 1}–{str(mvp_through)[-2:]}；不含 FMVP、ABA 或其他联赛 MVP。"),
            "seasonYears": field_coverage("NBA/BAA", regular_through, True, max(years) <= regular_through,
                "实际常规赛出场赛季的结束年；如 2024 代表 2023–24，生涯中断年份不自动补齐。"),
        }
        result[player_id] = {"teamCount": len(franchises) if team_complete else None,
            "franchiseIds": sorted(franchise for franchise in franchises if franchise),
            "playoffAppearances": len(playoffs[player_id]) if playoffs_ok else None, "playoffSeasonYears": sorted(playoffs[player_id]),
            "finalsAppearances": len(finals[player_id]) if finals_ok else None, "finalsSeasonYears": sorted(finals[player_id]),
            "pointsPerGame": round(points / games, 1) if scoring_complete and games else None,
            "mvpCount": player["awards"]["mvp"], "seasonYears": years,
            "careerStartYear": min(years), "careerEndYear": max(years),
            "metricCoverage": coverage, "metricScope": {key: item["scope"] for key, item in coverage.items()}}
    return result


def refresh_cba():
    links = {}
    for team_id in TEAM_IDS:
        page = fetch(f"https://cba.sports.sina.com.cn/cba/team/show/{team_id}/")
        for player_id, player_name in re.findall(r'/player/show/(\d+)/?"[^>]*>([^<]+)</a>', page):
            if html.unescape(player_name).strip() in CBA_SELECTION:
                links[html.unescape(player_name).strip()] = player_id
    # Yi's historical archive remains a CBA record, not a current roster claim.
    links["易建联"] = "3"

    def profile(item):
        player_name, player_id = item
        url = f"https://cba.sports.sina.com.cn/cba/player/show/{player_id}/"
        page = fetch(url)
        title = re.search(r"<title>([^_<]+)", page)
        if not title or title.group(1) != player_name:
            raise ValueError(f"Sina identity mismatch: {player_name} {url}")
        def field(pattern):
            found = re.search(pattern, page)
            return html.unescape(found.group(1)).strip() if found else None
        birth = field(r"生日：([0-9-]+)")
        height = field(r"身高：([0-9.]+)cm")
        position = field(r"位置：([^<]+)")
        team = field(r"球队：([^<]+)")
        country = field(r"国籍：([^<]+)")
        if country and not re.search(r"[A-Za-z\u4e00-\u9fff]", country):
            country = None  # Source occasionally prints numeric internal codes.
        season = field(r"(\d{2}-\d{2})赛季") or field(r"CBA联赛(\d{2}-\d{2})场均")
        return {"id": f"cba-sina-{player_id}", "name": player_name, "sourceUrl": url,
                "birthYear": int(birth[:4]) if birth else None,
                "heightCm": float(height) if height else None, "positionRaw": position,
                "team": team, "country": country, "profileSeason": season,
                "retrievedAt": AS_OF}
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        records = list(executor.map(profile, links.items()))
    assert len(records) >= 20, f"Only {len(records)} CBA profiles verified"
    CBA_CACHE.write_text(json.dumps({"source": "新浪体育 CBA 公开球员档案（非官方）", "retrievedAt": AS_OF,
                                   "records": records}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return records


def build():
    directory = json.loads((APP_DATA / "player-directory.json").read_text(encoding="utf-8"))
    alias_path = ROOT / "config" / "player-aliases.json"
    alias_data = json.loads(alias_path.read_text(encoding="utf-8"))
    aliases = alias_data["players"]
    career_metrics = load_career_metrics(directory)
    nba_appearances = load_nba_appearances({player["id"] for player in directory["players"]})
    appearance_cache = json.loads(APPEARANCE_CACHE.read_text(encoding="utf-8"))
    sources = [{"id": "nba-snapshot", "title": "NBA/BAA 背景快照（原球员库）",
                "url": "https://www.kaggle.com/datasets/sumitrodatta/nba-aba-baa-stats", "asOf": "2026-08-15",
                "note": "Basketball-Reference 派生公开数据；原始档案与队伍赛季表，非实时。"},
               {"id": "euro-2025-round1", "title": "EuroLeague 官方：2025-26 首轮 BKN–OLY 比赛资料，PDF 第3–4页",
                "url": EURO_URL, "asOf": "2025-09-30", "note": "只选两队18人，球队只代表该日登记，不代表完整履历或现效力球队。"},
               {"id": "nba-yao-cba", "title": "NBA 官方：姚明由上海鲨鱼进入 NBA", "url": YAO_URL,
                "asOf": "2018-06-25", "note": "用于确认姚明的历史 CBA 上海球队记录。"},
               {"id": "nba-career-games", "title": "NBA/BAA 常规赛逐赛季快照", "asOf": "2026-08-15",
                "url": "https://www.kaggle.com/datasets/sumitrodatta/nba-aba-baa-stats",
                "note": "实际出场赛季、球队、总得分与总场次截至2025–26；同赛季转队合计只算一次。"},
               {"id": "nba-franchise-history", "title": "NBA/BAA 历史球队沿革表", "asOf": "2024-06-17",
                "url": "https://www.kaggle.com/datasets/gonzalogigena/nba-all-time-stats",
                "note": "all_time_teams.csv：按队伍代码、赛季区间归属 Current Abbr；新快照中沿用同代码且同全名才延展。不合并 ABA。"},
               {"id": "nba-playoff-games", "title": "NBA/BAA 季后赛逐赛季实际出场记录", "asOf": "2024-06-17",
                "url": "https://www.kaggle.com/datasets/gonzalogigena/nba-all-time-stats",
                "note": "schedule.csv季后赛赛程与逐场球员boxscore连接，核对所有赛程场次，排除DNP，去重实际出场赛季；截至2023–24。"},
               {"id": "nba-finals-games", "title": "NBA/BAA 总决赛赛程与逐场球员记录", "asOf": "2024-06-17",
                "url": "https://www.kaggle.com/datasets/gonzalogigena/nba-all-time-stats",
                "note": "schedule.csv 的 Series=Finals 与逐场 boxscore 连接；排除DNP，按球员与赛季去重，非球队名单归属；截至2023–24。"},
               {"id": "nba-mvp-official", "title": "NBA 官方历届常规赛 MVP", "asOf": "2026-08-15",
                "url": "https://www.nba.com/news/history-mvp-award-winners",
                "note": "保留的官方历届获奖快照1955–56至2025–26，采用已匹配球员ID的awards.csv；不含FMVP。"}]
    players = []
    for player in directory["players"]:
        bio = player["background"]
        debut = bio.get("debutDate")
        debut_year = int(debut[:4]) if debut else None
        # Career-info metadata can contain an earlier ABA debut. Do not relabel
        # that date as NBA/BAA, and do not infer an exact debut year from a season.
        valid_debut = debut_year is not None and player["careerStart"] - 1 <= debut_year <= player["careerStart"]
        positions = [position for position in "GFC" if position in (player.get("position") or "")]
        record = {"id": player["id"], "directoryId": player["id"], "name": player["name"],
                  "chineseName": None, "aliases": [], "pools": ["nba", "global"],
                  "birthYear": int(bio["birthDate"][:4]) if bio.get("birthDate") else None,
                  "heightCm": round(bio["heightCm"]) if bio.get("heightCm") else None,
                  "positions": positions, "teams": [{"id": "NBA:" + team["code"], "name": team["name"]} for team in player["teams"]],
                  "teamsComplete": True, "teamsScope": "NBA/BAA",
                  "country": None, "firstSeasonYear": debut_year if valid_debut else None,
                  "firstSeasonScope": "NBA/BAA", "sourceIds": ["nba-snapshot"], "asOf": "2026-08-15",
                  "fieldSources": {key: ["nba-snapshot"] for key in ["birthYear", "heightCm", "positions", "teams", "firstSeasonYear"]},
                  "notes": ["球队集合仅为已收录 NBA/BAA 生涯，不包含海外生涯；首赛年指 NBA/BAA 首次正式出场年。", "身高四舍五入至厘米，来自档案记录，不是实时测量；国家/地区未核实，保持空值。"]}
        record.update(career_metrics[player["id"]])
        metric_sources = {"teamCount": ["nba-career-games", "nba-franchise-history"],
                          "playoffAppearances": ["nba-playoff-games"], "finalsAppearances": ["nba-finals-games"],
                          "pointsPerGame": ["nba-career-games"], "mvpCount": ["nba-mvp-official"],
                          "seasonYears": ["nba-career-games"], "careerStartYear": ["nba-career-games"], "careerEndYear": ["nba-career-games"]}
        record["fieldSources"].update(metric_sources)
        record["sourceIds"] = sorted(set(record["sourceIds"] + [source for group in metric_sources.values() for source in group]))
        if not valid_debut:
            record["firstSeasonScope"] = None
            record["notes"].append("原始首秀日期与 NBA/BAA 首个赛季不一致或缺失（可能是 ABA 首秀），因此本游戏首赛年暂置未知。")
        players.append(record)
    # One person, several pools. Explicit verified identity mapping, not fuzzy matching.
    yao = next(player for player in players if player["id"] == "mingya01")
    yao["pools"].insert(1, "cba")
    yao["teams"].append({"id": "CBA:上海", "name": "上海"})
    yao["teamsComplete"] = False
    yao["teamsScope"] = "NBA/BAA + 已核实CBA球队"
    yao["sourceIds"].append("nba-yao-cba")
    yao["fieldSources"]["teams"].append("nba-yao-cba")
    yao["notes"][0] = "NBA/BAA 生涯球队另补已核实的 CBA 上海；首赛年仍只指 NBA/BAA 首次正式出场年。"
    yao["notes"].append("CBA 上海记录来自 NBA 官方回顾；跨联赛球队集合不宣称完整。")
    cba = json.loads(CBA_CACHE.read_text(encoding="utf-8"))["records"]
    for record in cba:
        source_id = record["id"]
        sources.append({"id": source_id, "title": f"新浪CBA档案：{record['name']}", "url": record["sourceUrl"],
                        "asOf": AS_OF, "note": f"非官方资料；页面标注赛季 {record.get('profileSeason') or '未注明'}，球队可能是历史记录，不当作实时名单。"})
        raw = record.get("positionRaw") or ""
        positions = [code for label, code in [("后卫", "G"), ("前锋", "F"), ("中锋", "C")] if label in raw]
        players.append({"id": record["id"], "directoryId": None, "name": record["name"], "chineseName": record["name"], "aliases": [],
                        "pools": ["cba", "global"], "birthYear": record["birthYear"], "heightCm": record["heightCm"], "positions": positions,
                        "teams": [{"id": "CBA:" + record["team"], "name": record["team"]}] if record["team"] else [],
                        "teamsComplete": False, "teamsScope": "CBA档案单队记录", "country": record.get("country"),
                        "firstSeasonYear": None, "firstSeasonScope": None, "sourceIds": [source_id], "asOf": AS_OF,
                        "fieldSources": {key: [source_id] for key in ["birthYear", "heightCm", "positions", "teams", "country"]},
                        "notes": [f"非官方新浪档案；页面赛季：{record.get('profileSeason') or '未标注'}。球队记录不完整，不代表当前注册名单。", "首个职业赛季未核实，保持未知；不以最早收录赛季冒充首秀。"]})
    for name, position, height, birth, team in EURO_RECORDS:
        players.append({"id": "euro-" + slug(name), "directoryId": None, "name": name, "chineseName": None, "aliases": [],
                        "pools": ["global"], "birthYear": birth, "heightCm": height, "positions": [position],
                        "teams": [{"id": "EURO:" + team, "name": team}], "teamsComplete": False, "teamsScope": "EuroLeague 2025-09-30登记",
                        "country": None, "firstSeasonYear": None, "firstSeasonScope": None, "sourceIds": ["euro-2025-round1"], "asOf": "2025-09-30",
                        "fieldSources": {key: ["euro-2025-round1"] for key in ["birthYear", "heightCm", "positions", "teams"]},
                        "notes": ["EuroLeague 官方比赛资料中的两队精选；出生年、身高、位置及球队按 2025-09-30 登记。", "不是完整履历；首个职业赛季、国家/地区未收录。部分球员曾打 NBA，但不在原 GOAT 300 人目录中。"]})
    for record in players:
        if record["id"] in aliases:
            record["chineseName"] = aliases[record["id"]].get("chineseName") or record["chineseName"]
            record["aliases"] = list(dict.fromkeys(aliases[record["id"]].get("aliases", [])))
        if record["directoryId"]:
            continue
        for key in METRICS:
            record[key] = None
        record["metricCoverage"] = {key: field_coverage() for key in METRICS}
        record["metricScope"] = {key: None for key in METRICS}
        record["seasonYears"] = []
        record["careerStartYear"] = record["careerEndYear"] = None
        scope = "CBA" if "cba" in record["pools"] else "EuroLeague"
        record["metricCoverage"]["seasonYears"] = field_coverage(scope, note="赛季只由下方经核实的实际出场证据填充。")
        record["metricScope"]["seasonYears"] = scope
        record["fieldSources"].update({key: [] for key in METRICS})
        record["fieldSources"]["seasonYears"] = record["sourceIds"].copy()
        record["fieldSources"]["careerStartYear"] = record["fieldSources"]["careerEndYear"] = []
        record["notes"].append("球队数、季后赛/总决赛次数、常规赛场均分及MVP缺少同联赛完整生涯记录，均保留未知；单队档案不能当作只效力过一队。")
    ids = {record["id"] for record in players}
    sources.extend(appearance_cache["sources"])
    for record in players:
        record["appearances"] = sorted(nba_appearances.get(record["id"], []) + appearance_cache["players"].get(record["id"], []),
                                       key=lambda item: (item["season"], item["league"], item["teamId"]))
        known_teams = {team["id"] for team in record["teams"]}
        for appearance in record["appearances"]:
            if appearance["teamId"] not in known_teams:
                record["teams"].append({"id": appearance["teamId"], "name": appearance["teamId"].split(":", 1)[1]})
                known_teams.add(appearance["teamId"])
        appearance_sources = sorted({item["sourceId"] for item in record["appearances"]})
        record["sourceIds"] = sorted(set(record["sourceIds"] + appearance_sources))
        record["fieldSources"]["appearances"] = appearance_sources
        record["fieldSources"]["teams"] = sorted(set(record["fieldSources"]["teams"] + appearance_sources))
        is_nba = record["directoryId"] is not None
        record["appearanceCoverage"] = {
            "verifiedOnly": True, "complete": is_nba and "cba" not in record["pools"],
            "scope": "NBA/BAA常规赛" if is_nba and "cba" not in record["pools"] else "已核实的跨联赛部分实际出场",
            "throughSeason": max((item["season"] for item in record["appearances"]), default=None),
            "note": ("NBA/BAA实际常规赛赛季与原始球队同行连接，g>0且排除合计行；不以生涯年份补齐中断。" if is_nba else
                     "仅有明确赛季、球队及正出场数/比赛表现的记录才能筛选；登记名单和档案年份不算出场。资料为部分历史记录，未收录不等于未效力。")}
        if "cba" in record["pools"] and is_nba:
            record["appearanceCoverage"]["note"] += " 姚明CBA目前只逐条核实2001–02上海赛季，其他CBA年份不推断。"
        if not is_nba:
            record["seasonYears"] = sorted({item["season"] for item in record["appearances"]})
            scope = "CBA" if "cba" in record["pools"] else "EuroLeague"
            record["metricCoverage"]["seasonYears"] = field_coverage(scope,
                max(record["seasonYears"], default=None), False, False, record["appearanceCoverage"]["note"])
            record["fieldSources"]["seasonYears"] = appearance_sources
        record["notes"].append(record["appearanceCoverage"]["note"])
    assert len(ids) == len(players)
    # Exact normalized name + birth year provides a second duplicate guard.
    identity_keys = [(slug(record["name"]) or record["name"], record["birthYear"]) for record in players]
    assert len(set(identity_keys)) == len(players), "duplicate person requires explicit verified merge"
    assert next(p for p in players if p["id"] == "jordami01")["firstSeasonYear"] == 1984
    assert next(p for p in players if p["id"] == "ervinju01")["firstSeasonYear"] is None
    assert sum(p["id"] == "mingya01" for p in players) == 1
    source_ids = {source["id"] for source in sources}
    assert all(set(record["sourceIds"]) <= source_ids for record in players)
    assert all(record["positions"] and record["birthYear"] and record["heightCm"] for record in players)
    validate_metrics(players, aliases, source_ids)
    pools = [{"id": "nba", "name": "NBA 精选", "description": "沿用 GOAT 300 人候选库，包含 NBA/BAA 历史球员；不是联盟全体球员。"},
             {"id": "cba", "name": "CBA 精选", "description": "新浪 CBA 公开档案精选 + 经 NBA 官方确认 CBA 履历的姚明；包含历史球员，并非实时完整名单。"},
             {"id": "global", "name": "全球男子精选", "description": "NBA 与 CBA 精选的去重并集，另加 EuroLeague 两队 18 人；并非全球全部球员或所有联赛。"}]
    for pool in pools:
        pool["count"] = sum(pool["id"] in record["pools"] for record in players)
    return {"version": "1.2", "dataAsOf": "2026-10-04", "meta": {"snapshotDate": "2026-10-04",
            "note": "单人离线游戏资料包；NBA 快照 2026-08-15，CBA档案读取2026-10-03、实际历史出场表读取2026-10-04（各页历史赛季可能不同）；EuroLeague登记2025-09-30并另核实有日期的比赛事实。未知字段中性提示，不推断为错误。",
            "internationalSelectionCount": len(EURO_RECORDS), "sourceCaveat": "CBA官方接口加密响应未作提取；使用可公开读取的新浪档案并明确为非官方。",
            "metricCoverage": {key: sum(record[key] is not None for record in players) for key in METRICS},
            "metricNote": "NBA/BAA球队数按franchise沿革去重；常规赛与NBA常规赛MVP截至2025–26，季后赛/总决赛实际出场赛季截至2023–24。不同联赛或快照不直接比较。CBA/国际未知不当作0。",
            "yearFilterNote": "年份为赛季结束年；年份和球队必须命中同一条实际出场证据。NBA/BAA仅常规赛实际出场；CBA采用历史正出场数表，EuroLeague采用明确日期比赛表现，不使用档案标题或注册名单。历史球队改名按当季名称分别显示。",
            "appearanceCoverage": {"version": "1.0", "verifiedPlayers": sum(bool(record["appearances"]) for record in players),
                "records": sum(len(record["appearances"]) for record in players),
                "note": "NBA/BAA常规赛截至2025–26。CBA历史出场表与EuroLeague比赛事实为不完整历史证据，缺少证据的球员不能进入限定题库，未限定题库仍保留全部精选球员。"}},
            "pools": pools, "sources": sources, "players": players}


def validate_metrics(players, aliases, source_ids):
    """Regression checks focus on identity, counting units, missingness and dates."""
    by_id = {record["id"]: record for record in players}
    assert set(by_id) <= set(aliases), "Every game identity needs an explicit reviewed alias record"
    harden, jordan, lebron = [by_id[key] for key in ("hardeja01", "jordami01", "jamesle01")]
    assert harden["chineseName"] == "詹姆斯·哈登" and {"哈登", "大胡子", "Jame Harden"} <= set(harden["aliases"])
    assert (jordan["teamCount"], jordan["playoffAppearances"], jordan["finalsAppearances"], jordan["pointsPerGame"], jordan["mvpCount"]) == (2, 13, 6, 30.1, 5)
    assert (lebron["teamCount"], lebron["playoffAppearances"], lebron["finalsAppearances"], lebron["mvpCount"]) == (3, 17, 10, 4)
    assert harden["playoffAppearances"] == 15 and harden["finalsAppearances"] == 1 and harden["finalsSeasonYears"] == [2012]
    assert harden["mvpCount"] == 1 and by_id["duncati01"]["finalsAppearances"] == 6
    assert by_id["duncati01"]["playoffAppearances"] == 18  # 2000 injury/DNP must not become an appearance.
    assert by_id["mingya01"]["teamCount"] == 1 and by_id["mingya01"]["finalsAppearances"] == by_id["mingya01"]["mvpCount"] == 0
    assert jordan["careerStartYear"] == 1985 and jordan["careerEndYear"] == 2003 and 1994 not in jordan["seasonYears"]
    assert jordan["firstSeasonYear"] == 1984  # Real debut calendar year differs from season ending year.
    fixture = """<h2>25-26赛季</h2><h2>CBA个人历史数据</h2><table><tbody>
      <tr><td>CBA联赛99-00</td><td>上海</td><td>22</td></tr>
      <tr><td>CBA联赛00-01</td><td>上海</td><td>0</td></tr>
      <tr><td>CBA联赛01-02</td><td>上海</td><td>NA</td></tr>
      <tr><td>CBA联赛95-96</td><td>上海</td><td>3</td></tr>
      </tbody></table>"""
    assert [(item["season"], item["games"]) for item in parse_cba_appearances(fixture, "fixture")] == [(1996, 3), (2000, 22)]
    for record in players:
        appearance_keys = [(item["season"], item["league"], item["teamId"]) for item in record["appearances"]]
        assert len(appearance_keys) == len(set(appearance_keys)), f"duplicate appearance: {record['id']}"
        for appearance in record["appearances"]:
            assert appearance["sourceId"] in source_ids
            assert appearance["teamId"] in {team["id"] for team in record["teams"]}
            assert appearance["league"] in ("NBA", "BAA", "CBA", "EuroLeague")
            assert 1947 <= appearance["season"] <= 2026
            assert appearance["evidence"] in ("season-games", "dated-performance")
            assert appearance.get("games", 1) > 0
        if record["directoryId"]:
            assert {item["season"] for item in record["appearances"] if item["league"] in ("NBA", "BAA")} == set(record["seasonYears"])
        assert record["seasonYears"] == sorted(set(record["seasonYears"]))
        for key in METRICS:
            coverage = record["metricCoverage"][key]
            assert record["metricScope"][key] == coverage["scope"]
            assert set(record["fieldSources"][key]) <= source_ids
            if record[key] is not None:
                assert isinstance(record[key], (int, float)) and record[key] >= 0
                assert coverage["complete"] and isinstance(coverage["throughSeason"], int)
                assert record["fieldSources"][key]
            else:
                assert not coverage["complete"]
        if record["directoryId"]:
            assert record["playoffAppearances"] == len(record["playoffSeasonYears"])
            assert record["finalsAppearances"] == len(record["finalsSeasonYears"])
            assert set(record["finalsSeasonYears"]) <= set(record["playoffSeasonYears"])
            assert record["metricCoverage"]["playoffAppearances"]["throughSeason"] == record["metricCoverage"]["finalsAppearances"]["throughSeason"] == 2024
            assert record["metricCoverage"]["pointsPerGame"]["throughSeason"] == 2026
        else:
            assert all(record[key] is None for key in METRICS)
            assert record["careerStartYear"] is None and record["careerEndYear"] is None
            assert not record["metricCoverage"]["seasonYears"]["complete"]


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--refresh-cba", action="store_true")
    parser.add_argument("--refresh-cba-appearances", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.refresh_cba:
        refresh_cba()
    if args.refresh_cba_appearances:
        refresh_cba_appearances()
    result = build()
    payload = json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
    if not args.self_test:
        (APP_DATA / "guess-players.json").write_text(payload, encoding="utf-8")
    print(json.dumps({"ok": True, "version": result["version"], "players": len(result["players"]),
                      "metricCoverage": result["meta"]["metricCoverage"], "pools": result["pools"]}, ensure_ascii=False))
