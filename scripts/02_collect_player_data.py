from __future__ import annotations

import hashlib

import numpy as np
import pandas as pd

from common import INTERIM, RAW, RAW_CSV, OUTPUT, PROCESSED, canonical_name, canonical_season_rows, ensure_dirs, season_end_year, setup_logging, write_csv
from data_utils import add_era_adjustments, add_leader_titles, career_summary, load_honors, load_regular_seasons, load_team_success


GONZALO_CSV = RAW / "kaggle_nba_all_time" / "csv"


def _minutes_as_float(series: pd.Series) -> pd.Series:
    text = series.astype("string")
    parts = text.str.extract(r"^(\d+):(\d+)$")
    clock = pd.to_numeric(parts[0], errors="coerce") + pd.to_numeric(parts[1], errors="coerce") / 60
    numeric = pd.to_numeric(series, errors="coerce")
    return clock.fillna(numeric)


def _gonzalo_playoff_seasons(master: pd.DataFrame, logger) -> pd.DataFrame:
    """Build complete BAA/NBA playoff season lines from retained game-level box scores."""
    pool_fingerprint = hashlib.sha256("\n".join(sorted(master["player_id"].astype(str))).encode("utf-8")).hexdigest()[:12]
    cached = INTERIM / f"gonzalo_playoffs_by_season_{pool_fingerprint}.csv"
    raw_zip = RAW / "kaggle_nba_all_time" / "nba-all-time-stats_2026-08-15.zip"
    if cached.exists() and cached.stat().st_mtime >= raw_zip.stat().st_mtime:
        data = pd.read_csv(cached)
        return data[data["player_id"].isin(master["player_id"])].copy()

    schedule = pd.read_csv(
        GONZALO_CSV / "schedule.csv",
        dtype={"Game Reference": "string", "Season": "string", "League": "string"},
    )
    schedule = schedule[
        schedule["Playoffs"].eq(True)
        & schedule["League"].str.upper().isin(["NBA", "BAA"])
    ].copy()
    schedule["season"] = schedule["Season"].map(season_end_year)
    schedule["winner_team"] = np.where(
        pd.to_numeric(schedule["Visitor PTS"], errors="coerce")
        > pd.to_numeric(schedule["Home PTS"], errors="coerce"),
        schedule["Visitor"],
        schedule["Home"],
    )
    schedule = schedule[["Game Reference", "season", "winner_team"]].drop_duplicates("Game Reference")

    player_ids = set(master["player_id"])
    columns = {
        "Game Reference", "Team", "Period", "Player Name", "Player Reference", "MP",
        "FG", "FGA", "3P", "3PA", "FT", "FTA", "TRB", "AST", "STL", "BLK", "TOV", "PTS", "Reason",
    }
    frames: list[pd.DataFrame] = []
    boxscore_dir = GONZALO_CSV / "boxscores_by_year"
    paths = sorted(boxscore_dir.glob("NBA_*_basic.csv")) + sorted(boxscore_dir.glob("BAA_*_basic.csv"))
    for path in paths:
        frame = pd.read_csv(
            path,
            usecols=lambda column: column in columns,
            dtype={"Game Reference": "string", "Player Reference": "string"},
            low_memory=False,
        )
        frame = frame[
            frame["Period"].astype(str).str.lower().eq("game")
            & frame["Player Reference"].isin(player_ids)
        ].copy()
        if frame.empty:
            continue
        # DNP rows have neither minutes nor a recorded box-score value and must not count as games played.
        played = frame["MP"].notna() | frame[[column for column in ["PTS", "TRB", "AST"] if column in frame]].notna().any(axis=1)
        frames.append(frame[played])

    games = pd.concat(frames, ignore_index=True)
    games = games.merge(schedule, on="Game Reference", how="inner")
    games = games.sort_values(["Player Reference", "season", "Game Reference"]).drop_duplicates(
        ["Player Reference", "Game Reference"], keep="first"
    )
    games["minutes_value"] = _minutes_as_float(games["MP"])
    games["won"] = games["Team"].eq(games["winner_team"])
    numeric_columns = ["FG", "FGA", "3P", "3PA", "FT", "FTA", "TRB", "AST", "STL", "BLK", "TOV", "PTS"]
    for column in numeric_columns:
        if column not in games:
            games[column] = np.nan
        games[column] = pd.to_numeric(games[column], errors="coerce")

    rows: list[dict] = []
    for (player_id, season), group in games.groupby(["Player Reference", "season"], sort=True):
        games_played = group["Game Reference"].nunique()

        def per_game(column: str) -> float:
            observed = group[column].notna().sum()
            return group[column].sum(min_count=1) / observed if observed else np.nan

        fga = group["FGA"].sum(min_count=1)
        fta = group["FTA"].sum(min_count=1)
        points = group["PTS"].sum(min_count=1)
        denominator = 2 * (fga + 0.44 * fta) if pd.notna(fga) and pd.notna(fta) else np.nan
        teams = sorted(group["Team"].dropna().astype(str).unique())
        rows.append(
            {
                "player_id": player_id,
                "player_name": group["Player Name"].dropna().iloc[-1],
                "season": int(season),
                "team": teams[0] if len(teams) == 1 else "MULTI",
                "playoff_games": games_played,
                "playoff_wins_known": int(group["won"].sum()),
                "playoff_minutes_per_game": group["minutes_value"].mean(),
                "playoff_ppg": per_game("PTS"),
                "playoff_rpg": per_game("TRB"),
                "playoff_apg": per_game("AST"),
                "playoff_spg": per_game("STL"),
                "playoff_bpg": per_game("BLK"),
                "playoff_tovpg": per_game("TOV"),
                "playoff_fg_pct": group["FG"].sum(min_count=1) / fga if pd.notna(fga) and fga > 0 else np.nan,
                "playoff_3p_pct": group["3P"].sum(min_count=1) / group["3PA"].sum(min_count=1)
                if group["3PA"].sum(min_count=1) > 0 else np.nan,
                "playoff_ft_pct": group["FT"].sum(min_count=1) / fta if pd.notna(fta) and fta > 0 else np.nan,
                "playoff_ts_pct": points / denominator if pd.notna(denominator) and denominator > 0 else np.nan,
                "source_id": "gonzalogigena_nba_all_time",
            }
        )
    data = pd.DataFrame(rows)
    write_csv(data, cached)
    logger.info("Cached %s full-history playoff player-seasons from game-level box scores", len(data))
    return data[data["player_id"].isin(master["player_id"])].copy()


def _secondary_playoff_seasons(master: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    id_by_key = master.drop_duplicates("name_key").set_index("name_key")["player_id"]

    modern = pd.read_csv(RAW / "player_stats_traditional_po_1996_2023.csv")
    modern["name_key"] = modern["PLAYER_NAME"].map(canonical_name)
    modern["player_id"] = modern["name_key"].map(id_by_key)
    modern["season"] = modern["SEASON"].map(season_end_year)
    career_bounds = master.set_index("player_id")[["career_start", "career_end"]]
    modern = modern.join(career_bounds, on="player_id")
    modern = modern[
        pd.to_numeric(modern["season"], errors="coerce").between(
            pd.to_numeric(modern["career_start"], errors="coerce"),
            pd.to_numeric(modern["career_end"], errors="coerce"),
        )
    ]
    modern = modern.dropna(subset=["player_id", "season"]).sort_values("GP", ascending=False).drop_duplicates(["player_id", "season"])
    modern_base = pd.DataFrame(
        {
            "player_id": modern["player_id"], "player_name": modern["PLAYER_NAME"], "season": modern["season"].astype(int),
            "team": modern["TEAM_ABBREVIATION"], "playoff_games": modern["GP"], "playoff_wins_known": modern["W"],
            "playoff_minutes_per_game": modern["MIN"], "playoff_ppg": modern["PTS"], "playoff_rpg": modern["REB"],
            "playoff_apg": modern["AST"], "playoff_spg": modern["STL"], "playoff_bpg": modern["BLK"],
            "playoff_tovpg": modern["TOV"], "playoff_fg_pct": modern["FG_PCT"], "playoff_3p_pct": modern["FG3_PCT"],
            "playoff_ft_pct": modern["FT_PCT"],
            "playoff_ts_pct": np.nan,
            "source_id": "brescou_nba_stats",
        }
    )

    historical = pd.read_csv(RAW / "nba_data_historical_538.csv")
    historical = historical[historical["type"] == "PO"].copy()
    historical = historical[historical["player_id"].isin(master["player_id"])].sort_values("Min", ascending=False).drop_duplicates(["player_id", "year_id"])
    mpg = pd.to_numeric(historical["MPG"], errors="coerce")
    historical_base = pd.DataFrame(
        {
            "player_id": historical["player_id"], "player_name": historical["name_common"], "season": historical["year_id"].astype(int),
            "team": historical["team_id"], "playoff_games": historical["G"], "playoff_wins_known": np.nan,
            "playoff_minutes_per_game": mpg,
            "playoff_ppg": pd.to_numeric(historical["P/36"], errors="coerce") * mpg / 36,
            "playoff_rpg": pd.to_numeric(historical["R/36"], errors="coerce") * mpg / 36,
            "playoff_apg": pd.to_numeric(historical["A/36"], errors="coerce") * mpg / 36,
            "playoff_spg": np.nan, "playoff_bpg": np.nan,
            "playoff_tovpg": pd.to_numeric(historical["TO/36"], errors="coerce") * mpg / 36,
            "playoff_fg_pct": np.nan, "playoff_3p_pct": pd.to_numeric(historical["3P%"], errors="coerce") / 100,
            "playoff_ft_pct": pd.to_numeric(historical["FT%"], errors="coerce") / 100,
            "playoff_ts_pct": pd.to_numeric(historical["TS%"], errors="coerce") / 100,
            "source_id": "fivethirtyeight_historical",
        }
    )
    return modern_base, historical_base


def _comparison_status(primary: pd.Series, secondary: pd.Series, fields: dict[str, float]) -> tuple[str, int, int, float]:
    comparisons: list[bool] = []
    differences: list[float] = []
    for field, tolerance in fields.items():
        left = pd.to_numeric(pd.Series([primary.get(field)]), errors="coerce").iloc[0]
        right = pd.to_numeric(pd.Series([secondary.get(field)]), errors="coerce").iloc[0]
        if pd.isna(left) or pd.isna(right):
            continue
        difference = abs(float(left) - float(right))
        comparisons.append(difference <= tolerance)
        differences.append(difference)
    if not comparisons:
        return "secondary_available_not_comparable", 0, 0, np.nan
    matched = sum(comparisons)
    return ("verified_match" if all(comparisons) else "material_difference"), len(comparisons), matched, max(differences)


def build_playoff_seasons(master: pd.DataFrame, logger) -> pd.DataFrame:
    primary = _gonzalo_playoff_seasons(master, logger)
    brescou, five_thirty_eight = _secondary_playoff_seasons(master)
    secondary_frames = {
        "brescou_nba_stats": brescou,
        "fivethirtyeight_historical": five_thirty_eight,
    }
    comparisons = {
        "brescou_nba_stats": {
            "playoff_games": 0.0, "playoff_wins_known": 0.0, "playoff_ppg": 0.11,
            "playoff_rpg": 0.11, "playoff_apg": 0.11, "playoff_fg_pct": 0.006,
            "playoff_3p_pct": 0.008, "playoff_ft_pct": 0.008,
        },
        "fivethirtyeight_historical": {"playoff_games": 0.0, "playoff_ts_pct": 0.008},
    }
    secondary_lookup = {
        source_id: frame.drop_duplicates(["player_id", "season"]).set_index(["player_id", "season"])
        for source_id, frame in secondary_frames.items()
    }
    audit_rows: list[dict] = []
    enriched_rows: list[dict] = []
    primary_keys: set[tuple[str, int]] = set()
    for row in primary.to_dict("records"):
        key = (row["player_id"], int(row["season"]))
        primary_keys.add(key)
        sources: list[str] = []
        statuses: list[str] = []
        comparable = 0
        matched = 0
        max_difference = np.nan
        for source_id, lookup in secondary_lookup.items():
            if key not in lookup.index:
                continue
            secondary = lookup.loc[key]
            if isinstance(secondary, pd.DataFrame):
                secondary = secondary.iloc[0]
            status, count, match_count, difference = _comparison_status(pd.Series(row), secondary, comparisons[source_id])
            sources.append(source_id)
            statuses.append(status)
            comparable += count
            matched += match_count
            if pd.notna(difference):
                max_difference = difference if pd.isna(max_difference) else max(max_difference, difference)
            audit_rows.append(
                {
                    "player_id": row["player_id"], "player_name": row["player_name"], "season": row["season"],
                    "data_domain": "playoffs", "primary_source_id": row["source_id"], "secondary_source_id": source_id,
                    "fields_compared": count, "fields_matched": match_count, "max_absolute_difference": difference,
                    "verification_status": status,
                }
            )
        row["secondary_source_id"] = "; ".join(sources) if sources else "NA"
        row["source_count"] = 1 + len(sources)
        row["cross_source_status"] = "verified_match" if "verified_match" in statuses else (statuses[0] if statuses else "single_source")
        row["verification_fields"] = comparable
        row["verification_fields_matched"] = matched
        row["max_cross_source_difference"] = max_difference
        row["data_quality"] = "B" if row["cross_source_status"] == "verified_match" else "C"
        enriched_rows.append(row)

    # Keep reliable secondary rows only when the full-history source genuinely lacks that player-season.
    for source_id, frame in secondary_frames.items():
        for row in frame.to_dict("records"):
            key = (row["player_id"], int(row["season"]))
            if key in primary_keys:
                continue
            row.update(
                {
                    "secondary_source_id": "NA", "source_count": 1, "cross_source_status": "single_source_fallback",
                    "verification_fields": 0, "verification_fields_matched": 0, "max_cross_source_difference": np.nan,
                    "data_quality": "B" if source_id == "fivethirtyeight_historical" else "C",
                }
            )
            enriched_rows.append(row)
            primary_keys.add(key)

    write_csv(pd.DataFrame(audit_rows), OUTPUT / "diagnostics" / "source_reconciliation_playoffs.csv")
    return pd.DataFrame(enriched_rows).sort_values(["player_id", "season"]).reset_index(drop=True)


def build_regular_source_reconciliation(regular: pd.DataFrame, master: pd.DataFrame) -> pd.DataFrame:
    primary = regular[regular["player_id"].isin(master["player_id"])].copy()
    gonzalo = pd.read_csv(GONZALO_CSV / "player_stats" / "totals_stats.csv")
    gonzalo = gonzalo.rename(
            columns={
                "Player Reference": "player_id", "Player": "player", "Season": "season", "League": "lg", "Tm": "team",
                "G": "g", "MP": "mp", "PTS": "pts", "TRB": "trb", "AST": "ast", "STL": "stl", "BLK": "blk",
            }
        )
    gonzalo["season"] = gonzalo["season"].map(season_end_year)
    gonzalo = canonical_season_rows(gonzalo)
    gonzalo_lookup = gonzalo.set_index(["player_id", "season"])

    brescou = pd.read_csv(RAW / "player_stats_traditional_rs_1996_2023.csv")
    id_by_key = master.drop_duplicates("name_key").set_index("name_key")["player_id"]
    brescou["player_id"] = brescou["PLAYER_NAME"].map(canonical_name).map(id_by_key)
    brescou["season"] = brescou["SEASON"].map(season_end_year)
    career_bounds = master.set_index("player_id")[["career_start", "career_end"]]
    brescou = brescou.join(career_bounds, on="player_id")
    brescou = brescou[
        pd.to_numeric(brescou["season"], errors="coerce").between(
            pd.to_numeric(brescou["career_start"], errors="coerce"),
            pd.to_numeric(brescou["career_end"], errors="coerce"),
        )
    ]
    brescou = brescou.dropna(subset=["player_id", "season"]).sort_values("GP", ascending=False).drop_duplicates(["player_id", "season"])
    brescou_lookup = brescou.set_index(["player_id", "season"])

    rows: list[dict] = []
    exact_fields = ["g", "mp", "pts", "trb", "ast", "stl", "blk"]
    for row in primary.to_dict("records"):
        key = (row["player_id"], int(row["season"]))
        if key in gonzalo_lookup.index:
            secondary = gonzalo_lookup.loc[key]
            comparisons = []
            differences = []
            for field in exact_fields:
                left = pd.to_numeric(pd.Series([row.get(field)]), errors="coerce").iloc[0]
                right = pd.to_numeric(pd.Series([secondary.get(field)]), errors="coerce").iloc[0]
                if pd.notna(left) and pd.notna(right):
                    difference = abs(float(left) - float(right))
                    comparisons.append(difference <= max(1e-9, abs(float(left)) * 1e-6))
                    differences.append(difference)
            rows.append(
                {
                    "player_id": row["player_id"], "player_name": row["player"], "season": row["season"],
                    "data_domain": "regular_season", "primary_source_id": "kaggle_sumitrodatta_nba",
                    "secondary_source_id": "gonzalogigena_nba_all_time", "fields_compared": len(comparisons),
                    "fields_matched": sum(comparisons), "max_absolute_difference": max(differences) if differences else np.nan,
                    "verification_status": "verified_match" if comparisons and all(comparisons) else "material_difference",
                }
            )
        if key in brescou_lookup.index:
            secondary = brescou_lookup.loc[key]
            pairs = [("g", "GP", 0.0), ("ppg", "PTS", 0.11), ("rpg", "REB", 0.11), ("apg", "AST", 0.11)]
            comparisons = []
            differences = []
            for primary_field, secondary_field, tolerance in pairs:
                left = pd.to_numeric(pd.Series([row.get(primary_field)]), errors="coerce").iloc[0]
                right = pd.to_numeric(pd.Series([secondary.get(secondary_field)]), errors="coerce").iloc[0]
                if pd.notna(left) and pd.notna(right):
                    difference = abs(float(left) - float(right))
                    comparisons.append(difference <= tolerance)
                    differences.append(difference)
            rows.append(
                {
                    "player_id": row["player_id"], "player_name": row["player"], "season": row["season"],
                    "data_domain": "regular_season", "primary_source_id": "kaggle_sumitrodatta_nba",
                    "secondary_source_id": "brescou_nba_stats", "fields_compared": len(comparisons),
                    "fields_matched": sum(comparisons), "max_absolute_difference": max(differences) if differences else np.nan,
                    "verification_status": "verified_match" if comparisons and all(comparisons) else "material_difference",
                }
            )
    return pd.DataFrame(rows)


def build_playoff_career(playoffs: pd.DataFrame, master: pd.DataFrame) -> pd.DataFrame:
    rows = []
    metrics = ["playoff_minutes_per_game", "playoff_ppg", "playoff_rpg", "playoff_apg", "playoff_spg", "playoff_bpg", "playoff_tovpg", "playoff_ts_pct"]
    for player_id, group in playoffs.groupby("player_id"):
        games = pd.to_numeric(group["playoff_games"], errors="coerce")
        row = {
            "player_id": player_id,
            "player_name": group["player_name"].iloc[-1],
            "playoff_games": games.sum(min_count=1),
            "playoff_seasons_observed": group["season"].nunique(),
            "playoff_first_observed": group["season"].min(),
            "playoff_last_observed": group["season"].max(),
            "playoff_wins_known": pd.to_numeric(group["playoff_wins_known"], errors="coerce").sum(min_count=1),
        }
        for metric in metrics:
            values = pd.to_numeric(group[metric], errors="coerce")
            valid = values.notna() & games.notna()
            row[metric] = np.average(values[valid], weights=games[valid]) if valid.any() and games[valid].sum() > 0 else np.nan
        rows.append(row)
    career = pd.DataFrame(rows)
    all_players = master[["player_id", "player_name"]].merge(career, on="player_id", how="left", suffixes=("", "_source"))
    all_players["player_name"] = all_players["player_name"].fillna(all_players["player_name_source"])
    return all_players.drop(columns=["player_name_source"], errors="ignore")


def build_advanced_metrics(master: pd.DataFrame, regular: pd.DataFrame) -> pd.DataFrame:
    regular_cols = ["player_id", "player", "season", "team", "per", "ts_percent", "ows", "dws", "ws", "ws_48", "obpm", "dbpm", "bpm", "vorp"]
    rs = regular[regular_cols].rename(columns={"player": "player_name"}).copy()
    rs["season_type"] = "Regular Season"
    rs["source_id"] = "kaggle_sumitrodatta_nba"

    raptor = pd.read_csv(RAW / "nba_data_historical_538.csv")
    raptor = raptor[(raptor["type"] == "PO") & raptor["player_id"].isin(master["player_id"])].copy()
    po = pd.DataFrame(
        {
            "player_id": raptor["player_id"], "player_name": raptor["name_common"], "season": raptor["year_id"], "team": raptor["team_id"],
            "per": np.nan, "ts_percent": pd.to_numeric(raptor["TS%"], errors="coerce") / 100,
            "ows": np.nan, "dws": np.nan, "ws": np.nan, "ws_48": np.nan, "obpm": np.nan, "dbpm": np.nan, "bpm": np.nan, "vorp": np.nan,
            "raptor_offense": raptor["Raptor O"], "raptor_defense": raptor["Raptor D"], "raptor_plus_minus": raptor["Raptor+/-"], "raptor_war": raptor["Raptor WAR"],
            "season_type": "Playoffs", "source_id": "fivethirtyeight_historical",
        }
    )
    return pd.concat([rs, po], ignore_index=True, sort=False)


def main() -> None:
    ensure_dirs()
    logger = setup_logging("02_collect")
    master = pd.read_csv(OUTPUT / "candidate_pool" / "master_pool.csv")
    master["name_key"] = master["player_name"].map(canonical_name)
    ids = set(master["player_id"])

    regular = add_era_adjustments(load_regular_seasons())
    regular = regular[regular["player_id"].isin(ids)].copy()
    career = career_summary(regular)
    honors = add_leader_titles(regular, load_honors(regular))
    success, _ = load_team_success()
    career = career.merge(honors.drop(columns=["player"], errors="ignore"), on="player_id", how="left").merge(success, on="player_id", how="left")
    career = master[["player_id", "player_name"]].merge(career, on="player_id", how="left")

    info = pd.read_csv(RAW_CSV / "Player Career Info.csv")
    player_info = master.merge(info, on="player_id", how="left", suffixes=("", "_source"))
    player_info = player_info[[
        "player_id", "player_name", "birth_year", "birth_date", "career_start", "career_end", "active_status", "era", "position",
        "ht_in_in", "wt", "colleges", "hof", "pool_A", "pool_B", "pool_C", "primary_entry_reason", "secondary_entry_reason",
    ]]

    regular_reconciliation = build_regular_source_reconciliation(regular, master)
    write_csv(regular_reconciliation, OUTPUT / "diagnostics" / "source_reconciliation_regular.csv")
    playoffs = build_playoff_seasons(master, logger)
    playoff_career = build_playoff_career(playoffs, master)
    team_success = master[["player_id", "player_name"]].merge(success, on="player_id", how="left")
    for column in ["championships", "finals_appearances"]:
        team_success[column] = team_success[column].fillna(0).astype(int)
    team_success["conference_finals"] = np.nan
    team_success["playoff_series_wins"] = np.nan
    team_success["regular_season_team_success"] = np.nan
    team_success["known_limitations"] = "Conference finals, series wins and roster-weighted team success not available in retained sources; NA preserved"

    awards_cols = [
        "player_id", "player_name", "mvp", "mvp_shares", "mvp_top3", "mvp_top5", "finals_mvp", "dpoy", "all_nba_first",
        "all_nba_second", "all_nba_third", "all_nba_total", "all_defense_first", "all_defense_second", "all_defense_total", "all_star",
        "scoring_titles", "rebounding_titles", "assist_titles", "steals_titles", "blocks_titles", "leader_titles",
    ]
    awards = career[awards_cols]

    advanced = build_advanced_metrics(master, regular)
    era_cols = [
        "player_id", "player", "season", "g", "games_share", "ppg", "rpg", "apg", "spg", "bpg", "ts_percent", "per", "bpm", "ws_48",
        "z_ppg", "z_rpg", "z_apg", "z_spg", "z_bpg", "z_ts_percent", "z_per", "z_bpm", "z_ws_48", "era_offense", "era_rebound",
        "era_defense", "season_performance", "season_performance_available", "qualified_for_rate",
    ]
    era_adjusted = regular[era_cols].rename(columns={"player": "player_name"})
    peak_cols = ["player_id", "player_name", "career_seasons", "career_games", "career_minutes", "peak_1", "peak_3", "peak_5", "peak_7", "elite_seasons", "superstar_seasons", "positive_value_seasons", "cumulative_performance", "career_ws", "career_vorp"]
    peak = career[peak_cols]

    regular_display_cols = [
        "player_id", "player", "season", "age", "team", "pos", "g", "gs", "mp", "pts", "trb", "ast", "stl", "blk", "tov",
        "fg_percent", "x3p_percent", "ft_percent", "e_fg_percent", "ts_percent", "ppg", "rpg", "apg", "spg", "bpg", "tovpg",
    ]
    by_season = regular[regular_display_cols].rename(columns={"player": "player_name"})
    career_display_cols = [
        "player_id", "player_name", "career_start", "career_end", "career_seasons", "career_games", "career_minutes", "career_points",
        "career_rebounds", "career_assists", "career_steals", "career_blocks", "career_ppg", "career_rpg", "career_apg", "career_spg", "career_bpg",
        "career_ts", "career_ows", "career_dws", "career_ws", "career_vorp",
    ]

    outputs = {
        "player_info.csv": player_info,
        "regular_season_career.csv": career[career_display_cols],
        "regular_season_by_season.csv": by_season,
        "playoffs_career.csv": playoff_career,
        "playoffs_by_season.csv": playoffs,
        "awards.csv": awards,
        "team_success.csv": team_success,
        "advanced_metrics.csv": advanced,
        "era_adjusted.csv": era_adjusted,
        "peak_longevity.csv": peak,
    }
    for filename, data in outputs.items():
        write_csv(data, PROCESSED / filename)
    logger.info(
        "Processed %s candidates, %s regular-season rows, %s playoff rows and %s regular cross-source checks",
        len(master), len(by_season), len(playoffs), len(regular_reconciliation),
    )


if __name__ == "__main__":
    main()
