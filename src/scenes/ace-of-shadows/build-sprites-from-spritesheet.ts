import { range, sprite } from "@utils";
import { Container, Rectangle, RenderTexture, type Sprite, Texture } from "pixi.js";
import "pixi.js/advanced-blend-modes";
import { CARD_HEIGHT, CARD_WIDTH, cardDimensions } from "./card-dimensions";
import { type CardColor, cardTypes, createCard } from "./create-card";

const cardColors: CardColor[] = ["red", "blue", "orange"];

// Atlas layout
const ATLAS_COLS = 16;
const ATLAS_ROWS = 9;

/** Load assets, build all 144 cards, bake into a single atlas RenderTexture, return Sprites. */
export function loadCardSprites(): Sprite[] {
  // Build grid of all 144 cards positioned in atlas layout
  const grid = new Container();
  let idx = 0;

  for (const type of cardTypes) {
    for (const color of cardColors) {
      for (const level of range(1, 13)) {
        const card = createCard(cardDimensions, type, color, level);
        card.position.set((idx % ATLAS_COLS) * CARD_WIDTH, Math.floor(idx / ATLAS_COLS) * CARD_HEIGHT);
        grid.addChild(card);
        idx++;
      }
    }
  }

  // Bake entire grid into a single atlas RenderTexture.
  const atlasRt = RenderTexture.create({
    width: ATLAS_COLS * CARD_WIDTH,
    height: ATLAS_ROWS * CARD_HEIGHT,
  });

  atlasRt.render(grid);
  grid.destroy({ children: true });

  // Create sprites from atlas sub-textures
  const sprites: Sprite[] = [];
  for (const i of range(idx)) {
    const col = i % ATLAS_COLS;
    const row = Math.floor(i / ATLAS_COLS);
    const texture = new Texture({
      source: atlasRt.source,
      frame: new Rectangle(col * CARD_WIDTH, row * CARD_HEIGHT, CARD_WIDTH, CARD_HEIGHT),
    });
    const cardSprite = sprite(texture);
    cardSprite.anchor.set(0.5);
    sprites.push(cardSprite);
  }

  // Clean up atlas RenderTexture (the individual card sprites will keep the source alive)
  atlasRt.destroy();

  return sprites;
}
