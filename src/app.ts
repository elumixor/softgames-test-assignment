import { di } from "@elumixor/di";
import { Application } from "pixi.js";

export const App = di.injectable(
  class App {
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
      await this.pixi.init({ background: "#1a1a2e", resizeTo: window });
      document.body.appendChild(this.pixi.canvas);
    }
  },
);
