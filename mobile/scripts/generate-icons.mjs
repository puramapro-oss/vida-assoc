#!/usr/bin/env node
// Generate Sangha app icons from Pollinations master image.
// Usage: node scripts/generate-icons.mjs
import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const sharpPath = resolve(ROOT, "..", "node_modules", "sharp", "lib", "index.js");
const sharp = (await import(sharpPath)).default;

const PROMPT = encodeURIComponent(
  "vivid glowing sacred tree silhouette with leaves turning into light particles, minimalist symbol, emerald green #10B981 and cyan #06B6D4 radial glow on deep black #0A0A0F, premium flat app icon, centered, high contrast, no text, no letters, sacred geometry, spiritual and nature vibes"
);

const MASTER_URL = `https://image.pollinations.ai/prompt/${PROMPT}?width=1024&height=1024&model=flux&enhance=true&nologo=true&seed=1111`;

async function fetchMaster() {
  console.log("Downloading master icon from Pollinations…");
  const r = await fetch(MASTER_URL);
  if (!r.ok) throw new Error(`Pollinations ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  console.log(`  ok (${(buf.length / 1024).toFixed(0)} KB)`);
  return buf;
}

async function write(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, data);
  console.log(`  → ${path.replace(ROOT + "/", "")}`);
}

const master = await fetchMaster();

const icon = await sharp(master).resize(1024, 1024).png().toBuffer();
await write(resolve(ROOT, "assets", "icon.png"), icon);

const adaptive = await sharp({
  create: {
    width: 1024,
    height: 1024,
    channels: 4,
    background: { r: 10, g: 10, b: 15, alpha: 1 },
  },
})
  .composite([
    {
      input: await sharp(master).resize(824, 824).png().toBuffer(),
      gravity: "center",
    },
  ])
  .png()
  .toBuffer();
await write(resolve(ROOT, "assets", "adaptive-icon.png"), adaptive);

const favicon = await sharp(master).resize(48, 48).png().toBuffer();
await write(resolve(ROOT, "assets", "favicon.png"), favicon);

const splash = await sharp({
  create: {
    width: 1284,
    height: 2778,
    channels: 4,
    background: { r: 10, g: 10, b: 15, alpha: 1 },
  },
})
  .composite([
    {
      input: await sharp(master).resize(520, 520).png().toBuffer(),
      gravity: "center",
    },
  ])
  .png()
  .toBuffer();
await write(resolve(ROOT, "assets", "splash-icon.png"), splash);

console.log("Done ✨");
