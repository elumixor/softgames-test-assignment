import { di } from "@elumixor/di";
import { Container, Graphics, Text } from "pixi.js";
import { Scene } from "./scene";
import { SceneManager } from "./scene-manager";

interface MenuEntry {
  label: string;
  load: () => Promise<Scene>;
}

const entries: MenuEntry[] = [
  { label: "Ace of Shadows", load: async () => new (await import("./ace-of-shadows-scene")).AceOfShadowsScene() },
  { label: "Magic Words", load: async () => new (await import("./magic-words-scene")).MagicWordsScene() },
  { label: "Phoenix Flame", load: async () => new (await import("./phoenix-flame-scene")).PhoenixFlameScene() },
];

export class MenuScene extends Scene {
  private readonly sceneManager = di.inject(SceneManager);
  private readonly title = new Text({ text: "Softgames Assignment", style: { fontSize: 32, fill: 0xffffff } });
  private readonly buttons = new Container();

  override init() {
    this.title.anchor.set(0.5);
    this.addChild(this.title);

    for (const entry of entries) {
      const button = this.createButton(entry.label, async () => {
        const scene = await entry.load();
        await this.sceneManager.switchTo(scene);
      });
      this.buttons.addChild(button);
    }

    this.addChild(this.buttons);
  }

  override resize(width: number, height: number) {
    this.title.position.set(width / 2, height * 0.2);

    const buttonSpacing = 70;
    const totalHeight = (this.buttons.children.length - 1) * buttonSpacing;
    const startY = height / 2 - totalHeight / 2;

    for (let i = 0; i < this.buttons.children.length; i++) {
      const btn = this.buttons.children[i];
      btn.position.set(width / 2 - 120, startY + i * buttonSpacing);
    }
  }

  private createButton(label: string, onClick: () => Promise<void>) {
    const container = new Container();
    const bg = new Graphics().roundRect(0, 0, 240, 50, 12).fill({ color: 0x3a3a5c }).stroke({ color: 0x8888aa });
    const text = new Text({ text: label, style: { fontSize: 18, fill: 0xffffff } });
    text.anchor.set(0.5);
    text.position.set(120, 25);

    container.addChild(bg, text);
    container.eventMode = "static";
    container.cursor = "pointer";
    container.on("pointerdown", () => void onClick());

    return container;
  }
}
