# Ranking Model Methodology — GOAT Model v0.2

## 1. Public-ranking prior

Each ordered list is first normalized as `100 × (list size − rank) / (list size − 1)`. List absence is unobserved, not zero. The strict prior score is the reliability-weighted mean; a weighted median and robust blend remain diagnostics.

| source | reliability_weight | included_in_public_prior | rationale |
| --- | --- | --- | --- |
| ESPN_2022 | 1.000 | True | Large ESPN expert panel with thousands of head-to-head votes and an explicit NBA-only scope. |
| HoopsHype_2021 | 0.950 | True | Eight staff ballots with the highest and lowest ballots removed before aggregation. |
| CBS_2017 | 0.850 | True | Seven named panelists aggregated by average rank; older and shorter than the two highest-weight sources. |
| Bleacher_Report_2025 | 0.750 | True | Recent 100-player staff list with broad criteria, but a less explicitly quantified aggregation procedure. |
| NBA_75 | NA | False | Unranked official recognition; not converted into a strict rank |
| NBA_50 | NA | False | Unranked official recognition; not converted into a strict rank |

NBA 50 and NBA 75 are official but unranked, so they are never converted into invented numeric ranks.

Prior uncertainty is `14² / sum(source weights) + weighted between-source variance`. This makes four agreeing lists more precise than one list and weakens the prior when sources disagree.

## 2. Expert-fitted evidence model

The seven 0–100 component scores predict the weighted public prior for players appearing in at least two ordered lists. Ridge alpha is selected using 20 repeats of 5-fold cross-validation. Component coefficients are constrained non-negative, so a better Peak or Playoff score can no longer lower the fitted score merely because of collinearity.

| feature | coefficient_standardized | coefficient_raw_score_scale | bootstrap_std | selection_stability |
| --- | --- | --- | --- | --- |
| intercept | 48.635 | -75.949 | 1.448 | NA |
| regular_season_score | 5.027 | 0.330 | 1.794 | 1.000 |
| peak_score | 0.000 | 0.000 | 0.406 | 0.144 |
| longevity_score | 3.181 | 0.160 | 1.344 | 0.988 |
| playoffs_score | 4.627 | 0.258 | 1.331 | 1.000 |
| awards_score | 12.062 | 0.735 | 1.337 | 1.000 |
| defense_score | 2.145 | 0.118 | 1.496 | 0.896 |
| team_success_score | 4.375 | 0.182 | 1.377 | 1.000 |

Training players use repeated out-of-fold predictions as their model evidence. This prevents their own target from being reused as an in-sample prediction in the posterior.

## 3. Prior + model posterior

`posterior = prior_weight × public_prior + (1 − prior_weight) × model_evidence`

`prior_weight = prior_precision / (prior_precision + model_precision)` capped at 85%. Model precision is the inverse square of the repeated-OOF RMSE (12.972). Players with no public-list prior use model evidence only; list absence is never a penalty.

## 4. Other views

Human Weighted remains the configurable product-slider view:

| component | weight |
| --- | --- |
| regular_season | 0.160 |
| peak | 0.200 |
| longevity | 0.140 |
| playoffs | 0.180 |
| awards | 0.140 |
| defense | 0.100 |
| team_success | 0.080 |

Pure Data uses inverse mean absolute component-correlation weights and no expert target:

| component | pure_data_weight | method |
| --- | --- | --- |
| regular_season | 0.138 | inverse mean absolute component-correlation weighting; configured pure_data_weights are retained as a documented fallback only |
| peak | 0.136 | inverse mean absolute component-correlation weighting; configured pure_data_weights are retained as a documented fallback only |
| longevity | 0.135 | inverse mean absolute component-correlation weighting; configured pure_data_weights are retained as a documented fallback only |
| playoffs | 0.132 | inverse mean absolute component-correlation weighting; configured pure_data_weights are retained as a documented fallback only |
| awards | 0.133 | inverse mean absolute component-correlation weighting; configured pure_data_weights are retained as a documented fallback only |
| defense | 0.159 | inverse mean absolute component-correlation weighting; configured pure_data_weights are retained as a documented fallback only |
| team_success | 0.166 | inverse mean absolute component-correlation weighting; configured pure_data_weights are retained as a documented fallback only |

## 5. Evaluation

| model | evaluation | n | score_rmse | spearman | kendall_tau | rank_rmse | top_10_overlap | top_25_overlap | top_50_overlap |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Human Weighted | matched public-prior sample | 77 | 27.645 | 0.844 | 0.668 | 12.401 | 0.800 | 0.880 | 0.860 |
| Expert Fitted | 20x5-fold repeated out-of-fold | 77 | 12.972 | 0.880 | 0.707 | 10.910 | 0.800 | 0.920 | 0.860 |
| Expert Fitted | in-sample diagnostic | 77 | 12.055 | 0.896 | 0.733 | 10.147 | 0.800 | 0.920 | 0.860 |
| Pure Data | matched public-prior sample | 77 | 27.171 | 0.847 | 0.672 | 12.289 | 0.800 | 0.840 | 0.840 |
| Prior + Model Posterior | public prior plus repeated OOF model evidence | 77 | 7.062 | 0.962 | 0.859 | 6.137 | 1.000 | 0.960 | 0.940 |

The posterior describes a transparent compromise between public historical judgment and structured data. It is not a mathematical proof of the GOAT.
