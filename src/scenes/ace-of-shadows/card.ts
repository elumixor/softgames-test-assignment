import { Assets, Sprite, type Spritesheet } from "pixi.js";

export const CARD_WIDTH = 512;
export const CARD_HEIGHT = 896;

type CardType = "warrior" | "rogue" | "mage" | "bard";
type CardColor = "red" | "blue" | "orange";

const cardTypes: CardType[] = ["warrior", "rogue", "mage", "bard"];
const cardColors: CardColor[] = ["red", "blue", "orange"];

export async function loadCardSprites(): Promise<Sprite[]> {
  const sheet = await Assets.load<Spritesheet>("generated/ace-of-shadows-cards.json");
  const sprites: Sprite[] = [];

  for (const type of cardTypes) {
    for (const color of cardColors) {
      for (let level = 1; level <= 12; level++) {
        const key = `${type}_${color}_${level}`;
        const texture = sheet.textures[key];
        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5);
        sprites.push(sprite);
      }
    }
  }

  return sprites;
}
