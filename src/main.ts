import "@elumixor/extensions";
import "pixi.js/advanced-blend-modes";
import "./utils/extensions";
import { Assets } from "pixi.js";
import screenfull from "screenfull";
import { App } from "./app";
import { FpsCounter } from "./components/fps-counter";
import { SceneManager } from "./scenes/scene-manager";

async function main() {
  const app = new App();
  await app.init();
  await Assets.load([
    "assets/fonts/anta.ttf",
    "assets/fonts/sour-gummy.ttf",
    "assets/ui/left.png",
    "assets/ui/fullscreen.png",
  ]);

  const fpsCounter = new FpsCounter();
  app.stage.addChild(fpsCounter);

  const sceneManager = new SceneManager();

  await sceneManager.navigateToRoute();

  window.addEventListener("resize", () => sceneManager.resize());
  window.addEventListener("hashchange", () => void sceneManager.navigateToRoute());

  // Enter fullscreen on first user interaction (browsers require a gesture)
  if (screenfull.isEnabled) {
    const enterFullscreen = () => {
      if (!screenfull.isFullscreen) void screenfull.request();
      window.removeEventListener("pointerdown", enterFullscreen);
    };
    window.addEventListener("pointerdown", enterFullscreen);
  }
}

main().catch((e: Error) => console.error(`Failed to start application: ${e.message}`));
