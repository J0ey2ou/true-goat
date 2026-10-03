from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

from common import ACCESS_DATE, OUTPUT, PROCESSED, RAW, ROOT, ensure_dirs, setup_logging, sha256, write_csv


SOURCE_DETAILS = {
    "kaggle_sumitrodatta_nba": {
        "primary_source": "Kaggle / Sumitro Datta",
        "source_url": "https://www.kaggle.com/datasets/sumitrodatta/nba-aba-baa-stats",
        "source_title": "NBA Stats (1947-present)",
        "source_type": "public dataset",
        "official_status": "non-official",
        "data_quality": "B",
        "historical_coverage": "BAA/NBA regular seasons 1947-2026; stat availability varies by era",
        "known_limitations": "Derived from Basketball-Reference; steals/blocks start in 1973-74; advanced metrics are incomplete in early eras",
    },
    "fivethirtyeight_historical": {
        "primary_source": "FiveThirtyEight",
        "source_url": "https://github.com/fivethirtyeight/nba-player-advanced-metrics",
        "source_title": "Historical RAPTOR and other NBA data",
        "source_type": "published analytics dataset",
        "official_status": "non-official",
        "data_quality": "B",
        "historical_coverage": "NBA regular season and playoffs 1977-2020",
        "known_limitations": "RAPTOR methodology/coverage changes by era; no rows after 2020",
    },
    "brescou_nba_stats": {
        "primary_source": "Brescou NBA Statistics Repository",
        "source_url": "https://github.com/Brescou/NBA-dataset-stats-player-team",
        "source_title": "NBA Statistics Repository",
        "source_type": "public repository",
        "official_status": "non-official",
        "data_quality": "C",
        "historical_coverage": "NBA regular seasons and playoffs 1996-97 through 2022-23",
        "known_limitations": "Modern-era cross-check source; the retained 2022-23 playoff snapshot is incomplete for several finalists",
    },
    "gonzalogigena_nba_all_time": {
        "primary_source": "Kaggle / Gonzalo Gigena",
        "source_url": "https://www.kaggle.com/datasets/gonzalogigena/nba-all-time-stats",
        "source_title": "NBA All Time Stats (1947-Present)",
        "source_type": "public dataset",
        "official_status": "non-official",
        "data_quality": "B",
        "historical_coverage": "BAA/NBA game results and player box scores 1947-2024",
        "known_limitations": "Derived from Basketball-Reference; the retained regular-season 2023-24 player table was an in-season snapshot, so the newer Sumitro Datta source remains primary for regular-season totals",
    },
    "nba_official_history": {
        "primary_source": "NBA.com",
        "source_url": "https://www.nba.com/history",
        "source_title": "NBA official history pages",
        "source_type": "league official",
        "official_status": "official",
        "data_quality": "A",
        "historical_coverage": "League history through 2025-26",
        "known_limitations": "Some pages provide winners/lists but not full voting detail",
    },
}


def long_rows(df: pd.DataFrame, id_cols: list[str], metrics: list[str], source_id: str | None, season_default: str = "Career") -> pd.DataFrame:
    available = [metric for metric in metrics if metric in df.columns]
    melted = df[id_cols + available].melt(id_vars=id_cols, value_vars=available, var_name="indicator_name", value_name="value")
    if "player_name" not in melted.columns and "player" in melted.columns:
        melted = melted.rename(columns={"player": "player_name"})
    if "season" not in melted.columns:
        melted["season"] = season_default
    if source_id:
        melted["source_id"] = source_id
    return melted


def enrich_sources(rows: pd.DataFrame) -> pd.DataFrame:
    result = rows.copy()
    details = pd.DataFrame(SOURCE_DETAILS).T.rename_axis("source_id").reset_index()
    result = result.merge(details, on="source_id", how="left")
    missing = result["value"].isna()
    result["source_access_date"] = ACCESS_DATE
    result["secondary_source"] = np.select(
        [result["source_id"].eq("kaggle_sumitrodatta_nba"), result["source_id"].eq("gonzalogigena_nba_all_time")],
        ["Gonzalo Gigena all-time dataset; Brescou NBA stats", "FiveThirtyEight historical; Brescou NBA stats"],
        default="NA",
    )
    result["secondary_source_url"] = np.select(
        [result["source_id"].eq("kaggle_sumitrodatta_nba"), result["source_id"].eq("gonzalogigena_nba_all_time")],
        [
            "https://www.kaggle.com/datasets/gonzalogigena/nba-all-time-stats; https://github.com/Brescou/NBA-dataset-stats-player-team",
            "https://github.com/fivethirtyeight/nba-player-advanced-metrics; https://github.com/Brescou/NBA-dataset-stats-player-team",
        ],
        default="NA",
    )
    result["verified"] = (~missing) & result["data_quality"].isin(["A", "B"])
    result["verification_method"] = np.select(
        [missing, result["data_quality"].eq("A"), result["data_quality"].eq("B")],
        ["missing kept as NA", "official-page parsing plus uniqueness checks", "schema/range checks and representative cross-source reconciliation"],
        default="schema and range checks; single retained source",
    )
    result.loc[missing, "data_quality"] = "D"
    result.loc[missing, "known_limitations"] = result.loc[missing, "known_limitations"].fillna("") + "; value not observed"
    result["notes"] = "Raw facts and derived facts are stored separately; zero is never substituted for NA"
    columns = [
        "player_name", "player_id", "indicator_name", "season", "value", "primary_source", "source_url", "source_title",
        "source_access_date", "secondary_source", "secondary_source_url", "source_type", "official_status", "verified",
        "verification_method", "data_quality", "historical_coverage", "known_limitations", "notes", "source_id",
    ]
    return result[columns]


def main() -> None:
    ensure_dirs()
    logger = setup_logging("03_sources")
    regular = pd.read_csv(PROCESSED / "regular_season_by_season.csv")
    regular_rows = long_rows(
        regular, ["player_id", "player_name", "season"],
        ["g", "mp", "pts", "trb", "ast", "stl", "blk", "tov", "fg_percent", "x3p_percent", "ft_percent", "e_fg_percent", "ts_percent"],
        "kaggle_sumitrodatta_nba",
    )
    career = pd.read_csv(PROCESSED / "regular_season_career.csv")
    career_rows = long_rows(
        career, ["player_id", "player_name"],
        ["career_games", "career_minutes", "career_points", "career_rebounds", "career_assists", "career_steals", "career_blocks", "career_ppg", "career_rpg", "career_apg", "career_spg", "career_bpg", "career_ts", "career_ws", "career_vorp"],
        "kaggle_sumitrodatta_nba",
    )
    playoffs = pd.read_csv(PROCESSED / "playoffs_by_season.csv")
    playoff_metrics = [
        "playoff_games", "playoff_wins_known", "playoff_minutes_per_game", "playoff_ppg", "playoff_rpg", "playoff_apg",
        "playoff_spg", "playoff_bpg", "playoff_tovpg", "playoff_fg_pct", "playoff_3p_pct", "playoff_ft_pct", "playoff_ts_pct",
    ]
    playoff_rows = long_rows(playoffs, ["player_id", "player_name", "season", "source_id"], playoff_metrics, None)

    awards = pd.read_csv(PROCESSED / "awards.csv")
    official_awards = ["mvp", "finals_mvp", "dpoy"]
    published_awards = [column for column in awards.columns if column not in ["player_id", "player_name"] + official_awards]
    award_rows = pd.concat(
        [
            long_rows(awards, ["player_id", "player_name"], official_awards, "nba_official_history"),
            long_rows(awards, ["player_id", "player_name"], published_awards, "kaggle_sumitrodatta_nba"),
        ],
        ignore_index=True,
    )
    team = pd.read_csv(PROCESSED / "team_success.csv")
    team_rows = long_rows(
        team, ["player_id", "player_name"],
        ["championships", "finals_appearances", "conference_finals", "playoff_series_wins", "regular_season_team_success"],
        "nba_official_history",
    )
    all_rows = enrich_sources(pd.concat([regular_rows, career_rows, playoff_rows, award_rows, team_rows], ignore_index=True))
    reconciliation = pd.concat(
        [
            pd.read_csv(OUTPUT / "diagnostics" / "source_reconciliation_regular.csv"),
            pd.read_csv(OUTPUT / "diagnostics" / "source_reconciliation_playoffs.csv"),
        ],
        ignore_index=True,
    )
    write_csv(reconciliation, OUTPUT / "diagnostics" / "source_reconciliation.csv")
    reconciliation_summary = (
        reconciliation.groupby(["player_id", "season", "primary_source_id"], as_index=False)
        .agg(
            reconciliation_secondary_sources=("secondary_source_id", lambda values: "; ".join(sorted(set(values)))),
            reconciliation_fields_compared=("fields_compared", "sum"),
            reconciliation_fields_matched=("fields_matched", "sum"),
            reconciliation_any_match=("verification_status", lambda values: bool((values == "verified_match").any())),
            reconciliation_any_difference=("verification_status", lambda values: bool((values == "material_difference").any())),
        )
    )
    all_rows["season_numeric"] = pd.to_numeric(all_rows["season"], errors="coerce")
    all_rows = all_rows.merge(
        reconciliation_summary,
        left_on=["player_id", "season_numeric", "source_id"],
        right_on=["player_id", "season", "primary_source_id"],
        how="left",
        suffixes=("", "_reconciliation"),
    )
    has_reconciliation = all_rows["reconciliation_fields_compared"].fillna(0).gt(0)
    all_rows.loc[has_reconciliation, "secondary_source"] = all_rows.loc[has_reconciliation, "reconciliation_secondary_sources"]
    all_rows.loc[has_reconciliation, "verified"] = (
        all_rows.loc[has_reconciliation, "reconciliation_any_match"].eq(True).to_numpy(dtype=bool)
    )
    all_rows.loc[has_reconciliation & all_rows["reconciliation_any_match"].eq(True), "data_quality"] = "B"
    all_rows.loc[has_reconciliation & ~all_rows["reconciliation_any_match"].eq(True), "data_quality"] = "C"
    all_rows.loc[has_reconciliation, "verification_method"] = (
        "field-level cross-source reconciliation: "
        + all_rows.loc[has_reconciliation, "reconciliation_fields_matched"].fillna(0).astype(int).astype(str)
        + "/"
        + all_rows.loc[has_reconciliation, "reconciliation_fields_compared"].fillna(0).astype(int).astype(str)
        + " comparable fields matched"
    )
    all_rows = all_rows.drop(
        columns=[
            "season_numeric", "season_reconciliation", "primary_source_id", "reconciliation_secondary_sources",
            "reconciliation_fields_compared", "reconciliation_fields_matched", "reconciliation_any_match",
            "reconciliation_any_difference",
        ],
        errors="ignore",
    )
    write_csv(all_rows, OUTPUT / "diagnostics" / "data_sources.csv")

    group_keys = [
        "player_name", "player_id", "indicator_name", "primary_source", "source_url", "source_title",
        "source_access_date", "secondary_source", "secondary_source_url", "source_type", "official_status",
        "verified", "verification_method", "data_quality", "historical_coverage", "known_limitations", "notes", "source_id",
    ]
    grouped_input = all_rows.assign(
        season_numeric=pd.to_numeric(all_rows["season"], errors="coerce"),
        observed=all_rows["value"].notna(),
        career_level=all_rows["season"].astype(str).eq("Career"),
    )
    source_groups = (
        grouped_input.groupby(group_keys, as_index=False, dropna=False)
        .agg(
            season_start=("season_numeric", "min"),
            season_end=("season_numeric", "max"),
            record_count=("value", "size"),
            observed_record_count=("observed", "sum"),
            career_level_records=("career_level", "sum"),
            value_min=("value", "min"),
            value_max=("value", "max"),
        )
    )
    source_groups["season_scope"] = np.select(
        [
            source_groups["career_level_records"].eq(source_groups["record_count"]),
            source_groups["season_start"].eq(source_groups["season_end"]),
        ],
        ["Career", source_groups["season_start"].fillna("").astype(str)],
        default=source_groups["season_start"].fillna("").astype(str) + "–" + source_groups["season_end"].fillna("").astype(str),
    )
    source_groups = source_groups[[
        "player_name", "player_id", "indicator_name", "season_scope", "season_start", "season_end", "record_count",
        "observed_record_count", "value_min", "value_max", "primary_source", "source_url", "source_title",
        "source_access_date", "secondary_source", "secondary_source_url", "source_type", "official_status", "verified",
        "verification_method", "data_quality", "historical_coverage", "known_limitations", "notes", "source_id",
    ]]
    write_csv(source_groups, OUTPUT / "diagnostics" / "data_source_groups.csv")
    source_manifest = pd.DataFrame(
        [
            {"field": "workbook_detail_sheet", "value": "Source_Groups"},
            {"field": "grouping_unit", "value": "One player + indicator + source + quality combination"},
            {"field": "grouped_records", "value": len(source_groups)},
            {"field": "full_row_level_audit_records", "value": len(all_rows)},
            {"field": "full_row_level_audit_path", "value": "output/diagnostics/data_sources.csv"},
            {"field": "missing_value_policy", "value": "NA is retained; never converted to zero"},
            {"field": "data_access_date", "value": ACCESS_DATE},
        ]
    )
    write_csv(source_manifest, OUTPUT / "diagnostics" / "data_source_manifest.csv")

    model_raw_metrics = [
        "career_games", "career_minutes", "career_points", "career_rebounds", "career_assists", "career_steals", "career_blocks",
        "career_ts", "career_ws", "career_vorp", "mvp", "mvp_shares", "finals_mvp", "dpoy", "all_nba_total",
        "all_defense_total", "all_star", "championships", "finals_appearances",
    ]
    coverage = (
        all_rows[all_rows["indicator_name"].isin(model_raw_metrics)]
        .assign(observed=lambda frame: frame["value"].notna())
        .groupby(["player_id", "player_name"], as_index=False)
        .agg(observed_items=("observed", "sum"), total_items=("observed", "size"))
    )
    coverage["missing_items"] = coverage["total_items"] - coverage["observed_items"]
    coverage["completeness_pct"] = coverage["observed_items"] / coverage["total_items"]
    playoff_coverage = playoffs.groupby("player_id").agg(
        playoff_seasons_observed=("season", "nunique"), playoff_first_observed=("season", "min"), playoff_last_observed=("season", "max")
    ).reset_index()
    coverage = coverage.merge(playoff_coverage, on="player_id", how="left")
    write_csv(coverage, OUTPUT / "diagnostics" / "data_completeness_summary.csv")

    raw_files = [path for path in RAW.rglob("*") if path.is_file()]
    manifest = pd.DataFrame(
        [{"relative_path": str(path.relative_to(ROOT)), "bytes": path.stat().st_size, "sha256": sha256(path), "access_date": ACCESS_DATE} for path in raw_files]
    )
    write_csv(manifest, OUTPUT / "diagnostics" / "raw_file_manifest.csv")

    reconciliation_matches = int(reconciliation["fields_matched"].sum())
    reconciliation_fields = int(reconciliation["fields_compared"].sum())
    report = f"""# Data Completeness Report

## Scope

- Master candidate pool: {coverage.shape[0]} players.
- Regular-season player-seasons retained: {regular[['player_id','season']].drop_duplicates().shape[0]}.
- Playoff player-seasons retained: {playoffs[['player_id','season']].drop_duplicates().shape[0]}.
- Row-level source audit records: {len(all_rows):,}.
- Workbook source groups: {len(source_groups):,}; each row groups one player/indicator/source/quality combination while preserving season range, record count and value range.

## Coverage findings

- Regular-season counting statistics cover BAA/NBA seasons from 1947 through 2026.
- Steals and blocks are structurally unavailable before 1973-74. Those cells remain `NA`, never zero.
- BPM/VORP and related advanced metrics do not cover the earliest eras consistently; historical players are not assigned zero.
- Full-history BAA/NBA playoff game boxes now cover 1947-2024. They replace the v0.1 split source that made pre-1997 players structurally incomparable with modern players.
- Cross-source reconciliation compared {reconciliation_fields:,} common fields and matched {reconciliation_matches:,}; material differences are retained in `source_reconciliation.csv`, never silently averaged away.
- Player-level playoff box data for 2024-25 and 2025-26 remain unavailable in a retained, full-history comparable source. These seasons remain `NA` rather than being inferred.
- NBA official champion and Finals MVP pages do cover 2025-26, so team championships and Finals MVP counts are current even where box-level playoff data are not.

## Historical vs modern modeling

The v0.2 ranking uses dimension scores with available-input renormalization. A `Historical Comparable` view uses only broadly available career, rate, awards and team-success fields. Modern-only RAPTOR/PIE fields are retained for analysis but are not allowed to make missing historical values behave like zeros.

## Quality grades

- A: NBA official league-history pages.
- B: public historical datasets with retained licenses and cross-source/schema checks.
- C: one reliable retained public repository without a second full-history match.
- D: unobserved or era-structurally unavailable data.
"""
    (ROOT / "docs" / "data_completeness_report.md").write_text(report, encoding="utf-8")
    logger.info(
        "Wrote %s source audit rows and %s workbook groups; median completeness %.1f%%",
        len(all_rows), len(source_groups), coverage["completeness_pct"].median() * 100,
    )


if __name__ == "__main__":
    main()
