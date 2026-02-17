import { BackButton } from "@components/buttons/back-button";
import { FullscreenButton } from "@components/buttons/fullscreen-button";
import { SoundButton } from "@components/buttons/sound-button";
import { di } from "@elumixor/di";
import { App } from "@services/app";
import type { Container } from "pixi.js";
import { AceOfShadowsScene } from "./ace-of-shadows/ace-of-shadows-scene";
import { MagicWordsScene } from "./magic-words/magic-words-scene";
import { MenuScene } from "./menu/menu-scene";
import { PhoenixFlameScene } from "./phoenix-flame/phoenix-flame-scene";

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
