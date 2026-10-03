# Indicator Dictionary

The v0.2 dictionary contains **90 indicators** across 9 dimensions.

| dimension | indicator_count |
| --- | --- |
| Availability / Durability | 4 |
| Awards | 17 |
| Defense | 5 |
| Era Dominance | 6 |
| Longevity | 10 |
| Peak | 5 |
| Playoffs | 13 |
| Regular Season Individual Performance | 25 |
| Team Success | 5 |

## Core rules

- Raw facts and derived variables are stored separately.
- Cross-era rate comparisons use within-season z-scores clipped to [-3, 3].
- Peak 1/3/5/7 uses a multi-stat performance composite, not PPG alone.
- Missing inputs are reweighted out of composites and never converted to zero.
- The final models use seven dimension scores to limit double counting.
- Full-history playoff game boxes now cover 1947–2024; early-era steals/blocks still remain structurally unobserved.

See `indicator_overlap_report.md` for empirical and conceptual overlap diagnostics.
