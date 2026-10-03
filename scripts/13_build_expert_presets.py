"""Fit transparent, regularized preference simulations to published partial orders.

This is an interactive-model preset builder, not a claim that a commentator
uses these coefficients. Missing components contribute the neutral centered value 0.
Run with --self-test for deterministic checks without writing an output file.
"""
from __future__ import annotations

import argparse
import copy
import json
import math
from pathlib import Path

import numpy as np
from scipy.optimize import minimize


ROOT = Path(__file__).resolve().parents[1]
DIMENSIONS = (
    "regular_season", "peak", "longevity", "playoffs", "awards", "defense",
    "team_success",
)
MARGIN = 0.75
REGULARIZATION = 0.1
EPSILON = 1e-9


def component_vector(player: dict) -> np.ndarray:
    """Treat absent/non-finite components as missing, never as a zero score."""
    values = []
    for key in DIMENSIONS:
        value = player.get("components", {}).get(f"{key}_score")
        if value is None or isinstance(value, bool):
            values.append(np.nan)
        else:
            try:
                number = float(value)
            except (TypeError, ValueError):
                number = np.nan
            values.append(number if math.isfinite(number) else np.nan)
    return np.asarray(values, dtype=float)


def score_matrix(matrix: np.ndarray, coefficients: np.ndarray) -> np.ndarray:
    """Same independent, neutral-imputed additive score as the interactive client."""
    available = np.isfinite(matrix)
    centered = np.where(available, (matrix - 50.0) / 10.0, 0.0)
    scores = 50.0 + centered @ coefficients
    if np.any(coefficients > 0):
        scores[(available.astype(float) @ coefficients) <= 0] = np.nan
    return scores


def score_and_gradient(matrix: np.ndarray, coefficients: np.ndarray):
    centered = np.where(np.isfinite(matrix), (matrix - 50.0) / 10.0, 0.0)
    return 50.0 + centered @ coefficients, centered


def observations(expert: dict, players_by_id: dict):
    """Only compare explicitly ranked players or explicit pair constraints."""
    ranking = expert.get("ranking", [])
    if not isinstance(ranking, list) or len(ranking) != len(set(ranking)):
        raise ValueError(f"{expert.get('id')}: ranking must be a duplicate-free list")
    pairs = [(ranking[i], ranking[j]) for i in range(len(ranking))
             for j in range(i + 1, len(ranking))]
    for pair in expert.get("constraints", []):
        pairs.append((pair["higher"], pair["lower"]))
    pairs = list(dict.fromkeys(pairs))
    if not pairs:
        raise ValueError(f"{expert.get('id')}: needs at least one observed comparison")
    ids = list(dict.fromkeys(ranking + [p for pair in pairs for p in pair]))
    unknown = [p for p in ids if p not in players_by_id]
    if unknown:
        raise ValueError(f"{expert.get('id')}: unknown player IDs: {unknown}")
    if any(higher == lower for higher, lower in pairs):
        raise ValueError(f"{expert.get('id')}: a player cannot outrank themselves")
    matrix = np.asarray([component_vector(players_by_id[p]) for p in ids])
    if np.any(~np.isfinite(matrix).any(axis=1)):
        raise ValueError(f"{expert.get('id')}: an observed player has no components")
    return ranking, pairs, ids, matrix


def fit_expert(expert: dict, players_by_id: dict, base: np.ndarray) -> dict:
    ranking, pairs, ids, matrix = observations(expert, players_by_id)
    indices = {player_id: index for index, player_id in enumerate(ids)}
    higher = np.asarray([indices[p[0]] for p in pairs])
    lower = np.asarray([indices[p[1]] for p in pairs])
    def objective(coefficients):
        scores, gradients = score_and_gradient(matrix, coefficients)
        shortfall = np.maximum(0.0, MARGIN - (scores[higher] - scores[lower]))
        residual = coefficients - base
        value = np.mean(shortfall ** 2) + REGULARIZATION * (residual @ residual)
        gradient = (-2.0 * (shortfall[:, None]
                    * (gradients[higher] - gradients[lower])).mean(axis=0)
                    + 2.0 * REGULARIZATION * residual)
        return float(value), gradient

    # Strongly convex squared-hinge + ridge objective, with only box bounds.
    # Nine starts are kept as a deterministic solver diagnostic, not validation.
    starts = [base, np.full(len(DIMENSIONS), 10.0 / len(DIMENSIONS))]
    starts.extend(10.0 * axis for axis in np.eye(len(DIMENSIONS)))
    results = []
    for start in starts:
        result = minimize(objective, start, jac=True, method="SLSQP",
                          bounds=[(0.0, 10.0)] * len(DIMENSIONS),
                          options={"maxiter": 3000, "ftol": 1e-12})
        coefficients = np.clip(result.x, 0.0, 10.0)
        feasible = bool(np.all(np.isfinite(score_matrix(matrix, coefficients))))
        value, _ = objective(coefficients)
        results.append({"result": result, "coefficients": coefficients, "objective": value,
                        "feasible": feasible})
    candidates = [r for r in results if r["feasible"] and r["result"].success]
    if not candidates:
        raise RuntimeError(f"{expert.get('id')}: no successful feasible SLSQP result")
    best = min(candidates, key=lambda r: r["objective"])
    coefficients = best["coefficients"]
    scores = score_matrix(matrix, coefficients)
    all_scores = score_matrix(np.asarray([component_vector(p)
                                         for p in players_by_id.values()]), coefficients)
    gaps = scores[higher] - scores[lower]
    published_ranks = {player_id: index + 1 for index, player_id in enumerate(ranking)}
    ranked_players = []
    for index, player_id in enumerate(ids):
        ranked_players.append({
            "player_id": player_id,
            "player_name": players_by_id[player_id]["player_name"],
            "publishedRank": published_ranks.get(player_id),
            "modelRank": int(1 + np.count_nonzero(scores > scores[index] + EPSILON)),
            "allPlayerRank": int(1 + np.count_nonzero(all_scores > scores[index] + EPSILON)),
            "score": float(scores[index]),
        })
    unsatisfied = []
    for index, (higher_id, lower_id) in enumerate(pairs):
        if gaps[index] <= EPSILON:
            unsatisfied.append({
                "higher": higher_id, "lower": lower_id,
                "higherName": players_by_id[higher_id]["player_name"],
                "lowerName": players_by_id[lower_id]["player_name"],
                "scoreGap": float(gaps[index]),
            })
    centered = np.where(np.isfinite(matrix), (matrix - 50.0) / 10.0, 0.0)
    contrast_rank = int(np.linalg.matrix_rank(centered[higher] - centered[lower]))
    baseline_scores = score_matrix(matrix, base)
    positive_margins = int(np.count_nonzero(gaps >= MARGIN - 1e-7))
    metadata = copy.deepcopy(expert)
    metadata.pop("weights", None)
    metadata["coefficients"] = {k: float(v) for k, v in zip(DIMENSIONS, coefficients)}
    metadata["priorCoefficient"] = 0.0
    metadata["fit"] = {
        "playerCount": len(ids), "pairCount": len(pairs),
        "satisfiedPairs": len(pairs) - len(unsatisfied),
        "pairwiseAccuracy": (len(pairs) - len(unsatisfied)) / len(pairs),
        "baselinePairwiseAccuracy": float(np.mean(
            baseline_scores[higher] > baseline_scores[lower] + EPSILON)),
        "marginSatisfiedPairs": positive_margins,
        "marginAccuracy": positive_margins / len(pairs),
        "rankedPlayers": ranked_players,
        "modelRankScope": "within explicitly observed players; allPlayerRank uses the full 300-player pool",
        "unsatisfiedConstraints": unsatisfied,
        "observedPairs": [{"higher": h, "lower": l} for h, l in pairs],
        "objective": float(best["objective"]),
        "baselineObjective": objective(base)[0],
        "coefficientDistanceFromDefault": float(np.linalg.norm(coefficients - base)),
        "comparisonDirectionRank": contrast_rank,
        "coefficientDegreesOfFreedom": len(DIMENSIONS),
        "startsAttempted": len(results),
        "startsConverged": len(candidates),
        "convergedObjectiveSpread": float(max(r["objective"] for r in candidates)
                                          - min(r["objective"] for r in candidates)),
        "solver": "scipy.optimize.minimize / SLSQP",
        "solverSuccess": bool(best["result"].success),
        "solverMessage": str(best["result"].message),
        "guaranteesPublishedOrder": False,
        "limitations": [
            "Only the explicitly published comparisons are fitted; unlisted players are not assumed inferior.",
            "Coefficients are a regularized preference simulation, not the commentator's actual formula or endorsement.",
            "Partial ordinal rankings do not uniquely identify seven coefficients; default coefficients influence the result.",
            "Pairwise accuracy is in-sample fit, not an independent prediction test or a GOAT probability.",
            "The seven fixed historical components may not encode a commentator's complete criteria.",
            "Independent coefficients are applied to every candidate without player-specific bonuses or rank overrides.",
            "Scores are additive points, not percentages, and may exceed 100 or fall below zero.",
        ],
    }
    return metadata


def build(config: dict, data: dict) -> dict:
    players = data["players"]
    by_id = {p["player_id"]: p for p in players}
    if len(by_id) != len(players):
        raise ValueError("Duplicate player IDs in source data")
    base = np.asarray([data["default_user_weights"][key] for key in DIMENSIONS], dtype=float)
    if not np.all(np.isfinite(base)) or np.any(base < 0) or base.sum() <= 0:
        raise ValueError("Default weights must be finite, nonnegative and nonzero")
    base *= 10.0
    if np.any(base > 10):
        raise ValueError("Default additive coefficients must stay within [0, 10]")
    experts = config.get("experts", [])
    if not experts or len({e["id"] for e in experts}) != len(experts):
        raise ValueError("Need at least one expert, with distinct expert IDs")
    output = {key: copy.deepcopy(value) for key, value in config.items() if key != "experts"}
    output.update({
        "version": "0.4",
        "schemaVersion": 4,
        "dataVersion": data.get("model_version"),
        "dataAccessDate": data.get("data_access_date"),
        "method": {
            "name": "Regularized independent additive partial-order preference simulation",
            "dimensions": list(DIMENSIONS),
            "scoreFormula": "50 + sum(beta[k] * ((component[k] - 50) / 10)) + gamma * ((public_prior - 50) / 10)",
            "missingPolicy": "Missing components and public priors use neutral 50 (centered contribution 0), not raw zero. Expose coverage; never redistribute coefficients.",
            "undefinedScorePolicy": "null if every positively activated term is missing; the deliberately all-zero model returns intercept 50 for everyone",
            "objective": "mean(max(0, margin - (score[higher]-score[lower]))^2) + regularization * sum((beta-default)^2)",
            "margin": MARGIN, "regularization": REGULARIZATION,
            "coefficientConstraints": "0 <= beta[k] <= 10 independently; no sum constraint; fixed intercept 50; gamma=0 during expert fitting",
            "defaultCoefficients": {k: float(v) for k, v in zip(DIMENSIONS, base)},
            "intercept": 50,
            "defaultPriorCoefficient": 0,
            "coefficientInterpretation": "A 10-point increase in component k adds beta[k] score points, holding other components fixed.",
            "observationPolicy": "All pairwise comparisons within the published list plus explicit constraints; no implicit loss for unlisted players",
            "interpretation": "Preference simulation only; no Bayesian posterior or probability claim",
            "fitValidation": "Nine deterministic starts; in-sample comparisons reported, no held-out validation",
            "dataFreshnessNote": "Source publication dates describe opinions, not updates to the fixed player-data snapshot.",
        },
        "experts": [fit_expert(expert, by_id, base) for expert in experts],
    })
    return output


def self_test():
    base = np.asarray([1.6, 2.0, 1.4, 1.8, 1.4, 1.0, 0.8])
    assert np.allclose(score_matrix(np.asarray([[100, np.nan, 0, 0, 0, 0, 0]]),
                                   np.asarray([2.0, 8.0, 0, 0, 0, 0, 0])), [60])
    assert np.allclose(score_matrix(np.full((1, 7), np.nan), np.zeros(7)), [50])
    assert math.isnan(score_matrix(np.full((1, 7), np.nan), base)[0])
    assert math.isnan(score_matrix(np.asarray([[np.nan, 20, 30, 40, 50, 60, 70]]),
                                  np.asarray([1, 0, 0, 0, 0, 0, 0]))[0])
    players = {}
    for index, values in enumerate(([100, 60, 70, 80, 70, 90, 60],
                                    [80, 90, 95, 85, 80, 70, 70],
                                    [70, 65, 60, 75, 60, 65, 80])):
        key = f"p{index}"
        players[key] = {"player_id": key, "player_name": key,
                        "components": {f"{k}_score": v for k, v in zip(DIMENSIONS, values)}}
    expert = {"id": "test", "name": "test", "ranking": ["p0", "p1"],
              "constraints": [{"higher": "p0", "lower": "p1"}]}
    result = fit_expert(expert, players, base)
    repeated = fit_expert(expert, players, base)
    assert result["fit"]["pairCount"] == 1
    assert result["fit"]["playerCount"] == 2
    assert result["fit"]["pairwiseAccuracy"] == 1.0
    assert result["fit"]["objective"] <= result["fit"]["baselineObjective"]
    assert all(0 <= v <= 10 for v in result["coefficients"].values())
    assert abs(sum(result["coefficients"].values()) - 10) > 1e-5
    assert result["coefficients"] == repeated["coefficients"]
    matrix = np.asarray([component_vector(p) for p in players.values()])
    scores, gradients = score_and_gradient(matrix, base)
    for column in range(7):
        delta = np.zeros(7)
        delta[column] = 1e-6
        assert np.allclose((score_matrix(matrix, base + delta) - scores) / 1e-6,
                           gradients[:, column])
    contradictory = {"id": "contradictory", "ranking": ["p0", "p1"],
                     "constraints": [{"higher": "p1", "lower": "p0"}]}
    assert fit_expert(contradictory, players, base)["fit"]["unsatisfiedConstraints"]
    print("PASS: neutral missing policy, zero model, partial-order scope, deduplication, independent coefficients, analytic gradients, fit improvement, determinism, contradictions")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=ROOT / "config" / "espn_expert_rankings.json")
    parser.add_argument("--data", type=Path, default=ROOT / "data" / "processed" / "goat_model_v0_2_web.json")
    parser.add_argument("--output", type=Path, default=ROOT / "app" / "data" / "experts.json")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    config = json.loads(args.input.read_text(encoding="utf-8-sig"))
    data = json.loads(args.data.read_text(encoding="utf-8-sig"))
    output = build(config, data)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2, allow_nan=False)
                           + "\n", encoding="utf-8")
    for expert in output["experts"]:
        fit = expert["fit"]
        print(f"{expert['id']}: {fit['playerCount']} players, "
              f"{fit['satisfiedPairs']}/{fit['pairCount']} comparisons in the published direction; "
              f"{fit['marginSatisfiedPairs']} meet margin")
    print(f"Saved {args.output}")


if __name__ == "__main__":
    main()
