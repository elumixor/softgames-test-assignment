import { Container, Graphics, Text } from "pixi.js";
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
  private readonly title = new Text({ text: "Softgames Assignment", style: { fontSize: 32, fill: 0xffffff } });
  private readonly buttons = new Container();

  override init() {
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
  }

  private createButton(label: string, onClick: () => void) {
    const container = new Container();
    const bg = new Graphics().roundRect(0, 0, 240, 50, 12).fill({ color: 0x3a3a5c }).stroke({ color: 0x8888aa });
    const text = new Text({ text: label, style: { fontSize: 18, fill: 0xffffff } });
    text.anchor.set(0.5);
    text.position.set(120, 25);

    container.addChild(bg, text);
    container.eventMode = "static";
    container.cursor = "pointer";
    container.on("pointerdown", onClick);

    return container;
  }
}
