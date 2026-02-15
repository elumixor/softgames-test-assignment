import "@elumixor/extensions";
import "pixi.js/advanced-blend-modes";
import "./utils/extensions";
import { Assets } from "pixi.js";
import { App } from "./app";
import { FpsCounter } from "./components/fps-counter";
import { SceneManager } from "./scenes/scene-manager";

async function main() {
  const app = new App();
  await app.init();
  await Assets.load("assets/fonts/anta.ttf");

  const fpsCounter = new FpsCounter();
  app.stage.addChild(fpsCounter);

  const sceneManager = new SceneManager();

  await sceneManager.navigateToRoute();

  window.addEventListener("resize", () => sceneManager.resize());
  window.addEventListener("hashchange", () => void sceneManager.navigateToRoute());
}

main().catch((e: Error) => console.error(`Failed to start application: ${e.message}`));
