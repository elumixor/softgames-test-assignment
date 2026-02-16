import { di } from "@elumixor/di";
import { App } from "@services/app";
import { Container, type GenerateTextureOptions, type Texture } from "pixi.js";

declare module "pixi.js" {
  interface Container {
    /**
     * Scales the container uniformly to fit within the specified bounds (contain mode).
     * The container will be scaled down to fit entirely within the bounds while maintaining aspect ratio.
     * @param maxWidth - Maximum width to fit within
     * @param maxHeight - Maximum height to fit within
     */
    containTo(maxWidth: number, maxHeight: number): void;

    /**
     * Scales the container uniformly to cover the specified bounds (cover mode).
     * The container will be scaled up to cover the entire bounds while maintaining aspect ratio.
     * @param maxWidth - Width to cover
     * @param maxHeight - Height to cover
     */
    coverTo(maxWidth: number, maxHeight: number): void;

    /**
     * Gets or sets a uniform scale value for both x and y axes.
     * Getter returns scale.x, setter sets both scale.x and scale.y to the same value.
     */
    scaleUniform: number;

    /**
     * Sets the height while maintaining uniform scaling (aspect ratio preserved).
     * Resets scale to 1, sets height, then matches scale.x to scale.y.
     * Getter returns the current height.
     */
    uniformHeight: number;

    /**
     * Sets the width while maintaining uniform scaling (aspect ratio preserved).
     * Resets scale to 1, sets width, then matches scale.y to scale.x.
     * Getter returns the current width.
     */
    uniformWidth: number;

    /**
     * Generates a texture from this container using the renderer.
     * @param options - Texture generation options (excluding target, which is set to this container)
     */
    toTexture(options?: Omit<GenerateTextureOptions, "target">): Texture;
  }
}

Reflect.defineProperty(Container.prototype, "containTo", {
  value(this: Container, maxWidth: number, maxHeight: number): void {
    this.scale.set(1);

    const scaleX = maxWidth / this.width;
    const scaleY = maxHeight / this.height;
    const scale = Math.min(scaleX, scaleY);

    this.scale.set(scale);
  },
});

Reflect.defineProperty(Container.prototype, "coverTo", {
  value(this: Container, maxWidth: number, maxHeight: number): void {
    this.scale.set(1);

    const scaleX = maxWidth / this.width;
    const scaleY = maxHeight / this.height;
    const scale = Math.max(scaleX, scaleY);

    this.scale.set(scale);
  },
});

Reflect.defineProperty(Container.prototype, "scaleUniform", {
  get(this: Container): number {
    return this.scale.x;
  },
  set(this: Container, value: number): void {
    this.scale.set(value);
  },
});

Reflect.defineProperty(Container.prototype, "uniformHeight", {
  set(this: Container, value: number): void {
    this.scale.set(1);
    this.height = value;
    this.scale.x = this.scale.y;
  },
  get(this: Container): number {
    return this.height;
  },
});

Reflect.defineProperty(Container.prototype, "uniformWidth", {
  set(this: Container, value: number): void {
    this.scale.set(1);
    this.width = value;
    this.scale.y = this.scale.x;
  },
  get(this: Container): number {
    return this.width;
  },
});

Reflect.defineProperty(Container.prototype, "toTexture", {
  value(this: Container, options?: Omit<GenerateTextureOptions, "target">): Texture {
    const { renderer } = di.inject(App);
    return renderer.generateTexture({ ...options, target: this });
  },
});
