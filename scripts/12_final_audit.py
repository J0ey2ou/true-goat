from __future__ import annotations

import json
import math
import zipfile
from pathlib import Path
from xml.etree import ElementTree

import pandas as pd

from common import OUTPUT, PROCESSED, ROOT


FINAL_DIR = ROOT / "outputs" / "01a00459-396c-7300-99ff-9d81d32d3b8e"
EXPECTED_SHEETS = {
    "NBA_GOAT_candidate_pool.xlsx": {"Master_Pool", "Pool_A", "Pool_B", "Pool_C", "Pool_Comparison", "Candidate_Rules"},
    "NBA_GOAT_indicator_dictionary.xlsx": {"Indicator_Dictionary", "Overlap_Pairs", "Correlation_Matrix"},
    "NBA_GOAT_player_database.xlsx": {
        "Player_Info", "Regular_Season_Career", "Regular_Season_By_Season", "Playoffs_Career", "Playoffs_By_Season",
        "Awards", "Team_Success", "Advanced_Metrics", "Era_Adjusted", "Peak_Longevity", "Model_Features",
    },
    "NBA_GOAT_data_sources.xlsx": {"Source_Groups", "Full_Audit_Manifest", "Completeness", "Raw_File_Manifest", "Quality_Checks", "Source_Reconciliation"},
    "external_rankings_raw.xlsx": {"External_Rankings_Raw", "Consensus_Expert", "Source_Methods"},
    "NBA_GOAT_rankings_v0.2.xlsx": {
        "Posterior_Model", "Human_Model", "Expert_Fitted_Model", "Pure_Data_Model", "Consensus_Expert", "Ranking_Comparison",
        "Component_Scores", "Sensitivity", "Ranking_Elasticity", "Model_Performance", "Model_Coefficients",
        "Make_Him_GOAT", "Weight_Snapshots", "Prior_Source_Sensitivity", "Source_Uncertainty",
        "GOAT3_Diagnostics", "Source_Weights",
    },
}


def workbook_sheets(path: Path) -> set[str]:
    with zipfile.ZipFile(path) as archive:
        corrupt = archive.testzip()
        if corrupt:
            raise ValueError(f"Corrupt member in {path.name}: {corrupt}")
        root = ElementTree.fromstring(archive.read("xl/workbook.xml"))
    namespace = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    return {sheet.attrib["name"] for sheet in root.findall("x:sheets/x:sheet", namespace)}


def assert_finite_json(value) -> None:
    if isinstance(value, dict):
        for item in value.values():
            assert_finite_json(item)
    elif isinstance(value, list):
        for item in value:
            assert_finite_json(item)
    elif isinstance(value, float) and not math.isfinite(value):
        raise ValueError("Non-finite number found in web JSON")


def main() -> None:
    checks: list[dict] = []

    produced = {path.name for path in FINAL_DIR.glob("*.xlsx")}
    allowed_archives = {"NBA_GOAT_rankings_v0.1.xlsx"}
    current_present = set(EXPECTED_SHEETS).issubset(produced)
    unexpected = produced - set(EXPECTED_SHEETS) - allowed_archives
    checks.append({
        "check": "six_current_workbooks_plus_allowed_archive",
        "status": "PASS" if current_present and not unexpected else "FAIL",
        "value": {"produced": sorted(produced), "unexpected": sorted(unexpected)},
    })
    for filename, expected in EXPECTED_SHEETS.items():
        actual = workbook_sheets(FINAL_DIR / filename)
        checks.append({
            "check": f"xlsx_sheets:{filename}",
            "status": "PASS" if actual == expected else "FAIL",
            "value": sorted(actual),
        })

    master = pd.read_csv(OUTPUT / "candidate_pool" / "master_pool.csv")
    checks.extend(
        [
            {"check": "master_rows", "status": "PASS" if len(master) == 300 else "FAIL", "value": len(master)},
            {"check": "master_unique_ids", "status": "PASS" if master["player_id"].is_unique else "FAIL", "value": master["player_id"].nunique()},
            {"check": "master_unique_names", "status": "PASS" if master["player_name"].is_unique else "FAIL", "value": master["player_name"].nunique()},
        ]
    )
    universe = pd.read_csv(OUTPUT / "diagnostics" / "candidate_universe_scores.csv", low_memory=False).set_index("player_id")
    identity_ok = all(
        int(universe.loc[player_id, "external_ranked_sources"]) == 0
        and int(universe.loc[player_id, "NBA_75"]) == 0
        and int(universe.loc[player_id, "NBA_50"]) == 0
        for player_id in ["paytoga02", "ewingpa02"]
    )
    checks.append({"check": "suffix_identity_resolution", "status": "PASS" if identity_ok else "FAIL", "value": identity_ok})

    ranking_lengths = {
        filename: len(pd.read_csv(OUTPUT / "rankings" / filename))
        for filename in ["human_model.csv", "expert_fitted_model.csv", "posterior_model.csv", "pure_data_model.csv", "ranking_comparison.csv", "ranking_elasticity.csv"]
    }
    checks.append({"check": "ranking_rows", "status": "PASS" if set(ranking_lengths.values()) == {300} else "FAIL", "value": ranking_lengths})

    source_rows = len(pd.read_csv(OUTPUT / "diagnostics" / "data_sources.csv", low_memory=False))
    source_groups = len(pd.read_csv(OUTPUT / "diagnostics" / "data_source_groups.csv", low_memory=False))
    source_manifest = pd.read_csv(OUTPUT / "diagnostics" / "data_source_manifest.csv").set_index("field")["value"]
    source_counts_match = (
        source_rows == int(float(source_manifest["full_row_level_audit_records"]))
        and source_groups == int(float(source_manifest["grouped_records"]))
    )
    checks.append({"check": "source_audit_rows", "status": "PASS" if source_counts_match else "FAIL", "value": {"rows": source_rows, "groups": source_groups}})

    playoff = pd.read_csv(PROCESSED / "playoffs_career.csv").set_index("player_name")
    corrected_playoffs = {
        name: {"games": int(playoff.loc[name, "playoff_games"]), "wins": int(playoff.loc[name, "playoff_wins_known"])}
        for name in ["Michael Jordan", "LeBron James", "Kareem Abdul-Jabbar"]
    }
    correction_ok = corrected_playoffs == {
        "Michael Jordan": {"games": 179, "wins": 119},
        "LeBron James": {"games": 287, "wins": 183},
        "Kareem Abdul-Jabbar": {"games": 237, "wins": 154},
    }
    checks.append({"check": "full_history_playoff_rebuild", "status": "PASS" if correction_ok else "FAIL", "value": corrected_playoffs})

    reconciliation = pd.read_csv(OUTPUT / "diagnostics" / "source_reconciliation.csv")
    compared = int(reconciliation["fields_compared"].sum())
    matched = int(reconciliation["fields_matched"].sum())
    checks.append({
        "check": "cross_source_reconciliation",
        "status": "PASS" if compared > 10000 and matched / compared > 0.98 else "FAIL",
        "value": {"compared": compared, "matched": matched, "match_pct": matched / compared},
    })

    payload = json.loads((PROCESSED / "goat_model_v0_2_web.json").read_text(encoding="utf-8"))
    assert_finite_json(payload)
    checks.append({"check": "web_json_players", "status": "PASS" if len(payload["players"]) == 300 else "FAIL", "value": len(payload["players"])})

    verification_path = OUTPUT / "diagnostics" / "workbook_verification_all.json"
    verification = json.loads(verification_path.read_text(encoding="utf-8")) if verification_path.exists() else {"workbooks": []}
    clean_scans = all("matched 0 entries" in workbook["errorScan"] for workbook in verification["workbooks"])
    checks.append({
        "check": "workbook_render_and_error_scans",
        "status": "PASS" if len(verification["workbooks"]) == 6 and clean_scans else "FAIL",
        "value": len(verification["workbooks"]),
    })

    required_docs = [
        ROOT / "README.md", ROOT / "CHANGELOG.md", ROOT / "docs" / "candidate_pool_methodology.md",
        ROOT / "docs" / "indicator_dictionary.md", ROOT / "docs" / "data_source_documentation.md",
        ROOT / "docs" / "ranking_model_methodology.md", ROOT / "docs" / "data_completeness_report.md",
        ROOT / "docs" / "indicator_overlap_report.md", ROOT / "docs" / "first_results_report.md",
    ]
    checks.append({"check": "required_docs", "status": "PASS" if all(path.exists() and path.stat().st_size > 0 for path in required_docs) else "FAIL", "value": len(required_docs)})

    status = "PASS" if all(check["status"] in ["PASS", "INFO"] for check in checks) else "FAIL"
    result = {"status": status, "checks": checks}
    (OUTPUT / "diagnostics" / "final_audit.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if status != "PASS":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
