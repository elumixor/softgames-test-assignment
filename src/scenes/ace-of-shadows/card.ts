import "pixi.js/advanced-blend-modes";
import { Assets, Container, Graphics, Rectangle, type Renderer, RenderTexture, Sprite, Text, Texture } from "pixi.js";

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

interface CardAssets {
  images: Record<CardType, Texture>;
  gradient: Texture;
}

// Atlas layout
const ATLAS_COLS = 16;
const ATLAS_ROWS = 9;

/** Load assets, build all 144 cards, bake into a single atlas RenderTexture, return Sprites. */
export async function loadCardSprites(renderer: Renderer): Promise<Sprite[]> {
  const [warrior, rogue, mage, bard, gradient] = await Promise.all([
    Assets.load("assets/cards/warrior.png"),
    Assets.load("assets/cards/rogue.png"),
    Assets.load("assets/cards/mage.png"),
    Assets.load("assets/cards/bard.png"),
    Assets.load("assets/card-gradient.png"),
    Assets.load("assets/fonts/fireside.otf"),
  ]);

  const assets: CardAssets = { images: { warrior, rogue, mage, bard }, gradient };
  const textAtlas = buildTextAtlas(renderer);

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
  // Use resolution 2/3 so actual GPU texture = 8192×8064 (fits max texture size).
  // Logical size stays 12288×12096, so card frames remain 768×1344 and CARD_SCALE stays 0.35.
  const atlasRt = RenderTexture.create({
    width: ATLAS_COLS * CARD_WIDTH,
    height: ATLAS_ROWS * CARD_HEIGHT,
    resolution: 2 / 3,
  });
  renderer.render({ container: grid, target: atlasRt });
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
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprites.push(sprite);
  }

  return sprites;
}

// --- Text atlas (shared pre-rendered text/circle textures) ---

interface TextAtlas {
  typeNames: Record<CardType, Texture>;
  levels: Record<number, Texture>;
  circle: Texture;
}

function buildTextAtlas(renderer: Renderer): TextAtlas {
  const fontStyle = { fontFamily: "Fireside", fill: 0xcccccc } as const;

  const typeNames = {} as Record<CardType, Texture>;
  for (const type of cardTypes) {
    const text = new Text({
      text: type.charAt(0).toUpperCase() + type.slice(1),
      style: { ...fontStyle, fontSize: 64 },
    });
    const rt = RenderTexture.create({ width: Math.ceil(text.width), height: Math.ceil(text.height) });
    renderer.render({ container: text, target: rt });
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
    renderer.render({ container: text, target: rt });
    levels[l] = rt;
    text.destroy();
  }

  const circleGfx = new Graphics().circle(CIRCLE_R + 3, CIRCLE_R + 3, CIRCLE_R).stroke({ color: 0xcccccc, width: 5 });
  const circleSize = (CIRCLE_R + 3) * 2;
  const circleRt = RenderTexture.create({ width: circleSize, height: circleSize });
  renderer.render({ container: circleGfx, target: circleRt });
  circleGfx.destroy();

  return { typeNames, levels, circle: circleRt };
}

// --- Card container builder ---

function buildCardContainer(assets: CardAssets, atlas: TextAtlas, type: CardType, color: CardColor, level: number) {
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

  const typeSprite = new Sprite(atlas.typeNames[type]);
  typeSprite.anchor.set(0, 1);
  typeSprite.position.set(PADDING, CARD_HEIGHT - PADDING);
  textLayer.addChild(typeSprite);

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

  return card;
}
