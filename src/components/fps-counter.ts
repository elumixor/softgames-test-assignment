import { di } from "@elumixor/di";
import { Text } from "pixi.js";
import { App } from "../app";

@di.injectable
export class FpsCounter extends Text {
  private readonly app = di.inject(App);

  constructor() {
    super({
      text: "FPS: 0",
      style: { fontSize: 14, fill: 0xffffff, fontFamily: "monospace" },
    });

    this.position.set(8, 8);
    this.app.ticker.add(() => {
      this.text = `FPS: ${Math.round(this.app.ticker.FPS)}`;
    });
  }
}
