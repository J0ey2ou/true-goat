"""Build the read-only player directory from retained, player-id-linked sources.

This export does not change candidate selection or ranking features. Seasons are
labelled by ending year in the inputs; biography debut dates remain separate.
Missing values are serialized as JSON null, including unavailable nationality.
"""
from __future__ import annotations

import argparse
import json
import math
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from ranking_utils import SOURCE_META, parse_external_rankings


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
RAW = DATA / "raw" / "kaggle_nba_aba_baa" / "csv"
PROCESSED = DATA / "processed"
OUTPUT = ROOT / "app" / "data" / "player-directory.json"


def value(item):
    if item is None or pd.isna(item):
        return None
    if hasattr(item, "item"):
        item = item.item()
    if isinstance(item, float):
        return round(item, 6) if math.isfinite(item) else None
    return item


def integer(item):
    parsed = pd.to_numeric(item, errors="coerce")
    return None if pd.isna(parsed) else int(parsed)


def flag(item):
    return str(item).lower() in ("true", "1", "1.0")


def season_label(year):
    number = integer(year)
    return f"{number - 1}–{number % 100:02d}" if number else None


def indexed(path):
    table = pd.read_csv(path)
    assert not table["player_id"].duplicated().any(), f"duplicate player ids: {path}"
    return table.set_index("player_id")


def build():
    config = json.loads((ROOT / "config" / "candidate_rules.yaml").read_text(encoding="utf-8"))
    source_config = json.loads((ROOT / "config" / "source_config.yaml").read_text(encoding="utf-8"))
    snapshot = source_config["access_date"]
    master = pd.read_csv(ROOT / "output" / "candidate_pool" / "master_pool.csv")
    universe = indexed(ROOT / "output" / "diagnostics" / "candidate_universe_scores.csv")
    info = indexed(PROCESSED / "player_info.csv")
    biographies = indexed(RAW / "Player Career Info.csv")
    regular = indexed(PROCESSED / "regular_season_career.csv")
    playoffs = indexed(PROCESSED / "playoffs_career.csv")
    awards = indexed(PROCESSED / "awards.csv")
    success = indexed(PROCESSED / "team_success.csv")
    rs_seasons = pd.read_csv(PROCESSED / "regular_season_by_season.csv")
    po_seasons = pd.read_csv(PROCESSED / "playoffs_by_season.csv")
    rs_groups = {key: group for key, group in rs_seasons.groupby("player_id")}
    po_groups = {key: group for key, group in po_seasons.groupby("player_id")}
    draft = pd.read_csv(RAW / "Draft Pick History.csv")
    draft = draft[draft.lg.isin(["NBA", "BAA"])]
    totals = pd.read_csv(RAW / "Player Totals.csv")
    aba_first = totals[totals.lg.eq("ABA")].groupby("player_id").season.min().to_dict()
    # Canonical career tables merge traded-player seasons into TOT. The original
    # team rows are needed here to retain all actual team stints without TOT.
    totals = totals[totals.lg.isin(["NBA", "BAA"]) & totals.player_id.isin(master.player_id)]
    totals = totals[~totals.team.astype(str).str.fullmatch(r"TOT|\d+TM", case=False)]
    teams_table = pd.read_csv(RAW / "Team Abbrev.csv")
    team_names = {(int(row.season), row.abbreviation): row.team for row in teams_table.itertuples()}
    rule_table = pd.read_csv(ROOT / "output" / "candidate_pool" / "candidate_rules.csv")
    top_n = int(rule_table.loc[rule_table.rule.eq("calibrated_top_n"), "value"].iloc[0])
    ordered_rankings, official_teams = parse_external_rankings()
    eligible = universe[universe.career_games.ge(config["minimum_career_games"])].sort_values("performance_candidate_score", ascending=False)
    performance_ranks = {key: rank for rank, key in enumerate(eligible.index, start=1)}
    era_sorted = eligible.sort_values(["era", "performance_candidate_score"], ascending=[True, False])
    b_era = set(era_sorted.groupby("era").head(config["pool_b"]["era_representatives_per_decade"]).index)
    c_era = set(era_sorted.groupby("era").head(config["pool_c"]["era_representatives_per_decade"]).index)
    players = []
    for row in master.itertuples(index=False):
        player_id = row.player_id
        candidate = universe.loc[player_id]
        bio, ri, rs, po = biographies.loc[player_id], info.loc[player_id], regular.loc[player_id], playoffs.loc[player_id]
        award, team_success = awards.loc[player_id], success.loc[player_id]
        rs_group = rs_groups[player_id]
        po_group = po_groups.get(player_id, pd.DataFrame())
        pools = {key: flag(getattr(row, f"pool_{key}")) for key in "ABC"}
        reasons = {key: [] for key in "ABC"}
        a = config["pool_a"]
        tests = [("mvp", "MVP", "mvp_min"), ("dpoy", "最佳防守球员", "dpoy_min"),
                 ("all_nba_first", "最佳阵容一阵", "all_nba_first_min"),
                 ("all_nba_total", "最佳阵容", "all_nba_total_min"),
                 ("all_star", "全明星", "all_star_min"), ("leader_titles", "单项数据王", "leader_titles_min")]
        if pools["A"]:
            for column, label, threshold in tests:
                if candidate[column] >= a[threshold]:
                    reasons["A"].append(f"{label} {int(candidate[column])} 次，达到入选门槛 {a[threshold]} 次")
            if candidate.honor_score_percentile >= a["honor_score_percentile"]:
                reasons["A"].append(f"荣誉候选指数处于历史候选全集前 {(1 - a['honor_score_percentile']) * 100:.1f}%")
            for column, label in [("NBA_75", "NBA 75 周年官方名单"), ("NBA_50", "NBA 50 周年官方名单")]:
                if flag(candidate[column]):
                    reasons["A"].append(f"入选{label}")
        if pools["B"]:
            rank = performance_ranks.get(player_id)
            if rank is not None and rank <= top_n:
                reasons["B"].append(f"常规赛至少 {config['minimum_career_games']} 场的候选人中，统计候选指数第 {rank}，进入前 {top_n}")
            if player_id in b_era:
                reasons["B"].append(f"{row.era} 年代统计候选指数前 {config['pool_b']['era_representatives_per_decade']}，纳入年代代表")
            reasons["B"].append(f"统计候选指数 {candidate.performance_candidate_score:.3f}；用于选人，不是 GOAT 最终得分")
        if pools["C"]:
            if candidate.external_ranked_sources > 0:
                reasons["C"].append(f"进入 {int(candidate.external_ranked_sources)} 份已收录媒体历史排行榜")
            for column, label in [("NBA_75", "NBA 75 周年官方名单"), ("NBA_50", "NBA 50 周年官方名单")]:
                if flag(candidate[column]):
                    reasons["C"].append(f"入选{label}")
            if flag(candidate.hof) and candidate.all_star >= config["pool_c"]["include_hof_with_all_star_min"]:
                reasons["C"].append(f"快照记载为名人堂成员，且至少 {config['pool_c']['include_hof_with_all_star_min']} 次全明星")
            if "configured high-elasticity/discussion case" in str(row.qualification_C):
                reasons["C"].append("项目配置明确列入的讨论案例；不是统计门槛或额外加分")
            if player_id in c_era:
                reasons["C"].append(f"{row.era} 年代统计候选指数前 {config['pool_c']['era_representatives_per_decade']}，纳入年代代表")
        observed_teams = []
        for code, group in totals[totals.player_id.eq(player_id)].groupby("team"):
            start, end = int(group.season.min()), int(group.season.max())
            observed_teams.append({"code": code, "name": team_names.get((end, code), code),
                                   "firstSeason": season_label(start), "lastSeason": season_label(end),
                                   "firstSeasonEndYear": start, "lastSeasonEndYear": end})
        observed_teams.sort(key=lambda item: (item["firstSeasonEndYear"], item["code"]))
        height, weight = value(bio.ht_in_in), value(bio.wt)
        draft_records = []
        for pick in draft[draft.player_id.eq(player_id)].sort_values("season").itertuples():
            draft_records.append({"year": int(pick.season), "round": integer(pick.round),
                                  "pick": integer(pick.overall_pick), "team": pick.tm,
                                  "teamName": team_names.get((int(pick.season) + 1, pick.tm), pick.tm)})
        debut = pd.to_datetime(bio.debut, errors="coerce", utc=True)
        nba_debut_matches = pd.notna(debut) and int(rs.career_start) - 1 <= debut.year <= int(rs.career_start)
        aba_season = aba_first.get(player_id)
        has_aba_debut = bool(pd.notna(debut) and not nba_debut_matches and aba_season is not None and aba_season - 1 <= debut.year <= aba_season)
        background = {"birthDate": value(bio.birth_date), "heightCm": round(height * 2.54, 1) if height else None,
                      "heightIn": height, "weightKg": round(weight * 0.45359237, 1) if weight else None,
                      "weightLb": weight, "college": value(bio.colleges), "country": None,
                      "debutDate": debut.strftime("%Y-%m-%d") if pd.notna(debut) else None,
                      "debutScope": "ABA" if has_aba_debut else "NBA/BAA" if nba_debut_matches else "未核实",
                      "hasABADebut": has_aba_debut,
                      "draft": draft_records[0] if draft_records else None, "draftRecords": draft_records}
        career_rs = {"games": integer(rs.career_games), "seasons": integer(rs.career_seasons),
                     "ts": value(rs.career_ts), "metricCoverageGames": {}}
        coverage_notes = []
        if pd.notna(debut) and not int(rs.career_start) - 1 <= debut.year <= int(rs.career_start):
            coverage_notes.append("原始首赛日期早于 NBA/BAA 首个赛季，可能为 ABA 首秀；不可当作 NBA 首秀日期。NBA/BAA 年代范围以本页赛季记录为准。")
        for column, total_key, per_game_key in [("pts", "points", "ppg"), ("trb", "rebounds", "rpg"),
                                                ("ast", "assists", "apg"), ("stl", "steals", "spg"),
                                                ("blk", "blocks", "bpg"), ("mp", "minutes", "mpg")]:
            observed = rs_group[column].notna()
            available_games = rs_group.loc[observed, "g"].sum()
            total = rs_group.loc[observed, column].sum(min_count=1)
            career_rs[total_key] = value(total)
            career_rs[per_game_key] = value(total / available_games) if available_games else None
            career_rs["metricCoverageGames"][total_key] = int(available_games)
        if any(count < career_rs["games"] for count in career_rs["metricCoverageGames"].values()):
            coverage_notes.append("早期部分统计未记录：累计只计有值赛季，场均以该项有记录赛季的出场数为分母；缺失不是 0。")
        career_po = {"games": integer(po.playoff_games), "seasons": integer(po.playoff_seasons_observed),
                     "firstSeason": season_label(po.playoff_first_observed), "lastSeason": season_label(po.playoff_last_observed),
                     "wins": integer(po.playoff_wins_known), "ppg": value(po.playoff_ppg),
                     "rpg": value(po.playoff_rpg), "apg": value(po.playoff_apg), "spg": value(po.playoff_spg),
                     "bpg": value(po.playoff_bpg), "mpg": value(po.playoff_minutes_per_game), "ts": value(po.playoff_ts_pct)}
        if po_group.empty:
            coverage_notes.append("未收录季后赛数据；这不等于已确认季后赛出场为 0。")
        if int(rs.career_end) > int(po_seasons.season.max()):
            coverage_notes.append("常规赛与季后赛快照不同步；季后赛未更新至该球员末个常规赛记录年。")
        if not background["college"]:
            coverage_notes.append("学校字段未收录；不能据此推断未上大学。")
        if not draft_records:
            coverage_notes.append("NBA/BAA 选秀表未匹配；不能据此推断为落选秀。")
        if len(draft_records) > 1:
            coverage_notes.append("选秀来源有多条记录，展示首条并在 draftRecords 中保留全部。")
        coverage_notes.append("国家/地区未有可靠字段，暂不从姓名、出生地或学校推断。")
        po_source_ids = sorted(set(po_group.source_id.dropna())) if not po_group.empty else []
        external_records = [{"sourceId": record.source, "rank": int(record.rank), "size": int(record.ranking_size), "year": int(record.year)}
                            for record in ordered_rankings[ordered_rankings.name_key.eq(candidate.name_key)].itertuples()]
        recognition_ids = list(official_teams.loc[official_teams.name_key.eq(candidate.name_key), "source"])
        players.append({"id": player_id, "name": row.player_name, "chineseName": None,
                        "position": value(ri.position), "era": row.era,
                        "careerStart": int(rs.career_start), "careerEnd": int(rs.career_end),
                        "firstSeason": season_label(rs.career_start), "lastSeason": season_label(rs.career_end),
                        "snapshotStatus": row.active_status, "seasons": integer(rs.career_seasons),
                        "games": integer(rs.career_games), "teams": observed_teams, "background": background,
                        "careerRS": career_rs, "careerPO": career_po,
                        "awards": {"mvp": integer(award.mvp), "finalsMvp": integer(award.finals_mvp),
                                   "dpoy": integer(award.dpoy), "allNbaFirst": integer(award.all_nba_first),
                                   "allNba": integer(award.all_nba_total), "allStar": integer(award.all_star),
                                   "allDefense": integer(award.all_defense_total),
                                   "championships": integer(team_success.championships),
                                   "finalsAppearances": integer(team_success.finals_appearances),
                                   "hallOfFame": flag(bio.hof), "nba75": flag(row.NBA_75), "nba50": flag(row.NBA_50)},
                        "eligibility": {"pools": pools, "reasons": reasons,
                                        "performanceCandidateScore": value(candidate.performance_candidate_score),
                                        "externalRankings": external_records},
                        "coverage": {"notes": coverage_notes,
                                     "missingFields": [key for key, item in background.items() if item is None],
                                     "sources": sorted(set(["kaggle_sumitrodatta_nba", "nba_official_history"] + po_source_ids + recognition_ids + [record["sourceId"] for record in external_records])),
                                     "regularSeasonThrough": int(rs.career_end),
                                     "playoffsThrough": integer(po.playoff_last_observed)}})
    sources = [{"id": item["source_id"], "title": item["title"], "url": item["url"],
                "accessedAt": snapshot, "note": item["coverage"], "official": item["official_status"] == "official"}
               for item in source_config["sources"]]
    sources.extend({"id": key, "title": key.replace("_", " "), "url": item["url"], "accessedAt": snapshot,
                    "note": "入选依据使用的公开历史榜或官方周年名单；不代表现行榜单。"}
                   for key, item in SOURCE_META.items())
    sources.extend([
        {"id": "nba_profile_jordan", "title": "NBA 官方档案：Michael Jordan（背景抽查）", "accessedAt": "2026-10-03",
         "url": "https://www.nba.com/stats/player/893", "note": "仅抽查生日字段与本地快照一致；不是 300 人逐项官方核验"},
        {"id": "nba_profile_abdul_jabbar", "title": "NBA 官方档案：Kareem Abdul-Jabbar（背景抽查）", "accessedAt": "2026-10-03",
         "url": "https://www.nba.com/stats/player/76003/traditional", "note": "仅抽查生日字段与本地快照一致；不是 300 人逐项官方核验"},
    ])
    directory = {"version": "1.0", "meta": {"playerCount": len(players), "snapshotDate": snapshot,
                 "generatedAt": datetime.now(timezone.utc).isoformat(),
                 "regularSeasonThrough": int(rs_seasons.season.max()), "playoffsThrough": int(po_seasons.season.max()),
                 "scope": "NBA / BAA；不把 ABA 赛季混入生涯统计", "note": "入选资格和评分分离：300 人为 A / B / C 三池并集，不是先定好的历史前 300 名。年份均指赛季结束年；球队为原始赛季表中的实际球队，不含 TOT 合计行。",
                 "backgroundNote": "身高体重为来源档案记录值（in/lb 转 cm/kg），不是实时测量。快照 active/retired 为按末个记录赛季生成的状态，不代表已核实当前在役/退役。",
                 "coverage": {"birthDate": sum(bool(p["background"]["birthDate"]) for p in players),
                              "height": sum(p["background"]["heightCm"] is not None for p in players),
                              "weight": sum(p["background"]["weightKg"] is not None for p in players),
                              "college": sum(bool(p["background"]["college"]) for p in players),
                              "draft": sum(p["background"]["draft"] is not None for p in players),
                              "teams": sum(bool(p["teams"]) for p in players),
                              "country": 0, "playoffs": sum(p["careerPO"]["games"] is not None for p in players)},
                 "fieldSources": {"background": "kaggle_sumitrodatta_nba / Player Career Info.csv", "draft": "kaggle_sumitrodatta_nba / Draft Pick History.csv", "teams": "kaggle_sumitrodatta_nba / Player Totals.csv + Team Abbrev.csv", "regularSeason": "kaggle_sumitrodatta_nba / processed regular_season_by_season.csv", "playoffs": "processed playoffs_career.csv；多来源合并，逐球员列出主来源", "awards": "processed awards.csv + team_success.csv；NBA 官方历史快照与候选原始源合并", "eligibility": "01_build_candidate_pool.py + candidate_rules.yaml + candidate_universe_scores.csv"}},
                 "pools": [
                     {"id": "A", "name": "荣誉与官方认可", "count": int(master.pool_A.sum()),
                      "description": "达到一项荣誉门槛或官方周年名单，即可进入 A 池。",
                      "rules": ["MVP ≥ 1；DPOY ≥ 1；最佳阵容一阵 ≥ 2；最佳阵容总数 ≥ 4；全明星 ≥ 6；单项数据王 ≥ 2（满足其一）", "或荣誉候选指数达到全集 96.5 分位；或 NBA 50 / 75 周年官方名单"]},
                     {"id": "B", "name": "统计表现与年代代表", "count": int(master.pool_B.sum()),
                      "description": f"至少 100 场的候选人中，统计候选指数前 {top_n}，并补入每年代前 5。",
                      "rules": ["指数来自巅峰 1/3/5 年、累积表现、出场时间、WS、VORP 的可用项加权分位", "前 N 的阈值自动校准，使三池并集接近 300；不使用最终 GOAT 分数挑人"]},
                     {"id": "C", "name": "媒体认可与讨论案例", "count": int(master.pool_C.sum()),
                      "description": "媒体历史榜、官方名单、名人堂及全明星、年代代表和预设讨论案例。",
                      "rules": ["至少进入一份已收录外部有序榜；或 NBA 50 / 75；或名人堂且全明星 ≥ 3", "或至少 100 场候选人中的每年代统计指数前 3；或配置列出的 24 个讨论案例"]},
                 ], "sources": sources, "players": players}
    validate(directory)
    return directory


def validate(directory):
    players = directory["players"]
    assert len(players) == 300
    assert len({p["id"] for p in players}) == 300
    assert [p["count"] for p in directory["pools"]] == [203, 219, 162]
    for player in players:
        assert any(player["eligibility"]["pools"].values())
        for key in "ABC":
            assert bool(player["eligibility"]["reasons"][key]) == player["eligibility"]["pools"][key]
        assert player["background"]["country"] is None
        assert all(team["code"] != "TOT" for team in player["teams"])
    by_id = {p["id"]: p for p in players}
    jordan = by_id["jordami01"]
    assert jordan["background"]["birthDate"] == "1963-02-17"
    assert jordan["background"]["debutDate"] == "1984-10-26"
    assert jordan["firstSeason"] == "1984–85" and jordan["lastSeason"] == "2002–03"
    assert jordan["careerRS"]["points"] == 32292 and jordan["careerPO"]["games"] == 179
    assert jordan["background"]["draft"]["pick"] == 3
    assert set(team["code"] for team in jordan["teams"]) == {"CHI", "WAS"}
    assert by_id["abdulka01"]["background"]["birthDate"] == "1947-04-16"
    assert by_id["chambwi01"]["careerRS"]["blocks"] is None
    assert by_id["chambwi01"]["careerRS"]["bpg"] is None
    json.dumps(directory, ensure_ascii=False, allow_nan=False)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true", help="Validate without modifying output")
    args = parser.parse_args()
    result = build()
    if not args.self_test:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print(json.dumps({"ok": True, "players": result["meta"]["playerCount"], "coverage": result["meta"]["coverage"], "output": str(OUTPUT) if not args.self_test else None}, ensure_ascii=False))
