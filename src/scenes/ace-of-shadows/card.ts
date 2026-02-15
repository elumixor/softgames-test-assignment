import "pixi.js/advanced-blend-modes";
import { Container, Graphics, type Renderer, RenderTexture, Sprite, Text, type Texture } from "pixi.js";

export const CARD_WIDTH = 768;
export const CARD_HEIGHT = 1344;
const CORNER_RADIUS = 50;
const BORDER_INSET = 15;
const PADDING = BORDER_INSET + 30;
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

export interface CardAssets {
  images: Record<CardType, Texture>;
  gradient: Texture;
}

/** Pre-rendered text/circle textures shared across all cards */
interface TextAtlas {
  typeNames: Record<CardType, Texture>;
  levels: Record<number, Texture>;
  circle: Texture;
}

function buildTextAtlas(renderer: Renderer): TextAtlas {
  const fontStyle = { fontFamily: "Fireside", fill: 0xcccccc } as const;

  // Pre-render type name labels
  const typeNames = {} as Record<CardType, Texture>;
  for (const type of cardTypes) {
    const text = new Text({
      text: type.charAt(0).toUpperCase() + type.slice(1),
      style: { ...fontStyle, fontSize: 64 },
    });
    const rt = RenderTexture.create({
      width: Math.ceil(text.width),
      height: Math.ceil(text.height),
      resolution: window.devicePixelRatio,
    });
    renderer.render({ container: text, target: rt });
    typeNames[type] = rt;
    text.destroy();
  }

  // Pre-render level numbers (1–12)
  const levels = {} as Record<number, Texture>;
  for (let l = 1; l <= 12; l++) {
    const text = new Text({
      text: String(l),
      style: { ...fontStyle, fontSize: l >= 10 ? 42 : 60 },
    });
    const rt = RenderTexture.create({
      width: Math.ceil(text.width),
      height: Math.ceil(text.height),
      resolution: window.devicePixelRatio,
    });
    renderer.render({ container: text, target: rt });
    levels[l] = rt;
    text.destroy();
  }

  // Pre-render circle stroke
  const circleGfx = new Graphics().circle(CIRCLE_R + 3, CIRCLE_R + 3, CIRCLE_R).stroke({ color: 0xcccccc, width: 5 });
  const circleSize = (CIRCLE_R + 3) * 2;
  const circleRt = RenderTexture.create({
    width: circleSize,
    height: circleSize,
    resolution: window.devicePixelRatio,
  });
  renderer.render({ container: circleGfx, target: circleRt });
  const circle = circleRt;
  circleGfx.destroy();

  return { typeNames, levels, circle };
}

export function generateAllCards(renderer: Renderer, assets: CardAssets): Container[] {
  const atlas = buildTextAtlas(renderer);
  const cards: Container[] = [];

  for (const type of cardTypes) {
    for (const color of cardColors) {
      for (let level = 1; level <= 12; level++) {
        cards.push(createCard(assets, atlas, type, color, level));
      }
    }
  }

  return cards;
}

function createCard(assets: CardAssets, atlas: TextAtlas, type: CardType, color: CardColor, level: number): Container {
  const card = new Container();

  const mask = new Graphics().roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS).fill(0xffffff);
  card.addChild(mask);
  card.mask = mask;

  const img = new Sprite(assets.images[type]);
  img.width = CARD_WIDTH;
  img.height = CARD_HEIGHT;
  card.addChild(img);

  const overlay = new Graphics().rect(0, 0, CARD_WIDTH, CARD_HEIGHT).fill(colorHex[color]);
  overlay.blendMode = "darken";
  card.addChild(overlay);

  const grad = new Sprite(assets.gradient);
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

  // Type name — left bottom (shared texture)
  const typeSprite = new Sprite(atlas.typeNames[type]);
  typeSprite.anchor.set(0, 1);
  typeSprite.position.set(PADDING, CARD_HEIGHT - PADDING);
  textLayer.addChild(typeSprite);

  // Level circle + number — right bottom (shared textures)
  const cx = CARD_WIDTH - PADDING - CIRCLE_R;
  const cy = CARD_HEIGHT - PADDING - CIRCLE_R;

  const circleSprite = new Sprite(atlas.circle);
  circleSprite.anchor.set(0.5);
  circleSprite.position.set(cx, cy);
  textLayer.addChild(circleSprite);

  const levelSprite = new Sprite(atlas.levels[level]);
  levelSprite.anchor.set(0.5);
  levelSprite.position.set(cx, cy);
  textLayer.addChild(levelSprite);

  card.addChild(textLayer);

  card.pivot.set(CARD_WIDTH / 2, CARD_HEIGHT / 2);

  return card;
}
