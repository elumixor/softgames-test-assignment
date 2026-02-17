import { BackButton, FullscreenButton, SoundButton } from "@components/buttons";
import { di } from "@elumixor/di";
import { AceOfShadowsScene } from "@scenes/ace-of-shadows";
import { MagicWordsScene } from "@scenes/magic-words";
import { MenuScene } from "@scenes/menu";
import { PhoenixFlameScene } from "@scenes/phoenix-flame";
import { App } from "@services/app";
import type { Container } from "pixi.js";

type RouteId = "ace-of-shadows" | "magic-words" | "phoenix-flame";

const routeLoaders: Record<RouteId, () => Container> = {
  "ace-of-shadows": () => new AceOfShadowsScene(),
  "magic-words": () => new MagicWordsScene(),
  "phoenix-flame": () => new PhoenixFlameScene(),
};

const BUTTON_SIZE = 30;
const BUTTON_PADDING = 12;
const BUTTON_GAP = 8;

@di.injectable
export class SceneManager {
  private readonly app = di.inject(App);

  private readonly backButton = new BackButton();
  private readonly fullscreenButton = new FullscreenButton();
  private readonly soundButton = new SoundButton();
  private readonly buttons = [this.fullscreenButton, this.soundButton, this.backButton];

  private currentScene?: Container;

  constructor() {
    this.app.resized.subscribeImmediate(this.resize);

    window.addEventListener("hashchange", () => this.navigate());

    this.navigate();
  }

  private navigate(): void {
    const hash = location.hash.replace("#/", "") as RouteId;

    this.currentScene?.destroy();

    if (hash in routeLoaders) this.currentScene = routeLoaders[hash]();
    else this.currentScene = new MenuScene();

    this.app.stage.addChild(this.currentScene, ...this.buttons);

    location.hash = hash ? `#/${hash}` : "";
    this.backButton.visible = hash in routeLoaders;
  }

  private readonly resize = (): void => {
    const half = BUTTON_SIZE / 2;
    const rightX = this.app.screen.width - BUTTON_PADDING - half;
    const topY = BUTTON_PADDING + half;

    for (const [i, button] of this.buttons.entries())
      button.position.set(rightX - i * (BUTTON_SIZE + BUTTON_GAP), topY);
  };
}
