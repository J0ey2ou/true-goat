"""Export exact inputs and frozen reference distributions for the seven indices.

Read the production weight specification with AST, rather than maintaining a
second formula. No source data or player score is modified by this exporter.
"""
from __future__ import annotations

import ast
import csv
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def number(value):
    try:
        result = float(value)
        return result if math.isfinite(result) else None
    except (TypeError, ValueError):
        return None


def build():
    tree = ast.parse((ROOT / "scripts/04_build_indicators.py").read_text(encoding="utf-8"))
    specs = next(ast.literal_eval(node.value) for node in ast.walk(tree)
                 if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == "component_specs" for t in node.targets))
    with (ROOT / "data/processed/model_features_full.csv").open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    fields = list(dict.fromkeys(field for spec in specs.values() for field in spec))
    references = {field: sorted(value for row in rows if (value := number(row.get(field))) is not None) for field in fields}
    players = {row["player_id"]: {"raw": {field: number(row.get(field)) for field in fields},
                "scores": {key: number(row.get(key + "_score")) for key in specs}} for row in rows}
    # Persist enough season evidence to inspect the inputs to the peak windows.
    with (ROOT / "data/processed/era_adjusted.csv").open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            if row["player_id"] in players:
                players[row["player_id"]].setdefault("seasons", []).append({field: number(row.get(field)) for field in
                    ["season", "g", "games_share", "season_performance_available", "ppg", "rpg", "apg", "ts_percent", "era_defense"]})
    payload = {"version": 1, "referenceCount": len(rows), "specifications": specs,
               "references": references, "players": players,
               "source": "data/processed/model_features_full.csv; scripts/04_build_indicators.py; scripts/data_utils.py",
               "percentileRule": "Original: average one-based ascending rank / observed n. Extension: equal values use average rank/n (rtol=atol=1e-12); otherwise fraction strictly below x.",
               "missingRule": "Within dimension: omit missing inputs and divide by remaining input weight. Final additive model: missing dimension contributes 0."}
    target = ROOT / "app/data/dimension-audit.json"
    target.write_text(json.dumps(payload, ensure_ascii=False, allow_nan=False, separators=(",", ":")), encoding="utf-8")
    print(f"Exported {len(players)} audited players and {len(fields)} reference distributions to {target}")


if __name__ == "__main__":
    build()
