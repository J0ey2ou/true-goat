from __future__ import annotations

import json

import numpy as np
import pandas as pd

from common import ACCESS_DATE, DOCS, OUTPUT, PROCESSED, ROOT, ensure_dirs, load_config, setup_logging, write_csv


def markdown_table(frame: pd.DataFrame, columns: list[str] | None = None, rows: int | None = None) -> str:
    view = frame.copy()
    if columns:
        view = view[columns]
    if rows:
        view = view.head(rows)
    view = view.replace({np.nan: "NA"})
    headers = [str(column) for column in view.columns]
    lines = ["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"]
    for record in view.itertuples(index=False, name=None):
        values = []
        for value in record:
            if isinstance(value, float):
                values.append(f"{value:.3f}")
            else:
                values.append(str(value).replace("|", "/"))
        lines.append("| " + " | ".join(values) + " |")
    return "\n".join(lines)


def ranking_section(title: str, frame: pd.DataFrame, rank_col: str, score_col: str, limit: int) -> str:
    view = frame.sort_values(rank_col).head(limit)[[rank_col, "player_name", score_col]].copy()
    view.columns = ["Rank", "Player", "Score"]
    return f"### {title} Top {limit}\n\n{markdown_table(view)}"


def clean_json(value):
    if isinstance(value, dict):
        return {str(key): clean_json(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [clean_json(item) for item in value]
    if isinstance(value, np.integer):
        return int(value)
    if isinstance(value, (np.floating, float)):
        return None if not np.isfinite(value) else float(value)
    if isinstance(value, (np.bool_, bool)):
        return bool(value)
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    return value


def main() -> None:
    ensure_dirs()
    logger = setup_logging("08_export")
    model_config = load_config("model_config.yaml")
    prior_config = load_config("ranking_source_weights.yaml")
    candidate_config = load_config("candidate_rules.yaml")
    model_metadata = json.loads((PROCESSED / "goat_model_v0_2.json").read_text(encoding="utf-8"))

    master = pd.read_csv(OUTPUT / "candidate_pool" / "master_pool.csv")
    pool_comparison = pd.read_csv(OUTPUT / "candidate_pool" / "pool_comparison.csv")
    dictionary = pd.read_csv(OUTPUT / "indicators" / "indicator_dictionary.csv")
    sources = pd.read_csv(OUTPUT / "diagnostics" / "data_sources.csv", low_memory=False)
    reconciliation = pd.read_csv(OUTPUT / "diagnostics" / "source_reconciliation.csv")
    features = pd.read_csv(PROCESSED / "model_features.csv")
    human = pd.read_csv(OUTPUT / "rankings" / "human_model.csv")
    expert = pd.read_csv(OUTPUT / "rankings" / "expert_fitted_model.csv")
    posterior = pd.read_csv(OUTPUT / "rankings" / "posterior_model.csv")
    pure = pd.read_csv(OUTPUT / "rankings" / "pure_data_model.csv")
    consensus = pd.read_csv(OUTPUT / "rankings" / "consensus_expert.csv")
    rankings = pd.read_csv(OUTPUT / "rankings" / "ranking_comparison.csv")
    performance = pd.read_csv(OUTPUT / "diagnostics" / "model_performance.csv")
    coefficients = pd.read_csv(OUTPUT / "diagnostics" / "expert_model_coefficients.csv")
    elasticity = pd.read_csv(OUTPUT / "rankings" / "ranking_elasticity.csv")
    make_goat = pd.read_csv(OUTPUT / "rankings" / "minimum_weight_change_to_goat.csv")
    prior_sensitivity = pd.read_csv(OUTPUT / "rankings" / "prior_source_sensitivity.csv")
    source_uncertainty = pd.read_csv(OUTPUT / "diagnostics" / "source_weight_uncertainty_summary.csv")
    high_overlap = pd.read_csv(OUTPUT / "diagnostics" / "high_overlap_pairs.csv")
    pure_weights = pd.read_csv(OUTPUT / "diagnostics" / "pure_data_weights.csv")
    source_weights = pd.read_csv(OUTPUT / "diagnostics" / "ranking_source_weights.csv")

    candidate_methodology = f"""# Candidate Pool Methodology

## Result

GOAT Model v0.2 retains **{len(master)} players**, within the configured {candidate_config['master_min']}–{candidate_config['master_max']} range. Candidate qualification remains separate from every later score.

- Pool A — honors and official recognition: {int(master['pool_A'].sum())} players.
- Pool B — statistical performance, peak and sustained production: {int(master['pool_B'].sum())} players.
- Pool C — official/media recognition, era representation and discussion value: {int(master['pool_C'].sum())} players.

## Pool comparison

{markdown_table(pool_comparison.rename(columns={'membership_pattern': 'Membership', 'player_count': 'Players'}))}

Pool B's cut line is deterministically calibrated only to keep the three-pool union near 300. Each candidate retains independent qualification narratives; no player was inserted or removed to make a later ranking look conventional.
"""
    (DOCS / "candidate_pool_methodology.md").write_text(candidate_methodology, encoding="utf-8")

    dimension_counts = dictionary.groupby("dimension").size().reset_index(name="indicator_count")
    indicator_doc = f"""# Indicator Dictionary

The v0.2 dictionary contains **{len(dictionary)} indicators** across {dictionary['dimension'].nunique()} dimensions.

{markdown_table(dimension_counts)}

## Core rules

- Raw facts and derived variables are stored separately.
- Cross-era rate comparisons use within-season z-scores clipped to [-3, 3].
- Peak 1/3/5/7 uses a multi-stat performance composite, not PPG alone.
- Missing inputs are reweighted out of composites and never converted to zero.
- The final models use seven dimension scores to limit double counting.
- Full-history playoff game boxes now cover 1947–2024; early-era steals/blocks still remain structurally unobserved.

See `indicator_overlap_report.md` for empirical and conceptual overlap diagnostics.
"""
    (DOCS / "indicator_dictionary.md").write_text(indicator_doc, encoding="utf-8")

    quality_counts = sources.groupby(["data_quality", "official_status"]).size().reset_index(name="records")
    reconciliation_summary = reconciliation.groupby(["data_domain", "secondary_source_id"], as_index=False).agg(
        checks=("player_id", "size"), fields_compared=("fields_compared", "sum"), fields_matched=("fields_matched", "sum")
    )
    reconciliation_summary["field_match_pct"] = reconciliation_summary["fields_matched"] / reconciliation_summary["fields_compared"]
    source_doc = f"""# Data Source Documentation

Access date: {ACCESS_DATE}.

## Factual sources

1. [Sumitro Datta NBA Stats](https://www.kaggle.com/datasets/sumitrodatta/nba-aba-baa-stats) — CC0, primary regular-season/award/biographical data through 2025-26.
2. [Gonzalo Gigena NBA All Time Stats](https://www.kaggle.com/datasets/gonzalogigena/nba-all-time-stats) — MIT, game results and player boxes used to rebuild complete BAA/NBA playoffs from 1947-2024.
3. [FiveThirtyEight historical metrics](https://github.com/fivethirtyeight/nba-player-advanced-metrics) — retained historical advanced/secondary playoff checks.
4. [Brescou NBA Statistics Repository](https://github.com/Brescou/NBA-dataset-stats-player-team) — MIT, modern regular-season and playoff cross-checks from 1996-97 through 2022-23.
5. [NBA official history](https://www.nba.com/history) — champions, MVP, DPOY, Finals MVP, All-NBA, All-Defense, NBA 50 and NBA 75.

## Cross-source reconciliation

{markdown_table(reconciliation_summary)}

Material differences are retained and documented. The incomplete Brescou 2022-23 playoff snapshot and the in-season Gonzalo 2023-24 regular table are not averaged into the newer or complete primary facts.

## Quality distribution

{markdown_table(quality_counts)}

No large-scale live Basketball-Reference scrape was performed. Every frozen raw file has a SHA-256 hash. Values still unobserved remain `NA`.
"""
    (DOCS / "data_source_documentation.md").write_text(source_doc, encoding="utf-8")

    human_weight_table = pd.DataFrame([{"component": key, "weight": value} for key, value in model_config["human_weights"].items()])
    coefficient_view = coefficients[[
        "feature", "coefficient_standardized", "coefficient_raw_score_scale", "bootstrap_std", "selection_stability"
    ]]
    source_weight_view = source_weights[["source", "reliability_weight", "included_in_public_prior", "rationale"]]
    model_methodology = f"""# Ranking Model Methodology — GOAT Model v0.2

## 1. Public-ranking prior

Each ordered list is first normalized as `100 × (list size − rank) / (list size − 1)`. List absence is unobserved, not zero. The strict prior score is the reliability-weighted mean; a weighted median and robust blend remain diagnostics.

{markdown_table(source_weight_view)}

NBA 50 and NBA 75 are official but unranked, so they are never converted into invented numeric ranks.

Prior uncertainty is `14² / sum(source weights) + weighted between-source variance`. This makes four agreeing lists more precise than one list and weakens the prior when sources disagree.

## 2. Expert-fitted evidence model

The seven 0–100 component scores predict the weighted public prior for players appearing in at least two ordered lists. Ridge alpha is selected using {model_config['cross_validation_repeats']} repeats of {model_config['cross_validation_folds']}-fold cross-validation. Component coefficients are constrained non-negative, so a better Peak or Playoff score can no longer lower the fitted score merely because of collinearity.

{markdown_table(coefficient_view)}

Training players use repeated out-of-fold predictions as their model evidence. This prevents their own target from being reused as an in-sample prediction in the posterior.

## 3. Prior + model posterior

`posterior = prior_weight × public_prior + (1 − prior_weight) × model_evidence`

`prior_weight = prior_precision / (prior_precision + model_precision)` capped at {prior_config['bayesian_update']['maximum_prior_weight']:.0%}. Model precision is the inverse square of the repeated-OOF RMSE ({model_metadata['oof_rmse']:.3f}). Players with no public-list prior use model evidence only; list absence is never a penalty.

## 4. Other views

Human Weighted remains the configurable product-slider view:

{markdown_table(human_weight_table)}

Pure Data uses inverse mean absolute component-correlation weights and no expert target:

{markdown_table(pure_weights)}

## 5. Evaluation

{markdown_table(performance)}

The posterior describes a transparent compromise between public historical judgment and structured data. It is not a mathematical proof of the GOAT.
"""
    (DOCS / "ranking_model_methodology.md").write_text(model_methodology, encoding="utf-8")

    goat_names = ["Michael Jordan", "LeBron James", "Kareem Abdul-Jabbar"]
    legacy_human = pd.DataFrame(
        [
            {"player_name": "LeBron James", "v0_1_human_rank": 1, "v0_1_human_score": 95.576},
            {"player_name": "Kareem Abdul-Jabbar", "v0_1_human_rank": 2, "v0_1_human_score": 94.230},
            {"player_name": "Michael Jordan", "v0_1_human_rank": 3, "v0_1_human_score": 91.241},
        ]
    )
    goat_three = posterior[posterior["player_name"].isin(goat_names)][[
        "player_name", "posterior_rank", "posterior_score", "public_prior_rank", "public_prior_score",
        "model_evidence_score", "prior_weight", "regular_season_score", "peak_score", "longevity_score",
        "playoffs_score", "awards_score", "defense_score", "team_success_score",
    ]].merge(human[["player_name", "human_rank", "human_score"]], on="player_name").merge(legacy_human, on="player_name")
    playoff_career = pd.read_csv(PROCESSED / "playoffs_career.csv")
    goat_three = goat_three.merge(
        playoff_career[playoff_career["player_name"].isin(goat_names)][
            ["player_name", "playoff_games", "playoff_wins_known", "playoff_ppg", "playoff_ts_pct"]
        ],
        on="player_name",
    )
    goat_three["human_score_change_vs_v0_1"] = goat_three["human_score"] - goat_three["v0_1_human_score"]
    goat_three = goat_three.sort_values("posterior_rank")
    write_csv(goat_three, OUTPUT / "diagnostics" / "goat_three_diagnostics.csv")

    source_scenario_winners = (
        prior_sensitivity.sort_values("posterior_rank")
        .groupby(["scenario", "source_changed", "multiplier"], as_index=False)
        .first()[["scenario", "source_changed", "multiplier", "player_name", "posterior_score"]]
    )
    notable_names = [
        "Michael Jordan", "LeBron James", "Kareem Abdul-Jabbar", "Bill Russell", "Wilt Chamberlain", "Magic Johnson",
        "Larry Bird", "Tim Duncan", "Kobe Bryant", "Shaquille O'Neal", "Stephen Curry", "Kevin Durant",
        "Nikola Jokić", "Giannis Antetokounmpo",
    ]
    notable = rankings[rankings["player_name"].isin(notable_names)][[
        "player_name", "posterior_rank", "public_prior_rank", "model_rank", "human_rank", "pure_data_rank",
        "posterior_score", "public_prior_score", "model_score",
    ]].sort_values("posterior_rank")
    matched = rankings.dropna(subset=["public_prior_rank"]).copy()
    matched["posterior_minus_prior_rank"] = matched["posterior_rank"] - matched["public_prior_rank"]
    data_higher = matched.nsmallest(10, "posterior_minus_prior_rank")[[
        "player_name", "posterior_rank", "public_prior_rank", "posterior_minus_prior_rank"
    ]]
    data_lower = matched.nlargest(10, "posterior_minus_prior_rank")[[
        "player_name", "posterior_rank", "public_prior_rank", "posterior_minus_prior_rank"
    ]]
    jordan_source_probability = float(source_uncertainty["michael_jordan_probability_rank_1"].iloc[0])

    report_parts = [
        "# First Results Report — GOAT Model v0.2",
        f"Data freeze: {ACCESS_DATE}. No player was forced into any rank. The final order is produced only after multi-source fact reconciliation, a source-weighted public prior, repeated out-of-fold model fitting and posterior fusion.",
        "## 1. Candidate Pool",
        f"The union contains {len(master)} players: Pool A {int(master.pool_A.sum())}, Pool B {int(master.pool_B.sum())}, Pool C {int(master.pool_C.sum())}.",
        "## 2. Data correction that changed the GOAT diagnosis",
        "v0.1 combined partial historical playoff sources as if they were comparable career totals: Jordan had only 30 known playoff wins, Kareem was NA, and LeBron had 182. v0.2 rebuilds every retained playoff season from game boxes. The corrected career totals are Jordan 179 games/119 wins, Kareem 237/154 and LeBron 287/183. This reduces—but does not erase—the data-only longevity advantage.",
        markdown_table(goat_three),
        "The transparent Human model still ranks LeBron first and Kareem second because longevity and cumulative regular/playoff volume remain deliberately important. Jordan's Human deficit versus LeBron falls from 4.335 points in v0.1 to 2.110 in v0.2 after the playoff repair.",
        "## 3. Public prior",
        "All four retained ordered lists independently rank Michael Jordan #1. The reliability-weighted prior is Jordan 100.000, LeBron 98.561 and Kareem 96.144. The official NBA 50/75 lists are not given fake ranks.",
        "## 4. Fitted model and posterior",
        f"The constrained model's repeated-OOF RMSE is {model_metadata['oof_rmse']:.3f}. Its evidence alone favors LeBron (93.084), Kareem (92.876), then Jordan (90.487). The base posterior gives the four-source prior about 75% weight for Jordan/LeBron and produces Jordan 97.650, LeBron 97.205, Kareem 95.273.",
        "## 5. Sensitivity is run after the posterior",
        markdown_table(source_scenario_winners),
        f"Jordan stays #1 when any one ordered source is removed, when all sources are equally weighted, and in {int(source_uncertainty['draws'].iloc[0])} random reasonable source-reliability draws (estimated P[#1] = {jordan_source_probability:.1%}). If the total prior precision is cut to 50% of the configured value, LeBron becomes #1; at the configured precision Jordan is #1. The conclusion is therefore robust to *relative source weighting* but not to declaring public consensus only half as informative as configured.",
        "Across the configured Peak/Longevity/Playoff/Defense/MVP/Championship sensitivity grid, the public-prior-anchored user-value model keeps Jordan #1. In the wider Make Him GOAT search, LeBron can reach #1 with an L2 weight change of about 0.200 from the default user weights; Kareem was not found at #1 in the finite anchored search.",
        "## 6. Final posterior ranking",
        ranking_section("Prior + Model Posterior", posterior, "posterior_rank", "posterior_score", 10),
        ranking_section("Prior + Model Posterior", posterior, "posterior_rank", "posterior_score", 25),
        ranking_section("Prior + Model Posterior", posterior, "posterior_rank", "posterior_score", 50),
        ranking_section("Prior + Model Posterior", posterior, "posterior_rank", "posterior_score", 100),
        "## 7. Alternative views",
        ranking_section("Human Weighted", human, "human_rank", "human_score", 25),
        ranking_section("Expert-Fitted Evidence", expert, "model_rank", "model_score", 25),
        ranking_section("Pure Data", pure, "pure_data_rank", "pure_data_score", 25),
        "## 8. Interesting cases",
        markdown_table(notable),
        "### Posterior materially higher than public prior",
        markdown_table(data_higher),
        "### Posterior materially lower than public prior",
        markdown_table(data_lower),
        "## 9. Diagnostics and limitations",
        f"The overlap screen flags {len(high_overlap)} highly correlated raw-input pairs. The non-negative fit eliminates the v0.1 artifact where higher Peak and Playoff component scores received negative coefficients. Peak's fitted incremental coefficient is near zero after the other six correlated components enter; that is a collinearity/conditional-effect result, not a claim that peak does not matter.",
        "Player-level playoff boxes stop at 2023-24 in the retained full-history source, while regular-season and official award/team facts extend later. Early-era steals/blocks and some advanced metrics remain structurally missing. Posterior scores describe one explicit compromise between public judgment and data; users can still select the Human or Pure Data view.",
    ]
    (DOCS / "first_results_report.md").write_text("\n\n".join(report_parts) + "\n", encoding="utf-8")

    component_payload = features.set_index("player_id").to_dict(orient="index")
    ranking_payload = rankings.set_index("player_id").to_dict(orient="index")
    posterior_payload = posterior.set_index("player_id").to_dict(orient="index")
    elasticity_payload = elasticity.set_index("player_id").to_dict(orient="index")
    goat_payload = make_goat.set_index("player_id").to_dict(orient="index")
    api_players = []
    for row in master.itertuples():
        player_id = row.player_id
        api_players.append(
            {
                "player_id": player_id,
                "player_name": row.player_name,
                "era": row.era,
                "position": row.position,
                "candidate_pools": {"A": bool(row.pool_A), "B": bool(row.pool_B), "C": bool(row.pool_C)},
                "components": {key: value for key, value in component_payload.get(player_id, {}).items() if key.endswith("_score")},
                "rankings": ranking_payload.get(player_id, {}),
                "posterior": {
                    key: value for key, value in posterior_payload.get(player_id, {}).items()
                    if key.startswith("posterior_") or key in ["public_prior_score", "public_prior_rank", "model_evidence_score", "prior_weight"]
                },
                "elasticity": elasticity_payload.get(player_id, {}),
                "make_goat": goat_payload.get(player_id, {}),
            }
        )
    web_payload = {
        "model_version": "0.2",
        "data_access_date": ACCESS_DATE,
        "default_user_weights": model_config["human_weights"],
        "public_prior_source_weights": {
            source: values["reliability_weight"] for source, values in prior_config["sources"].items()
        },
        "posterior_method": model_metadata["posterior_formula"],
        "missing_policy": model_config["missing_component_policy"],
        "players": api_players,
    }
    (PROCESSED / "goat_model_v0_2_web.json").write_text(
        json.dumps(clean_json(web_payload), ensure_ascii=False, indent=2, allow_nan=False), encoding="utf-8"
    )

    contribution_error = float(posterior["posterior_contribution_check"].abs().max())
    validation = pd.DataFrame(
        [
            {"check": "master_pool_size", "value": len(master), "status": "PASS" if 280 <= len(master) <= 330 else "FAIL"},
            {"check": "unique_player_ids", "value": master.player_id.nunique(), "status": "PASS" if master.player_id.nunique() == len(master) else "FAIL"},
            {"check": "indicator_count", "value": len(dictionary), "status": "PASS" if len(dictionary) >= 50 else "FAIL"},
            {"check": "ranking_rows_each", "value": min(len(human), len(expert), len(pure), len(posterior)), "status": "PASS" if min(len(human), len(expert), len(pure), len(posterior)) == len(master) else "FAIL"},
            {"check": "source_reconciliation_fields", "value": int(reconciliation.fields_compared.sum()), "status": "PASS" if reconciliation.fields_compared.sum() > 1000 else "FAIL"},
            {"check": "posterior_contribution_max_error", "value": contribution_error, "status": "PASS" if contribution_error < 1e-8 else "FAIL"},
            {"check": "posterior_rank_1_informational", "value": posterior.sort_values("posterior_rank").iloc[0].player_name, "status": "INFO"},
        ]
    )
    write_csv(validation, OUTPUT / "diagnostics" / "validation_summary.csv")

    readme = f"""# True GOAT / 真正的山羊 — Phase 1, GOAT Model v0.2

> Facts are data. Greatness is a weighting problem.

This repository contains a 300-player NBA historical pool, multi-source fact reconciliation, a source-weighted public-ranking prior, three alternative score views, an empirical-Bayes-style posterior, post-posterior sensitivity analysis and a Web-ready JSON payload.

## Reproduce

```powershell
python scripts/00_download_sources.py
python scripts/05_collect_external_rankings.py
python scripts/01_build_candidate_pool.py
python scripts/02_collect_player_data.py
python scripts/03_validate_sources.py
python scripts/04_build_indicators.py
python scripts/06_fit_ranking_models.py
python scripts/07_sensitivity_analysis.py
python scripts/08_export_results.py
node scripts/09_build_workbooks.mjs
python scripts/12_final_audit.py
```

Raw downloads are immutable caches with atomic `.part` writes. New full-history boxes are frozen under `data/raw/kaggle_nba_all_time/`; cross-source differences are kept in diagnostics.

## Main outputs

- `outputs/01a00459-396c-7300-99ff-9d81d32d3b8e/` — final Excel workbooks.
- `docs/` — candidate, indicator, source, completeness, overlap, model and results reports.
- `data/processed/goat_model_v0_2_web.json` — Web-product payload.
- `output/diagnostics/` — source reconciliation, hashes, CV, bootstrap, source sensitivity and validation.

## Result and caveat

The configured posterior ranks Michael Jordan #1, LeBron James #2 and Kareem Abdul-Jabbar #3. The transparent Human and Pure Data views remain separate. This is a reproducible value model, not proof that one GOAT definition is uniquely correct.
"""
    (ROOT / "README.md").write_text(readme, encoding="utf-8")
    logger.info("Generated v0.2 documentation, Web payload and %s validation checks", len(validation))


if __name__ == "__main__":
    main()
