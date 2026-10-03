from __future__ import annotations

import numpy as np
import pandas as pd

from common import RAW_CSV, OUTPUT, canonical_name, ensure_dirs, load_config, percentile, setup_logging, write_csv
from data_utils import add_era_adjustments, add_leader_titles, career_summary, load_honors, load_regular_seasons, load_team_success
from ranking_utils import parse_external_rankings


def era_label(year: float) -> str:
    if pd.isna(year):
        return "Unknown"
    decade = int(year) // 10 * 10
    return f"{decade}s"


def nonzero_reason(label: str, value: float) -> str | None:
    return f"{int(value)} {label}" if pd.notna(value) and value > 0 else None


def main() -> None:
    ensure_dirs()
    logger = setup_logging("01_candidates")
    rules = load_config("candidate_rules.yaml")
    season = add_era_adjustments(
        load_regular_seasons(),
        rules["pool_b"]["season_min_games_floor"],
        rules["pool_b"]["season_min_league_games_share"],
    )
    career = career_summary(season)
    honors = add_leader_titles(season, load_honors(season))
    success, finals = load_team_success()

    info = pd.read_csv(RAW_CSV / "Player Career Info.csv")
    info["birth_year"] = pd.to_datetime(info["birth_date"], errors="coerce").dt.year
    info = info.rename(columns={"from": "info_from", "to": "info_to"})
    base = career.merge(honors.drop(columns=["player"], errors="ignore"), on="player_id", how="left")
    base = base.merge(success, on="player_id", how="left")
    base = base.merge(info[["player_id", "pos", "birth_year", "info_from", "info_to", "hof"]], on="player_id", how="left")
    base["name_key"] = base["player"].map(canonical_name)
    base["career_mid"] = (base["career_start"] + base["career_end"]) / 2
    base["era"] = base["career_mid"].map(era_label)
    base["active_status"] = np.where(base["career_end"].eq(season["season"].max()), "active", "retired")
    for column in ["championships", "finals_appearances"]:
        base[column] = base[column].fillna(0).astype(int)

    ordered, official = parse_external_rankings()
    external_counts = ordered.groupby("name_key")["source"].nunique().rename("external_ranked_sources")
    official_flags = official.assign(flag=1).pivot_table(index="name_key", columns="source", values="flag", aggfunc="max", fill_value=0)
    identity_map = (
        base.sort_values(["name_key", "career_games", "career_minutes", "player_id"], ascending=[True, False, False, True])
        .drop_duplicates("name_key")[["player_id", "name_key"]]
    )
    recognition = (
        identity_map.merge(external_counts.reset_index(), on="name_key", how="left")
        .merge(official_flags.reset_index(), on="name_key", how="left")
        .drop(columns="name_key")
    )
    base = base.merge(recognition, on="player_id", how="left")
    for column in ["external_ranked_sources", "NBA_75", "NBA_50"]:
        if column not in base:
            base[column] = 0
        base[column] = base[column].fillna(0).astype(int)

    base["honor_candidate_score"] = (
        base["mvp"] * 8.0 + base["finals_mvp"] * 7.0 + base["dpoy"] * 4.0
        + base["all_nba_first"] * 2.5 + base["all_nba_second"] * 1.5 + base["all_nba_third"] * 0.8
        + base["all_defense_first"] * 1.2 + base["all_defense_second"] * 0.6
        + base["all_star"] * 0.45 + base["leader_titles"] * 1.2
        + base["championships"] * 0.5 + base["NBA_75"] * 3.0 + base["NBA_50"] * 2.0
    )
    base["honor_score_percentile"] = percentile(base["honor_candidate_score"])

    statistical_fields = ["peak_1", "peak_3", "peak_5", "cumulative_performance", "career_minutes", "career_ws", "career_vorp"]
    statistical_weights = [0.18, 0.20, 0.14, 0.18, 0.08, 0.12, 0.10]
    score = pd.Series(0.0, index=base.index)
    weight_sum = pd.Series(0.0, index=base.index)
    for field, weight in zip(statistical_fields, statistical_weights):
        pct = percentile(base[field])
        score = score.add(pct.fillna(0) * weight)
        weight_sum = weight_sum.add(pct.notna().astype(float) * weight)
    base["performance_candidate_score"] = score / weight_sum.replace(0, np.nan)

    a = rules["pool_a"]
    base["pool_A"] = (
        (base["mvp"] >= a["mvp_min"]) | (base["dpoy"] >= a["dpoy_min"])
        | (base["all_nba_first"] >= a["all_nba_first_min"]) | (base["all_nba_total"] >= a["all_nba_total_min"])
        | (base["all_star"] >= a["all_star_min"]) | (base["leader_titles"] >= a["leader_titles_min"])
        | (base["honor_score_percentile"] >= a["honor_score_percentile"]) | base["NBA_75"].eq(1) | base["NBA_50"].eq(1)
    )

    discussion_keys = {canonical_name(name) for name in rules["pool_c"]["discussion_cases"]}
    hof_flag = base["hof"].fillna(False).astype(bool) & (base["all_star"] >= rules["pool_c"]["include_hof_with_all_star_min"])
    base["pool_C"] = (
        base["external_ranked_sources"].gt(0) | base["NBA_75"].eq(1) | base["NBA_50"].eq(1)
        | hof_flag | base["name_key"].isin(discussion_keys)
    )
    era_c = (
        base[base["career_games"] >= rules["minimum_career_games"]]
        .sort_values(["era", "performance_candidate_score"], ascending=[True, False])
        .groupby("era").head(rules["pool_c"]["era_representatives_per_decade"])["player_id"]
    )
    base.loc[base["player_id"].isin(era_c), "pool_C"] = True

    eligible = base[base["career_games"] >= rules["minimum_career_games"]].sort_values("performance_candidate_score", ascending=False)
    forced_b = set(
        eligible.sort_values(["era", "performance_candidate_score"], ascending=[True, False])
        .groupby("era").head(rules["pool_b"]["era_representatives_per_decade"])["player_id"]
    )
    best_n = None
    best_distance = 10**9
    best_mask = None
    for top_n in range(rules["pool_b"]["min_top_n"], rules["pool_b"]["max_top_n"] + 1, rules["pool_b"]["adjust_step"]):
        selected = set(eligible.head(top_n)["player_id"]) | forced_b
        mask_b = base["player_id"].isin(selected)
        union_count = int((base["pool_A"] | base["pool_C"] | mask_b).sum())
        distance = abs(union_count - rules["master_target"])
        if distance < best_distance:
            best_distance, best_n, best_mask = distance, top_n, mask_b
    base["pool_B"] = best_mask
    base["master_pool"] = base[["pool_A", "pool_B", "pool_C"]].any(axis=1)
    master_count = int(base["master_pool"].sum())
    if not rules["master_min"] <= master_count <= rules["master_max"]:
        raise ValueError(f"Master pool size {master_count} is outside configured range")

    def reason_a(row: pd.Series) -> str:
        parts = [
            nonzero_reason("MVP", row.mvp), nonzero_reason("Finals MVP", row.finals_mvp), nonzero_reason("DPOY", row.dpoy),
            nonzero_reason("All-NBA First", row.all_nba_first), nonzero_reason("All-NBA", row.all_nba_total),
            nonzero_reason("All-Star", row.all_star), nonzero_reason("statistical leader titles", row.leader_titles),
            "NBA 75" if row.NBA_75 else None, "NBA 50" if row.NBA_50 else None,
        ]
        return "; ".join(item for item in parts if item) if row.pool_A else "NA"

    def reason_b(row: pd.Series) -> str:
        if not row.pool_B:
            return "NA"
        return (
            f"performance candidate percentile {row.performance_candidate_score:.3f}; "
            f"peak1 {row.peak_1:.2f}; peak3 {row.peak_3:.2f}; peak5 {row.peak_5:.2f}; "
            f"career games {int(row.career_games)}; cumulative performance {row.cumulative_performance:.2f}"
        )

    def reason_c(row: pd.Series) -> str:
        if not row.pool_C:
            return "NA"
        parts = [
            f"appears in {int(row.external_ranked_sources)} ordered external rankings" if row.external_ranked_sources else None,
            "NBA 75 official recognition" if row.NBA_75 else None,
            "NBA 50 official recognition" if row.NBA_50 else None,
            "Hall of Fame with multi-year All-Star recognition" if bool(row.hof) and row.all_star >= 3 else None,
            "configured high-elasticity/discussion case" if row.name_key in discussion_keys else None,
            f"era representative ({row.era})" if row.player_id in set(era_c) else None,
        ]
        return "; ".join(item for item in parts if item)

    base["qualification_A"] = base.apply(reason_a, axis=1)
    base["qualification_B"] = base.apply(reason_b, axis=1)
    base["qualification_C"] = base.apply(reason_c, axis=1)
    base["primary_entry_reason"] = np.select(
        [base["pool_A"], base["pool_B"], base["pool_C"]],
        ["honors and league recognition", "statistical production and peak", "historical recognition / era representation"],
        default="NA",
    )
    base["secondary_entry_reason"] = base.apply(
        lambda row: "; ".join(
            label for label, flag in [("Pool A", row.pool_A), ("Pool B", row.pool_B), ("Pool C", row.pool_C)] if flag
        ),
        axis=1,
    )
    base["membership_pattern"] = base.apply(
        lambda row: "+".join(letter for letter in ["A" if row.pool_A else "", "B" if row.pool_B else "", "C" if row.pool_C else ""] if letter) or "None",
        axis=1,
    )

    columns = [
        "player_name", "player_id", "birth_year", "career_start", "career_end", "active_status", "pool_A", "pool_B", "pool_C",
        "qualification_A", "qualification_B", "qualification_C", "primary_entry_reason", "secondary_entry_reason", "era", "position",
        "membership_pattern", "honor_candidate_score", "performance_candidate_score", "career_games", "peak_1", "peak_3", "peak_5",
        "mvp", "finals_mvp", "dpoy", "all_nba_first", "all_nba_total", "all_star", "championships", "NBA_75", "NBA_50", "hof",
    ]
    base = base.rename(columns={"player": "player_name", "pos": "position"})
    master = base[base["master_pool"]][columns].sort_values(["honor_candidate_score", "performance_candidate_score"], ascending=False)
    out = OUTPUT / "candidate_pool"
    write_csv(master, out / "master_pool.csv")
    write_csv(master[master["pool_A"]], out / "pool_a.csv")
    write_csv(master[master["pool_B"]], out / "pool_b.csv")
    write_csv(master[master["pool_C"]], out / "pool_c.csv")
    comparison = master.groupby("membership_pattern", as_index=False).agg(player_count=("player_id", "count"))
    write_csv(comparison, out / "pool_comparison.csv")
    rules_rows = []
    for pool, values in [("General", rules), ("Pool_A", rules["pool_a"]), ("Pool_B", rules["pool_b"]), ("Pool_C", rules["pool_c"])]:
        for key, value in values.items():
            if isinstance(value, (dict, list)):
                value = str(value)
            rules_rows.append({"pool": pool, "rule": key, "value": value})
    rules_rows.append({"pool": "Pool_B", "rule": "calibrated_top_n", "value": best_n})
    rules_rows.append({"pool": "Master", "rule": "actual_union_count", "value": master_count})
    write_csv(pd.DataFrame(rules_rows), out / "candidate_rules.csv")
    write_csv(base, OUTPUT / "diagnostics" / "candidate_universe_scores.csv")
    write_csv(season, OUTPUT / "indicators" / "all_player_season_metrics.csv")
    write_csv(finals, OUTPUT / "diagnostics" / "official_finals_by_season.csv")
    logger.info("Pool sizes: A=%s B=%s C=%s union=%s (B top_n=%s)", master.pool_A.sum(), master.pool_B.sum(), master.pool_C.sum(), master_count, best_n)


if __name__ == "__main__":
    main()
