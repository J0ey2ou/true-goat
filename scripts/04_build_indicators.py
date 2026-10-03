from __future__ import annotations

import itertools

import numpy as np
import pandas as pd

from common import OUTPUT, PROCESSED, ROOT, ensure_dirs, percentile, safe_zscore, setup_logging, weighted_available_average, write_csv


def composite_score(frame: pd.DataFrame, weights: dict[str, float]) -> tuple[pd.Series, pd.Series]:
    pct = pd.DataFrame(index=frame.index)
    for column in weights:
        pct[column] = percentile(frame[column]) if column in frame else np.nan
    score = weighted_available_average(pct, weights) * 100
    coverage = pct.notna().sum(axis=1) / max(len(weights), 1)
    return score, coverage


def indicator_dictionary() -> pd.DataFrame:
    rows = []

    def add(
        indicator_id: str,
        indicator_name: str,
        dimension: str,
        definition: str,
        formula: str,
        unit: str,
        higher: bool = True,
        career_or_season: str = "career",
        regular_or_playoff: str = "regular",
        individual_or_team: str = "individual",
        raw_or_derived: str = "raw",
        era_needed: bool = False,
        availability: str = "1947-present",
        missing: str = "NA if unobserved",
        overlap: str = "none material",
        source: str = "Kaggle NBA/ABA/BAA dataset",
        backup: str = "NBA official history / retained secondary dataset",
        notes: str = "candidate/display metric",
    ) -> None:
        rows.append(
            {
                "indicator_id": indicator_id, "indicator_name": indicator_name, "dimension": dimension, "definition": definition,
                "formula": formula, "unit": unit, "higher_is_better": higher, "career_or_season": career_or_season,
                "regular_or_playoff": regular_or_playoff, "individual_or_team": individual_or_team, "raw_or_derived": raw_or_derived,
                "era_adjustment_needed": era_needed, "historical_availability": availability, "missing_data_issue": missing,
                "potential_overlap": overlap, "proposed_source": source, "backup_source": backup, "notes": notes,
            }
        )

    counting = [
        ("RS_G", "Games", "g", "games"), ("RS_MP", "Minutes", "mp", "minutes"), ("RS_PTS", "Points", "pts", "points"),
        ("RS_TRB", "Rebounds", "trb", "rebounds"), ("RS_AST", "Assists", "ast", "assists"),
        ("RS_STL", "Steals", "stl", "steals"), ("RS_BLK", "Blocks", "blk", "blocks"), ("RS_TOV", "Turnovers", "tov", "turnovers"),
    ]
    for ident, name, field, unit in counting:
        add(ident, name, "Regular Season Individual Performance", f"Regular-season {name.lower()}", field, unit, field != "tov", overlap="career totals overlap with longevity and per-game production")
    rates = [
        ("RS_PPG", "Points per game", "PTS / G", "points/game"), ("RS_RPG", "Rebounds per game", "TRB / G", "rebounds/game"),
        ("RS_APG", "Assists per game", "AST / G", "assists/game"), ("RS_SPG", "Steals per game", "STL / G", "steals/game"),
        ("RS_BPG", "Blocks per game", "BLK / G", "blocks/game"), ("RS_FGP", "Field-goal percentage", "FG / FGA", "rate"),
        ("RS_3PP", "Three-point percentage", "3P / 3PA", "rate"), ("RS_FTP", "Free-throw percentage", "FT / FTA", "rate"),
        ("RS_EFG", "Effective field-goal percentage", "(FG + 0.5*3P) / FGA", "rate"),
        ("RS_TS", "True shooting percentage", "PTS / (2*(FGA + 0.44*FTA))", "rate"),
    ]
    for ident, name, formula, unit in rates:
        add(ident, name, "Regular Season Individual Performance", name, formula, unit, era_needed=True, raw_or_derived="derived", overlap="rate may overlap with scoring or shooting-efficiency family")
    advanced = [
        ("ADV_PER", "PER", "published PER"), ("ADV_WS", "Win Shares", "published OWS + DWS"),
        ("ADV_WS48", "Win Shares per 48", "WS / minutes * 48"), ("ADV_BPM", "Box Plus/Minus", "published BPM"),
        ("ADV_OBPM", "Offensive BPM", "published OBPM"), ("ADV_DBPM", "Defensive BPM", "published DBPM"),
        ("ADV_VORP", "Value Over Replacement Player", "published VORP"),
    ]
    for ident, name, formula in advanced:
        add(ident, name, "Regular Season Individual Performance", name, formula, "index", raw_or_derived="published derived", era_needed=True, availability="mostly 1974-present; some fields reconstructed earlier", missing="not available consistently for early eras", overlap="advanced metrics overlap with box-score production", notes="display and component input only when observed")

    for window in [1, 3, 5, 7]:
        add(f"PEAK_{window}", f"Best {window}-season peak", "Peak", f"Mean of the best {window} availability-adjusted season performance scores", f"mean(top {window} season_performance_available)", "z-score", career_or_season="career", raw_or_derived="derived", era_needed=True, overlap="peak windows are nested and highly correlated", notes="Peak component input")
    add("PEAK_PLAYOFF", "Playoff peak", "Peak", "Best three observed playoff composite seasons", "mean(top 3 playoff era composites)", "z-score", regular_or_playoff="playoff", raw_or_derived="derived", era_needed=True, availability="1947-2024 retained full-history coverage", missing="2025-2026 player playoff data unavailable in the retained full-history source", overlap="overlaps with playoff career composite")

    longevity = [
        ("LONG_SEASONS", "Career seasons", "count(distinct season)", "seasons"), ("LONG_GAMES", "Career games", "sum(G)", "games"),
        ("LONG_MIN", "Career minutes", "sum(MP)", "minutes"), ("LONG_ELITE", "Elite seasons", "count(season_performance_available >= 1.0)", "seasons"),
        ("LONG_SUPER", "Superstar seasons", "count(season_performance_available >= 1.75)", "seasons"),
        ("LONG_POS", "Positive-value seasons", "count(season_performance_available >= 0.5)", "seasons"),
        ("LONG_CUM", "Cumulative performance", "sum(max(season_performance_available + 0.5, 0))", "index"),
        ("LONG_WS", "Career Win Shares", "sum(WS)", "wins"), ("LONG_VORP", "Career VORP", "sum(VORP)", "wins over replacement"),
        ("LONG_AGE", "Age-related longevity", "career_end - career_start + late-prime bonus", "index"),
    ]
    for ident, name, formula, unit in longevity:
        add(ident, name, "Longevity", name, formula, unit, raw_or_derived="derived", overlap="games/minutes/seasons and cumulative metrics are strongly related", notes="Longevity component input or diagnostic")

    playoff = [
        ("PO_G", "Playoff games", "sum(playoff games)", "games"), ("PO_PPG", "Playoff PPG", "games-weighted PPG", "points/game"),
        ("PO_RPG", "Playoff RPG", "games-weighted RPG", "rebounds/game"), ("PO_APG", "Playoff APG", "games-weighted APG", "assists/game"),
        ("PO_SPG", "Playoff SPG", "games-weighted SPG", "steals/game"), ("PO_BPG", "Playoff BPG", "games-weighted BPG", "blocks/game"),
        ("PO_TS", "Playoff TS%", "games-weighted TS%", "rate"), ("PO_WINS", "Known playoff wins", "sum observed playoff wins", "wins"),
        ("PO_SERIES", "Series wins", "count won series", "series"), ("PO_CF", "Conference finals appearances", "count appearances", "appearances"),
        ("PO_FIN", "Finals appearances", "count finalist roster seasons", "appearances"), ("PO_COMP", "Playoff individual composite", "within-playoff-season z-score composite", "0-100"),
        ("PO_RAPTOR", "Playoff RAPTOR", "published RAPTOR +/-", "points/100"),
    ]
    for ident, name, formula, unit in playoff:
        availability = "1947-2024 retained full-history player data" if ident not in ["PO_FIN"] else "1947-2026 official team result"
        missing = "2025-2026 player playoff box data unavailable; steals/blocks unavailable in early eras" if ident not in ["PO_FIN"] else "none for finalist-team history"
        add(ident, name, "Playoffs", name, formula, unit, career_or_season="career", regular_or_playoff="playoff", raw_or_derived="derived", era_needed=ident in ["PO_PPG", "PO_RPG", "PO_APG", "PO_TS", "PO_COMP"], availability=availability, missing=missing, overlap="separates individual playoff performance from team achievement", source="Gonzalo Gigena full-history boxes + FiveThirtyEight + Brescou + NBA official history")

    awards = [
        ("AW_MVP", "MVP count", "count official MVP wins"), ("AW_MVPS", "MVP shares", "sum MVP vote shares"),
        ("AW_MVPT3", "MVP Top 3", "count vote rank <= 3"), ("AW_MVPT5", "MVP Top 5", "count vote rank <= 5"),
        ("AW_FMVP", "Finals MVP", "count official Finals MVP wins"), ("AW_DPOY", "DPOY", "count official DPOY wins"),
        ("AW_AN1", "All-NBA First Team", "count first-team selections"), ("AW_AN2", "All-NBA Second Team", "count second-team selections"),
        ("AW_AN3", "All-NBA Third Team", "count third-team selections"), ("AW_AD1", "All-Defensive First Team", "count first-team selections"),
        ("AW_AD2", "All-Defensive Second Team", "count second-team selections"), ("AW_AS", "All-Star selections", "count distinct selections"),
        ("AW_SCT", "Scoring titles", "count qualified PPG league leads"), ("AW_REBT", "Rebounding titles", "count qualified RPG league leads"),
        ("AW_ASTT", "Assist titles", "count qualified APG league leads"), ("AW_STLT", "Steals titles", "count qualified SPG league leads"),
        ("AW_BLKT", "Blocks titles", "count qualified BPG league leads"),
    ]
    for ident, name, formula in awards:
        add(ident, name, "Awards", name, formula, "count/share", raw_or_derived="raw/derived", availability="varies by award inception", missing="award did not exist in some eras; absence is not treated as observed zero in era diagnostics", overlap="awards overlap with performance and with each other", source="NBA official history + public historical dataset", notes="Awards component input/display")

    team = [
        ("TEAM_CHAMP", "Championships", "count champion roster seasons"), ("TEAM_FINALS", "Finals appearances", "count finalist roster seasons"),
        ("TEAM_CF", "Conference finals", "count appearances"), ("TEAM_SERIES", "Playoff series wins", "count won series"),
        ("TEAM_RS", "Regular-season team success", "team win-based player-season aggregation"),
    ]
    for ident, name, formula in team:
        add(ident, name, "Team Success", name, formula, "count/index", individual_or_team="team context", raw_or_derived="derived", overlap="team outcomes are correlated with awards and playoff volume", source="NBA official history", missing="conference-finals/series detail retained as NA in v0.1" if ident in ["TEAM_CF", "TEAM_SERIES", "TEAM_RS"] else "none material")

    defense = [
        ("DEF_DWS", "Career defensive Win Shares", "sum(DWS)", "wins"), ("DEF_DBPM", "Career/season DBPM", "published DBPM", "index"),
        ("DEF_STL", "Era-adjusted steals", "within-season z(SPG)", "z-score"), ("DEF_BLK", "Era-adjusted blocks", "within-season z(BPG)", "z-score"),
        ("DEF_AWARDS", "Defensive awards composite", "percentile(DPOY, All-Defense)", "0-100"),
    ]
    for ident, name, formula, unit in defense:
        add(ident, name, "Defense", name, formula, unit, raw_or_derived="derived", era_needed=True, availability="steals/blocks 1974-present; All-Defense 1969-present; DPOY 1983-present", missing="structural pre-inception missingness", overlap="DPOY and All-Defense overlap; DWS/DBPM overlap", notes="missing inputs reweighted, never zero-filled")

    era = [
        ("ERA_PPG", "Era-adjusted PPG", "z(PPG within season)"), ("ERA_TS", "Era-adjusted TS%", "z(TS% within season)"),
        ("ERA_AST", "Era-adjusted APG", "z(APG within season)"), ("ERA_REB", "Era-adjusted RPG", "z(RPG within season)"),
        ("ERA_DEF", "Era-adjusted defense", "weighted available z(SPG,BPG,DBPM)"),
        ("ERA_COMP", "Season performance composite", "weighted available within-season z metrics"),
    ]
    for ident, name, formula in era:
        add(ident, name, "Era Dominance", name, formula, "z-score", career_or_season="season", raw_or_derived="derived", era_needed=True, overlap="component inputs are correlated by construction", notes="core cross-era normalization")

    availability = [
        ("AVL_SHARE", "Games played share", "G / league maximum G in season"), ("AVL_PEAK", "Peak availability", "mean games share in top performance seasons"),
        ("AVL_MIN", "Minutes durability", "career minutes percentile"), ("AVL_PO", "Playoff availability", "observed playoff games and seasons"),
    ]
    for ident, name, formula in availability:
        add(ident, name, "Availability / Durability", name, formula, "rate/index", raw_or_derived="derived", overlap="overlaps with longevity games and minutes", notes="availability penalty is explicit")

    return pd.DataFrame(rows)


def main() -> None:
    ensure_dirs()
    logger = setup_logging("04_indicators")
    career = pd.read_csv(PROCESSED / "regular_season_career.csv")
    peak = pd.read_csv(PROCESSED / "peak_longevity.csv")
    awards = pd.read_csv(PROCESSED / "awards.csv")
    playoffs = pd.read_csv(PROCESSED / "playoffs_career.csv")
    playoff_seasons = pd.read_csv(PROCESSED / "playoffs_by_season.csv")
    team = pd.read_csv(PROCESSED / "team_success.csv")
    era = pd.read_csv(PROCESSED / "era_adjusted.csv")

    features = career.merge(peak, on=["player_id", "player_name"], how="left", suffixes=("", "_peak"))
    features = features.merge(awards, on=["player_id", "player_name"], how="left")
    features = features.merge(playoffs, on=["player_id", "player_name"], how="left")
    features = features.merge(team, on=["player_id", "player_name"], how="left")

    era["weighted_quality"] = era["season_performance_available"] * era["g"]
    era_summary = era.groupby("player_id").agg(
        era_quality_num=("weighted_quality", "sum"), era_quality_den=("g", "sum"),
        mean_games_share=("games_share", "mean"), peak_games_share=("games_share", lambda values: values.nlargest(min(5, len(values))).mean()),
        career_era_defense=("era_defense", "mean"),
    ).reset_index()
    era_summary["career_era_quality"] = era_summary["era_quality_num"] / era_summary["era_quality_den"].replace(0, np.nan)
    features = features.merge(era_summary, on="player_id", how="left")

    playoff_seasons["qualified"] = playoff_seasons["playoff_games"] >= 5
    for column in ["playoff_ppg", "playoff_rpg", "playoff_apg", "playoff_ts_pct"]:
        playoff_seasons[f"z_{column}"] = pd.to_numeric(playoff_seasons[column], errors="coerce").where(playoff_seasons["qualified"]).groupby(playoff_seasons["season"]).transform(safe_zscore)
    playoff_seasons["playoff_season_composite"] = weighted_available_average(
        playoff_seasons, {"z_playoff_ppg": 0.40, "z_playoff_rpg": 0.18, "z_playoff_apg": 0.22, "z_playoff_ts_pct": 0.20}
    )
    po_rows = []
    for player_id, group in playoff_seasons.groupby("player_id"):
        values = group["playoff_season_composite"].dropna().sort_values(ascending=False)
        games = pd.to_numeric(group["playoff_games"], errors="coerce")
        po_rows.append(
            {
                "player_id": player_id,
                "playoff_peak_3": values.head(3).mean() if len(values) else np.nan,
                "playoff_era_mean": np.average(group.loc[group["playoff_season_composite"].notna(), "playoff_season_composite"], weights=games[group["playoff_season_composite"].notna()]) if group["playoff_season_composite"].notna().any() else np.nan,
            }
        )
    features = features.merge(pd.DataFrame(po_rows), on="player_id", how="left")
    write_csv(playoff_seasons, OUTPUT / "indicators" / "playoff_era_adjusted.csv")

    component_specs = {
        "regular_season": {"career_ppg": 0.24, "career_rpg": 0.12, "career_apg": 0.14, "career_ts": 0.16, "career_era_quality": 0.34},
        "peak": {"peak_1": 0.25, "peak_3": 0.30, "peak_5": 0.25, "peak_7": 0.20},
        "longevity": {"career_games": 0.13, "career_minutes": 0.13, "elite_seasons": 0.16, "positive_value_seasons": 0.10, "cumulative_performance": 0.18, "career_ws": 0.14, "career_vorp": 0.10, "mean_games_share": 0.06},
        "playoffs": {"playoff_games": 0.22, "playoff_peak_3": 0.30, "playoff_era_mean": 0.25, "playoff_wins_known": 0.08, "playoff_ts_pct": 0.15},
        "awards": {"mvp": 0.24, "mvp_shares": 0.16, "mvp_top3": 0.08, "finals_mvp": 0.16, "all_nba_first": 0.14, "all_nba_total": 0.10, "all_star": 0.05, "leader_titles": 0.07},
        "defense": {"career_dws": 0.28, "career_era_defense": 0.22, "dpoy": 0.20, "all_defense_first": 0.18, "all_defense_second": 0.07, "career_spg": 0.025, "career_bpg": 0.025},
        "team_success": {"championships": 0.65, "finals_appearances": 0.35},
    }
    component_columns = []
    for component, weights in component_specs.items():
        score, coverage = composite_score(features, weights)
        features[f"{component}_score"] = score
        features[f"{component}_coverage"] = coverage
        component_columns.append(f"{component}_score")

    features["component_coverage_count"] = features[component_columns].notna().sum(axis=1)
    features["historical_comparable_score"] = weighted_available_average(
        features,
        {"regular_season_score": 0.23, "peak_score": 0.24, "longevity_score": 0.18, "awards_score": 0.16, "defense_score": 0.09, "team_success_score": 0.10},
    )
    model_cols = ["player_id", "player_name"] + component_columns + [f"{name}_coverage" for name in component_specs] + ["component_coverage_count", "historical_comparable_score"]
    write_csv(features, PROCESSED / "model_features_full.csv")
    write_csv(features[model_cols], PROCESSED / "model_features.csv")

    dictionary = indicator_dictionary()
    write_csv(dictionary, OUTPUT / "indicators" / "indicator_dictionary.csv")

    numeric_inputs = [column for weights in component_specs.values() for column in weights if column in features.columns]
    correlation = features[numeric_inputs].corr(min_periods=30)
    correlation.to_csv(OUTPUT / "diagnostics" / "indicator_correlation_matrix.csv", encoding="utf-8-sig", na_rep="NA")
    pairs = []
    for left, right in itertools.combinations(numeric_inputs, 2):
        value = correlation.loc[left, right]
        if pd.notna(value) and abs(value) >= 0.75:
            pairs.append({"indicator_1": left, "indicator_2": right, "pearson_correlation": value, "absolute_correlation": abs(value)})
    pairs_df = pd.DataFrame(pairs).sort_values("absolute_correlation", ascending=False) if pairs else pd.DataFrame(columns=["indicator_1", "indicator_2", "pearson_correlation", "absolute_correlation"])
    write_csv(pairs_df, OUTPUT / "diagnostics" / "high_overlap_pairs.csv")

    report = f"""# Indicator Overlap Report

## Empirical screen

Across the 300-player master pool, {len(pairs_df)} input pairs have absolute Pearson correlation at or above 0.75 (minimum 30 observed pairs). The machine-readable list is `output/diagnostics/high_overlap_pairs.csv`.

## Conceptual overlap decisions

- Career games, seasons and minutes all represent longevity. They remain visible but enter a single Longevity component, preventing three separate top-level rewards.
- Career points, PPG, scoring titles, MVP and All-NBA partly reward scoring. The final models operate on dimension scores; the Awards and Regular Season dimensions remain separately inspectable and receive explicit weights.
- Peak 1/3/5/7 are deliberately nested. They are combined inside one Peak component instead of acting as four independent top-level dimensions.
- Win Shares, VORP, BPM and PER overlap with box-score production. Modern advanced fields are retained for diagnostics and partial component construction only when observed; no historical missing value becomes zero.
- Championships, Finals appearances and playoff games correlate with team opportunity. Individual playoff performance and Team Success are modeled separately.
- DPOY and All-Defense overlap. Both are retained because award inception and voting history differ, but their influence is confined to the Defense component.

## Recommended treatment

- Keep raw fields for transparency and display.
- Fit the primary expert model on the seven component scores, not dozens of correlated raw columns.
- Use Ridge regularization and bootstrap coefficient stability.
- Treat modern-only RAPTOR/PIE fields as diagnostics, not universal historical requirements.
"""
    (ROOT / "docs" / "indicator_overlap_report.md").write_text(report, encoding="utf-8")
    logger.info("Built %s dictionary entries, %s model features and %s high-correlation pairs", len(dictionary), len(features), len(pairs_df))


if __name__ == "__main__":
    main()
