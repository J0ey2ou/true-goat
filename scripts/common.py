from __future__ import annotations

import hashlib
import json
import logging
import re
import unicodedata
from pathlib import Path

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
RAW_CSV = RAW / "kaggle_nba_aba_baa" / "csv"
INTERIM = ROOT / "data" / "interim"
PROCESSED = ROOT / "data" / "processed"
EXTERNAL = ROOT / "data" / "external_rankings"
OUTPUT = ROOT / "output"
CONFIG = ROOT / "config"
DOCS = ROOT / "docs"
ACCESS_DATE = "2026-08-15"


def setup_logging(name: str) -> logging.Logger:
    log_dir = OUTPUT / "diagnostics"
    log_dir.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger
    logger.setLevel(logging.INFO)
    formatter = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s")
    stream = logging.StreamHandler()
    stream.setFormatter(formatter)
    file_handler = logging.FileHandler(log_dir / "pipeline.log", encoding="utf-8")
    file_handler.setFormatter(formatter)
    logger.addHandler(stream)
    logger.addHandler(file_handler)
    return logger


def load_config(filename: str) -> dict:
    # JSON is valid YAML 1.2 and avoids a nonessential PyYAML dependency.
    return json.loads((CONFIG / filename).read_text(encoding="utf-8"))


def ensure_dirs() -> None:
    for path in [INTERIM, PROCESSED, EXTERNAL, DOCS]:
        path.mkdir(parents=True, exist_ok=True)
    for name in ["candidate_pool", "indicators", "rankings", "diagnostics", "reports"]:
        (OUTPUT / name).mkdir(parents=True, exist_ok=True)


def normalize_name(value: str) -> str:
    value = re.sub(r"\[[^\]]+\]\([^\)]+\)", lambda m: m.group(0).split("]")[0].lstrip("["), str(value))
    value = value.replace("’", "'").replace("‘", "'").replace("`", "'")
    value = unicodedata.normalize("NFKD", value)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    value = re.sub(r"[^A-Za-z0-9 ]+", " ", value)
    return re.sub(r"\s+", " ", value).strip().lower()


NAME_ALIASES = {
    "nate tiny archibald": "nate archibald",
    "tiny archibald": "nate archibald",
    "shaquille oneal": "shaquille o neal",
    "metta world peace": "ron artest",
    "ron artest": "ron artest",
    "earvin magic johnson": "magic johnson",
    "nikola jokic": "nikola jokic",
    "luka doncic": "luka doncic",
    "manu ginobili": "manu ginobili",
}


PLAYER_NAME_OVERRIDES = {
    # The retained upstream career-info snapshot omits the suffix for ewingpa02.
    "ewingpa02": "Patrick Ewing Jr.",
}


def canonical_name(value: str) -> str:
    key = normalize_name(value)
    return NAME_ALIASES.get(key, key)


def season_end_year(value: str | int | float) -> int | None:
    if pd.isna(value):
        return None
    text = str(value).strip()
    if re.fullmatch(r"\d{4}", text):
        return int(text)
    match = re.match(r"(\d{4})\s*[-–—]\s*(\d{2,4})", text)
    if not match:
        return None
    start = int(match.group(1))
    end_text = match.group(2)
    if len(end_text) == 2:
        century = start // 100 * 100
        end = century + int(end_text)
        if end < start:
            end += 100
        return end
    return int(end_text)


def canonical_season_rows(df: pd.DataFrame, leagues: tuple[str, ...] = ("NBA", "BAA")) -> pd.DataFrame:
    work = df.copy()
    if "lg" in work.columns:
        work = work[work["lg"].astype(str).str.upper().isin(leagues)].copy()
    work["_is_total"] = work.get("team", pd.Series("", index=work.index)).astype(str).str.upper().eq("TOT")
    work = work.sort_values(["player_id", "season", "_is_total"], ascending=[True, True, False])
    work = work.drop_duplicates(["player_id", "season"], keep="first").drop(columns="_is_total")
    return work.reset_index(drop=True)


def safe_zscore(series: pd.Series) -> pd.Series:
    numeric = pd.to_numeric(series, errors="coerce")
    mean = numeric.mean(skipna=True)
    std = numeric.std(skipna=True, ddof=0)
    if not np.isfinite(std) or std == 0:
        return pd.Series(np.nan, index=series.index)
    return ((numeric - mean) / std).clip(-3, 3)


def percentile(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce").rank(pct=True, method="average")


def weighted_available_average(frame: pd.DataFrame, weights: dict[str, float]) -> pd.Series:
    columns = [column for column in weights if column in frame.columns]
    values = frame[columns].apply(pd.to_numeric, errors="coerce")
    weight_vector = pd.Series({column: weights[column] for column in columns})
    numerator = values.mul(weight_vector, axis=1).sum(axis=1, skipna=True)
    denominator = values.notna().mul(weight_vector, axis=1).sum(axis=1)
    return numerator.div(denominator.where(denominator > 0))


def write_csv(df: pd.DataFrame, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False, encoding="utf-8-sig", na_rep="NA")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def rank_desc(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce").rank(method="min", ascending=False).astype("Int64")


def clean_markdown_name(text: str) -> str:
    text = re.sub(r"!\[[^\]]*\]\([^\)]*\)", "", text)
    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)
    text = re.sub(r"[*_#]", "", text)
    text = re.sub(r"\s+[\U0001F1E6-\U0001F1FF]{2}$", "", text)
    return re.sub(r"\s+", " ", text).strip(" :-")
