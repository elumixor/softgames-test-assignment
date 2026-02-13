import { di } from "@elumixor/di";
import { Text } from "pixi.js";
import { App } from "../app";

export const FpsCounter = di.injectable(
  class FpsCounter {
    private readonly app = di.inject(App);
    private readonly text = new Text({
      text: "FPS: 0",
      style: { fontSize: 14, fill: 0xffffff, fontFamily: "monospace" },
    });

    init() {
      this.text.position.set(8, 8);
      this.app.stage.addChild(this.text);
      this.app.ticker.add(() => {
        this.text.text = `FPS: ${Math.round(this.app.ticker.FPS)}`;
      });
    }

    bringToFront() {
      this.app.stage.removeChild(this.text);
      this.app.stage.addChild(this.text);
    }
  },
);
