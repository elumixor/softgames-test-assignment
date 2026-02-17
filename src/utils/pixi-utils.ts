import { Assets, Graphics, Sprite, type Texture } from "pixi.js";

export function texture(path: string): Texture {
  return Assets.get<Texture>(path);
}

export function sprite(source: string | Texture): Sprite {
  return new Sprite(typeof source === "string" ? texture(source) : source);
}

export function rectSprite({
  width = 2,
  height = 2,
  color = 0,
  alpha = 1,
}: {
  width?: number;
  height?: number;
  color?: number;
  alpha?: number;
}): Sprite {
  const graphics = new Graphics();
  graphics.rect(0, 0, width, height).fill({ color, alpha });
  const generatedTexture = graphics.toTexture();
  graphics.destroy();
  return new Sprite(generatedTexture);
}
