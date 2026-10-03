from __future__ import annotations

import json

import numpy as np
import pandas as pd
from scipy.optimize import lsq_linear

from common import (
    OUTPUT,
    PROCESSED,
    canonical_name,
    ensure_dirs,
    load_config,
    rank_desc,
    setup_logging,
    weighted_available_average,
    write_csv,
)


COMPONENTS = ["regular_season", "peak", "longevity", "playoffs", "awards", "defense", "team_success"]
FEATURES = [f"{name}_score" for name in COMPONENTS]


def weighted_model(frame: pd.DataFrame, weights: dict[str, float], prefix: str) -> pd.DataFrame:
    result = frame[["player_id", "player_name"] + FEATURES].copy()
    weight_map = {f"{name}_score": float(weights[name]) for name in COMPONENTS}
    result[f"{prefix}_score"] = weighted_available_average(result, weight_map)
    denominator = result[FEATURES].notna().mul(pd.Series(weight_map)).sum(axis=1)
    for name in COMPONENTS:
        field = f"{name}_score"
        result[f"{prefix}_{name}_contribution"] = result[field] * weights[name] / denominator.replace(0, np.nan)
    result[f"{prefix}_rank"] = rank_desc(result[f"{prefix}_score"])
    return result.sort_values([f"{prefix}_rank", "player_name"])


def fit_nonnegative_ridge(x: np.ndarray, y: np.ndarray, alpha: float) -> tuple[float, np.ndarray]:
    """Ridge regression with monotone (non-negative) component effects."""
    x_mean = x.mean(axis=0)
    y_mean = float(y.mean())
    centered_x = x - x_mean
    centered_y = y - y_mean
    augmented_x = np.vstack([centered_x, np.sqrt(alpha) * np.eye(x.shape[1])])
    augmented_y = np.r_[centered_y, np.zeros(x.shape[1])]
    coefficient = lsq_linear(augmented_x, augmented_y, bounds=(0, np.inf), method="trf").x
    intercept = y_mean - float(x_mean @ coefficient)
    return intercept, coefficient


def pearson(x: np.ndarray, y: np.ndarray) -> float:
    if len(x) < 2 or np.std(x) == 0 or np.std(y) == 0:
        return np.nan
    return float(np.corrcoef(x, y)[0, 1])


def spearman(x: np.ndarray, y: np.ndarray) -> float:
    return pearson(pd.Series(x).rank().to_numpy(), pd.Series(y).rank().to_numpy())


def kendall_tau(x: np.ndarray, y: np.ndarray) -> float:
    concordant = discordant = 0
    for left in range(len(x)):
        for right in range(left + 1, len(x)):
            product = (x[left] - x[right]) * (y[left] - y[right])
            if product > 0:
                concordant += 1
            elif product < 0:
                discordant += 1
    total = concordant + discordant
    return (concordant - discordant) / total if total else np.nan


def top_overlap(y_true: np.ndarray, y_pred: np.ndarray, top_n: int) -> float:
    n = min(top_n, len(y_true))
    return len(set(np.argsort(-y_true)[:n]) & set(np.argsort(-y_pred)[:n])) / n


def rank_rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    true_rank = pd.Series(y_true).rank(ascending=False, method="average").to_numpy()
    predicted_rank = pd.Series(y_pred).rank(ascending=False, method="average").to_numpy()
    return float(np.sqrt(np.mean((true_rank - predicted_rank) ** 2)))


def evaluate(model: str, y_true: np.ndarray, y_pred: np.ndarray, evaluation: str) -> dict:
    return {
        "model": model,
        "evaluation": evaluation,
        "n": len(y_true),
        "score_rmse": float(np.sqrt(np.mean((y_true - y_pred) ** 2))),
        "spearman": spearman(y_true, y_pred),
        "kendall_tau": kendall_tau(y_true, y_pred),
        "rank_rmse": rank_rmse(y_true, y_pred),
        "top_10_overlap": top_overlap(y_true, y_pred, 10),
        "top_25_overlap": top_overlap(y_true, y_pred, 25),
        "top_50_overlap": top_overlap(y_true, y_pred, 50),
    }


def prepare_design(training: pd.DataFrame) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    raw = training[FEATURES].to_numpy(dtype=float)
    medians = np.nanmedian(raw, axis=0)
    imputed = np.where(np.isnan(raw), medians, raw)
    means = imputed.mean(axis=0)
    standard_deviations = imputed.std(axis=0)
    standard_deviations[standard_deviations == 0] = 1
    return (imputed - means) / standard_deviations, medians, means, standard_deviations


def transform_design(frame: pd.DataFrame, medians: np.ndarray, means: np.ndarray, stds: np.ndarray) -> np.ndarray:
    raw = frame[FEATURES].to_numpy(dtype=float)
    imputed = np.where(np.isnan(raw), medians, raw)
    return (imputed - means) / stds


def repeated_cv(
    x: np.ndarray,
    y: np.ndarray,
    alphas: list[float],
    folds: int,
    repeats: int,
    seed: int,
) -> list[dict]:
    rng = np.random.default_rng(seed)
    assignments = []
    for _ in range(repeats):
        permutation = rng.permutation(len(y))
        fold_id = np.empty(len(y), dtype=int)
        fold_id[permutation] = np.arange(len(y)) % folds
        assignments.append(fold_id)

    results = []
    for alpha in alphas:
        prediction_sum = np.zeros(len(y))
        prediction_count = np.zeros(len(y))
        squared_errors = []
        for fold_id in assignments:
            for fold in range(folds):
                valid = fold_id == fold
                intercept, coefficient = fit_nonnegative_ridge(x[~valid], y[~valid], alpha)
                prediction = intercept + x[valid] @ coefficient
                prediction_sum[valid] += prediction
                prediction_count[valid] += 1
                squared_errors.extend((prediction - y[valid]) ** 2)
        results.append(
            {
                "alpha": float(alpha),
                "cv_mse": float(np.mean(squared_errors)),
                "oof_predictions": prediction_sum / prediction_count,
                "folds": folds,
                "repeats": repeats,
            }
        )
    return results


def main() -> None:
    ensure_dirs()
    logger = setup_logging("06_models")
    config = load_config("model_config.yaml")
    prior_config = load_config("ranking_source_weights.yaml")
    rng = np.random.default_rng(config["random_seed"])

    features = pd.read_csv(PROCESSED / "model_features.csv")
    features["name_key"] = features["player_name"].map(canonical_name)
    consensus = pd.read_csv(OUTPUT / "rankings" / "consensus_expert.csv")
    consensus_columns = [
        "name_key", "public_prior_score", "public_prior_rank", "public_prior_sd", "public_prior_precision",
        "sources_count", "source_weight_sum", "normalized_score_std", "sources_used",
    ]
    training = features.merge(consensus[consensus_columns], on="name_key", how="inner")
    minimum_sources = int(prior_config["consensus"]["minimum_sources_for_model_training"])
    training = training[training["sources_count"] >= minimum_sources].copy().reset_index(drop=True)

    human = weighted_model(features, config["human_weights"], "human")
    correlation = features[FEATURES].corr(min_periods=50).abs()
    redundancy = (correlation.sum(axis=1) - 1) / (correlation.notna().sum(axis=1) - 1).replace(0, np.nan)
    pure_weight_vector = (1 / (1 + redundancy)).fillna(1)
    pure_weight_vector = pure_weight_vector / pure_weight_vector.sum()
    pure_weights = {name: float(pure_weight_vector[f"{name}_score"]) for name in COMPONENTS}
    pure = weighted_model(features, pure_weights, "pure_data")

    x, medians, means, stds = prepare_design(training)
    y = training["public_prior_score"].to_numpy(dtype=float)
    folds = int(config["cross_validation_folds"])
    repeats = int(config["cross_validation_repeats"])
    alpha_results = repeated_cv(
        x,
        y,
        [float(value) for value in config["ridge_alphas"]],
        folds,
        repeats,
        int(config["random_seed"]),
    )
    best = min(alpha_results, key=lambda item: item["cv_mse"])
    best_alpha = float(best["alpha"])
    cv_predictions = np.clip(best["oof_predictions"], 0, 100)
    intercept, coefficient = fit_nonnegative_ridge(x, y, best_alpha)

    all_x = transform_design(features, medians, means, stds)
    full_fit_raw = intercept + all_x @ coefficient
    full_fit_score = np.clip(full_fit_raw, 0, 100)
    expert = features[["player_id", "player_name"] + FEATURES + ["name_key"]].copy()
    expert["model_prediction_raw"] = full_fit_raw
    expert["model_score"] = full_fit_score
    expert["model_rank"] = rank_desc(expert["model_score"])
    for index, name in enumerate(COMPONENTS):
        expert[f"model_{name}_standardized_effect"] = all_x[:, index] * coefficient[index]
    expert = expert.merge(consensus[consensus_columns], on="name_key", how="left")
    expert["model_residual_vs_public_prior"] = expert["model_score"] - expert["public_prior_score"]
    expert = expert.sort_values(["model_rank", "player_name"])

    # Use out-of-fold evidence for every player whose public prior trained the model.
    oof_map = pd.Series(cv_predictions, index=training["player_id"]).to_dict()
    expert["model_evidence_score"] = expert["player_id"].map(oof_map).fillna(expert["model_score"])
    expert["model_evidence_type"] = np.where(
        expert["player_id"].isin(oof_map),
        f"{repeats}x{folds}-fold repeated out-of-fold",
        "full fitted model (player absent from training target)",
    )

    cv_rmse = float(np.sqrt(np.mean((cv_predictions - y) ** 2)))
    bayes = prior_config["bayesian_update"]
    model_sd = float(np.clip(cv_rmse, bayes["model_oof_rmse_floor"], bayes["model_oof_rmse_ceiling"]))
    model_precision = 1 / model_sd**2
    prior_precision = pd.to_numeric(expert["public_prior_precision"], errors="coerce")
    raw_prior_weight = prior_precision / (prior_precision + model_precision)
    expert["prior_weight"] = raw_prior_weight.clip(
        lower=float(bayes["minimum_prior_weight"]),
        upper=float(bayes["maximum_prior_weight"]),
    ).fillna(0)
    expert["model_evidence_weight"] = 1 - expert["prior_weight"]
    expert["posterior_prior_contribution"] = expert["prior_weight"] * expert["public_prior_score"].fillna(0)
    expert["posterior_model_contribution"] = expert["model_evidence_weight"] * expert["model_evidence_score"]
    expert["posterior_score"] = expert["posterior_prior_contribution"] + expert["posterior_model_contribution"]
    expert["posterior_rank"] = rank_desc(expert["posterior_score"])
    expert["posterior_sd"] = np.where(
        prior_precision.notna(),
        np.sqrt(1 / (prior_precision.fillna(0) + model_precision)),
        model_sd,
    )

    raw_coefficients = coefficient / stds
    raw_component_strength = np.nan_to_num(features[FEATURES].to_numpy(dtype=float), nan=medians) * raw_coefficients
    strength_denominator = raw_component_strength.sum(axis=1)
    strength_share = np.divide(
        raw_component_strength,
        strength_denominator[:, None],
        out=np.full_like(raw_component_strength, 1 / len(COMPONENTS)),
        where=strength_denominator[:, None] > 0,
    )
    strength_by_player = pd.DataFrame(strength_share, index=features["player_id"], columns=COMPONENTS)
    expert = expert.set_index("player_id", drop=False)
    for name in COMPONENTS:
        expert[f"posterior_{name}_contribution"] = (
            expert["posterior_model_contribution"] * strength_by_player[name].reindex(expert.index)
        )
    expert["posterior_contribution_check"] = (
        expert["posterior_prior_contribution"]
        + expert[[f"posterior_{name}_contribution" for name in COMPONENTS]].sum(axis=1)
        - expert["posterior_score"]
    )
    expert = expert.reset_index(drop=True).sort_values(["posterior_rank", "player_name"])

    bootstrap_coefficients = []
    for _ in range(int(config["bootstrap_iterations"])):
        sample = rng.integers(0, len(training), len(training))
        bootstrap_intercept, bootstrap_coefficient = fit_nonnegative_ridge(x[sample], y[sample], best_alpha)
        bootstrap_coefficients.append(np.r_[bootstrap_intercept, bootstrap_coefficient])
    bootstrap = np.vstack(bootstrap_coefficients)
    full_beta = np.r_[intercept, coefficient]
    coefficient_names = ["intercept"] + FEATURES
    coefficients = pd.DataFrame(
        {
            "feature": coefficient_names,
            "coefficient_standardized": full_beta,
            "coefficient_raw_score_scale": np.r_[intercept - np.sum(means * coefficient / stds), raw_coefficients],
            "bootstrap_mean": bootstrap.mean(axis=0),
            "bootstrap_std": bootstrap.std(axis=0),
            "selection_stability": [np.nan] + [(bootstrap[:, index] > 1e-8).mean() for index in range(1, bootstrap.shape[1])],
            "monotonic_nonnegative_constraint": [False] + [True] * len(FEATURES),
            "ridge_alpha": best_alpha,
        }
    )

    pure_weight_rows = pd.DataFrame(
        [{"component": name, "pure_data_weight": value, "method": config["pure_method"]} for name, value in pure_weights.items()]
    )
    training_ids = training["player_id"]
    human_evaluation = human.set_index("player_id").loc[training_ids, "human_score"].to_numpy()
    pure_evaluation = pure.set_index("player_id").loc[training_ids, "pure_data_score"].to_numpy()
    in_sample = np.clip(intercept + x @ coefficient, 0, 100)
    posterior_evaluation = expert.set_index("player_id").loc[training_ids, "posterior_score"].to_numpy()
    performance = pd.DataFrame(
        [
            evaluate("Human Weighted", y, human_evaluation, "matched public-prior sample"),
            evaluate("Expert Fitted", y, cv_predictions, f"{repeats}x{folds}-fold repeated out-of-fold"),
            evaluate("Expert Fitted", y, in_sample, "in-sample diagnostic"),
            evaluate("Pure Data", y, pure_evaluation, "matched public-prior sample"),
            evaluate("Prior + Model Posterior", y, posterior_evaluation, "public prior plus repeated OOF model evidence"),
        ]
    )

    comparison = features[["player_id", "player_name"]].copy()
    comparison = comparison.merge(human[["player_id", "human_score", "human_rank"]], on="player_id")
    comparison = comparison.merge(
        expert[["player_id", "model_score", "model_rank", "posterior_score", "posterior_rank", "prior_weight"]],
        on="player_id",
    )
    comparison = comparison.merge(pure[["player_id", "pure_data_score", "pure_data_rank"]], on="player_id")
    comparison["name_key"] = comparison["player_name"].map(canonical_name)
    comparison = comparison.merge(
        consensus[["name_key", "public_prior_score", "public_prior_rank", "sources_count"]],
        on="name_key",
        how="left",
    )
    comparison["posterior_vs_public_prior_rank"] = comparison["posterior_rank"] - comparison["public_prior_rank"]
    comparison["posterior_vs_human_rank"] = comparison["posterior_rank"] - comparison["human_rank"]
    comparison = comparison.sort_values("posterior_rank")

    write_csv(human, OUTPUT / "rankings" / "human_model.csv")
    write_csv(expert, OUTPUT / "rankings" / "expert_fitted_model.csv")
    write_csv(expert, OUTPUT / "rankings" / "posterior_model.csv")
    write_csv(pure, OUTPUT / "rankings" / "pure_data_model.csv")
    write_csv(comparison, OUTPUT / "rankings" / "ranking_comparison.csv")
    write_csv(coefficients, OUTPUT / "diagnostics" / "expert_model_coefficients.csv")
    write_csv(performance, OUTPUT / "diagnostics" / "model_performance.csv")
    write_csv(pure_weight_rows, OUTPUT / "diagnostics" / "pure_data_weights.csv")
    write_csv(
        pd.DataFrame(
            [
                {"alpha": result["alpha"], "cv_mse": result["cv_mse"], "folds": folds, "repeats": repeats}
                for result in alpha_results
            ]
        ),
        OUTPUT / "diagnostics" / "ridge_cv.csv",
    )

    model_metadata = {
        "version": config["version"],
        "training_target": "reliability-weighted public ranking prior",
        "training_players": len(training),
        "minimum_ranking_sources": minimum_sources,
        "components": COMPONENTS,
        "ridge_alpha": best_alpha,
        "cross_validation_folds": folds,
        "cross_validation_repeats": repeats,
        "oof_rmse": cv_rmse,
        "model_evidence_sd": model_sd,
        "standardized_intercept": intercept,
        "standardized_coefficients": dict(zip(FEATURES, coefficient.tolist())),
        "raw_score_coefficients": dict(zip(FEATURES, raw_coefficients.tolist())),
        "posterior_formula": "precision-weighted public prior plus model evidence; training players use repeated OOF evidence",
    }
    (PROCESSED / "goat_model_v0_2.json").write_text(json.dumps(model_metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    logger.info(
        "Fit v0.2 on %s prior players; alpha %.3g; OOF RMSE %.2f; posterior #1=%s",
        len(training), best_alpha, cv_rmse, expert.iloc[0].player_name,
    )


if __name__ == "__main__":
    main()
