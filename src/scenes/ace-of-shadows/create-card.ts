import { ASSETS } from "@services/assets";
import { sprite } from "@utils";
import { Container, Graphics, Text } from "pixi.js";

export const cardTypes = ["warrior", "rogue", "mage", "bard"] as const;
export type CardType = (typeof cardTypes)[number];

const colors = {
  red: 0xfe5252,
  blue: 0x66bfff,
  orange: 0xfea25f,
};
export type CardColor = keyof typeof colors;

export interface CardDimensions {
  width: number;
  height: number;
  cornerRadius: number;
  borderInset: number;
  padding: number;
  circleRadius: number;
}

export function createCard(
  { width, height, cornerRadius, borderInset, padding, circleRadius }: CardDimensions,
  type: CardType,
  color: CardColor,
  level: number,
): Container {
  const card = new Container();

  const mask = new Graphics().roundRect(0, 0, width, height, cornerRadius).fill(0xffffff);
  card.addChild(mask);
  card.mask = mask;

  const img = sprite(`assets/cards/${type}.png`);
  img.anchor.set(0.5);
  img.position.set(width / 2, height / 2);
  img.coverTo(width, height);
  card.addChild(img);

  const overlay = new Graphics().rect(0, 0, width, height).fill(colors[color]);
  overlay.blendMode = "darken";
  card.addChild(overlay);

  const grad = sprite(ASSETS.CARD_GRADIENT);
  grad.uniformWidth = width;
  grad.y = height - grad.height;
  card.addChild(grad);

  const innerR = Math.max(cornerRadius - borderInset, 0);
  card.addChild(
    new Graphics()
      .roundRect(borderInset, borderInset, width - borderInset * 2, height - borderInset * 2, innerR)
      .stroke({ color: 0xffffff, width: 1.2, alpha: 0.4 }),
  );

  const textLayer = new Container();
  textLayer.blendMode = "difference";

  const typeText = new Text({
    text: type.capitalize(),
    style: { fontFamily: "Fireside", fill: 0xcccccc, fontSize: 20 },
  });
  typeText.anchor.set(0, 1);
  typeText.position.set(padding, height - padding);
  textLayer.addChild(typeText);

  const cx = width - padding - circleRadius;
  const cy = height - padding - circleRadius;
  const circle = new Graphics().circle(cx, cy, circleRadius).stroke({ color: 0xcccccc, width: 2 });
  textLayer.addChild(circle);

  const levelText = new Text({
    text: String(level),
    style: { fontFamily: "Fireside", fill: 0xcccccc, fontSize: level >= 10 ? 16 : 23 },
  });
  levelText.anchor.set(0.5);
  levelText.position.set(cx, cy);
  textLayer.addChild(levelText);

  card.addChild(textLayer);

  return card;
}
