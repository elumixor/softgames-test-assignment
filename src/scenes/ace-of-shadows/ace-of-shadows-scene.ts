import { di } from "@elumixor/di";
import { delay } from "@utils";
import { Assets, Container, Rectangle, Sprite, type Ticker } from "pixi.js";
import { App } from "../../app";
import { BackButton } from "../../components/back-button";
import { Scene } from "../scene";
import { type CardAssets, generateAllCards } from "./card";

// Layout in 1000×1000 design space
const CARD_SCALE = 0.35;
const STACK_X = 300;
const STACK_Y = 350;
const TABLE_X = 660;
const TABLE_Y = 370;
const DEPTH_OFFSET = 1;

// Animation tuning
const MOVE_INTERVAL = 1;
const FAST_MOVE_INTERVAL = 0.1;
const ANIMATION_DURATION = 0.6;
const LIFT_HEIGHT = 40;
const LIFT_SCALE_PEAK = 1.08;
const ROTATION_SPREAD_DEG = 5;
const POSITION_SPREAD = 8;

// Hit zone covers a card-sized area with padding
const HIT_HALF_W = 190;
const HIT_HALF_H = 280;

export class AceOfShadowsScene extends Scene {
  private readonly app = di.inject(App);
  private readonly backButton = new BackButton(() => {
    location.hash = "";
  });
  private readonly background = new Sprite();
  private readonly hitZone = new Container();

  private stack: Container[] = [];
  private table: Container[] = [];
  private moveTimer = 0;
  private hovering = false;
  private inFlight = 0;
  private tidying = false;
  private direction: "toTable" | "toStack" = "toTable";

  override async init() {
    const [boardTex, warrior, rogue, mage, bard, gradient] = await Promise.all([
      Assets.load("assets/board.jpg"),
      Assets.load("assets/cards/warrior.png"),
      Assets.load("assets/cards/rogue.png"),
      Assets.load("assets/cards/mage.png"),
      Assets.load("assets/cards/bard.png"),
      Assets.load("assets/card-gradient.png"),
      Assets.load("assets/fonts/fireside.otf"),
    ]);

    this.background.texture = boardTex;
    this.addChild(this.background);

    const assets: CardAssets = { images: { warrior, rogue, mage, bard }, gradient };
    const cards = generateAllCards(this.app.renderer, assets);

    // Fisher-Yates shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    this.stack = cards;

    for (let i = 0; i < this.stack.length; i++) {
      const card = this.stack[i];
      card.scale.set(CARD_SCALE);
      card.position.set(STACK_X + i * DEPTH_OFFSET, STACK_Y - i * DEPTH_OFFSET);
      this.addChild(card);
    }

    // Hover hit zone over the source stack
    this.hitZone.eventMode = "static";
    this.hitZone.cursor = "pointer";
    this.hitZone.on("pointerdown", () => {
      this.hovering = true;
    });
    this.hitZone.on("pointerup", () => {
      this.hovering = false;
    });
    this.hitZone.on("pointerupoutside", () => {
      this.hovering = false;
    });
    this.hitZone.on("pointerleave", () => {
      this.hovering = false;
    });
    this.updateHitZone();
    this.addChild(this.hitZone);

    this.addChild(this.backButton);
    this.app.ticker.add(this.onTick);
  }

  override onResize(screenWidth: number, screenHeight: number) {
    const s = this.scale.x;
    const localLeft = -this.position.x / s;
    const localTop = -this.position.y / s;
    const localW = screenWidth / s;
    const localH = screenHeight / s;

    this.background.coverTo(localW, localH);
    this.background.position.set(
      localLeft + (localW - this.background.width) / 2,
      localTop + (localH - this.background.height) / 2,
    );

    this.backButton.placeTopRight(localLeft + localW, localTop);
  }

  override destroy() {
    this.app.ticker.remove(this.onTick);
    super.destroy();
  }

  private updateHitZone() {
    const sx = this.direction === "toTable" ? STACK_X : TABLE_X;
    const sy = this.direction === "toTable" ? STACK_Y : TABLE_Y;
    this.hitZone.hitArea = new Rectangle(sx - HIT_HALF_W, sy - HIT_HALF_H, HIT_HALF_W * 2, HIT_HALF_H * 2);
  }

  private onTick = (ticker: Ticker) => {
    const source = this.direction === "toTable" ? this.stack : this.table;
    if (source.length === 0) return;

    this.moveTimer += ticker.deltaMS / 1000;
    const interval = this.hovering ? FAST_MOVE_INTERVAL : MOVE_INTERVAL;
    if (this.moveTimer >= interval) {
      this.moveTimer = 0;
      this.moveCard();
    }
  };

  private moveCard() {
    const source = this.direction === "toTable" ? this.stack : this.table;
    if (source.length === 0) return;

    const card = source.pop();
    if (!card) throw new Error("No card to move");

    const dest = this.direction === "toTable" ? this.table : this.stack;
    const destIndex = dest.length;

    // Ensure card is visible and bring to front
    card.visible = true;
    this.removeChild(card);
    this.addChild(card);
    this.removeChild(this.backButton);
    this.addChild(this.backButton);

    const startX = card.x;
    const startY = card.y;
    const startRotation = card.rotation;

    const toTable = this.direction === "toTable";
    const baseX = toTable ? TABLE_X : STACK_X;
    const baseY = toTable ? TABLE_Y : STACK_Y;
    const tx = baseX + destIndex * DEPTH_OFFSET + (Math.random() - 0.5) * 2 * POSITION_SPREAD;
    const ty = baseY - destIndex * DEPTH_OFFSET + (Math.random() - 0.5) * 2 * POSITION_SPREAD;
    const finalRotation = ((Math.random() - 0.5) * 2 * ROTATION_SPREAD_DEG * Math.PI) / 180;

    // Reserve slot immediately for concurrent animations
    dest.push(card);
    this.inFlight++;

    let elapsed = 0;
    const update = (ticker: Ticker) => {
      if (card.destroyed) {
        this.app.ticker.remove(update);
        this.inFlight--;
        this.checkDirectionSwitch();
        return;
      }

      elapsed += ticker.deltaMS / 1000;
      const t = Math.min(elapsed / ANIMATION_DURATION, 1);

      const easePos = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
      const arc = Math.sin(t * Math.PI) * LIFT_HEIGHT;
      const scaleBump = Math.sin(t * Math.PI) * (LIFT_SCALE_PEAK - 1);
      const easeRot = 1 - (1 - t) ** 2;

      card.x = startX + (tx - startX) * easePos;
      card.y = startY + (ty - startY) * easePos - arc;
      card.scale.set(CARD_SCALE * (1 + scaleBump));
      card.rotation = startRotation + (finalRotation - startRotation) * easeRot;

      if (t >= 1) {
        card.x = tx;
        card.y = ty;
        card.scale.set(CARD_SCALE);
        card.rotation = finalRotation;
        this.app.ticker.remove(update);
        this.inFlight--;
        this.checkDirectionSwitch();
      }
    };

    this.app.ticker.add(update);
  }

  private checkDirectionSwitch() {
    const source = this.direction === "toTable" ? this.stack : this.table;
    if (source.length > 0 || this.inFlight > 0 || this.tidying) return;

    void this.tidyAndSwitch();
  }

  private async tidyAndSwitch() {
    this.tidying = true;

    // The pile that just received all cards
    const pile = this.direction === "toTable" ? this.table : this.stack;
    const baseX = this.direction === "toTable" ? TABLE_X : STACK_X;
    const baseY = this.direction === "toTable" ? TABLE_Y : STACK_Y;

    const duration = 0.3;
    await Promise.all(
      pile.map((card, i) => this.animateToNeat(card, baseX + i * DEPTH_OFFSET, baseY - i * DEPTH_OFFSET, duration)),
    );

    // Fix z-order: re-add cards bottom-to-top
    for (const card of pile) this.removeChild(card);
    for (const card of pile) this.addChild(card);
    this.removeChild(this.hitZone);
    this.addChild(this.hitZone);
    this.removeChild(this.backButton);
    this.addChild(this.backButton);

    await delay(0.5);

    this.direction = this.direction === "toTable" ? "toStack" : "toTable";
    this.hovering = false;
    this.moveTimer = 0;
    this.tidying = false;
    this.updateHitZone();
  }

  private animateToNeat(card: Container, tx: number, ty: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startX = card.x;
      const startY = card.y;
      const startRotation = card.rotation;
      let elapsed = 0;

      const update = (ticker: Ticker) => {
        if (card.destroyed) {
          this.app.ticker.remove(update);
          resolve();
          return;
        }

        elapsed += ticker.deltaMS / 1000;
        const t = Math.min(elapsed / duration, 1);
        const ease = 1 - (1 - t) ** 3;

        card.x = startX + (tx - startX) * ease;
        card.y = startY + (ty - startY) * ease;
        card.rotation = startRotation * (1 - ease);

        if (t >= 1) {
          card.x = tx;
          card.y = ty;
          card.rotation = 0;
          this.app.ticker.remove(update);
          resolve();
        }
      };

      this.app.ticker.add(update);
    });
  }
}
