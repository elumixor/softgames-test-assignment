import "@elumixor/extensions";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createCanvas, GlobalFonts, type Image, loadImage } from "@napi-rs/canvas";

// Card dimensions in the atlas (2/3 of original 768x1344)
const CARD_W = 512;
const CARD_H = 896;

// Scale factor from original card coordinate space
const S = CARD_W / 768;

// Original constants, scaled
const CORNER_RADIUS = 50 * S;
const BORDER_INSET = 15 * S;
const PADDING = (15 + 30) * S;
const CIRCLE_R = 45 * S;
const BORDER_LINE_W = 3 * S;
const CIRCLE_LINE_W = 5 * S;

// Atlas layout: 16 columns x 9 rows = 144 cards
const COLS = 16;
const ROWS = 9;
const ATLAS_W = COLS * CARD_W; // 8192
const ATLAS_H = ROWS * CARD_H; // 8064

const cardTypes = ["warrior", "rogue", "mage", "bard"] as const;
const cardColors = ["red", "blue", "orange"] as const;

const colorHex: Record<string, string> = {
  red: "#fe5252",
  blue: "#66bfff",
  orange: "#fea25f",
};

const root = join(new URL(".", import.meta.url).pathname, "..");

// Register font
GlobalFonts.registerFromPath(join(root, "assets/fonts/fireside.otf"), "Fireside");

// Load images
const [warrior, rogue, mage, bard, gradient] = await Promise.all([
  loadImage(join(root, "assets/cards/warrior.png")),
  loadImage(join(root, "assets/cards/rogue.png")),
  loadImage(join(root, "assets/cards/mage.png")),
  loadImage(join(root, "assets/cards/bard.png")),
  loadImage(join(root, "assets/card-gradient.png")),
]);

const images: Record<string, Image> = { warrior, rogue, mage, bard };

// Create atlas canvas
const atlas = createCanvas(ATLAS_W, ATLAS_H);
const actx = atlas.getContext("2d");

// JSON frames for PIXI spritesheet
const frames: Record<string, unknown> = {};

let col = 0;
let row = 0;

for (const type of cardTypes) {
  for (const color of cardColors) {
    for (let level = 1; level <= 12; level++) {
      const x = col * CARD_W;
      const y = row * CARD_H;

      // Draw single card on a temp canvas
      const card = createCanvas(CARD_W, CARD_H);
      const ctx = card.getContext("2d");

      // 1. Rounded rectangle clip (mask)
      ctx.beginPath();
      ctx.roundRect(0, 0, CARD_W, CARD_H, CORNER_RADIUS);
      ctx.clip();

      // 2. Character image, scaled to fill
      ctx.drawImage(images[type], 0, 0, CARD_W, CARD_H);

      // 3. Darken overlay with card color
      ctx.globalCompositeOperation = "darken";
      ctx.fillStyle = colorHex[color];
      ctx.fillRect(0, 0, CARD_W, CARD_H);

      // 4. Gradient at bottom (uniformWidth scaling)
      ctx.globalCompositeOperation = "source-over";
      const gradScale = CARD_W / gradient.width;
      const gradH = gradient.height * gradScale;
      ctx.drawImage(gradient, 0, CARD_H - gradH, CARD_W, gradH);

      // 5. Border stroke (inset rounded rect)
      const innerR = Math.max(CORNER_RADIUS - BORDER_INSET, 0);
      ctx.beginPath();
      ctx.roundRect(BORDER_INSET, BORDER_INSET, CARD_W - BORDER_INSET * 2, CARD_H - BORDER_INSET * 2, innerR);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = BORDER_LINE_W;
      ctx.stroke();

      // 6. Difference text layer — render to a separate canvas first (source-over),
      //    then composite onto card with "difference" (matches PIXI container blend)
      const textLayer = createCanvas(CARD_W, CARD_H);
      const tctx = textLayer.getContext("2d");

      // Type name - bottom left
      tctx.font = `${Math.round(64 * S)}px Fireside`;
      tctx.fillStyle = "#cccccc";
      tctx.textAlign = "left";
      tctx.textBaseline = "alphabetic";
      const typeName = type.capitalize();
      const metrics = tctx.measureText(typeName);
      const textY = CARD_H - PADDING - metrics.actualBoundingBoxDescent;
      tctx.fillText(typeName, PADDING, textY);

      // Circle - bottom right
      const cx = CARD_W - PADDING - CIRCLE_R;
      const cy = CARD_H - PADDING - CIRCLE_R;
      tctx.beginPath();
      tctx.arc(cx, cy, CIRCLE_R, 0, Math.PI * 2);
      tctx.strokeStyle = "#cccccc";
      tctx.lineWidth = CIRCLE_LINE_W;
      tctx.stroke();

      // Level number - centered in circle
      const fontSize = Math.round(60 * S);
      tctx.font = `${fontSize}px Roboto`;
      tctx.fillStyle = "#cccccc";
      tctx.textAlign = "center";
      tctx.textBaseline = "middle";
      tctx.fillText(String(level), cx, cy);

      // Composite text layer with "difference" blend
      ctx.globalCompositeOperation = "difference";
      ctx.drawImage(textLayer, 0, 0);

      // Composite card onto atlas
      actx.drawImage(card, x, y);

      // Add frame to spritesheet JSON
      const key = `${type}_${color}_${level}`;
      frames[key] = {
        frame: { x, y, w: CARD_W, h: CARD_H },
        sourceSize: { w: CARD_W, h: CARD_H },
        spriteSourceSize: { x: 0, y: 0, w: CARD_W, h: CARD_H },
      };

      col++;
      if (col >= COLS) {
        col = 0;
        row++;
      }
    }
  }
}

// Output
const outDir = join(root, "generated");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const pngBuffer = atlas.toBuffer("image/png");
writeFileSync(join(outDir, "ace-of-shadows-cards.png"), pngBuffer);

const json = {
  frames,
  meta: {
    image: "ace-of-shadows-cards.png",
    format: "RGBA8888",
    size: { w: ATLAS_W, h: ATLAS_H },
    scale: 1,
  },
};
writeFileSync(join(outDir, "ace-of-shadows-cards.json"), JSON.stringify(json, null, 2));

console.log(`Atlas generated: ${ATLAS_W}x${ATLAS_H}, ${Object.keys(frames).length} cards`);
