import { sprite } from "@utils";
import { Container, Graphics, Text, type Texture } from "pixi.js";

const AVATAR_SIZE = 56;

export class Avatar extends Container {
  constructor(name: string, texture: Texture | undefined) {
    super();

    const r = AVATAR_SIZE / 2;

    const circleBg = new Graphics().circle(r, r, r).fill({ color: 0xfff5e0 }).stroke({ color: 0x3b2414, width: 3 });

    if (texture) {
      const avatarSprite = sprite(texture);
      avatarSprite.width = AVATAR_SIZE;
      avatarSprite.height = AVATAR_SIZE;
      const mask = new Graphics().circle(r, r, r).fill({ color: 0xffffff });
      this.addChild(circleBg, avatarSprite, mask);
      avatarSprite.mask = mask;
    } else {
      const initial = new Text({
        text: name[0],
        style: { fontSize: 24, fill: 0xffffff, fontFamily: "Sour Gummy" },
      });
      initial.anchor.set(0.5);
      initial.position.set(r, r);
      this.addChild(circleBg, initial);
    }
  }
}
