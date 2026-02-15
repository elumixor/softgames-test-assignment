import { di } from "@elumixor/di";
import { App } from "../app";
import { FpsCounter } from "../components/fps-counter";
import type { Scene } from "./scene";
import { DESIGN_SIZE } from "./scene";

type RouteId = "ace-of-shadows" | "magic-words" | "phoenix-flame";

const routeLoaders: Record<RouteId, () => Promise<Scene>> = {
  "ace-of-shadows": async () => new (await import("./ace-of-shadows/ace-of-shadows-scene")).AceOfShadowsScene(),
  "magic-words": async () => new (await import("./magic-words/magic-words-scene")).MagicWordsScene(),
  "phoenix-flame": async () => new (await import("./phoenix-flame/phoenix-flame-scene")).PhoenixFlameScene(),
};

@di.injectable
export class SceneManager {
  private readonly app = di.inject(App);
  private readonly fpsCounter = di.inject(FpsCounter, { optional: true });

  private currentScene?: Scene;

  async switchTo(scene: Scene, route?: RouteId | "") {
    if (this.currentScene) {
      this.app.stage.removeChild(this.currentScene);
      this.currentScene.destroy();
    }

    this.currentScene = scene;
    this.app.stage.addChild(scene);
    await scene.init();
    this.resize();

    if (this.fpsCounter) this.app.stage.addChild(this.fpsCounter);

    if (route !== undefined) location.hash = route ? `#/${route}` : "";
  }

  async navigateToRoute() {
    const hash = location.hash.replace("#/", "");
    if (hash in routeLoaders) {
      const scene = await routeLoaders[hash as RouteId]();
      await this.switchTo(scene);
    } else {
      const { MenuScene } = await import("./menu-scene");
      await this.switchTo(new MenuScene());
    }
  }

  resize() {
    this.app.renderer.resolution = window.devicePixelRatio;
    this.app.renderer.resize(window.innerWidth, window.innerHeight);

    if (!this.currentScene) return;

    const { width, height } = this.app.screen;
    const scale = Math.min(width / DESIGN_SIZE, height / DESIGN_SIZE);
    this.currentScene.scale.set(scale);
    this.currentScene.position.set((width - DESIGN_SIZE * scale) / 2, (height - DESIGN_SIZE * scale) / 2);
    this.currentScene.onResize?.(width, height);
  }
}
