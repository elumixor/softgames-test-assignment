import { Assets, Sprite, type Texture } from "pixi.js";

export function texture(path: string): Texture {
  return Assets.get<Texture>(path);
}

export function sprite(source: string | Texture): Sprite {
  return new Sprite(typeof source === "string" ? texture(source) : source);
}
