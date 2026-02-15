import { di } from "@elumixor/di";
import { Application } from "pixi.js";

@di.injectable
export class App {
  private readonly pixi = new Application();

  get stage() {
    return this.pixi.stage;
  }

  get screen() {
    return this.pixi.screen;
  }

  get ticker() {
    return this.pixi.ticker;
  }

  get renderer() {
    return this.pixi.renderer;
  }

  async init() {
    await this.pixi.init({
      background: "#1a1a2e",
      resizeTo: window,
      resolution: window.devicePixelRatio,
      useBackBuffer: true,
    });
    document.body.appendChild(this.pixi.canvas);
  }
}
