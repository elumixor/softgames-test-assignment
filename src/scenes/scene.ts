import { di } from "@elumixor/di";
import type { ISubscription } from "@elumixor/event-emitter";
import { App, type ResizeData } from "@services/app";
import { Container } from "pixi.js";
import { type ComputedDimensions, computeDimensions, type SceneDimensions } from "./scene-dimensions";

export interface SceneResizeData extends ResizeData {
  scale: number;
  localLeft: number;
  localTop: number;
  localWidth: number;
  localHeight: number;
}

/**
 * Base scene class that handles automatic scaling and centering
 */
export abstract class Scene extends Container {
  protected readonly app = di.inject(App);
  private readonly dimensions: ComputedDimensions;
  private $resize?: ISubscription<ResizeData>;

  constructor(dimensions: SceneDimensions) {
    super();
    this.dimensions = computeDimensions(dimensions);

    // Delay this one frame so that the scene is fully constructed before we start receiving resize events
    this.app.ticker.addOnce(() => {
      this.$resize = this.app.resized.subscribeImmediate((data) => this.handleResize(data));
    });
  }

  private handleResize(data: ResizeData): void {
    const { width, height } = data;

    const {
      minWidth,
      minHeight,
      maxWidth = Infinity,
      maxHeight = Infinity,
    } = width <= height ? this.dimensions.portrait : this.dimensions.landscape;

    const minScale = Math.min(width / minWidth, height / minHeight);
    const maxScale = Math.min(maxWidth / minWidth, maxHeight / minHeight);
    const scale = Math.min(minScale, maxScale);

    this.scale.set(scale);
    this.position.set(width / 2, height / 2);

    const localLeft = -(width / 2) / scale;
    const localTop = -(height / 2) / scale;
    const localWidth = width / scale;
    const localHeight = height / scale;

    this.resize({ width, height, scale, localLeft, localTop, localWidth, localHeight });
  }

  // biome-ignore lint: Override in child classes if needed
  protected resize(_data: SceneResizeData): void {}

  override destroy(): void {
    this.$resize?.unsubscribe();
    super.destroy();
  }
}
