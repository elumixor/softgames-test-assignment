import { Container, Graphics, Text } from "pixi.js";

export class BackButton extends Container {
  constructor(onBack: () => void) {
    super();

    const bg = new Graphics().roundRect(0, 0, 100, 36, 8).fill({ color: 0x444466 }).stroke({ color: 0x8888aa });
    const label = new Text({ text: "Back", style: { fontSize: 16, fill: 0xffffff, fontFamily: "Anta" } });
    label.anchor.set(0.5);
    label.position.set(50, 18);

    this.addChild(bg, label);
    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerdown", onBack);
  }

  placeTopRight(rightX: number, topY: number, padding = 16) {
    this.position.set(rightX - this.width - padding, topY + padding);
  }
}
