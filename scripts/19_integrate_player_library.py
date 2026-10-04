"""Integrate source-linked pool expansions; never infer appearances from a roster.

Rebuild the original curated facts offline, merge explicitly linked identities,
then write only the two public factual data packages. Originals remain unchanged.
"""
from __future__ import annotations

import argparse
import copy
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
METRICS = ["teamCount", "playoffAppearances", "finalsAppearances", "pointsPerGame", "mvpCount"]
POOL_IDS = ["nba-easy", "nba-active", "nba-history", "cba-easy", "cba-active", "cba-history", "global"]


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def unique(items):
    return list(dict.fromkeys(items))


def merge_person(preferred, supplemental):
    result = copy.deepcopy(preferred)
    for key, value in supplemental.items():
        if key not in result or result[key] is None or result[key] == [] or result[key] == {}:
            result[key] = copy.deepcopy(value)
    for key in ["pools", "sourceIds", "aliases", "notes"]:
        result[key] = unique(preferred.get(key, []) + supplemental.get(key, []))
    result["aliases"] = unique(result["aliases"] + [n for n in [supplemental.get("name"), supplemental.get("chineseName")] if n and n not in [result.get("name"), result.get("chineseName")]])
    result["teams"] = list({t["id"]: t for t in supplemental.get("teams", []) + preferred.get("teams", [])}.values())
    result["appearances"] = sorted({(r["league"], r["season"], r["teamId"]): r
        for r in supplemental.get("appearances", []) + preferred.get("appearances", [])}.values(),
        key=lambda r: (r["season"], r["league"], r["teamId"]))
    fields = result.setdefault("fieldSources", {})
    for key, sources in supplemental.get("fieldSources", {}).items():
        fields[key] = unique(fields.get(key, []) + sources)
    return result


def build():
    spec = importlib.util.spec_from_file_location("curated_guess", ROOT / "scripts/15_build_guess_players.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    base = module.build()
    nba = load(ROOT / "config/guess-nba-expansion.json")
    cba = load(ROOT / "config/guess-cba-expansion.json")
    catalog = load(ROOT / "config/nba-player-catalog.json")
    redirects = {**nba.get("identityRedirects", {}), **cba.get("identityRedirects", {})}

    def identity(value):
        seen = set()
        while value in redirects:
            if value in seen:
                raise ValueError("Identity redirect cycle")
            seen.add(value)
            value = redirects[value]
        return value

    redirects = {alias: identity(alias) for alias in redirects}

    sources = {s["id"]: s for pack in [base, nba, cba] for s in pack["sources"]}
    people = {}
    for pack in [nba, cba, base]:
        for raw in pack["players"]:
            record = copy.deepcopy(raw)
            old_id, record["id"] = record["id"], identity(record["id"])
            if record["id"] != old_id:
                record["aliases"] = unique(record.get("aliases", []) + [old_id])
            previous = people.get(record["id"])
            # Keep the already audited 300-player facts; supplement new identities
            # with historical NBA records instead of overwriting them with unknowns.
            if previous:
                record = merge_person(record, previous) if pack is base and raw.get("directoryId") else merge_person(previous, record)
            people[record["id"]] = record
    catalog_ids = {p["id"] for p in catalog["players"]}
    for player in people.values():
        appearances = player.get("appearances", [])
        memberships = set(player.get("pools", [])) - {"nba", "cba"}
        if any(r["league"] in ["NBA", "BAA"] for r in appearances):
            memberships.add("nba-history")
        if any(r["league"] == "CBA" for r in appearances):
            memberships.add("cba-history")
            # Yao's dated CBA performance comes from the original reviewed FIBA
            # evidence, not the expanded Sina index. Retain him in the easy pool.
            if player["id"] == "mingya01":
                memberships.add("cba-easy")
        memberships.add("global")
        player["pools"] = [p for p in POOL_IDS if p in memberships]
        player["directoryId"] = player["id"] if player["id"] in catalog_ids else None
        team_leagues = {t["id"].split(":", 1)[0] for t in player["teams"]}
        if len(team_leagues) > 1:
            # Complete NBA history does not make a merged CBA/Euro sample complete.
            player["teamsComplete"] = False
            player["teamsScope"] = "已收录跨联赛球队（覆盖不完整）"
        nba_years = sorted({r["season"] for r in appearances if r["league"] in ["NBA", "BAA"]})
        player["seasonYears"] = nba_years or sorted({r["season"] for r in appearances})
        source_ids = unique(r["sourceId"] for r in appearances)
        player.setdefault("fieldSources", {})["appearances"] = source_ids
        player["sourceIds"] = unique(player.get("sourceIds", []) + source_ids)
        leagues = {r["league"] for r in appearances}
        player["appearanceCoverage"] = {
            "verifiedOnly": True,
            "complete": bool(nba_years) and leagues <= {"NBA", "BAA"},
            "throughSeason": max((r["season"] for r in appearances), default=None),
            "scope": "NBA/BAA 常规赛" if leagues <= {"NBA", "BAA"} else "已核实的跨联赛实际出场",
            "note": "只使用同一行的赛季、球队和正出场数/明确比赛表现。注册或阵容名单不算出场；跨联赛历史覆盖可能不完整。",
        }
        player.setdefault("metricScope", {})
        player.setdefault("metricCoverage", {})
        for key in METRICS:
            player.setdefault(key, None)
            player["metricCoverage"].setdefault(key, module.field_coverage())
            player["metricScope"][key] = player["metricCoverage"][key].get("scope")
            player["fieldSources"].setdefault(key, [])
    pools = {p["id"]: copy.deepcopy(p) for pack in [nba, cba] for p in pack["pools"]}
    pools["global"] = {"id": "global", "name": "全球 · 跨联赛已收录", "description": "NBA/BAA、CBA 与 EuroLeague 已收录档案，按已核实身份映射合并；仍有跨源身份待核查，不凭同名强行合并，也不是全球全部运动员。NBA GOAT 评级独立于游戏题库。"}
    for pool_id in POOL_IDS:
        if pool_id not in pools:
            raise ValueError("Missing documented pool " + pool_id)
        pools[pool_id]["count"] = sum(pool_id in p["pools"] for p in people.values())
        pools[pool_id]["asOf"] = nba["dataAsOf"] if pool_id.startswith("nba-") else cba["dataAsOf"] if pool_id.startswith("cba-") else "2026-10-04"
    metadata = copy.deepcopy(base["meta"])
    metadata.update({
        "snapshotDate": "2026-10-04", "nba": nba["meta"], "cba": cba["meta"],
        "note": "游戏独立于默认300人评级池。NBA历史涵盖快照内全部实际常规赛出场者；NBA现役为官网当日阵容，含训练营/双向/新人。CBA现役和历史覆盖按各池说明，不将未核实记录称为完整历史。已核实中文名/绰号保留，新增未核实译名者可用英文检索。",
        "metricCoverage": {key: sum(p[key] is not None for p in people.values()) for key in METRICS},
        "yearFilterNote": "年份和球队必须命中同一条实际出场证据。阵容、注册名单、优先续约权和档案页年份都不作为已出场证明。",
        "appearanceCoverage": {"version": "2.0", "verifiedPlayers": sum(bool(p["appearances"]) for p in people.values()),
            "records": sum(len(p["appearances"]) for p in people.values()), "note": "仅核实已收录实际比赛证据；现役新人、早期或国际缺失记录可能无法进入限定题目。"},
    })
    result = {"version": "2.0", "dataAsOf": "2026-10-04", "meta": metadata,
        "pools": [pools[p] for p in POOL_IDS], "sources": list(sources.values()),
        "identityRedirects": redirects, "players": sorted(people.values(), key=lambda p: p["id"])}
    # Reviewed cross-league aliases should also work in the add-player dialog.
    # Preserve every original default profile byte-for-byte at the field level.
    for profile in catalog["players"]:
        person = people.get(profile["id"])
        if not person or profile.get("catalogOriginal"):
            continue
        profile["aliases"] = unique(profile.get("aliases", []) + person.get("aliases", []) + [n for n in [person.get("chineseName")] if n])
        if not profile.get("chineseName"):
            profile["chineseName"] = person.get("chineseName")
    validate(result, catalog)
    return result, catalog


def validate(data, catalog):
    ids = {p["id"] for p in data["players"]}
    sources = {s["id"] for s in data["sources"]}
    assert len(ids) == len(data["players"])
    assert len(ids) > 5000
    assert len(data["pools"]) == 7
    for alias, target in data["identityRedirects"].items():
        assert alias not in ids and target in ids, (alias, target)
    assert len({p["id"] for p in catalog["players"]}) == len(catalog["players"])
    for player in data["players"]:
        assert set(player["sourceIds"]) <= sources, (player["id"], set(player["sourceIds"]) - sources)
        assert player["pools"] and all(p in POOL_IDS for p in player["pools"])
        teams = {t["id"] for t in player["teams"]}
        for row in player["appearances"]:
            assert row["teamId"] in teams, (player["id"], row)
            assert row["sourceId"] in sources
            assert row["evidence"] in ["season-games", "dated-performance"]
            assert row.get("games", 1) > 0
        for key in METRICS:
            if player[key] is not None:
                assert player["metricCoverage"][key]["complete"]
                assert player["fieldSources"][key]
    by_id = {p["id"]: p for p in data["players"]}
    assert by_id["jordami01"]["pointsPerGame"] == 30.1
    assert "nba-active" not in by_id["jordami01"]["pools"]
    assert "nba-active" in by_id["jamesle01"]["pools"]
    assert by_id["hardeja01"]["chineseName"] == "詹姆斯·哈登"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true")
    options = parser.parse_args()
    game, catalog = build()
    if not options.self_test:
        for name, payload in [("guess-players.json", game), ("player-catalog.json", catalog)]:
            (ROOT / "app/data" / name).write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":"), allow_nan=False) + "\n", encoding="utf-8")
    print(json.dumps({"ok": True, "version": game["version"], "players": len(game["players"]), "catalog": len(catalog["players"]), "pools": [{"id": p["id"], "count": p["count"]} for p in game["pools"]]}, ensure_ascii=False))
