from __future__ import annotations

import shutil
import time
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

from common import ROOT, ensure_dirs, load_config, setup_logging


CHUNK_SIZE = 1024 * 1024
MAX_RETRIES = 4


def download_cached(url: str, destination: Path, logger) -> None:
    """Download atomically, resume a .part file when supported, and never overwrite raw data."""
    if destination.exists():
        if destination.stat().st_size == 0:
            raise ValueError(f"Refusing to overwrite zero-byte raw file: {destination}")
        logger.info("Cache hit: %s", destination.relative_to(ROOT))
        return

    destination.parent.mkdir(parents=True, exist_ok=True)
    partial = destination.with_suffix(destination.suffix + ".part")
    for attempt in range(1, MAX_RETRIES + 1):
        offset = partial.stat().st_size if partial.exists() else 0
        headers = {"User-Agent": "True-GOAT-v0.1/reproducible-data-download"}
        if offset:
            headers["Range"] = f"bytes={offset}-"
        request = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                resumed = offset > 0 and getattr(response, "status", None) == 206
                mode = "ab" if resumed else "wb"
                if offset and not resumed:
                    logger.info("Server did not honor Range; restarting partial download for %s", destination.name)
                with partial.open(mode) as output:
                    shutil.copyfileobj(response, output, length=CHUNK_SIZE)
            partial.replace(destination)
            logger.info("Downloaded %s (%s bytes)", destination.relative_to(ROOT), destination.stat().st_size)
            return
        except (OSError, urllib.error.URLError, TimeoutError) as exc:
            if attempt == MAX_RETRIES:
                raise RuntimeError(f"Download failed after {MAX_RETRIES} attempts: {url}") from exc
            delay = 2 ** (attempt - 1)
            logger.warning("Download attempt %s/%s failed for %s; retrying in %ss", attempt, MAX_RETRIES, url, delay)
            time.sleep(delay)


def extract_missing(zip_path: Path, extract_path: Path, logger) -> None:
    """Extract only missing members and reject paths that escape the configured raw directory."""
    extract_path.mkdir(parents=True, exist_ok=True)
    root = extract_path.resolve()
    extracted = 0
    with zipfile.ZipFile(zip_path) as archive:
        for member in archive.infolist():
            target = (extract_path / member.filename).resolve()
            if root not in target.parents and target != root:
                raise ValueError(f"Unsafe archive member: {member.filename}")
            if member.is_dir() or target.exists():
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            partial = target.with_suffix(target.suffix + ".part")
            with archive.open(member) as source, partial.open("wb") as output:
                shutil.copyfileobj(source, output, length=CHUNK_SIZE)
            partial.replace(target)
            extracted += 1
    logger.info("Extracted %s new archive members into %s", extracted, extract_path.relative_to(ROOT))


def main() -> None:
    ensure_dirs()
    logger = setup_logging("00_download")
    config = load_config("source_config.yaml")
    downloadable: list[dict] = []
    for source in config["sources"]:
        if source.get("download_url") and source.get("local_path"):
            downloadable.append(source)
        for artifact in source.get("artifacts", []):
            downloadable.append(artifact)

    for artifact in downloadable:
        destination = ROOT / artifact["local_path"]
        download_cached(artifact["download_url"], destination, logger)
        if artifact.get("extract_path"):
            extract_missing(destination, ROOT / artifact["extract_path"], logger)
    logger.info("Source cache ready: %s downloadable artifacts checked", len(downloadable))


if __name__ == "__main__":
    main()
