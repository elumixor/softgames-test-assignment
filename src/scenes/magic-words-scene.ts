import { Text } from "pixi.js";
import { BackButton } from "../components/back-button";
import { Scene } from "./scene";

export class MagicWordsScene extends Scene {
  private readonly title = new Text({ text: "Magic Words", style: { fontSize: 28, fill: 0xffffff } });
  private readonly backButton = new BackButton(() => {
    location.hash = "";
  });

  override init() {
    this.title.anchor.set(0.5);
    this.title.position.set(500, 500);
    this.addChild(this.title, this.backButton);
  }

  override onResize(screenWidth: number, _screenHeight: number) {
    const s = this.scale.x;
    const localRight = (screenWidth - this.position.x) / s;
    const localTop = -this.position.y / s;
    this.backButton.placeTopRight(localRight, localTop);
  }
}
