import "@elumixor/extensions";
import { LoadingScene } from "@scenes/loading";
import { SceneManager } from "@scenes/scene-manager";
import { App } from "@services/app";
import { AssetLoader } from "@services/asset-loader";
import { SoundManager } from "@services/sounds";
import "@utils/extensions";
import "pixi.js/advanced-blend-modes";
import Stats from "stats.js";

async function main(): Promise<void> {
  const app = new App();
  await app.init();

  new SoundManager();
  new AssetLoader();

  // Show FPS stats
  const stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);
  app.ticker.add(() => {
    stats.update();
  });

  // Show loading scene first
  const loadingScene = new LoadingScene();
  app.stage.addChild(loadingScene);
  await loadingScene.load();

  // Fade out loading scene smoothly
  await loadingScene.fadeOut();
  app.stage.removeChild(loadingScene);

  new SceneManager();
}

main().catch((e: Error) => console.error(`Failed to start application: ${e.message}`));
