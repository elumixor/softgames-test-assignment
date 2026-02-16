import { di } from "@elumixor/di";
import { Assets, Container, Graphics, Sprite, type Texture, TilingSprite } from "pixi.js";
import { App } from "../app";

const PARALLAX_AMOUNT = 15;
const PARALLAX_LERP = 0.05;

export class TilingBackground extends TilingSprite {
  private readonly app = di.inject(App);
  private readonly isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Parallax state (desktop only)
  private targetOffsetX = 0;
  private targetOffsetY = 0;
  private currentOffsetX = 0;
  private currentOffsetY = 0;

  private readonly onMouseMove = (e: MouseEvent) => {
    const cx = e.clientX / window.innerWidth - 0.5;
    const cy = e.clientY / window.innerHeight - 0.5;
    this.targetOffsetX = cx * PARALLAX_AMOUNT;
    this.targetOffsetY = cy * PARALLAX_AMOUNT;
  };

  async init() {
    const iconTex = await Assets.load<Texture>("assets/galaxy.png");
    const iconSize = 32;
    const gap = 50;
    const cell = iconSize + gap;
    const tileSize = cell * 2;
    const tile = new Container();
    const bounds = new Graphics().rect(0, 0, tileSize, tileSize).fill({ color: 0, alpha: 0.001 });
    const s0 = new Sprite(iconTex);
    s0.width = s0.height = iconSize;
    s0.position.set(gap / 2, gap / 2);
    const s1 = new Sprite(iconTex);
    s1.width = s1.height = iconSize;
    s1.position.set(cell + gap / 2, cell + gap / 2);
    tile.addChild(bounds, s0, s1);
    this.texture = this.app.renderer.generateTexture({ target: tile, resolution: 2 });
    this.tint = 0x1a1a2e;

    if (!this.isMobile) {
      window.addEventListener("mousemove", this.onMouseMove);
      this.app.ticker.add(this.tick, this);
    }
  }

  resize(localLeft: number, localTop: number, localWidth: number, localHeight: number) {
    this.position.set(localLeft, localTop);
    this.width = localWidth;
    this.height = localHeight;
  }

  override destroy() {
    if (!this.isMobile) {
      window.removeEventListener("mousemove", this.onMouseMove);
      this.app.ticker.remove(this.tick, this);
    }
    super.destroy();
  }

  private tick = () => {
    this.currentOffsetX += (this.targetOffsetX - this.currentOffsetX) * PARALLAX_LERP;
    this.currentOffsetY += (this.targetOffsetY - this.currentOffsetY) * PARALLAX_LERP;
    this.tilePosition.x = this.currentOffsetX;
    this.tilePosition.y = this.currentOffsetY;
  };
}
