import { range } from "@utils";
import { FillGradient, Graphics, Sprite } from "pixi.js";

export function createFloor(
  columns: number = 24,
  rows: number = 12,
  width: number = 700,
  height: number = 400,
): Sprite {
  const g = new Graphics();

  const cx = width / 2;
  const groundY = height * 0.3;
  const bottom = height;
  const floorHeight = bottom - groundY;

  const topWidth = width;
  const bottomWidth = width * 1.4;

  const rowY: number[] = [];
  const rowW: number[] = [];
  for (const i of range(0, rows + 1)) {
    const t = i / rows;
    rowY.push(groundY + floorHeight * t * t);
    rowW.push(topWidth + (bottomWidth - topWidth) * t);
  }

  // Fill background trapezoid
  g.moveTo(cx - rowW[0] / 2, rowY[0])
    .lineTo(cx + rowW[0] / 2, rowY[0])
    .lineTo(cx + rowW[rows] / 2, rowY[rows])
    .lineTo(cx - rowW[rows] / 2, rowY[rows])
    .closePath()
    .fill(0xcccccc);

  // Horizontal lines
  for (const i of range(0, rows + 1)) {
    const x0 = cx - rowW[i] / 2;
    const x1 = cx + rowW[i] / 2;
    g.moveTo(x0, rowY[i]).lineTo(x1, rowY[i]).stroke({ color: 0xaaaaaa, width: 0.5 });
  }

  // Vertical lines
  for (const j of range(0, columns + 1)) {
    const s = j / columns;
    const bx = cx - bottomWidth / 2 + bottomWidth * s;
    const tx = cx - topWidth / 2 + topWidth * s;
    g.moveTo(bx, rowY[rows]).lineTo(tx, rowY[0]).stroke({ color: 0xaaaaaa, width: 0.5 });
  }

  // Dots at intersections
  const totalYSpan = rowY[rows] - rowY[0];
  for (const i of range(0, rows + 1)) {
    const lineFrac = totalYSpan > 0 ? (rowY[i] - rowY[0]) / totalYSpan : 0;
    for (const j of range(0, columns + 1)) {
      const s = j / columns;
      const tx = cx - topWidth / 2 + topWidth * s;
      const bx = cx - bottomWidth / 2 + bottomWidth * s;
      const x = tx + (bx - tx) * lineFrac;
      const r = 0.5 + 1.5 * lineFrac;
      g.circle(x, rowY[i], r).fill(0x999999);
    }
  }

  // Add gradient fade from top to bottom of grid (background color to transparent)
  const gradient = new FillGradient({
    type: "linear",
    start: { x: 0, y: rowY[0] - 1 },
    end: { x: 0, y: rowY[Math.floor(rows * 0.8)] },
    colorStops: [
      { offset: 0, color: [0, 0, 0, 1] },
      { offset: 1, color: [0, 0, 0, 0] },
    ],
    textureSpace: "global",
  });
  g.rect(0, rowY[0] - 1, width, rowY[Math.floor(rows * 0.8)] - rowY[0]).fill(gradient);

  // Bake to texture and create sprite
  const bakedTexture = g.toTexture();
  g.destroy();

  return new Sprite({ texture: bakedTexture });
}
