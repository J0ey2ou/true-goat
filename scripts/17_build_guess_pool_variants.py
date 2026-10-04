"""Build source-linked NBA history/current/easy guessing pools, without editing the app.

The public NBA roster is only refreshed with --refresh-roster. Only factual fields
are retained, never the HTML response. NBA/BAA played seasons come exclusively
from positive regular-season team rows; a roster record is NOT a played season.
"""
from __future__ import annotations

import argparse
import ast
import copy
import csv
import importlib.util
import json
import math
import re
import sys
import unicodedata
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data/raw/kaggle_nba_aba_baa/csv"
OUT = ROOT / "config/guess-nba-expansion.json"
CATALOG = ROOT / "config/nba-player-catalog.json"
ROSTER = ROOT / "config/guess-nba-roster.json"
AS_OF = "2026-10-04"
ROSTER_URL = "https://www.nba.com/players"
SOURCE = "https://www.kaggle.com/datasets/sumitrodatta/nba-aba-baa-stats"
ROSTER_SOURCE = "nba-current-roster-20261004"
ALLSTAR_SOURCE = "nba-allstar-selections"
PROFILE_SOURCE = "nba-all-history-bios"
METRICS = ["teamCount", "playoffAppearances", "finalsAppearances", "pointsPerGame", "mvpCount"]


def rows(path):
    with path.open(encoding="utf-8-sig", newline="") as stream:
        return list(csv.DictReader(stream))


def number(value):
    try:
        result = float(value)
        return result if math.isfinite(result) else None
    except (ValueError, TypeError):
        return None


def normalize_name(value, strip_suffix=True):
    # This upstream Egor spelling uses Cyrillic ё inside a Latin surname.
    value = value.replace("ё", "e").replace("Ё", "E")
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    if strip_suffix:
        value = re.sub(r"\b(jr|sr|ii|iii|iv)\b", "", value)
    return re.sub(r"[^a-z]", "", value)


def helper_module():
    spec = importlib.util.spec_from_file_location("guess_base", ROOT / "scripts/15_build_guess_players.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def refresh_roster():
    request = urllib.request.Request(ROSTER_URL, headers={"User-Agent": "TrueGOAT-public-roster-build/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        page = response.read().decode("utf-8")
    match = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', page, re.S)
    if not match:
        raise ValueError("Official roster page has no expected public JSON; existing snapshot unchanged")
    roster = json.loads(match.group(1))["props"]["pageProps"]["players"]
    selected = [row for row in roster if row.get("ROSTER_STATUS") == 1
                and row.get("HISTORIC") is False and (number(row.get("TEAM_ID")) or 0) > 0]
    assert 450 <= len(selected) <= 750, "Unexpected current-roster count; manual source review needed"
    assert len({row["TEAM_ID"] for row in selected}) == 30, "Current source must cover all 30 teams"
    assert len({row["PERSON_ID"] for row in selected}) == len(selected), "Duplicate NBA official identity"
    keys = ["PERSON_ID", "PLAYER_FIRST_NAME", "PLAYER_LAST_NAME", "PLAYER_SLUG", "TEAM_ID",
            "TEAM_CITY", "TEAM_NAME", "TEAM_ABBREVIATION", "POSITION", "HEIGHT", "COUNTRY",
            "FROM_YEAR", "TO_YEAR", "ROSTER_STATUS", "HISTORIC"]
    snapshot = {"version": 1, "asOf": AS_OF, "url": ROSTER_URL,
                "criteria": "ROSTER_STATUS=1, HISTORIC=false, TEAM_ID>0; includes training-camp/two-way/new players; not a game appearance or contract guarantee",
                "records": [{key: row.get(key) for key in keys} for row in selected]}
    ROSTER.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return snapshot


def base_record(player_id, name, career, team_rows, team_names, aliases, helper):
    years = sorted({int(row["season"]) for row in team_rows})
    birth = career.get("birth_date")
    height = number(career.get("ht_in_in"))
    debut = career.get("debut", "")[:10]
    debut_year = int(debut[:4]) if re.fullmatch(r"\d{4}-\d{2}-\d{2}", debut) else None
    debut_valid = bool(years) and debut_year is not None and years[0] - 1 <= debut_year <= years[0]
    team_codes = sorted({row["team"] for row in team_rows})
    record = {"id": player_id, "directoryId": None, "name": name,
        "chineseName": aliases.get(player_id, {}).get("chineseName"),
        "aliases": aliases.get(player_id, {}).get("aliases", []), "pools": ["nba-history", "global"],
        "birthYear": int(birth[:4]) if birth and re.fullmatch(r"\d{4}-\d{2}-\d{2}", birth) else None,
        "heightCm": round(height * 2.54) if height else None,
        "positions": [code for code in "GFC" if code in (career.get("pos") or "")],
        "teams": [{"id": "NBA:" + code, "name": team_names.get(code, code)} for code in team_codes],
        "teamsComplete": True, "teamsScope": "NBA/BAA", "country": None,
        "firstSeasonYear": debut_year if debut_valid else None,
        "firstSeasonScope": "NBA/BAA" if debut_valid else None,
        "sourceIds": [PROFILE_SOURCE, "nba-career-games"], "asOf": "2026-08-15",
        "fieldSources": {field: [PROFILE_SOURCE] for field in ["birthYear", "heightCm", "positions", "firstSeasonYear"]},
        "notes": ["NBA/BAA实赛快照；非实时球队；未知不推断。"],
        "seasonYears": years, "careerStartYear": years[0] if years else None,
        "careerEndYear": years[-1] if years else None}
    record["fieldSources"].update({"teams": ["nba-career-games"], "seasonYears": ["nba-career-games"]})
    return record


def build():
    helper = helper_module()
    from common import PLAYER_NAME_OVERRIDES
    # Rebuild the stable, original source-backed 347-person seed. Reading the
    # published expanded app JSON here would make a second build depend on its
    # own previous output and lose the Euro identity/alias redirect inputs.
    existing = helper.build()
    base = {player["id"]: player for player in existing["players"] if player.get("directoryId")}
    alias_data = json.loads((ROOT / "config/player-aliases.json").read_text(encoding="utf-8"))["players"]
    current = json.loads(ROSTER.read_text(encoding="utf-8"))
    assert current["asOf"] == AS_OF
    career = {row["player_id"]: row for row in rows(RAW / "Player Career Info.csv")}
    team_rows = defaultdict(list)
    for row in rows(RAW / "Player Totals.csv"):
        if row["lg"] in ("NBA", "BAA") and (number(row["g"]) or 0) > 0 and not re.fullmatch(r"TOT|\d+TM", row["team"], re.I):
            team_rows[row["player_id"]].append(row)
    history_ids = set(team_rows)
    assert len(history_ids) >= 5000, "A selected 300-player file is not the full historical universe"
    team_names = {}
    for row in sorted(rows(RAW / "Team Abbrev.csv"), key=lambda row: int(row["season"])):
        if row["lg"] in ("NBA", "BAA"):
            team_names[row["abbreviation"]] = row["team"]
    allstar = defaultdict(set)
    for row in rows(RAW / "All-Star Selections.csv"):
        if row["lg"] == "NBA":
            allstar[row["player_id"]].add(int(row["season"]))
    mvp_counts = {row["player_id"]: int(float(row["mvp"])) for row in rows(ROOT / "data/processed/awards.csv")}
    # Every NBA MVP winner in the retained award table must be in the official-
    # verified 300-player award dataset. This makes zero for other players valid.
    for row in rows(RAW / "Player Award Shares.csv"):
        if row["award"] == "nba mvp" and row["winner"] == "TRUE":
            assert mvp_counts.get(row["player_id"], 0) > 0
    appearances = helper.load_nba_appearances(history_ids)
    resolve_franchise = helper.load_franchises()
    finals, playoffs, finals_complete, playoffs_complete, first_po, through_po = helper.actual_postseason_seasons(history_ids)
    name_index, strict_name_index = defaultdict(set), defaultdict(set)
    for player_id, records in team_rows.items():
        for name in {records[0]["player"], career.get(player_id, {}).get("player", "")}:
            if name:
                name_index[normalize_name(name)].add(player_id)
                strict_name_index[normalize_name(name, False)].add(player_id)
    records, profiles = {}, {}
    for player_id in sorted(history_ids):
        stints = team_rows[player_id]
        info = career.get(player_id, {})
        name = PLAYER_NAME_OVERRIDES.get(player_id) or info.get("player") or stints[0]["player"]
        record = copy.deepcopy(base[player_id]) if player_id in base else base_record(player_id, name, info, stints, team_names, alias_data, helper)
        record["pools"] = [pool for pool in record.get("pools", []) if pool not in ("nba", "nba-active", "nba-history", "nba-easy")]
        record["pools"] = ["nba-history"] + record["pools"]
        years = sorted({int(row["season"]) for row in stints})
        record["appearances"] = appearances[player_id] + [row for row in record.get("appearances", []) if row["league"] not in ("NBA", "BAA")]
        record["seasonYears"] = years
        record["careerStartYear"], record["careerEndYear"] = years[0], years[-1]
        stats, coverage = {}, {}
        for field in ["g", "gs", "mp", "pts", "trb", "ast", "stl", "blk", "tov", "fg", "fga", "ft", "fta", "x3p", "x3pa"]:
            values = [number(row.get(field)) for row in stints]
            complete = all(value is not None for value in values)
            stats[field] = sum(values) if complete else None
            coverage[field] = {"complete": complete, "observedGames": sum(int(float(row["g"])) for row, value in zip(stints, values) if value is not None)}
        franchises = {resolve_franchise(row["team"], int(row["season"])) for row in stints}
        complete_teams = bool(franchises) and None not in franchises
        if player_id not in base:
            po_window = set(range(max(years[0], first_po), min(years[-1], through_po) + 1))
            # A player whose first NBA game follows the retained playoff snapshot
            # has unknown playoff history, not a fabricated zero.
            po_ok = bool(po_window) and po_window <= playoffs_complete
            finals_ok = bool(po_window) and po_window <= finals_complete
            record.update({"teamCount": len(franchises) if complete_teams else None,
                "franchiseIds": sorted(value for value in franchises if value),
                "pointsPerGame": round(stats["pts"] / stats["g"], 1) if stats["pts"] is not None and stats["g"] else None,
                "playoffAppearances": len(playoffs[player_id]) if po_ok else None,
                "finalsAppearances": len(finals[player_id]) if finals_ok else None,
                "playoffSeasonYears": sorted(playoffs[player_id]), "finalsSeasonYears": sorted(finals[player_id]),
                "mvpCount": mvp_counts.get(player_id, 0)})
            record["metricCoverage"] = {
                "teamCount": helper.field_coverage("NBA/BAA", 2026, complete_teams, True, "实赛franchise数，改名不重复。"),
                "pointsPerGame": helper.field_coverage("NBA/BAA", 2026, stats["pts"] is not None, True, "总得分/总场次，转队不重复。"),
                "playoffAppearances": helper.field_coverage("NBA/BAA", through_po, po_ok, years[-1] <= through_po, "实际出场赛季数；不含附加赛。"),
                "finalsAppearances": helper.field_coverage("NBA/BAA", through_po, finals_ok, years[-1] <= through_po, "Finals实赛赛季数，不计DNP。"),
                "mvpCount": helper.field_coverage("NBA", 2026, True, True, "官方常规赛MVP；不含FMVP。")}
            record["metricScope"] = {key: value["scope"] for key, value in record["metricCoverage"].items()}
            metric_sources = {"teamCount": ["nba-career-games", "nba-franchise-history"], "pointsPerGame": ["nba-career-games"],
                "playoffAppearances": ["nba-playoff-games"], "finalsAppearances": ["nba-finals-games"], "mvpCount": ["nba-mvp-official"]}
            record["fieldSources"].update(metric_sources)
            record["sourceIds"] = sorted(set(record["sourceIds"] + [source for group in metric_sources.values() for source in group]))
        record["allStarSelections"] = len(allstar[player_id])
        record["allStarSeasonYears"] = sorted(allstar[player_id])
        record["fieldSources"]["allStarSelections"] = [ALLSTAR_SOURCE]
        record["sourceIds"] = sorted(set(record["sourceIds"] + [ALLSTAR_SOURCE]))
        if record["mvpCount"] > 0 or record["allStarSelections"] >= 5:
            record["pools"].append("nba-easy")
        records[player_id] = record
        profiles[player_id] = {"careerInfo": info, "regularSeasonTotals": stats,
            "regularSeasonCoverage": coverage, "regularSeasonThrough": 2026,
            "awardFacts": {"mvp": record["mvpCount"], "allStar": record["allStarSelections"], "throughSeason": 2026},
            "sourceIds": [PROFILE_SOURCE, "nba-career-games", "nba-mvp-official", ALLSTAR_SOURCE]}
    unmatched_earlier = []
    for official in current["records"]:
        name = f"{official['PLAYER_FIRST_NAME']} {official['PLAYER_LAST_NAME']}"
        candidates = strict_name_index.get(normalize_name(name, False), set())
        if len(candidates) != 1:
            candidates = name_index.get(normalize_name(name), set())
        if len(candidates) > 1:
            start = int(official.get("FROM_YEAR") or 0)
            candidates = {key for key in candidates if min(int(row["season"]) for row in team_rows[key]) - 1 <= start <= min(int(row["season"]) for row in team_rows[key])}
        if official["PERSON_ID"] == 1641842:
            # Official Ronald Holland II profile has birthdate 2005-07-07,
            # same as the upstream Ron Holland identity; no fuzzy name merge.
            assert career["hollaro01"]["birth_date"] == "2005-07-07"
            candidates = {"hollaro01"}
        player_id = next(iter(candidates)) if len(candidates) == 1 else f"nba-{official['PERSON_ID']}"
        if player_id not in records:
            record = base_record(player_id, name, {}, [], team_names, alias_data, helper)
            record["pools"] = ["global"]
            record["teamsComplete"] = False
            record["teamsScope"] = "NBA/BAA未核实出场"
            record["sourceIds"] = [ROSTER_SOURCE]
            record["fieldSources"] = {}
            record["appearances"] = []
            record["notes"] = ["NBA.com当前名单登记；未与历史正出场快照核实连接，不能据名单推断已出场赛季、首秀或生涯累计数据。"]
            record["metricCoverage"] = {key: helper.field_coverage() for key in METRICS}
            record["metricScope"] = {key: None for key in METRICS}
            record.update({key: None for key in METRICS})
            record["allStarSelections"] = None
            record["allStarSeasonYears"] = []
            records[player_id] = record
            profiles[player_id] = {"careerInfo": {}, "regularSeasonTotals": {}, "regularSeasonCoverage": {},
                                   "regularSeasonThrough": None, "awardFacts": {}, "sourceIds": [ROSTER_SOURCE]}
            if int(official.get("FROM_YEAR") or 2026) < 2026:
                unmatched_earlier.append({"id": player_id, "name": name, "fromYear": official["FROM_YEAR"], "candidates": sorted(candidates)})
        record = records[player_id]
        record["pools"].append("nba-active")
        record["nbaRoster"] = {"personId": official["PERSON_ID"], "asOf": AS_OF, "sourceId": ROSTER_SOURCE,
            "teamId": "NBA:" + official["TEAM_ABBREVIATION"],
            "teamName": official["TEAM_CITY"] + " " + official["TEAM_NAME"], "status": "official-current-roster",
            "note": "官网当日名单，可能包括训练营/双向合同或未出场新人；不是实际出场证据。"}
        record["sourceIds"] = sorted(set(record["sourceIds"] + [ROSTER_SOURCE]))
        record["country"] = official.get("COUNTRY") or None
        record["fieldSources"]["country"] = [ROSTER_SOURCE]
        if name != record["name"]:
            record["aliases"] = list(dict.fromkeys(record["aliases"] + [name]))
        if not record["positions"]:
            record["positions"] = [code for code in "GFC" if code in (official.get("POSITION") or "")]
            record["fieldSources"]["positions"] = [ROSTER_SOURCE]
        if record["heightCm"] is None:
            height = re.fullmatch(r"(\d+)-(\d+)", official.get("HEIGHT") or "")
            if height:
                record["heightCm"] = round((int(height[1]) * 12 + int(height[2])) * 2.54)
                record["fieldSources"]["heightCm"] = [ROSTER_SOURCE]
        profiles[player_id]["officialRoster"] = official
    redirects = {}
    for player in existing["players"]:
        if player["id"].startswith("euro-"):
            matches = name_index.get(normalize_name(player["name"]), set())
            if len(matches) == 1:
                target_id = next(iter(matches))
                redirects[player["id"]] = target_id
                target = records[target_id]
                target["chineseName"] = target["chineseName"] or player.get("chineseName")
                target["aliases"] = list(dict.fromkeys(target["aliases"] + player.get("aliases", []) + [player["name"]]))
    counts = Counter(pool for player in records.values() for pool in player["pools"])
    new_source_ids = {PROFILE_SOURCE, ALLSTAR_SOURCE, ROSTER_SOURCE}
    used_sources = {source for player in records.values() for source in player["sourceIds"]}
    used_sources |= {row["sourceId"] for player in records.values() for row in player["appearances"]}
    sources = [source for source in existing["sources"] if (source["id"].startswith("nba-") or source["id"] in used_sources) and source["id"] not in new_source_ids]
    sources.extend([
        {"id": PROFILE_SOURCE, "title": "NBA/BAA 全历史球员档案", "url": SOURCE, "asOf": "2026-08-15", "note": "Player Career Info.csv基础事实；Player Totals.csv筛出实际NBA/BAA出场者；不是GOAT300精选。"},
        {"id": ALLSTAR_SOURCE, "title": "NBA All-Star Selections逐届名单", "url": SOURCE, "asOf": "2026-08-15", "note": "NBA全明星入选按球员/赛季去重，保留受伤被替换的入选者；不含ABA，不等于实际全明星出场次数。"},
        {"id": ROSTER_SOURCE, "title": "NBA.com 官方当前联盟名单", "url": ROSTER_URL, "asOf": AS_OF,
         "note": "完整30队JSON：ROSTER_STATUS=1、HISTORIC=false、TEAM_ID>0；含训练营/双向/新人，不宣称常规赛15人正式名单或已出场。"}])
    result = {"version": "1.0", "dataAsOf": AS_OF,
        "meta": {"historicalCount": len(history_ids), "rosterCount": len(current["records"]),
                 "currentWithoutHistoricalAppearance": sum('nba-active' in p['pools'] and 'nba-history' not in p['pools'] for p in records.values()),
                 "historyFirstSeason": 1947, "historyThroughSeason": 2026, "rosterAsOf": AS_OF,
                 "easyCriteria": "NBA常规赛MVP至少1次，或至少5届NBA全明星入选；截至2025–26，含现役与历史。",
                 "unmatchedEarlierRoster": unmatched_earlier,
                 "note": "历史池是数据快照内全部NBA/BAA常规赛正出场球员；不含ABA-only、季前赛-only或尚未出场新人。当前名单独立核实，不由末次出场年份推断。"},
        "pools": [
            {"id": "nba-active", "name": "NBA 现役", "count": counts["nba-active"], "description": f"NBA.com {AS_OF}官方当前30队名单；含训练营/双向/未出场新人，不等于曾在2026赛季出场。"},
            {"id": "nba-history", "name": "NBA 全历史", "count": counts["nba-history"], "description": "1946–47至2025–26快照内所有NBA/BAA常规赛实际出场球员；不含仅ABA球员或尚未正式出场新人。"},
            {"id": "nba-easy", "name": "NBA 简单·知名球星", "count": counts["nba-easy"], "description": "客观门槛：常规赛MVP≥1或NBA全明星入选≥5届；截至2025–26，历史与现役均可入选。"}],
        "sources": sources, "players": list(records.values()), "profiles": profiles, "identityRedirects": redirects}
    return result


def finite_json(value):
    """Convert pandas/numpy scalars to strict JSON without NaN pseudo-values."""
    if isinstance(value, dict):
        return {key: finite_json(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [finite_json(item) for item in value]
    if hasattr(value, "item"):
        value = value.item()
    if isinstance(value, float) and not math.isfinite(value):
        return None
    return value


def component_specifications():
    # Read the existing model's literal weights instead of maintaining another
    # formula. No import/main execution and no recomputation of the 300 players.
    tree = ast.parse((ROOT / "scripts/04_build_indicators.py").read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign) and any(isinstance(target, ast.Name) and target.id == "component_specs" for target in node.targets):
            return ast.literal_eval(node.value)
    raise ValueError("Existing component specifications not found")


def fixed_percentile(value, reference):
    """Frozen empirical percentile: average-rank/n on ties, no pool refitting.

    A value between reference points gets the fraction strictly below it; values
    below/above the reference range map to 0/1. Existing equal values retain the
    original pandas average-rank/n convention, including its 1-based rank.
    """
    import numpy as np
    value = number(value)
    if value is None:
        return None
    values = np.asarray(reference, dtype=float)
    values = values[np.isfinite(values)]
    if not len(values):
        return None
    equal = np.isclose(values, value, rtol=1e-12, atol=1e-12)
    if equal.any():
        less = ((values < value) & ~equal).sum()
        return float((less + (equal.sum() + 1) / 2) / len(values))
    return float((values < value).sum() / len(values))


def build_catalog(expansion):
    import numpy as np
    import pandas as pd
    from data_utils import add_era_adjustments, add_leader_titles, career_summary, load_honors, load_regular_seasons, load_team_success
    from common import load_config

    old_directory = json.loads((ROOT / "app/data/player-directory.json").read_text(encoding="utf-8"))
    old_profiles = {p["id"]: p for p in old_directory["players"]}
    old_models = {p["player_id"]: p for p in json.loads((ROOT / "data/processed/goat_model_v0_2_web.json").read_text(encoding="utf-8"))["players"]}
    old_reference = pd.read_csv(ROOT / "data/processed/model_features_full.csv")
    assert len(old_reference) == len(old_models) == 300
    rules = load_config("candidate_rules.yaml")["pool_b"]
    season = add_era_adjustments(load_regular_seasons(), rules["season_min_games_floor"], rules["season_min_league_games_share"])
    season = season[season["g"].gt(0)].copy()
    career = career_summary(season)
    honors = add_leader_titles(season, load_honors(season))
    success, _ = load_team_success()
    features = career.merge(honors.drop(columns="player", errors="ignore"), on="player_id", how="left").merge(success, on="player_id", how="left")
    season["weighted_quality"] = season["season_performance_available"] * season["g"]
    era = season.groupby("player_id").agg(era_quality_num=("weighted_quality", "sum"), era_quality_den=("g", "sum"),
        mean_games_share=("games_share", "mean"), career_era_defense=("era_defense", "mean"),
        observed_quality=("season_performance_available", "count")).reset_index()
    era["career_era_quality"] = (era["era_quality_num"] / era["era_quality_den"]).where(era["observed_quality"].gt(0))
    features = features.merge(era, on="player_id", how="left")
    features = features.set_index("player_id")
    groups = {key: group for key, group in season.groupby("player_id")}
    specs = component_specifications()
    reference = {key: old_reference[key].to_numpy() for weights in specs.values() for key in weights if key in old_reference}
    drafts = defaultdict(list)
    for row in rows(RAW / "Draft Pick History.csv"):
        if row["lg"] in ("NBA", "BAA"):
            drafts[row["player_id"]].append({"year": int(row["season"]), "round": number(row["round"]),
                "pick": number(row["overall_pick"]), "team": row["tm"], "teamName": row["tm"]})
    output = []
    for guessed in expansion["players"]:
        player_id = guessed["id"]
        if player_id in old_profiles:
            profile = copy.deepcopy(old_profiles[player_id])
            profile["model"] = copy.deepcopy(old_models[player_id])
            profile["catalogOriginal"] = True
            profile["aliases"] = guessed["aliases"]
            # Existing source profile / model values stay byte-for-byte equivalent.
            output.append(profile)
            continue
        facts = expansion["profiles"][player_id]
        info = facts["careerInfo"]
        birth = info.get("birth_date")
        height, weight = number(info.get("ht_in_in")), number(info.get("wt"))
        known = player_id in features.index
        feature = features.loc[player_id].to_dict() if known else {}
        group = groups.get(player_id)
        years = guessed["seasonYears"]
        games = int(feature["career_games"]) if known else None
        career_rs = {"games": games, "seasons": len(years) if years else None,
                     "ts": number(feature.get("career_ts")), "metricCoverageGames": {}}
        for field, total_key, rate_key in [("pts", "points", "ppg"), ("trb", "rebounds", "rpg"), ("ast", "assists", "apg"),
                ("stl", "steals", "spg"), ("blk", "blocks", "bpg"), ("mp", "minutes", "mpg")]:
            good = group[field].notna() if group is not None else None
            observed = int(group.loc[good, "g"].sum()) if group is not None else 0
            total = float(group.loc[good, field].sum()) if observed else None
            career_rs[total_key] = total
            career_rs[rate_key] = total / observed if observed else None
            career_rs["metricCoverageGames"][total_key] = observed
            # A whole-career model input is unavailable when the whole career
            # is not observed. Displayed partial rate is marked by coverage.
            if known and observed != games:
                feature["career_" + {"mp": "minutes", "pts": "ppg", "trb": "rpg", "ast": "apg", "stl": "spg", "blk": "bpg"}[field]] = np.nan
        if known:
            for raw_field, model_field in [("ws", "career_ws"), ("vorp", "career_vorp"), ("dws", "career_dws")]:
                if not group[raw_field].notna().any():
                    feature[model_field] = np.nan
        components, component_coverage, inputs = {}, {}, {}
        for component, weights in specs.items():
            if component == "playoffs" or not known:
                components[component + "_score"] = None
                component_coverage[component] = 0
                continue
            contributions = []
            inputs[component] = {}
            for field, coefficient in weights.items():
                value = number(feature.get(field))
                pct = fixed_percentile(value, reference.get(field, []))
                inputs[component][field] = {"raw": value, "referencePercentile": pct, "weight": coefficient}
                if pct is not None:
                    contributions.append((pct, coefficient))
            weight_sum = sum(weight for _, weight in contributions)
            components[component + "_score"] = 100 * sum(pct * weight for pct, weight in contributions) / weight_sum if weight_sum else None
            component_coverage[component] = len(contributions) / len(weights)
        teams = []
        for team in guessed["teams"]:
            if not team["id"].startswith("NBA:"):
                continue
            team_years = [row["season"] for row in guessed["appearances"] if row["teamId"] == team["id"]]
            if team_years:
                start, end = min(team_years), max(team_years)
                teams.append({"code": team["id"][4:], "name": team["name"], "firstSeason": season_label(start),
                              "lastSeason": season_label(end), "firstSeasonEndYear": start, "lastSeasonEndYear": end})
        team_awards = {"mvp": "mvp", "finalsMvp": "finals_mvp", "dpoy": "dpoy", "allNbaFirst": "all_nba_first", "allNba": "all_nba_total",
                       "allStar": "all_star", "allDefense": "all_defense_total", "championships": "championships", "finalsAppearances": "finals_appearances"}
        awards = {key: number(feature.get(field)) for key, field in team_awards.items()}
        awards.update({"hallOfFame": info.get("hof") == "TRUE" if info.get("hof") in ("TRUE", "FALSE") else None, "nba75": None, "nba50": None})
        debut = info.get("debut", "")[:10] or None
        eligibility = {"pools": {"A": False, "B": False, "C": False},
            "reasons": {"A": [], "B": [], "C": ["由用户从全历史/当前NBA扩展目录加入；不是原始300人候选池。"]},
            "performanceCandidateScore": None, "externalRankings": [], "userAdded": True}
        era_label = f"{int((years[0] + years[-1]) / 2) // 10 * 10}s" if years else "Unknown"
        source_ids = ["kaggle_sumitrodatta_nba", "nba_official_history"] if known else [ROSTER_SOURCE]
        notes = ["用户可添加的扩展球员；原300人的分数与媒体模型不改变。",
                 "扩展基础分沿用原七维定义和原300人固定分位参照；这里尚未计算季后赛维度，显示未知，不是0。",
                 "团队成就沿用既有模型的冠军/总决赛球队赛季归属定义，不等同于球员实际在总决赛出场；猜球员次数则另用实际出场证据。",
                 "部分历史基础数据缺失：场均展示有记录比赛口径，指标覆盖场次可查；覆盖不足的原始场均模块不会评分。"]
        if not known:
            notes = ["官方当前名单登记，但没有可核实NBA/BAA常规赛历史出场记录；不以注册名单制造统计，基础评分暂为未知。"]
        profile = {"id": player_id, "name": guessed["name"], "chineseName": guessed["chineseName"], "aliases": guessed["aliases"],
            "position": info.get("pos") or "-".join(guessed["positions"]) or None, "era": era_label,
            "careerStart": years[0] if years else None, "careerEnd": years[-1] if years else None,
            "firstSeason": season_label(years[0]) if years else None, "lastSeason": season_label(years[-1]) if years else None,
            "snapshotStatus": "active" if "nba-active" in guessed["pools"] else "unknown", "seasons": len(years) if years else None,
            "games": games, "teams": teams,
            "background": {"birthDate": birth if birth and birth != "NA" else None,
                "heightCm": round(height * 2.54, 1) if height else guessed["heightCm"], "heightIn": height,
                "weightKg": round(weight * 0.45359237, 1) if weight else None, "weightLb": weight,
                "college": info.get("colleges") if info.get("colleges") not in ("NA", "") else None,
                "country": guessed["country"], "debutDate": debut,
                "debutScope": guessed["firstSeasonScope"] or "未核实", "hasABADebut": False,
                "draft": drafts[player_id][0] if drafts[player_id] else None, "draftRecords": drafts[player_id]},
            "careerRS": career_rs,
            "careerPO": {key: None for key in ["games", "seasons", "firstSeason", "lastSeason", "wins", "ppg", "rpg", "apg", "spg", "bpg", "mpg", "ts"]},
            "awards": awards, "eligibility": eligibility,
            "coverage": {"notes": notes, "missingFields": [], "sources": source_ids,
                         "regularSeasonThrough": years[-1] if years else None, "playoffsThrough": None},
            "nbaRoster": guessed.get("nbaRoster"), "catalogOriginal": False,
            "model": {"player_id": player_id, "player_name": guessed["name"], "era": era_label,
                "position": info.get("pos") or None, "candidate_pools": {"A": False, "B": False, "C": False},
                "components": components, "rankings": {"public_prior_score": None},
                "extension": {"reference": "original-300-frozen", "componentCoverage": component_coverage,
                    "rawFeatures": {field: item["raw"] for group in inputs.values() for field, item in group.items()}, "playoffsComputed": False,
                    "note": "扩展分只投影到原300固定分位，不重拟合原300或评论员参数；所有缺失输入保留未知。"}}}
        output.append(finite_json(profile))
    sources = list(old_directory["sources"])
    sources.extend(source for source in expansion["sources"] if source["id"] not in {item["id"] for item in sources})
    catalog = {"version": "1.0", "meta": {"playerCount": len(output), "originalPlayerCount": 300,
        "snapshotDate": AS_OF, "regularSeasonThrough": 2026, "referencePlayerCount": 300,
        "note": "全历史/当前NBA添加目录。原300档案与model完全保留；新增使用原定义固定参照外推，未重新拟合；新增季后赛维度暂未知。",
        "referenceMethod": "equal: original average rank/n; non-equal: fraction of original reference values below x; outside:0/100; fixed reference never changes with added players",
        "componentSpecifications": specs,
        "frozenReferences": {field: [float(value) for value in values if math.isfinite(value)] for field, values in reference.items()}}, "sources": sources, "players": output}
    for profile in output:
        if profile["id"] in old_models:
            assert profile["model"] == old_models[profile["id"]], "Original model must never change"
            assert {key: value for key, value in profile.items() if key in old_profiles[profile["id"]]} == old_profiles[profile["id"]]
        for score in profile["model"]["components"].values():
            assert score is None or 0 <= score <= 100
    assert fixed_percentile(2, [1, 2, 2, 4]) == 0.625
    assert fixed_percentile(0, [1, 2, 2, 4]) == 0
    assert fixed_percentile(5, [1, 2, 2, 4]) == 1
    assert fixed_percentile(None, [1, 2, 2, 4]) is None
    print(json.dumps({"catalogSelfTest": "PASS", "players": len(output), "originalModelsPreserved": 300,
        "newPlayersWithAnyComponent": sum(not p["catalogOriginal"] and any(v is not None for v in p["model"]["components"].values()) for p in output)}))
    return catalog


def season_label(year):
    return f"{year - 1}–{str(year)[-2:]}"


def self_test(data):
    players = {p["id"]: p for p in data["players"]}
    source_ids = {source["id"] for source in data["sources"]}
    assert len(source_ids) == len(data["sources"])
    assert len(players) == len(data["players"])
    for pool in data["pools"]:
        assert pool["count"] == sum(pool["id"] in p["pools"] for p in players.values())
    assert "nba-active" not in players["jordami01"]["pools"]
    assert "nba-active" in players["jamesle01"]["pools"]
    assert "nba-easy" in players["jordami01"]["pools"]
    assert len([p for p in players.values() if "nba-history" in p["pools"]]) >= 5000
    for player in players.values():
        assert len(player["pools"]) == len(set(player["pools"]))
        assert set(player["sourceIds"]) <= source_ids
        assert all(row["sourceId"] in source_ids for row in player["appearances"])
        played = [row for row in player["appearances"] if row["league"] in ("NBA", "BAA")]
        assert ("nba-history" in player["pools"]) == bool(played)
        assert all(row["games"] > 0 and row["evidence"] == "season-games" for row in played)
        if "nba-active" in player["pools"]:
            assert player["nbaRoster"]["asOf"] == AS_OF
        if "nba-easy" in player["pools"]:
            assert player["mvpCount"] >= 1 or player["allStarSelections"] >= 5
        if player["directoryId"]:
            assert player["directoryId"] == player["id"]
        for metric in METRICS:
            assert metric in player and metric in player["metricCoverage"]
    print(json.dumps({"selfTest": "PASS", "players": len(players), "pools": data["pools"],
        "identityRedirects": data["identityRedirects"], "unmatchedEarlierRoster": data["meta"]["unmatchedEarlierRoster"]}, ensure_ascii=False))


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh-roster", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--catalog", action="store_true", help="Also generate frozen-reference player directory/model catalog")
    args = parser.parse_args()
    if args.refresh_roster:
        refresh_roster()
    result = build()
    self_test(result)
    OUT.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Generated factual expansion: {OUT.name}, {OUT.stat().st_size:,} bytes")
    if args.catalog:
        catalog = build_catalog(result)
        CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, separators=(",", ":"), allow_nan=False) + "\n", encoding="utf-8")
        print(f"Generated catalog: {CATALOG.name}, {CATALOG.stat().st_size:,} bytes")
