from __future__ import annotations

import json

import numpy as np
import pandas as pd

from common import OUTPUT, PROCESSED, canonical_name, ensure_dirs, load_config, percentile, rank_desc, setup_logging, weighted_available_average, write_csv


COMPONENTS = ["regular_season", "peak", "longevity", "playoffs", "awards", "defense", "team_success"]
FEATURES = [f"{name}_score" for name in COMPONENTS]


def score_with_weights(frame: pd.DataFrame, weights: dict[str, float]) -> pd.Series:
    return weighted_available_average(frame, {f"{name}_score": value for name, value in weights.items()})


def normalized_mutation(default: dict[str, float], target: str, multiplier: float) -> dict[str, float]:
    changed = default.copy()
    changed[target] *= multiplier
    total = sum(changed.values())
    return {name: value / total for name, value in changed.items()}


def internal_composite(frame: pd.DataFrame, raw_weights: dict[str, float]) -> pd.Series:
    percentiles = pd.DataFrame(index=frame.index)
    for column in raw_weights:
        percentiles[column] = percentile(frame[column])
    return weighted_available_average(percentiles, raw_weights) * 100


def posterior_update(
    evidence: np.ndarray,
    prior_score: np.ndarray,
    prior_precision: np.ndarray,
    model_precision: float,
    minimum_prior_weight: float,
    maximum_prior_weight: float,
) -> tuple[np.ndarray, np.ndarray]:
    available = np.isfinite(prior_score) & np.isfinite(prior_precision) & (prior_precision > 0)
    raw_weight = np.divide(
        prior_precision,
        prior_precision + model_precision,
        out=np.zeros_like(prior_precision, dtype=float),
        where=available,
    )
    prior_weight = np.where(available, np.clip(raw_weight, minimum_prior_weight, maximum_prior_weight), 0.0)
    score = prior_weight * np.nan_to_num(prior_score, nan=0.0) + (1 - prior_weight) * evidence
    return score, prior_weight


def scenario_rows(
    frame: pd.DataFrame,
    label: str,
    multiplier: float,
    weights: dict[str, float],
    evidence: pd.Series,
    prior_score: np.ndarray,
    prior_precision: np.ndarray,
    model_precision: float,
    bayes: dict,
) -> pd.DataFrame:
    score, prior_weight = posterior_update(
        evidence.to_numpy(dtype=float),
        prior_score,
        prior_precision,
        model_precision,
        float(bayes["minimum_prior_weight"]),
        float(bayes["maximum_prior_weight"]),
    )
    rank = rank_desc(pd.Series(score, index=frame.index))
    out = frame[["player_id", "player_name"]].copy()
    out["scenario"] = label
    out["multiplier"] = multiplier
    out["model_evidence_score"] = evidence
    out["posterior_score"] = score
    out["posterior_rank"] = rank
    out["prior_weight"] = prior_weight
    out["top_10"] = rank <= 10
    out["top_25"] = rank <= 25
    out["top_50"] = rank <= 50
    for name in COMPONENTS:
        out[f"weight_{name}"] = weights[name]
    return out


def aggregate_prior(ordered: pd.DataFrame, source_weights: dict[str, float], base_sd: float, disagreement_multiplier: float) -> pd.DataFrame:
    rows = []
    for name_key, group in ordered[ordered["source"].isin(source_weights)].groupby("name_key"):
        values = group["rank_normalized_0_100"].to_numpy(dtype=float)
        weights = group["source"].map(source_weights).to_numpy(dtype=float)
        weighted_mean = float(np.average(values, weights=weights))
        variance = float(np.average((values - weighted_mean) ** 2, weights=weights)) if len(values) > 1 else 0.0
        prior_variance = base_sd**2 / weights.sum() + disagreement_multiplier * variance
        rows.append(
            {
                "name_key": name_key,
                "public_prior_score": weighted_mean,
                "public_prior_precision": 1 / prior_variance,
                "sources_count": group["source"].nunique(),
                "source_weight_sum": weights.sum(),
            }
        )
    return pd.DataFrame(rows)


def main() -> None:
    ensure_dirs()
    logger = setup_logging("07_sensitivity")
    config = load_config("model_config.yaml")
    prior_config = load_config("ranking_source_weights.yaml")
    bayes = prior_config["bayesian_update"]
    model_metadata = json.loads((PROCESSED / "goat_model_v0_2.json").read_text(encoding="utf-8"))
    model_sd = float(model_metadata["model_evidence_sd"])
    model_precision = 1 / model_sd**2

    features = pd.read_csv(PROCESSED / "model_features_full.csv")
    posterior = pd.read_csv(OUTPUT / "rankings" / "posterior_model.csv")
    posterior = posterior.set_index("player_id").loc[features["player_id"]].reset_index()
    prior_score = pd.to_numeric(posterior["public_prior_score"], errors="coerce").to_numpy()
    prior_precision = pd.to_numeric(posterior["public_prior_precision"], errors="coerce").to_numpy()
    default = {name: float(config["human_weights"][name]) for name in COMPONENTS}
    multipliers = [float(value) for value in config["sensitivity_multipliers"]]

    # User-value sensitivity is run only after the public prior and model evidence have been built.
    scenarios = []
    for target, label in [
        ("peak", "Peak weight"),
        ("longevity", "Longevity weight"),
        ("playoffs", "Playoff weight"),
        ("defense", "Defense weight"),
    ]:
        for multiplier in multipliers:
            weights = normalized_mutation(default, target, multiplier)
            evidence = score_with_weights(features, weights)
            scenarios.append(
                scenario_rows(
                    features, label, multiplier, weights, evidence, prior_score, prior_precision, model_precision, bayes
                )
            )

    base_awards_weights = {
        "mvp": 0.24, "mvp_shares": 0.16, "mvp_top3": 0.08, "finals_mvp": 0.16,
        "all_nba_first": 0.14, "all_nba_total": 0.10, "all_star": 0.05, "leader_titles": 0.07,
    }
    for multiplier in multipliers:
        raw = base_awards_weights.copy()
        for field in ["mvp", "mvp_shares", "mvp_top3"]:
            raw[field] *= multiplier
        variant = features.copy()
        variant["awards_score"] = internal_composite(variant, raw)
        evidence = score_with_weights(variant, default)
        scenarios.append(
            scenario_rows(
                variant, "MVP weight inside Awards", multiplier, default, evidence,
                prior_score, prior_precision, model_precision, bayes,
            )
        )

    base_team_weights = {"championships": 0.65, "finals_appearances": 0.35}
    for multiplier in multipliers:
        raw = base_team_weights.copy()
        raw["championships"] *= multiplier
        variant = features.copy()
        variant["team_success_score"] = internal_composite(variant, raw)
        evidence = score_with_weights(variant, default)
        scenarios.append(
            scenario_rows(
                variant, "Championship weight inside Team Success", multiplier, default, evidence,
                prior_score, prior_precision, model_precision, bayes,
            )
        )

    sensitivity = pd.concat(scenarios, ignore_index=True)
    write_csv(sensitivity, OUTPUT / "rankings" / "sensitivity.csv")
    snapshots = (
        sensitivity[sensitivity["posterior_rank"] <= 25]
        .sort_values(["scenario", "multiplier", "posterior_rank"])
        .groupby(["scenario", "multiplier"], as_index=False)
        .agg(
            top_10=("player_name", lambda names: ", ".join(names.iloc[:10])),
            top_25=("player_name", lambda names: ", ".join(names.iloc[:25])),
        )
    )
    write_csv(snapshots, OUTPUT / "diagnostics" / "sensitivity_top_snapshots.csv")

    # Prior-strength and source-weight scenarios use the fitted model evidence and reproduce the final model at multiplier 1.
    base_evidence = pd.to_numeric(posterior["model_evidence_score"], errors="coerce").to_numpy()
    prior_rows = []
    for multiplier in [float(value) for value in config["prior_strength_multipliers"]]:
        score, weight = posterior_update(
            base_evidence, prior_score, np.nan_to_num(prior_precision, nan=0.0) * multiplier,
            model_precision, float(bayes["minimum_prior_weight"]), float(bayes["maximum_prior_weight"]),
        )
        rank = rank_desc(pd.Series(score)).to_numpy()
        for index, player in posterior.iterrows():
            prior_rows.append(
                {
                    "player_id": player["player_id"], "player_name": player["player_name"],
                    "scenario": "Prior precision multiplier", "source_changed": "ALL",
                    "multiplier": multiplier, "posterior_score": score[index], "posterior_rank": rank[index],
                    "prior_weight": weight[index], "sources_count": player.get("sources_count", np.nan),
                }
            )

    raw_rankings = pd.read_csv(OUTPUT.parent / "data" / "external_rankings" / "external_rankings_raw.csv")
    ordered = raw_rankings[raw_rankings["ranking_available"].astype(str).str.lower().eq("true")].copy()
    configured_weights = {
        source: float(values["reliability_weight"])
        for source, values in prior_config["sources"].items()
    }
    base_sd = float(bayes["single_source_score_sd"])
    disagreement = float(bayes["between_source_disagreement_multiplier"])
    source_scenarios: list[tuple[str, str, float, dict[str, float]]] = [
        ("Configured source weights", "NONE", 1.0, configured_weights),
        ("Equal source weights", "ALL", 1.0, {source: 1.0 for source in configured_weights}),
    ]
    for source in configured_weights:
        source_scenarios.append(
            ("Leave-one-source-out", source, 0.0, {key: value for key, value in configured_weights.items() if key != source})
        )
        for multiplier in [0.75, 1.25]:
            weights = configured_weights.copy()
            weights[source] *= multiplier
            source_scenarios.append(("Single-source reliability perturbation", source, multiplier, weights))

    identity = features[["player_id", "player_name"]].copy()
    identity["name_key"] = identity["player_name"].map(canonical_name)
    for label, changed_source, multiplier, weights in source_scenarios:
        aggregate = aggregate_prior(ordered, weights, base_sd, disagreement)
        aligned = identity.merge(aggregate, on="name_key", how="left")
        scenario_prior = aligned["public_prior_score"].to_numpy(dtype=float)
        scenario_precision = aligned["public_prior_precision"].to_numpy(dtype=float)
        score, prior_weight = posterior_update(
            base_evidence, scenario_prior, scenario_precision, model_precision,
            float(bayes["minimum_prior_weight"]), float(bayes["maximum_prior_weight"]),
        )
        rank = rank_desc(pd.Series(score)).to_numpy()
        for index, player in aligned.iterrows():
            prior_rows.append(
                {
                    "player_id": player["player_id"], "player_name": player["player_name"],
                    "scenario": label, "source_changed": changed_source, "multiplier": multiplier,
                    "posterior_score": score[index], "posterior_rank": rank[index], "prior_weight": prior_weight[index],
                    "sources_count": player.get("sources_count", np.nan),
                }
            )
    prior_sensitivity = pd.DataFrame(prior_rows)
    write_csv(prior_sensitivity, OUTPUT / "rankings" / "prior_source_sensitivity.csv")

    # Random reasonable user-weight draws: the public prior remains in place for every draw.
    rng = np.random.default_rng(config["random_seed"])
    alpha = np.array([default[name] for name in COMPONENTS]) * float(config["elasticity_dirichlet_concentration"])
    draws = rng.dirichlet(alpha, size=int(config["elasticity_random_draws"]))
    matrix = features[FEATURES].to_numpy(dtype=float)
    observed = ~np.isnan(matrix)
    filled = np.nan_to_num(matrix, nan=0.0)
    evidence_scores = draws @ filled.T
    evidence_denominators = draws @ observed.astype(float).T
    evidence_scores = evidence_scores / np.where(evidence_denominators > 0, evidence_denominators, np.nan)
    available_prior = np.isfinite(prior_score) & np.isfinite(prior_precision)
    base_prior_weight = np.divide(
        prior_precision,
        prior_precision + model_precision,
        out=np.zeros_like(prior_precision, dtype=float),
        where=available_prior,
    )
    base_prior_weight = np.where(
        available_prior,
        np.clip(base_prior_weight, float(bayes["minimum_prior_weight"]), float(bayes["maximum_prior_weight"])),
        0.0,
    )
    posterior_scores = base_prior_weight[None, :] * np.nan_to_num(prior_score, nan=0.0)[None, :] + (1 - base_prior_weight[None, :]) * evidence_scores
    ranks = np.empty_like(posterior_scores, dtype=int)
    for row in range(posterior_scores.shape[0]):
        ranks[row] = pd.Series(posterior_scores[row]).rank(ascending=False, method="min").to_numpy(dtype=int)
    elasticity = features[["player_id", "player_name"]].copy()
    elasticity["default_rank"] = posterior["posterior_rank"].to_numpy(dtype=int)
    elasticity["mean_rank"] = ranks.mean(axis=0)
    elasticity["rank_std"] = ranks.std(axis=0)
    elasticity["best_reasonable_rank"] = ranks.min(axis=0)
    elasticity["worst_reasonable_rank"] = ranks.max(axis=0)
    elasticity["rank_range"] = elasticity["worst_reasonable_rank"] - elasticity["best_reasonable_rank"]
    elasticity["probability_rank_1"] = (ranks == 1).mean(axis=0)
    elasticity["probability_top_10"] = (ranks <= 10).mean(axis=0)
    elasticity["probability_top_25"] = (ranks <= 25).mean(axis=0)
    elasticity["ranking_stability_0_100"] = 100 * (1 - elasticity["rank_std"] / max(len(features) - 1, 1))
    elasticity = elasticity.sort_values("default_rank")
    write_csv(elasticity, OUTPUT / "rankings" / "ranking_elasticity.csv")

    # Search user-value weights after applying the public prior; this supports the later slider product.
    search_draws = int(config["make_goat_search_draws"])
    local_count = int(search_draws * 0.65)
    local = rng.dirichlet(np.array([default[name] for name in COMPONENTS]) * 55, size=local_count)
    global_draws = rng.dirichlet(np.full(len(COMPONENTS), 0.55), size=search_draws - local_count)
    default_vector = np.array([default[name] for name in COMPONENTS])
    candidate_weights = np.vstack([default_vector, np.eye(len(COMPONENTS)), local, global_draws])
    candidate_denominators = candidate_weights @ observed.astype(float).T
    candidate_evidence = (candidate_weights @ filled.T) / np.where(candidate_denominators > 0, candidate_denominators, np.nan)
    candidate_scores = base_prior_weight[None, :] * np.nan_to_num(prior_score, nan=0.0)[None, :] + (1 - base_prior_weight[None, :]) * candidate_evidence
    maximum_scores = np.nanmax(candidate_scores, axis=1)
    distance = np.linalg.norm(candidate_weights - default_vector, axis=1)
    order = np.argsort(-candidate_scores, axis=1)
    sampled_rank_matrix = np.empty_like(order)
    sampled_rank_matrix[np.arange(order.shape[0])[:, None], order] = np.arange(1, order.shape[1] + 1)
    target_indices = np.argsort(posterior["posterior_rank"].to_numpy())[: int(config["make_goat_top_n"])]
    goat_rows = []
    for player_index in target_indices:
        wins = candidate_scores[:, player_index] >= maximum_scores - 1e-10
        sampled_ranks = sampled_rank_matrix[:, player_index]
        if wins.any():
            best_index = np.where(wins)[0][np.argmin(distance[wins])]
            feasible = True
        else:
            best_rank = sampled_ranks.min()
            choices = np.where(sampled_ranks == best_rank)[0]
            best_index = choices[np.argmin(distance[choices])]
            feasible = False
        row = {
            "player_id": features.iloc[player_index]["player_id"],
            "player_name": features.iloc[player_index]["player_name"],
            "default_rank": int(posterior.iloc[player_index]["posterior_rank"]),
            "goat_found_in_search": feasible,
            "minimum_l2_weight_change": float(distance[best_index]) if feasible else np.nan,
            "best_rank_in_search": int(sampled_ranks[best_index]),
            "search_draws": len(candidate_weights),
            "prior_anchored": True,
        }
        for index, name in enumerate(COMPONENTS):
            row[f"weight_{name}"] = float(candidate_weights[best_index, index])
        goat_rows.append(row)
    write_csv(pd.DataFrame(goat_rows).sort_values("default_rank"), OUTPUT / "rankings" / "minimum_weight_change_to_goat.csv")

    # Monte Carlo uncertainty in relative source reliability (total prior strength held constant).
    source_names = list(configured_weights)
    base_vector = np.array([configured_weights[source] for source in source_names])
    winners = []
    jordan_ranks = []
    jordan_index = int(identity.index[identity["player_name"].eq("Michael Jordan")][0])
    for _ in range(int(config["source_weight_uncertainty_draws"])):
        draw = base_vector * rng.lognormal(mean=0.0, sigma=float(config["source_weight_log_sd"]), size=len(base_vector))
        draw *= base_vector.sum() / draw.sum()
        aggregate = aggregate_prior(ordered, dict(zip(source_names, draw)), base_sd, disagreement)
        aligned = identity.merge(aggregate, on="name_key", how="left")
        score, _ = posterior_update(
            base_evidence,
            aligned["public_prior_score"].to_numpy(dtype=float),
            aligned["public_prior_precision"].to_numpy(dtype=float),
            model_precision,
            float(bayes["minimum_prior_weight"]),
            float(bayes["maximum_prior_weight"]),
        )
        rank = rank_desc(pd.Series(score)).to_numpy()
        winners.append(identity.iloc[int(np.argmax(score))]["player_name"])
        jordan_ranks.append(int(rank[jordan_index]))
    winner_summary = pd.Series(winners).value_counts().rename_axis("player_name").reset_index(name="wins")
    winner_summary["probability_rank_1"] = winner_summary["wins"] / len(winners)
    winner_summary["draws"] = len(winners)
    winner_summary["michael_jordan_probability_rank_1"] = float(np.mean(np.array(jordan_ranks) == 1))
    winner_summary["michael_jordan_worst_rank"] = max(jordan_ranks)
    write_csv(winner_summary, OUTPUT / "diagnostics" / "source_weight_uncertainty_summary.csv")
    logger.info(
        "Generated %s posterior value-sensitivity rows, %s prior/source rows, %s elasticity draws; Jordan source-weight P(#1)=%.1f%%",
        len(sensitivity), len(prior_sensitivity), len(draws), 100 * np.mean(np.array(jordan_ranks) == 1),
    )


if __name__ == "__main__":
    main()
