import { di } from "@elumixor/di";
import { Container, Graphics, Sprite, Texture } from "pixi.js";
import { App } from "../../app";

const FLOOR_COLS = 24;
const FLOOR_ROWS = 12;

export class FireGround extends Container {
  private readonly app = di.inject(App);
  private readonly floorSprite = new Sprite();
  private readonly fade = new Sprite({
    texture: Texture.from("assets/card-gradient.png"),
    anchor: { x: 0, y: 1 },
    // blendMode: "multiply",
  });
  private bakedTexture?: Texture;

  constructor() {
    super();
    this.addChild(this.floorSprite, this.fade);
  }

  resize(cx: number, groundY: number, left: number, top: number, bottom: number, screenWidth: number) {
    this.bakeFloor(cx, groundY, left, top, bottom, screenWidth);

    this.fade.position.set(left, groundY - 1);
    this.fade.width = screenWidth;
    this.fade.scale.y = -0.3;
  }

  private bakeFloor(cx: number, groundY: number, left: number, top: number, bottom: number, screenWidth: number) {
    const g = new Graphics();

    // Wall fill above ground line (black)
    g.rect(left, top, screenWidth, groundY - top).fill(0x000000);

    const floorHeight = bottom - groundY;
    if (floorHeight <= 0) return;

    const topWidth = screenWidth;
    const bottomWidth = screenWidth * 1.4;

    const rowY: number[] = [];
    const rowW: number[] = [];
    for (let i = 0; i <= FLOOR_ROWS; i++) {
      const t = i / FLOOR_ROWS;
      rowY.push(groundY + floorHeight * t * t);
      rowW.push(topWidth + (bottomWidth - topWidth) * t);
    }

    // Fill background trapezoid
    g.moveTo(cx - rowW[0] / 2, rowY[0])
      .lineTo(cx + rowW[0] / 2, rowY[0])
      .lineTo(cx + rowW[FLOOR_ROWS] / 2, rowY[FLOOR_ROWS])
      .lineTo(cx - rowW[FLOOR_ROWS] / 2, rowY[FLOOR_ROWS])
      .closePath()
      .fill(0xcccccc);

    // Horizontal lines
    for (let i = 0; i <= FLOOR_ROWS; i++) {
      const x0 = cx - rowW[i] / 2;
      const x1 = cx + rowW[i] / 2;
      g.moveTo(x0, rowY[i]).lineTo(x1, rowY[i]).stroke({ color: 0xaaaaaa, width: 0.5 });
    }

    // Vertical lines
    for (let j = 0; j <= FLOOR_COLS; j++) {
      const s = j / FLOOR_COLS;
      const bx = cx - bottomWidth / 2 + bottomWidth * s;
      const tx = cx - topWidth / 2 + topWidth * s;
      g.moveTo(bx, rowY[FLOOR_ROWS]).lineTo(tx, rowY[0]).stroke({ color: 0xaaaaaa, width: 0.5 });
    }

    // Dots at intersections
    const totalYSpan = rowY[FLOOR_ROWS] - rowY[0];
    for (let i = 0; i <= FLOOR_ROWS; i++) {
      const lineFrac = totalYSpan > 0 ? (rowY[i] - rowY[0]) / totalYSpan : 0;
      for (let j = 0; j <= FLOOR_COLS; j++) {
        const s = j / FLOOR_COLS;
        const tx = cx - topWidth / 2 + topWidth * s;
        const bx = cx - bottomWidth / 2 + bottomWidth * s;
        const x = tx + (bx - tx) * lineFrac;
        const r = 0.5 + 1.5 * lineFrac;
        g.circle(x, rowY[i], r).fill(0x999999);
      }
    }

    // Bake to texture
    if (this.bakedTexture) this.bakedTexture.destroy(true);
    this.bakedTexture = this.app.renderer.generateTexture(g);
    this.floorSprite.texture = this.bakedTexture;
    this.floorSprite.position.set(g.bounds.x, g.bounds.y);
    g.destroy();
  }
}
