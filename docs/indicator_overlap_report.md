# Indicator Overlap Report

## Empirical screen

Across the 300-player master pool, 50 input pairs have absolute Pearson correlation at or above 0.75 (minimum 30 observed pairs). The machine-readable list is `output/diagnostics/high_overlap_pairs.csv`.

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
