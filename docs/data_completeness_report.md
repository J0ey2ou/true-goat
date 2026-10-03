# Data Completeness Report

## Scope

- Master candidate pool: 300 players.
- Regular-season player-seasons retained: 3959.
- Playoff player-seasons retained: 2632.
- Row-level source audit records: 97,683.
- Workbook source groups: 26,606; each row groups one player/indicator/source/quality combination while preserving season range, record count and value range.

## Coverage findings

- Regular-season counting statistics cover BAA/NBA seasons from 1947 through 2026.
- Steals and blocks are structurally unavailable before 1973-74. Those cells remain `NA`, never zero.
- BPM/VORP and related advanced metrics do not cover the earliest eras consistently; historical players are not assigned zero.
- Full-history BAA/NBA playoff game boxes now cover 1947-2024. They replace the v0.1 split source that made pre-1997 players structurally incomparable with modern players.
- Cross-source reconciliation compared 46,576 common fields and matched 46,197; material differences are retained in `source_reconciliation.csv`, never silently averaged away.
- Player-level playoff box data for 2024-25 and 2025-26 remain unavailable in a retained, full-history comparable source. These seasons remain `NA` rather than being inferred.
- NBA official champion and Finals MVP pages do cover 2025-26, so team championships and Finals MVP counts are current even where box-level playoff data are not.

## Historical vs modern modeling

The v0.2 ranking uses dimension scores with available-input renormalization. A `Historical Comparable` view uses only broadly available career, rate, awards and team-success fields. Modern-only RAPTOR/PIE fields are retained for analysis but are not allowed to make missing historical values behave like zeros.

## Quality grades

- A: NBA official league-history pages.
- B: public historical datasets with retained licenses and cross-source/schema checks.
- C: one reliable retained public repository without a second full-history match.
- D: unobserved or era-structurally unavailable data.
