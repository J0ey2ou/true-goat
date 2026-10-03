from __future__ import annotations

import numpy as np
import pandas as pd

from common import EXTERNAL, OUTPUT, ensure_dirs, load_config, setup_logging, write_csv
from ranking_utils import parse_external_rankings


def main() -> None:
    ensure_dirs()
    logger = setup_logging("05_external")
    ordered, official = parse_external_rankings()
    expected = {"ESPN_2022": 76, "CBS_2017": 50, "HoopsHype_2021": 75, "Bleacher_Report_2025": 100}
    actual = ordered.groupby("source").size().to_dict()
    for source, count in expected.items():
        if actual.get(source) != count:
            raise ValueError(f"Parsed {actual.get(source)} rows for {source}; expected {count}")
    official_expected = {"NBA_75": 76, "NBA_50": 50}
    official_actual = official.groupby("source").size().to_dict()
    for source, count in official_expected.items():
        if official_actual.get(source) != count:
            raise ValueError(f"Parsed {official_actual.get(source)} rows for {source}; expected {count}")

    source_config = load_config("ranking_source_weights.yaml")
    source_weights = {
        source: float(values["reliability_weight"])
        for source, values in source_config["sources"].items()
    }
    ordered["source_reliability_weight"] = ordered["source"].map(source_weights)
    ordered["source_weight_rationale"] = ordered["source"].map(
        {source: values["rationale"] for source, values in source_config["sources"].items()}
    )
    official["source_reliability_weight"] = np.nan
    official["source_weight_rationale"] = "Official recognition only; deliberately excluded from strict rank aggregation"
    write_csv(pd.concat([ordered, official], ignore_index=True), EXTERNAL / "external_rankings_raw.csv")

    rows = []
    base_sd = float(source_config["bayesian_update"]["single_source_score_sd"])
    for name_key, group in ordered.groupby("name_key"):
        values = group["rank_normalized_0_100"].to_numpy(dtype=float)
        weights = group["source_reliability_weight"].to_numpy(dtype=float)
        weighted_mean = float(np.average(values, weights=weights))
        order = np.argsort(values)
        cumulative = np.cumsum(weights[order])
        weighted_median = float(values[order][np.searchsorted(cumulative, weights.sum() / 2, side="left")])
        weighted_variance = float(np.average((values - weighted_mean) ** 2, weights=weights)) if len(values) > 1 else 0.0
        prior_variance = base_sd**2 / weights.sum() + float(
            source_config["bayesian_update"]["between_source_disagreement_multiplier"]
        ) * weighted_variance
        mode = group["player"].mode()
        rows.append(
            {
                "name_key": name_key,
                "player": mode.iat[0] if not mode.empty else group["player"].iloc[0],
                "sources_count": group["source"].nunique(),
                "source_weight_sum": weights.sum(),
                "sources_used": "; ".join(group.sort_values("source")["source"]),
                "mean_normalized_score": values.mean(),
                "median_normalized_score": float(np.median(values)),
                "normalized_score_std": float(np.std(values, ddof=1)) if len(values) > 1 else np.nan,
                "weighted_mean_score": weighted_mean,
                "weighted_median_score": weighted_median,
                "weighted_between_source_variance": weighted_variance,
                "public_prior_score": weighted_mean,
                "public_prior_sd": float(np.sqrt(prior_variance)),
                "public_prior_precision": 1 / prior_variance,
                "robust_consensus_score": 0.75 * weighted_mean + 0.25 * weighted_median,
                "best_rank": group["rank"].min(),
                "worst_rank": group["rank"].max(),
            }
        )
    consensus = pd.DataFrame(rows)
    consensus["trimmed_mean_score"] = consensus["name_key"].map(
        ordered.groupby("name_key")["rank_normalized_0_100"].apply(
            lambda values: float(np.mean(np.sort(values.to_numpy())[1:-1])) if len(values) >= 4 else float(values.mean())
        )
    )
    consensus["consensus_score"] = consensus["public_prior_score"]
    consensus["consensus_rank"] = consensus["public_prior_score"].rank(ascending=False, method="min").astype(int)
    consensus["public_prior_rank"] = consensus["consensus_rank"]
    consensus = consensus.sort_values(["consensus_rank", "player"])
    write_csv(consensus, OUTPUT / "rankings" / "consensus_expert.csv")
    source_method_rows = []
    for source, values in source_config["sources"].items():
        source_method_rows.append(
            {
                "source": source,
                "reliability_weight": values["reliability_weight"],
                "rationale": values["rationale"],
                "included_in_public_prior": True,
            }
        )
    for source in ["NBA_75", "NBA_50"]:
        source_method_rows.append(
            {
                "source": source,
                "reliability_weight": np.nan,
                "rationale": "Unranked official recognition; not converted into a strict rank",
                "included_in_public_prior": False,
            }
        )
    write_csv(pd.DataFrame(source_method_rows), OUTPUT / "diagnostics" / "ranking_source_weights.csv")
    logger.info("Parsed %s ordered rows and %s official recognition rows", len(ordered), len(official))


if __name__ == "__main__":
    main()
