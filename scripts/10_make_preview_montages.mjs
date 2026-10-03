import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PREVIEW_ROOT = path.join(ROOT, "output", "diagnostics", "workbook_previews");
const MONTAGE_ROOT = path.join(ROOT, "output", "diagnostics", "workbook_montages");
const TILE_WIDTH = 560;
const TILE_HEIGHT = 350;
const LABEL_HEIGHT = 34;

function escapeXml(value) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]);
}

async function makeTile(filePath, label) {
  const preview = await sharp(filePath)
    .resize({ width: TILE_WIDTH - 20, height: TILE_HEIGHT - LABEL_HEIGHT - 20, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  const metadata = await sharp(preview).metadata();
  const labelSvg = Buffer.from(
    `<svg width="${TILE_WIDTH}" height="${LABEL_HEIGHT}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect width="100%" height="100%" fill="#12324A"/>` +
      `<text x="12" y="23" font-family="Arial" font-size="17" font-weight="700" fill="#FFFFFF">${escapeXml(label)}</text>` +
    `</svg>`,
  );
  return sharp({ create: { width: TILE_WIDTH, height: TILE_HEIGHT, channels: 4, background: "#E8EEF2" } })
    .composite([
      { input: labelSvg, left: 0, top: 0 },
      { input: preview, left: Math.floor((TILE_WIDTH - metadata.width) / 2), top: LABEL_HEIGHT + 10 },
    ])
    .png()
    .toBuffer();
}

async function main() {
  await fs.mkdir(MONTAGE_ROOT, { recursive: true });
  const directories = (await fs.readdir(PREVIEW_ROOT, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  for (const directory of directories) {
    const folder = path.join(PREVIEW_ROOT, directory.name);
    const files = (await fs.readdir(folder))
      .filter((name) => name.toLowerCase().endsWith(".png"))
      .sort((a, b) => a.localeCompare(b));
    const tiles = [];
    for (const name of files) {
      tiles.push(await makeTile(path.join(folder, name), path.basename(name, ".png")));
    }
    const columns = 2;
    const rows = Math.ceil(tiles.length / columns);
    const composite = tiles.map((input, index) => ({
      input,
      left: (index % columns) * TILE_WIDTH,
      top: Math.floor(index / columns) * TILE_HEIGHT,
    }));
    await sharp({ create: { width: columns * TILE_WIDTH, height: rows * TILE_HEIGHT, channels: 4, background: "#F5F7F9" } })
      .composite(composite)
      .png()
      .toFile(path.join(MONTAGE_ROOT, `${directory.name}.png`));
  }
}

await main();
