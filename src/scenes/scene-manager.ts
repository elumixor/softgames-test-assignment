import { di } from "@elumixor/di";
import { App } from "../app";
import { FpsCounter } from "../components/fps-counter";
import type { Scene } from "./scene";

export const SceneManager = di.injectable(
  class SceneManager {
    private readonly app = di.inject(App);
    private currentScene: Scene | undefined;

    async switchTo(scene: Scene) {
      if (this.currentScene) {
        this.app.stage.removeChild(this.currentScene);
        this.currentScene.destroy();
      }

      this.currentScene = scene;
      this.app.stage.addChild(scene);
      await scene.init();
      this.resize();

      const fpsCounter = di.inject(FpsCounter, { optional: true });
      if (fpsCounter) fpsCounter.bringToFront();
    }

    resize() {
      if (this.currentScene) this.currentScene.resize(this.app.screen.width, this.app.screen.height);
    }
  },
);
