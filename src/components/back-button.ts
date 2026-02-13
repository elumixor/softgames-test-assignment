import { Container, Graphics, Text } from "pixi.js";

export class BackButton extends Container {
  constructor(onBack: () => void) {
    super();

    const bg = new Graphics().roundRect(0, 0, 100, 36, 8).fill({ color: 0x444466 }).stroke({ color: 0x8888aa });
    const label = new Text({ text: "Back", style: { fontSize: 16, fill: 0xffffff } });
    label.anchor.set(0.5);
    label.position.set(50, 18);

    this.addChild(bg, label);
    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerdown", onBack);
  }

  placeTopRight(screenWidth: number) {
    this.position.set(screenWidth - this.width - 16, 16);
  }
}
