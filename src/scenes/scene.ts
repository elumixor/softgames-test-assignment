import { Container } from "pixi.js";

export const DESIGN_SIZE = 1000;

export abstract class Scene extends Container {
  abstract init(): void | Promise<void>;

  // Called by SceneManager after setting scale/position
  onResize?(_screenWidth: number, _screenHeight: number): void;

  override destroy() {
    super.destroy({ children: true });
  }
}
