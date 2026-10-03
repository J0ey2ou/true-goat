from __future__ import annotations

import re

import numpy as np
import pandas as pd

from common import (
    RAW,
    RAW_CSV,
    PLAYER_NAME_OVERRIDES,
    canonical_name,
    canonical_season_rows,
    season_end_year,
    safe_zscore,
    weighted_available_average,
)


def load_regular_seasons() -> pd.DataFrame:
    totals = canonical_season_rows(pd.read_csv(RAW_CSV / "Player Totals.csv"))
    totals["player"] = totals["player_id"].map(PLAYER_NAME_OVERRIDES).fillna(totals["player"])
    advanced = canonical_season_rows(pd.read_csv(RAW_CSV / "Advanced.csv"))
    advanced_columns = [
        "player_id", "season", "per", "ts_percent", "ows", "dws", "ws", "ws_48", "obpm", "dbpm", "bpm", "vorp"
    ]
    season = totals.merge(advanced[advanced_columns], on=["player_id", "season"], how="left")
    for total, rate in [("pts", "ppg"), ("trb", "rpg"), ("ast", "apg"), ("stl", "spg"), ("blk", "bpg"), ("tov", "tovpg")]:
        season[rate] = pd.to_numeric(season[total], errors="coerce").div(pd.to_numeric(season["g"], errors="coerce").replace(0, np.nan))
    season["career_ts_calc"] = pd.to_numeric(season["pts"], errors="coerce").div(
        2 * (pd.to_numeric(season["fga"], errors="coerce") + 0.44 * pd.to_numeric(season["fta"], errors="coerce"))
    )
    season["ts_percent"] = season["ts_percent"].fillna(season["career_ts_calc"])
    season["league_max_games"] = season.groupby("season")["g"].transform("max")
    season["games_share"] = season["g"] / season["league_max_games"].replace(0, np.nan)
    return season


def add_era_adjustments(season: pd.DataFrame, min_floor: int = 20, min_share: float = 0.35) -> pd.DataFrame:
    work = season.copy()
    work["qualified_for_rate"] = (work["g"] >= min_floor) & (work["games_share"] >= min_share)
    rate_columns = ["ppg", "rpg", "apg", "spg", "bpg", "ts_percent", "per", "ws_48", "bpm", "dbpm"]
    for column in rate_columns:
        eligible = pd.to_numeric(work[column], errors="coerce").where(work["qualified_for_rate"])
        work[f"z_{column}"] = eligible.groupby(work["season"]).transform(safe_zscore)
    work["era_offense"] = weighted_available_average(
        work,
        {"z_ppg": 0.33, "z_apg": 0.18, "z_ts_percent": 0.20, "z_per": 0.10, "z_ws_48": 0.09, "z_bpm": 0.10},
    )
    work["era_rebound"] = work["z_rpg"]
    work["era_defense"] = weighted_available_average(work, {"z_spg": 0.25, "z_bpg": 0.30, "z_dbpm": 0.45})
    work["season_performance"] = weighted_available_average(
        work,
        {
            "z_ppg": 0.24,
            "z_rpg": 0.13,
            "z_apg": 0.14,
            "z_ts_percent": 0.14,
            "z_per": 0.11,
            "z_bpm": 0.12,
            "z_ws_48": 0.08,
            "era_defense": 0.04,
        },
    )
    work["season_performance_available"] = work["season_performance"] - 0.45 * (1 - work["games_share"].clip(0, 1))
    return work


def _parse_official_winner_page(filename: str) -> pd.DataFrame:
    text = (RAW / filename).read_text(encoding="utf-8")
    rows = []
    pattern = re.compile(r"(?m)^(\d{4}(?:-\d{2})?)\s*[:—–-]+\s*([^,\n]+),\s*([^\n\(]+)")
    for season_text, player, team in pattern.findall(text):
        rows.append(
            {
                "season": season_end_year(season_text),
                "player": re.sub(r"[*_\[\]]", "", player).strip(),
                "team": re.sub(r"[*_\[\]]", "", team).strip(),
            }
        )
    return pd.DataFrame(rows).drop_duplicates(["season", "player"])


def load_official_award_counts() -> pd.DataFrame:
    frames = []
    for filename, column in [
        ("nba_mvp_official.md", "mvp"),
        ("nba_dpoy_official.md", "dpoy"),
        ("nba_finals_mvp_official.md", "finals_mvp"),
    ]:
        data = _parse_official_winner_page(filename)
        data["name_key"] = data["player"].map(canonical_name)
        counts = data.groupby("name_key").size().rename(column)
        frames.append(counts)
    return pd.concat(frames, axis=1).fillna(0).reset_index()


def load_current_team_supplement() -> pd.DataFrame:
    rows: list[dict] = []
    specs = [
        ("nba_all_nba_official.md", "All-NBA", ["FIRST TEAM", "SECOND TEAM", "THIRD TEAM"]),
        ("nba_all_defense_official.md", "All-Defense", ["FIRST TEAM", "SECOND TEAM"]),
    ]
    for filename, team_type, labels in specs:
        text = (RAW / filename).read_text(encoding="utf-8")
        start = text.find("2025-26")
        end_candidates = [value for value in [text.find("2024-25", start + 1), text.find("Official Release", start + 1)] if value > start]
        block = text[start : min(end_candidates) if end_candidates else start + 3000]
        current_label = None
        for line in block.splitlines():
            for label in labels:
                if label in line:
                    current_label = label
                    line = line.split(label, 1)[1]
                    break
            if "•" not in line or current_label is None:
                continue
            player = line.split("•", 1)[1].split(",", 1)[0].strip(" *_")
            if player:
                number = {"FIRST TEAM": "1st", "SECOND TEAM": "2nd", "THIRD TEAM": "3rd"}[current_label]
                rows.append({"season": 2026, "lg": "NBA", "type": team_type, "number_tm": number, "player": player, "name_key": canonical_name(player)})
    return pd.DataFrame(rows).drop_duplicates(["type", "number_tm", "name_key"])


def load_honors(season: pd.DataFrame) -> pd.DataFrame:
    player_keys = season[["player_id", "player"]].drop_duplicates("player_id")
    player_keys["name_key"] = player_keys["player"].map(canonical_name)
    identity_map = (
        season.groupby(["player_id", "player"], as_index=False)
        .agg(career_games=("g", "sum"), career_minutes=("mp", "sum"))
        .assign(name_key=lambda frame: frame["player"].map(canonical_name))
        .sort_values(["name_key", "career_games", "career_minutes", "player_id"], ascending=[True, False, False, True])
        .drop_duplicates("name_key")
        .set_index("name_key")["player_id"]
    )

    awards_raw = pd.read_csv(RAW_CSV / "Player Award Shares.csv")
    awards_raw = awards_raw[awards_raw["award"].astype(str).str.startswith("nba ")].copy()
    mvp = awards_raw[awards_raw["award"].eq("nba mvp")]
    shares = mvp.groupby("player_id").agg(
        mvp_shares=("share", "sum"),
        mvp_top3=("share", lambda values: int((values.rank(ascending=False, method="min") <= 3).sum())),
        mvp_ballot_seasons=("season", "nunique"),
    )
    # Top-3/Top-5 are based on actual season rank, not each player's own rows.
    mvp = mvp.copy()
    mvp["vote_rank"] = mvp.groupby("season")["share"].rank(ascending=False, method="min")
    vote_summary = mvp.groupby("player_id").agg(
        mvp_top3=("vote_rank", lambda values: int((values <= 3).sum())),
        mvp_top5=("vote_rank", lambda values: int((values <= 5).sum())),
    )
    shares = shares.drop(columns="mvp_top3").join(vote_summary, how="outer")

    eos = pd.read_csv(RAW_CSV / "End of Season Teams.csv")
    eos = eos[eos["lg"].astype(str).str.upper().isin(["NBA", "BAA"])].copy()
    eos["name_key"] = eos["player"].map(canonical_name)
    supplement = load_current_team_supplement()
    if not supplement.empty:
        supplement["player_id"] = supplement["name_key"].map(identity_map)
        supplement["position"] = np.nan
        supplement = supplement.dropna(subset=["player_id"])
        eos = pd.concat([eos, supplement[eos.columns]], ignore_index=True)
    pivot = (
        eos.assign(key=eos["type"].str.lower().str.replace("-", "_", regex=False) + "_" + eos["number_tm"].str.lower())
        .groupby(["player_id", "key"])
        .size()
        .unstack(fill_value=0)
    )
    rename = {
        "all_nba_1st": "all_nba_first", "all_nba_2nd": "all_nba_second", "all_nba_3rd": "all_nba_third",
        "all_defense_1st": "all_defense_first", "all_defense_2nd": "all_defense_second",
        "all_baa_1st": "all_nba_first", "all_baa_2nd": "all_nba_second",
    }
    pivot = pivot.rename(columns=rename)
    if pivot.columns.duplicated().any():
        pivot = pivot.T.groupby(level=0).sum().T

    all_star = pd.read_csv(RAW_CSV / "All-Star Selections.csv")
    all_star = all_star[all_star["lg"].astype(str).str.upper().eq("NBA")]
    all_star_counts = all_star.groupby("player_id")["season"].nunique().rename("all_star")

    official = load_official_award_counts()
    official["player_id"] = official["name_key"].map(identity_map)
    official = official.dropna(subset=["player_id"]).drop(columns="name_key").set_index("player_id")
    honors = player_keys.set_index("player_id").join(shares).join(pivot).join(all_star_counts).reset_index()
    honors = honors.merge(official, left_on="player_id", right_index=True, how="left")
    expected = [
        "mvp", "dpoy", "finals_mvp", "mvp_shares", "mvp_top3", "mvp_top5", "mvp_ballot_seasons",
        "all_nba_first", "all_nba_second", "all_nba_third", "all_defense_first", "all_defense_second", "all_star",
    ]
    for column in expected:
        if column not in honors:
            honors[column] = 0
        honors[column] = pd.to_numeric(honors[column], errors="coerce").fillna(0)
    honors["all_nba_total"] = honors[["all_nba_first", "all_nba_second", "all_nba_third"]].sum(axis=1)
    honors["all_defense_total"] = honors[["all_defense_first", "all_defense_second"]].sum(axis=1)
    return honors


def add_leader_titles(season: pd.DataFrame, honors: pd.DataFrame) -> pd.DataFrame:
    qualified = season[season["qualified_for_rate"]].copy()
    title_map = {"ppg": "scoring_titles", "rpg": "rebounding_titles", "apg": "assist_titles", "spg": "steals_titles", "bpg": "blocks_titles"}
    result = honors.copy()
    for metric, output in title_map.items():
        leaders = qualified[pd.to_numeric(qualified[metric], errors="coerce").eq(qualified.groupby("season")[metric].transform("max"))]
        counts = leaders.groupby("player_id")["season"].nunique()
        result[output] = result["player_id"].map(counts).fillna(0).astype(int)
    result["leader_titles"] = result[list(title_map.values())].sum(axis=1)
    return result


def load_team_success() -> tuple[pd.DataFrame, pd.DataFrame]:
    text = (RAW / "nba_champions_official.md").read_text(encoding="utf-8")
    rows = []
    pattern = re.compile(r"(?m)^(\d{4}-\d{2})\s*—\s*\*\*([^*]+)\*\*\s*def\.\s*([^,\n]+)")
    for season_text, champion, runner_up in pattern.findall(text):
        rows.append({"season": season_end_year(season_text), "champion_team": champion.strip(), "runner_up_team": runner_up.strip()})
    finals = pd.DataFrame(rows).drop_duplicates("season")

    team_map = pd.read_csv(RAW_CSV / "Team Abbrev.csv")
    team_map = team_map[team_map["lg"].astype(str).str.upper().isin(["NBA", "BAA"])]
    lookup = team_map.drop_duplicates(["season", "team"]).set_index(["season", "team"])["abbreviation"]
    finals["champion_abbrev"] = [lookup.get((row.season, row.champion_team), np.nan) for row in finals.itertuples()]
    finals["runner_up_abbrev"] = [lookup.get((row.season, row.runner_up_team), np.nan) for row in finals.itertuples()]

    roster = pd.read_csv(RAW_CSV / "Player Season Info.csv")
    roster = roster[roster["lg"].astype(str).str.upper().isin(["NBA", "BAA"])]
    roster = roster.merge(finals[["season", "champion_abbrev", "runner_up_abbrev"]], on="season", how="left")
    roster["championship"] = roster["team"].eq(roster["champion_abbrev"])
    roster["finals_appearance"] = roster["team"].eq(roster["champion_abbrev"]) | roster["team"].eq(roster["runner_up_abbrev"])
    success = roster.groupby("player_id").agg(
        championships=("championship", "sum"),
        finals_appearances=("finals_appearance", "sum"),
    ).reset_index()
    success["championships"] = success["championships"].astype(int)
    success["finals_appearances"] = success["finals_appearances"].astype(int)
    return success, finals


def career_summary(season: pd.DataFrame) -> pd.DataFrame:
    totals = season.groupby("player_id", as_index=False).agg(
        player=("player", "last"), career_start=("season", "min"), career_end=("season", "max"), career_seasons=("season", "nunique"),
        career_games=("g", "sum"), career_minutes=("mp", "sum"), career_points=("pts", "sum"), career_rebounds=("trb", "sum"),
        career_assists=("ast", "sum"), career_steals=("stl", "sum"), career_blocks=("blk", "sum"),
        career_ows=("ows", "sum"), career_dws=("dws", "sum"), career_ws=("ws", "sum"), career_vorp=("vorp", "sum"),
        career_fga=("fga", "sum"), career_fta=("fta", "sum"),
    )
    totals["career_ppg"] = totals["career_points"] / totals["career_games"].replace(0, np.nan)
    totals["career_rpg"] = totals["career_rebounds"] / totals["career_games"].replace(0, np.nan)
    totals["career_apg"] = totals["career_assists"] / totals["career_games"].replace(0, np.nan)
    totals["career_spg"] = totals["career_steals"] / totals["career_games"].replace(0, np.nan)
    totals["career_bpg"] = totals["career_blocks"] / totals["career_games"].replace(0, np.nan)
    totals["career_ts"] = totals["career_points"] / (2 * (totals["career_fga"] + 0.44 * totals["career_fta"]).replace(0, np.nan))

    peak_rows = []
    for player_id, group in season.groupby("player_id"):
        values = group["season_performance_available"].dropna().sort_values(ascending=False).to_numpy()
        peak_rows.append(
            {
                "player_id": player_id,
                "peak_1": float(values[:1].mean()) if len(values) >= 1 else np.nan,
                "peak_3": float(values[:3].mean()) if len(values) >= 3 else np.nan,
                "peak_5": float(values[:5].mean()) if len(values) >= 5 else np.nan,
                "peak_7": float(values[:7].mean()) if len(values) >= 7 else np.nan,
                "elite_seasons": int((values >= 1.0).sum()),
                "superstar_seasons": int((values >= 1.75).sum()),
                "positive_value_seasons": int((values >= 0.5).sum()),
                "cumulative_performance": float(np.maximum(values + 0.5, 0).sum()) if len(values) else np.nan,
            }
        )
    peaks = pd.DataFrame(peak_rows)
    return totals.merge(peaks, on="player_id", how="left")
