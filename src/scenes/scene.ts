import { Container } from "pixi.js";

export abstract class Scene extends Container {
  abstract init(): void | Promise<void>;

  // biome-ignore lint/suspicious/noEmptyBlockStatements: virtual method for subclasses to override
  resize(_width: number, _height: number) {}

  override destroy() {
    super.destroy({ children: true });
  }
}
