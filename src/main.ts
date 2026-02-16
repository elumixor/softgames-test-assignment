import "@elumixor/extensions";
import "pixi.js/advanced-blend-modes";
import "./utils/extensions";
import { Assets } from "pixi.js";
import { App } from "./app";
import { FpsCounter } from "./components/fps-counter";
import { SceneManager } from "./scenes/scene-manager";
import { SoundManager } from "./sound-manager";

async function main() {
  const app = new App();
  await app.init();
  await Assets.load([
    "assets/fonts/anta.ttf",
    "assets/fonts/sour-gummy.ttf",
    "assets/ui/left.png",
    "assets/ui/fullscreen.png",
    "assets/ui/sound.png",
    "assets/ui/no-sound.png",
  ]);

  new SoundManager();
  const fpsCounter = new FpsCounter();
  app.stage.addChild(fpsCounter);

  const sceneManager = new SceneManager();

  await sceneManager.navigateToRoute();

  window.addEventListener("resize", () => sceneManager.resize());
  window.addEventListener("hashchange", () => void sceneManager.navigateToRoute());

}

main().catch((e: Error) => console.error(`Failed to start application: ${e.message}`));
