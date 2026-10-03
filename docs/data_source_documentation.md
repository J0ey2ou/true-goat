# Data Source Documentation

Access date: 2026-08-15.

## Factual sources

1. [Sumitro Datta NBA Stats](https://www.kaggle.com/datasets/sumitrodatta/nba-aba-baa-stats) — CC0, primary regular-season/award/biographical data through 2025-26.
2. [Gonzalo Gigena NBA All Time Stats](https://www.kaggle.com/datasets/gonzalogigena/nba-all-time-stats) — MIT, game results and player boxes used to rebuild complete BAA/NBA playoffs from 1947-2024.
3. [FiveThirtyEight historical metrics](https://github.com/fivethirtyeight/nba-player-advanced-metrics) — retained historical advanced/secondary playoff checks.
4. [Brescou NBA Statistics Repository](https://github.com/Brescou/NBA-dataset-stats-player-team) — MIT, modern regular-season and playoff cross-checks from 1996-97 through 2022-23.
5. [NBA official history](https://www.nba.com/history) — champions, MVP, DPOY, Finals MVP, All-NBA, All-Defense, NBA 50 and NBA 75.

## Cross-source reconciliation

| data_domain | secondary_source_id | checks | fields_compared | fields_matched | field_match_pct |
| --- | --- | --- | --- | --- | --- |
| playoffs | brescou_nba_stats | 1234 | 9628 | 9594 | 0.996 |
| playoffs | fivethirtyeight_historical | 1886 | 3764 | 3763 | 1.000 |
| regular_season | brescou_nba_stats | 1916 | 7664 | 7664 | 1.000 |
| regular_season | gonzalogigena_nba_all_time | 3862 | 25520 | 25176 | 0.987 |

Material differences are retained and documented. The incomplete Brescou 2022-23 playoff snapshot and the in-season Gonzalo 2023-24 regular table are not averaged into the newer or complete primary facts.

## Quality distribution

| data_quality | official_status | records |
| --- | --- | --- |
| A | official | 1500 |
| B | non-official | 91986 |
| C | non-official | 728 |
| D | non-official | 2569 |
| D | official | 900 |

No large-scale live Basketball-Reference scrape was performed. Every frozen raw file has a SHA-256 hash. Values still unobserved remain `NA`.
