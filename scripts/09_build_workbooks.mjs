import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FINAL_DIR = path.join(ROOT, "outputs", "01a00459-396c-7300-99ff-9d81d32d3b8e");
const PREVIEW_DIR = path.join(ROOT, "output", "diagnostics", "workbook_previews");

const SOURCE_METHODS = [
  ["source", "year", "ranking_available", "ranking_method", "list_size", "reliability_weight", "role_in_project", "url"],
  ["ESPN NBA 75", 2022, true, "Expert panel with thousands of head-to-head votes", 76, 1.00, "Weighted public prior, model target and evaluation", "https://www.espn.com/nba/story/_/id/33297498/the-nba-75th-anniversary-team-ranked-where-76-basketball-legends-check-our-list"],
  ["CBS Sports 50", 2017, true, "Average rank from seven panelists", 50, 0.85, "Weighted public prior, model target and evaluation", "https://www.cbssports.com/nba/news/cbs-sports-50-greatest-nba-players-of-all-time-where-do-lebron-curry-rank/"],
  ["HoopsHype/Yahoo 75", 2021, true, "Eight ballots with high and low removed", 75, 0.95, "Weighted public prior, model target and evaluation", "https://sports.yahoo.com/75-greatest-nba-players-ever-091823397.html"],
  ["Bleacher Report 100", 2025, true, "Staff list using stats, awards, playoffs, titles and impact", 100, 0.75, "Weighted public prior, model target and evaluation", "https://bleacherreport.com/articles/25223594-brs-top-100-nba-players-all-time-ranked"],
  ["NBA 75 Anniversary Team", 2021, false, "Official recognition list; intentionally unranked", 76, "NA", "Candidate Pool C recognition only", "https://www.nba.com/nba-75-anniversary-team"],
  ["NBA 50 at 50", 1996, false, "Official recognition list; intentionally unranked", 50, "NA", "Candidate Pool C recognition only", "https://www.nba.com/history/nba-at-50/top-50-players"],
];

const WORKBOOKS = [
  {
    file: "NBA_GOAT_candidate_pool.xlsx",
    sheets: [
      ["Master_Pool", "output/candidate_pool/master_pool.csv"],
      ["Pool_A", "output/candidate_pool/pool_a.csv"],
      ["Pool_B", "output/candidate_pool/pool_b.csv"],
      ["Pool_C", "output/candidate_pool/pool_c.csv"],
      ["Pool_Comparison", "output/candidate_pool/pool_comparison.csv"],
      ["Candidate_Rules", "output/candidate_pool/candidate_rules.csv"],
    ],
  },
  {
    file: "NBA_GOAT_indicator_dictionary.xlsx",
    sheets: [
      ["Indicator_Dictionary", "output/indicators/indicator_dictionary.csv"],
      ["Overlap_Pairs", "output/diagnostics/high_overlap_pairs.csv"],
      ["Correlation_Matrix", "output/diagnostics/indicator_correlation_matrix.csv"],
    ],
  },
  {
    file: "NBA_GOAT_player_database.xlsx",
    sheets: [
      ["Player_Info", "data/processed/player_info.csv"],
      ["Regular_Season_Career", "data/processed/regular_season_career.csv"],
      ["Regular_Season_By_Season", "data/processed/regular_season_by_season.csv"],
      ["Playoffs_Career", "data/processed/playoffs_career.csv"],
      ["Playoffs_By_Season", "data/processed/playoffs_by_season.csv"],
      ["Awards", "data/processed/awards.csv"],
      ["Team_Success", "data/processed/team_success.csv"],
      ["Advanced_Metrics", "data/processed/advanced_metrics.csv"],
      ["Era_Adjusted", "data/processed/era_adjusted.csv"],
      ["Peak_Longevity", "data/processed/peak_longevity.csv"],
      ["Model_Features", "data/processed/model_features.csv"],
    ],
  },
  {
    file: "NBA_GOAT_data_sources.xlsx",
    sheets: [
      ["Source_Groups", "output/diagnostics/data_source_groups.csv"],
      ["Full_Audit_Manifest", "output/diagnostics/data_source_manifest.csv"],
      ["Completeness", "output/diagnostics/data_completeness_summary.csv"],
      ["Raw_File_Manifest", "output/diagnostics/raw_file_manifest.csv"],
      ["Quality_Checks", "output/diagnostics/validation_summary.csv"],
      ["Source_Reconciliation", "output/diagnostics/source_reconciliation.csv"],
    ],
  },
  {
    file: "external_rankings_raw.xlsx",
    sheets: [
      ["External_Rankings_Raw", "data/external_rankings/external_rankings_raw.csv"],
      ["Consensus_Expert", "output/rankings/consensus_expert.csv"],
      ["Source_Methods", null, SOURCE_METHODS],
    ],
  },
  {
    file: "NBA_GOAT_rankings_v0.2.xlsx",
    sheets: [
      ["Posterior_Model", "output/rankings/posterior_model.csv"],
      ["Human_Model", "output/rankings/human_model.csv"],
      ["Expert_Fitted_Model", "output/rankings/expert_fitted_model.csv"],
      ["Pure_Data_Model", "output/rankings/pure_data_model.csv"],
      ["Consensus_Expert", "output/rankings/consensus_expert.csv"],
      ["Ranking_Comparison", "output/rankings/ranking_comparison.csv"],
      ["Component_Scores", "data/processed/model_features.csv"],
      ["Sensitivity", "output/rankings/sensitivity.csv"],
      ["Ranking_Elasticity", "output/rankings/ranking_elasticity.csv"],
      ["Model_Performance", "output/diagnostics/model_performance.csv"],
      ["Model_Coefficients", "output/diagnostics/expert_model_coefficients.csv"],
      ["Make_Him_GOAT", "output/rankings/minimum_weight_change_to_goat.csv"],
      ["Weight_Snapshots", "output/diagnostics/sensitivity_top_snapshots.csv"],
      ["Prior_Source_Sensitivity", "output/rankings/prior_source_sensitivity.csv"],
      ["Source_Uncertainty", "output/diagnostics/source_weight_uncertainty_summary.csv"],
      ["GOAT3_Diagnostics", "output/diagnostics/goat_three_diagnostics.csv"],
      ["Source_Weights", "output/diagnostics/ranking_source_weights.csv"],
    ],
  },
];

function excelColumnName(index) {
  let value = index + 1;
  let name = "";
  while (value > 0) {
    value -= 1;
    name = String.fromCharCode(65 + (value % 26)) + name;
    value = Math.floor(value / 26);
  }
  return name;
}

function safeName(value) {
  return value.replace(/[^A-Za-z0-9_]/g, "_").slice(0, 120);
}

function widthFor(header, values) {
  const key = String(header).toLowerCase();
  const sampleMax = values.reduce((best, value) => Math.max(best, String(value ?? "").length), key.length);
  if (/(url|source_url)/.test(key)) return 38;
  if (/(definition|formula|notes|limitations|reason|qualification|method|title)/.test(key)) return 38;
  if (/(player_name|player$|indicator_name|feature|component)/.test(key)) return 23;
  if (/(player_id|source_id|indicator_id|name_key)/.test(key)) return 18;
  if (/(season|year|date|era|position|team)/.test(key)) return Math.min(16, Math.max(11, sampleMax + 2));
  return Math.min(24, Math.max(10, sampleMax + 2));
}

function numberFormatFor(header) {
  const key = String(header).toLowerCase();
  if (/(pct|percent|rate|share|probability|stability)/.test(key)) return "0.000";
  if (/(score|mean|std|coefficient|effect|contribution|weight|correlation|rmse|kendall|spearman|alpha|peak|ppg|rpg|apg|spg|bpg|vorp|bpm|per|ws|ts|value|minutes_per_game)/.test(key)) return "0.000";
  if (/(rank|year|season|count|games|minutes|points|rebounds|assists|steals|blocks|wins|titles|seasons|career_start|career_end|birth_year|appearances|championships|all_star|mvp|dpoy|finals_mvp)/.test(key)) return "0";
  return null;
}

async function importSheet(workbook, sheetName, relativeCsv, matrix) {
  if (relativeCsv) {
    const csvText = await fs.readFile(path.join(ROOT, relativeCsv), "utf8");
    await workbook.fromCSV(csvText, { sheetName });
  } else {
    const sheet = workbook.worksheets.add(sheetName);
    sheet.getRangeByIndexes(0, 0, matrix.length, matrix[0].length).values = matrix;
  }
  return workbook.worksheets.getItem(sheetName);
}

function styleSheet(sheet, workbookKey, sheetName) {
  const used = sheet.getUsedRange();
  const rowCount = used.rowCount;
  const columnCount = used.columnCount;
  const lastColumn = excelColumnName(columnCount - 1);
  const usedAddress = `A1:${lastColumn}${rowCount}`;
  const headers = sheet.getRangeByIndexes(0, 0, 1, columnCount).values[0];
  const sampleRows = Math.min(rowCount, 101);
  const sample = sheet.getRangeByIndexes(0, 0, sampleRows, columnCount).values;
  const largeSheet = rowCount > 50000;

  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(1);
  if (!largeSheet) {
    used.format.font = { name: "Aptos", size: 10, color: "#20303C" };
    used.format.verticalAlignment = "top";
    used.format.rowHeight = 18;
  }

  const header = sheet.getRangeByIndexes(0, 0, 1, columnCount);
  header.format.fill = "#12324A";
  header.format.font = { name: "Aptos Display", size: 10, bold: true, color: "#FFFFFF" };
  header.format.rowHeight = 30;
  header.format.wrapText = true;
  header.format.verticalAlignment = "center";
  header.format.borders = { bottom: { style: "medium", color: "#2A9D8F" } };

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    const column = sheet.getRangeByIndexes(0, columnIndex, rowCount, 1);
    const values = sample.map((row) => row[columnIndex]);
    column.format.columnWidth = widthFor(headers[columnIndex], values);
    const format = numberFormatFor(headers[columnIndex]);
    if (format && rowCount > 1 && !largeSheet) {
      sheet.getRangeByIndexes(1, columnIndex, rowCount - 1, 1).setNumberFormat(format);
    }
    if (!largeSheet && /(definition|formula|notes|limitations|reason|qualification|method)/i.test(String(headers[columnIndex]))) {
      column.format.wrapText = true;
    }
  }

  const tableName = safeName(`${workbookKey}_${sheetName}_Table`);
  const table = sheet.tables.add(usedAddress, true, tableName);
  table.style = "TableStyleMedium2";
  table.showBandedRows = true;
  table.showFilterButton = true;

  return { rowCount, columnCount, headers, usedAddress };
}

async function buildWorkbook(spec) {
  const workbook = Workbook.create();
  const workbookKey = safeName(spec.file.replace(/\.xlsx$/i, ""));
  const sheetStats = [];
  const previewFolder = path.join(PREVIEW_DIR, workbookKey);
  await fs.mkdir(previewFolder, { recursive: true });

  for (const [sheetName, csvPath, matrix] of spec.sheets) {
    const sheet = await importSheet(workbook, sheetName, csvPath, matrix);
    const stats = styleSheet(sheet, workbookKey, sheetName);
    sheetStats.push({ name: sheetName, ...stats });
    process.stdout.write(`  styled ${sheetName}: ${stats.rowCount - 1} data rows x ${stats.columnCount} columns\n`);
  }

  for (const stats of sheetStats) {
    const previewRows = Math.min(stats.rowCount, 20);
    const previewColumns = Math.min(stats.columnCount, 12);
    const previewRange = `A1:${excelColumnName(previewColumns - 1)}${previewRows}`;
    await workbook.inspect({
      kind: "region",
      sheetId: stats.name,
      range: previewRange,
      maxChars: 1200,
      tableMaxRows: 4,
      tableMaxCols: 6,
    });
    const preview = await workbook.render({
      sheetName: stats.name,
      range: previewRange,
      format: "png",
      scale: 0.9,
      headers: true,
    });
    await fs.writeFile(
      path.join(previewFolder, `${safeName(stats.name)}.png`),
      new Uint8Array(await preview.arrayBuffer()),
    );
  }

  const errorScan = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 100 },
    maxChars: 3000,
  });
  const output = await SpreadsheetFile.exportXlsx(workbook);
  const outputPath = path.join(FINAL_DIR, spec.file);
  await output.save(outputPath);
  return {
    file: spec.file,
    outputPath,
    sheets: sheetStats.map(({ name, rowCount, columnCount }) => ({ name, dataRows: rowCount - 1, columns: columnCount })),
    errorScan: errorScan.ndjson,
  };
}

async function main() {
  await fs.mkdir(FINAL_DIR, { recursive: true });
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  const verification = [];
  const requested = process.argv[2];
  const selected = requested ? WORKBOOKS.filter((spec) => spec.file === requested) : WORKBOOKS;
  if (selected.length === 0) throw new Error(`Unknown workbook: ${requested}`);
  for (const spec of selected) {
    process.stdout.write(`Building ${spec.file}\n`);
    verification.push(await buildWorkbook(spec));
  }
  await fs.writeFile(
    path.join(ROOT, "output", "diagnostics", `workbook_verification_${safeName(requested || "all")}.json`),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), workbooks: verification }, null, 2)}\n`,
    "utf8",
  );
  process.stdout.write(`Created ${verification.length} verified workbooks in ${FINAL_DIR}\n`);
}

await main();
