import { ASSETS } from "@services/assets";
import { sprite, texture } from "@utils";
import { Container, Graphics, Rectangle, RenderTexture, type Sprite, Text, Texture } from "pixi.js";
import "pixi.js/advanced-blend-modes";

export const CARD_WIDTH = 768;
export const CARD_HEIGHT = 1344;
const CORNER_RADIUS = 50;
const BORDER_INSET = 15;
const PADDING: number = BORDER_INSET + 30;
const CIRCLE_R = 45;

type CardType = "warrior" | "rogue" | "mage" | "bard";
type CardColor = "red" | "blue" | "orange";

const colorHex: Record<CardColor, number> = {
  red: 0xfe5252,
  blue: 0x66bfff,
  orange: 0xfea25f,
};

const cardTypes: CardType[] = ["warrior", "rogue", "mage", "bard"];
const cardColors: CardColor[] = ["red", "blue", "orange"];

interface CardAssets {
  images: Record<CardType, Texture>;
  gradient: Texture;
}

// Atlas layout
const ATLAS_COLS = 16;
const ATLAS_ROWS = 9;

/** Load assets, build all 144 cards, bake into a single atlas RenderTexture, return Sprites. */
export function loadCardSprites(): Sprite[] {
  const assets: CardAssets = {
    images: {
      warrior: texture(ASSETS.CARD_WARRIOR),
      rogue: texture(ASSETS.CARD_ROGUE),
      mage: texture(ASSETS.CARD_MAGE),
      bard: texture(ASSETS.CARD_BARD),
    },
    gradient: texture(ASSETS.CARD_GRADIENT),
  };
  const textAtlas = buildTextAtlas();

  // Build grid of all 144 cards positioned in atlas layout
  const grid = new Container();
  let idx = 0;

  for (const type of cardTypes) {
    for (const color of cardColors) {
      for (let level = 1; level <= 12; level++) {
        const card = buildCardContainer(assets, textAtlas, type, color, level);
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

  // Free intermediate text atlas textures
  for (const t of Object.values(textAtlas.typeNames)) t.destroy();
  for (const t of Object.values(textAtlas.levels)) t.destroy();
  textAtlas.circle.destroy();

  // Create sprites from atlas sub-textures
  const sprites: Sprite[] = [];
  for (let i = 0; i < idx; i++) {
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

  return sprites;
}

// --- Text atlas (shared pre-rendered text/circle textures) ---

interface TextAtlas {
  typeNames: Record<CardType, Texture>;
  levels: Record<number, Texture>;
  circle: Texture;
}

function buildTextAtlas(): TextAtlas {
  const fontStyle = { fontFamily: "Fireside", fill: 0xcccccc } as const;

  const typeNames = {} as Record<CardType, Texture>;
  for (const type of cardTypes) {
    const text = new Text({
      text: type.charAt(0).toUpperCase() + type.slice(1),
      style: { ...fontStyle, fontSize: 64 },
    });
    const rt = RenderTexture.create({ width: Math.ceil(text.width), height: Math.ceil(text.height) });
    rt.render(text);
    typeNames[type] = rt;
    text.destroy();
  }

  const levels = {} as Record<number, Texture>;
  for (let l = 1; l <= 12; l++) {
    const text = new Text({
      text: String(l),
      style: { ...fontStyle, fontSize: l >= 10 ? 42 : 60 },
    });
    const rt = RenderTexture.create({ width: Math.ceil(text.width), height: Math.ceil(text.height) });
    rt.render(text);
    levels[l] = rt;
    text.destroy();
  }

  const circleGfx = new Graphics().circle(CIRCLE_R + 3, CIRCLE_R + 3, CIRCLE_R).stroke({ color: 0xcccccc, width: 5 });
  const circleSize = (CIRCLE_R + 3) * 2;
  const circleRt = RenderTexture.create({ width: circleSize, height: circleSize });
  circleRt.render(circleGfx);
  circleGfx.destroy();

  return { typeNames, levels, circle: circleRt };
}

// --- Card container builder ---

function buildCardContainer(
  assets: CardAssets,
  atlas: TextAtlas,
  type: CardType,
  color: CardColor,
  level: number,
): Container {
  const card = new Container();

  const mask = new Graphics().roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS).fill(0xffffff);
  card.addChild(mask);
  card.mask = mask;

  const img = sprite(assets.images[type]);
  img.anchor.set(0.5);
  img.position.set(CARD_WIDTH / 2, CARD_HEIGHT / 2);
  img.coverTo(CARD_WIDTH, CARD_HEIGHT);
  card.addChild(img);

  const overlay = new Graphics().rect(0, 0, CARD_WIDTH, CARD_HEIGHT).fill(colorHex[color]);
  overlay.blendMode = "darken";
  card.addChild(overlay);

  const grad = sprite(assets.gradient);
  grad.uniformWidth = CARD_WIDTH;
  grad.y = CARD_HEIGHT - grad.height;
  card.addChild(grad);

  const innerR = Math.max(CORNER_RADIUS - BORDER_INSET, 0);
  card.addChild(
    new Graphics()
      .roundRect(BORDER_INSET, BORDER_INSET, CARD_WIDTH - BORDER_INSET * 2, CARD_HEIGHT - BORDER_INSET * 2, innerR)
      .stroke({ color: 0xffffff, width: 3, alpha: 0.4 }),
  );

  const textLayer = new Container();
  textLayer.blendMode = "difference";

  const typeSprite = sprite(atlas.typeNames[type]);
  typeSprite.anchor.set(0, 1);
  typeSprite.position.set(PADDING, CARD_HEIGHT - PADDING);
  textLayer.addChild(typeSprite);

  const cx = CARD_WIDTH - PADDING - CIRCLE_R;
  const cy = CARD_HEIGHT - PADDING - CIRCLE_R;

  const circleSprite = sprite(atlas.circle);
  circleSprite.anchor.set(0.5);
  circleSprite.position.set(cx, cy);
  textLayer.addChild(circleSprite);

  const levelSprite = sprite(atlas.levels[level]);
  levelSprite.anchor.set(0.5);
  levelSprite.position.set(cx, cy);
  textLayer.addChild(levelSprite);

  card.addChild(textLayer);

  return card;
}
