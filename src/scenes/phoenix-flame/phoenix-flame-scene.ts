import { di } from "@elumixor/di";
import { Graphics, Text } from "pixi.js";
import { App } from "../../app";
import { BackButton } from "../../components/back-button";
import { FullscreenButton } from "../../components/fullscreen-button";
import { Scene } from "../scene";
import { FireControls } from "./fire-controls";
import { FireFilter } from "./fire-filter";

export class PhoenixFlameScene extends Scene {
  private readonly app = di.inject(App);
  private readonly title = new Text({
    text: "Phoenix Flame",
    style: { fontSize: 28, fill: 0xffffff, fontFamily: "Anta" },
  });
  private readonly backButton = new BackButton(() => {
    location.hash = "";
  });
  private readonly fullscreenButton = new FullscreenButton();

  private readonly fireBase = new Graphics();
  private readonly fireFilter = new FireFilter();
  private controls?: FireControls;

  override init() {
    this.title.anchor.set(0.5);
    this.title.position.set(500, 50);

    this.fireBase.filters = [this.fireFilter];

    this.addChild(this.fireBase, this.title, this.backButton, this.fullscreenButton);

    this.app.ticker.add(this.tick, this);
    this.controls = new FireControls(this.fireFilter);
  }

  override onResize(screenWidth: number, screenHeight: number) {
    const s = this.scale.x;
    const localLeft = -this.position.x / s;
    const localTop = -this.position.y / s;
    const localWidth = screenWidth / s;
    const localHeight = screenHeight / s;
    const localRight = localLeft + localWidth;

    // Redraw fire base to cover entire screen in local coords
    this.fireBase.clear();
    this.fireBase.rect(localLeft, localTop, localWidth, localHeight).fill(0xffffff);

    this.fullscreenButton.placeTopRight(localRight, localTop, 0);
    this.backButton.placeTopRight(localRight, localTop, 1);
  }

  override destroy() {
    this.controls?.destroy();
    this.app.ticker.remove(this.tick, this);
    super.destroy();
  }

  private tick = () => {
    this.fireFilter.time += this.app.ticker.deltaMS / 1000;
  };
}
