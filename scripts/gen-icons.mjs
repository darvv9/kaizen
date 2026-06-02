import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const SRC =
  "C:/Users/darv9/.cursor/projects/c-Users-darv9-Downloads-app-rotina-davi/assets/kaizen-icon-source.png";
const OUT = "public/icons";

mkdirSync(OUT, { recursive: true });

const tasks = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

for (const t of tasks) {
  await sharp(SRC).resize(t.size, t.size, { fit: "cover" }).png().toFile(join(OUT, t.name));
  console.log("ok", t.name);
}

// Maskable: padding extra para a safe zone (ícone menor sobre fundo cheio).
const bg = { r: 10, g: 10, b: 12, alpha: 1 };
const inner = await sharp(SRC).resize(410, 410, { fit: "cover" }).png().toBuffer();
await sharp({
  create: { width: 512, height: 512, channels: 4, background: bg },
})
  .composite([{ input: inner, gravity: "center" }])
  .png()
  .toFile(join(OUT, "icon-512-maskable.png"));
console.log("ok icon-512-maskable.png");
