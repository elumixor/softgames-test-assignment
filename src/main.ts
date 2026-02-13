import "@elumixor/extensions";
import { App } from "./app";
import { FpsCounter } from "./components/fps-counter";
import { MenuScene } from "./scenes/menu-scene";
import { SceneManager } from "./scenes/scene-manager";

async function main() {
  const app = new App();
  await app.init();

  const sceneManager = new SceneManager();
  const fpsCounter = new FpsCounter();
  fpsCounter.init();

  await sceneManager.switchTo(new MenuScene());

  window.addEventListener("resize", () => sceneManager.resize());
}

main().catch((e: Error) => console.error(`Failed to start application: ${e.message}`));
