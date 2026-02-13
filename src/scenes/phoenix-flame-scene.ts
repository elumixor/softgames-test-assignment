import { di } from "@elumixor/di";
import { Text } from "pixi.js";
import { BackButton } from "../components/back-button";
import { Scene } from "./scene";
import { SceneManager } from "./scene-manager";

export class PhoenixFlameScene extends Scene {
  private readonly sceneManager = di.inject(SceneManager);
  private readonly title = new Text({ text: "Phoenix Flame", style: { fontSize: 28, fill: 0xffffff } });
  private readonly backButton = new BackButton(() => void this.sceneManager.switchTo(new MenuScene()));

  override init() {
    this.title.anchor.set(0.5);
    this.addChild(this.title, this.backButton);
  }

  override resize(width: number, height: number) {
    this.title.position.set(width / 2, height / 2);
    this.backButton.placeTopRight(width);
  }
}

import { MenuScene } from "./menu-scene";
