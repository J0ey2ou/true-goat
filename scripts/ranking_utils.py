from __future__ import annotations

import re
from pathlib import Path

import numpy as np
import pandas as pd

from common import EXTERNAL, ACCESS_DATE, canonical_name, clean_markdown_name


SOURCE_META = {
    "ESPN_2022": {
        "year": 2022,
        "url": "https://www.espn.com/nba/story/_/id/33297498/the-nba-75th-anniversary-team-ranked-where-76-basketball-legends-check-our-list",
        "method": "ESPN expert panel; thousands of head-to-head votes; NBA contributions only",
        "panel": "ESPN NBA expert panel",
    },
    "CBS_2017": {
        "year": 2017,
        "url": "https://www.cbssports.com/nba/news/cbs-sports-50-greatest-nba-players-of-all-time-where-do-lebron-curry-rank/",
        "method": "Average rank from seven CBS Sports panelists",
        "panel": "7 CBS Sports panelists",
    },
    "HoopsHype_2021": {
        "year": 2021,
        "url": "https://sports.yahoo.com/75-greatest-nba-players-ever-091823397.html",
        "method": "Eight staff ballots; highest and lowest removed; 75-to-1 points",
        "panel": "8 HoopsHype staff members",
    },
    "Bleacher_Report_2025": {
        "year": 2025,
        "url": "https://bleacherreport.com/articles/25223594-brs-top-100-nba-players-all-time-ranked",
        "method": "Panel ranking using career totality, stats, awards, playoffs, titles and cultural impact",
        "panel": "B/R NBA staff panel",
    },
    "NBA_75": {
        "year": 2021,
        "url": "https://www.nba.com/nba-75-anniversary-team",
        "method": "Official unranked anniversary team selected by players, coaches, executives and media",
        "panel": "NBA official voting panel",
    },
    "NBA_50": {
        "year": 1996,
        "url": "https://www.nba.com/history/nba-at-50/top-50-players",
        "method": "Official unranked anniversary team selected by a blue-ribbon panel",
        "panel": "NBA official blue-ribbon panel",
    },
}


def _ordered_rows(source: str, pairs: list[tuple[int, str]]) -> list[dict]:
    meta = SOURCE_META[source]
    size = len(pairs)
    rows = []
    for rank, player in pairs:
        player = clean_markdown_name(player)
        rows.append(
            {
                "player": player,
                "name_key": canonical_name(player),
                "source": source,
                "rank": rank,
                "year": meta["year"],
                "ranking_size": size,
                "rank_normalized_0_100": 100.0 if size == 1 else 100.0 * (size - rank) / (size - 1),
                "ranking_method": meta["method"],
                "expert_panel": meta["panel"],
                "individual_or_panel": "panel",
                "ranking_available": True,
                "url": meta["url"],
                "access_date": ACCESS_DATE,
            }
        )
    return rows


def parse_external_rankings() -> tuple[pd.DataFrame, pd.DataFrame]:
    rows: list[dict] = []

    espn = (EXTERNAL / "espn_2022.md").read_text(encoding="utf-8")
    espn_pairs = [(int(rank), name) for rank, name in re.findall(r"(?m)^## No\.\s*(\d+):\s*(.+?)\s*$", espn)]
    rows.extend(_ordered_rows("ESPN_2022", espn_pairs))

    cbs = (EXTERNAL / "cbs_2017.md").read_text(encoding="utf-8")
    cbs_pairs = [(int(rank), name) for rank, name in re.findall(r"(?m)^###\s+\*\*(\d+)\.\s*(.+?)\*\*\s*$", cbs)]
    rows.extend(_ordered_rows("CBS_2017", cbs_pairs))

    bleacher = (EXTERNAL / "bleacher_report_2025.md").read_text(encoding="utf-8")
    bleacher_pairs = [(int(rank), name) for rank, name in re.findall(r"(?m)^##\s+(\d+)\.\s*(.+?)\s*$", bleacher)]
    rows.extend(_ordered_rows("Bleacher_Report_2025", bleacher_pairs))

    hh = (EXTERNAL / "hoopshype_yahoo_2021.md").read_text(encoding="utf-8")
    hh_lines = hh.splitlines()
    hh_names: list[str] = []
    for index, line in enumerate(hh_lines):
        stripped = line.strip()
        if not stripped.startswith("**") or "Top accolades" in stripped:
            continue
        lookahead = "\n".join(hh_lines[index + 1 : index + 8])
        if "**Top accolades:**" not in lookahead:
            continue
        name = clean_markdown_name(stripped)
        if name and canonical_name(name) not in {canonical_name(item) for item in hh_names}:
            hh_names.append(name)
    hh_pairs = [(rank, name) for rank, name in enumerate(hh_names[:75], start=1)]
    rows.extend(_ordered_rows("HoopsHype_2021", hh_pairs))

    ordered = pd.DataFrame(rows)

    official_rows: list[dict] = []
    nba75 = (EXTERNAL / "nba75_official.md").read_text(encoding="utf-8")
    body75 = nba75[nba75.find("# NBA 75th Anniversary Team") : nba75.find("NBA 75TH ANNIVERSARY TEAM VOTING PANEL")]
    nba75_names = re.findall(r"•\s*\[([^\]]+)\]\(https?://[^\)]+\)", body75)
    nba75_names = list(dict.fromkeys(clean_markdown_name(name) for name in nba75_names))

    nba50 = (EXTERNAL / "nba50_official.md").read_text(encoding="utf-8")
    body50 = nba50[nba50.find("#### 50 Greatest Players in NBA History") : nba50.find("Voters for the 50 Greatest Players")]
    nba50_names = []
    for line in body50.splitlines():
        if not line.lstrip().startswith("*"):
            continue
        match_link = re.search(r"\*\*\[([^\]]+)\]\(", line)
        match_plain = re.search(r"\*\*([^\[*][^*]+)\*\*", line)
        name = match_link.group(1) if match_link else (match_plain.group(1) if match_plain else "")
        if name:
            nba50_names.append(clean_markdown_name(name))
    nba50_names = list(dict.fromkeys(nba50_names))

    for source, names in [("NBA_75", nba75_names), ("NBA_50", nba50_names)]:
        meta = SOURCE_META[source]
        for player in names:
            official_rows.append(
                {
                    "player": player,
                    "name_key": canonical_name(player),
                    "source": source,
                    "rank": np.nan,
                    "year": meta["year"],
                    "ranking_size": len(names),
                    "rank_normalized_0_100": np.nan,
                    "ranking_method": meta["method"],
                    "expert_panel": meta["panel"],
                    "individual_or_panel": "panel",
                    "ranking_available": False,
                    "url": meta["url"],
                    "access_date": ACCESS_DATE,
                }
            )
    official = pd.DataFrame(official_rows)
    return ordered, official
