import { di } from "@elumixor/di";
import { Assets, Container, Graphics, Sprite, Text, type Texture, TilingSprite } from "pixi.js";
import { App } from "../app";
import { FullscreenButton } from "../components/fullscreen-button";
import { FullscreenHint } from "../components/fullscreen-hint";
import { SoundButton } from "../components/sound-button";
import { Scene } from "./scene";

interface MenuEntry {
  label: string;
  route: "ace-of-shadows" | "magic-words" | "phoenix-flame";
}

const entries: MenuEntry[] = [
  { label: "Ace of Shadows", route: "ace-of-shadows" },
  { label: "Magic Words", route: "magic-words" },
  { label: "Phoenix Flame", route: "phoenix-flame" },
];

export class MenuScene extends Scene {
  private readonly app = di.inject(App);
  private readonly background = new TilingSprite();
  private readonly title = new Text({
    text: "Softgames Assignment",
    style: { fontSize: 32, fill: 0xffffff, fontFamily: "Anta" },
  });
  private readonly buttons = new Container();
  private readonly fullscreenButton = new FullscreenButton();
  private readonly soundButton = new SoundButton();
  private readonly fullscreenHint = new FullscreenHint();

  override async init() {
    // Build checkerboard tiling background
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
    this.background.texture = this.app.renderer.generateTexture({ target: tile, resolution: 2 });
    this.background.tint = 0x1a1a2e;
    this.addChild(this.background);

    this.title.anchor.set(0.5);
    this.title.position.set(500, 200);
    this.addChild(this.title);

    const buttonSpacing = 70;
    const totalHeight = (entries.length - 1) * buttonSpacing;
    const startY = 500 - totalHeight / 2;

    for (let i = 0; i < entries.length; i++) {
      const button = this.createButton(entries[i].label, () => {
        location.hash = `#/${entries[i].route}`;
      });
      button.position.set(500 - 120, startY + i * buttonSpacing);
      this.buttons.addChild(button);
    }

    this.addChild(this.buttons);

    this.fullscreenHint.position.set(500, startY + entries.length * buttonSpacing + 40);
    this.fullscreenButton.zIndex = 10000;
    this.soundButton.zIndex = 10000;
    this.sortableChildren = true;
    this.addChild(this.fullscreenHint, this.fullscreenButton, this.soundButton);
  }

  override onResize(screenWidth: number, screenHeight: number) {
    const s = this.scale.x;
    const localLeft = -this.position.x / s;
    const localTop = -this.position.y / s;
    this.background.position.set(localLeft, localTop);
    this.background.width = screenWidth / s;
    this.background.height = screenHeight / s;

    this.fullscreenButton.placeTopRight(localLeft + screenWidth / s, localTop, 0);
    this.soundButton.placeTopRight(localLeft + screenWidth / s, localTop, 1);
  }

  private createButton(label: string, onClick: () => void) {
    const container = new Container();
    const bg = new Graphics().roundRect(0, 0, 240, 50, 12).fill({ color: 0x3a3a5c }).stroke({ color: 0x8888aa });
    const text = new Text({ text: label, style: { fontSize: 18, fill: 0xffffff, fontFamily: "Anta" } });
    text.anchor.set(0.5);
    text.position.set(120, 25);

    container.addChild(bg, text);
    container.eventMode = "static";
    container.cursor = "pointer";
    container.on("pointerdown", onClick);

    return container;
  }
}
