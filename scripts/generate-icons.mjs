import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "public");
mkdirSync(OUT, { recursive: true });

function svg(size) {
  const r = Math.round(size * 0.16);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
    <rect width="100" height="100" rx="${(r / size) * 100}" fill="#1E3A5F"/>
    <circle cx="50" cy="54" r="30" fill="none" stroke="#FFFFFF" stroke-width="6"/>
    <line x1="50" y1="54" x2="50" y2="34" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/>
    <line x1="50" y1="54" x2="64" y2="60" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/>
    <rect x="40" y="12" width="20" height="8" rx="3" fill="#FFFFFF"/>
  </svg>`;
}

async function gen(size) {
  const file = join(OUT, `icon-${size}.png`);
  await sharp(Buffer.from(svg(size))).resize(size, size).png().toFile(file);
  console.log(`wrote ${file}`);
}

await gen(192);
await gen(512);
