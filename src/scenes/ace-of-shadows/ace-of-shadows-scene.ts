import { di } from "@elumixor/di";
import { delay } from "@utils";
import { Assets, Sprite, Text, type Ticker } from "pixi.js";
import { App } from "../../app";
import { BackButton } from "../../components/back-button";
import { Scene } from "../scene";
import { loadCardSprites } from "./card";

// Layout in 1000x1000 design space
const CARD_SCALE = 0.35;
const STACK_X = 300;
const STACK_Y = 400;
const TABLE_X = 660;
const TABLE_Y = 420;
const DEPTH_OFFSET = 1;
const COUNTER_Y_OFFSET = 280;

// Animation tuning
const MOVE_INTERVAL = 1;
const FAST_MOVE_INTERVAL = 0.1;
const ANIMATION_DURATION = 0.6;
const LIFT_HEIGHT = 40;
const LIFT_SCALE_PEAK = 1.08;
const ROTATION_SPREAD_DEG = 5;
const POSITION_SPREAD = 8;

// Tutorial hint
const HINT_FADE_SPEED = 1.5;
const HINT_INACTIVITY_DELAY = 1;

export class AceOfShadowsScene extends Scene {
  private readonly app = di.inject(App);
  private readonly backButton = new BackButton(() => {
    location.hash = "";
  });
  private readonly background = new Sprite();
  private readonly stackCounter = new Text({
    text: "0",
    style: { fill: 0xffffff, fontSize: 48, fontFamily: "Anta", dropShadow: { color: 0x000000, blur: 4, distance: 2 } },
  });
  private readonly tableCounter = new Text({
    text: "0",
    style: { fill: 0xffffff, fontSize: 48, fontFamily: "Anta", dropShadow: { color: 0x000000, blur: 4, distance: 2 } },
  });
  private readonly hint = new Text({
    text: "Press on the deck to move faster",
    style: { fill: 0xffffff, fontSize: 32, fontFamily: "Anta", dropShadow: { color: 0x000000, blur: 4, distance: 2 } },
  });

  private stack: Sprite[] = [];
  private table: Sprite[] = [];
  private moveTimer = 0;
  private hovering = false;
  private inFlight = 0;
  private tidying = false;
  private direction: "toTable" | "toStack" = "toTable";
  private hintVisible = false;
  private hintPhase = 0;
  private inactivityTimer = HINT_INACTIVITY_DELAY;
  private slideSound?: HTMLAudioElement;

  override async init() {
    const [boardTex, cards] = await Promise.all([Assets.load("assets/board.jpg"), loadCardSprites(this.app.renderer)]);

    this.background.texture = boardTex;
    this.addChild(this.background);

    // Fisher-Yates shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    this.stack = cards;

    this.sortableChildren = true;
    this.background.zIndex = -1;

    for (let i = 0; i < this.stack.length; i++) {
      const card = this.stack[i];
      card.scale.set(CARD_SCALE);
      card.position.set(STACK_X + i * DEPTH_OFFSET, STACK_Y - i * DEPTH_OFFSET);
      card.zIndex = i;
      card.eventMode = "none";
      card.cursor = "pointer";
      card.on("pointerdown", () => {
        this.hovering = true;
      });
      card.on("pointerup", () => {
        this.hovering = false;
      });
      card.on("pointerupoutside", () => {
        this.hovering = false;
      });
      card.on("pointerleave", () => {
        this.hovering = false;
      });
      this.addChild(card);
    }

    this.stackCounter.anchor.set(0.5, 0);
    this.stackCounter.position.set(STACK_X, STACK_Y + COUNTER_Y_OFFSET);
    this.stackCounter.zIndex = 9999;
    this.addChild(this.stackCounter);

    this.tableCounter.anchor.set(0.5, 0);
    this.tableCounter.position.set(TABLE_X, TABLE_Y + COUNTER_Y_OFFSET);
    this.tableCounter.zIndex = 9999;
    this.addChild(this.tableCounter);

    this.slideSound = new Audio("assets/sounds/cards-slide.mp3");

    this.hint.anchor.set(0.5);
    this.hint.position.set((STACK_X + TABLE_X) / 2, STACK_Y + COUNTER_Y_OFFSET + 130);
    this.hint.zIndex = 9999;
    this.hint.alpha = 0;
    this.addChild(this.hint);

    this.backButton.zIndex = 10000;
    this.addChild(this.backButton);
    this.activateTopCard();
    this.updateCounters();
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

  private onTick = (ticker: Ticker) => {
    const dt = ticker.deltaMS / 1000;

    // Hint fade logic
    if (this.hovering) {
      this.hintVisible = false;
      this.inactivityTimer = 0;
    } else {
      this.inactivityTimer += dt;
      if (this.inactivityTimer >= HINT_INACTIVITY_DELAY) this.hintVisible = true;
    }

    if (this.hintVisible) {
      this.hintPhase += dt * HINT_FADE_SPEED;
      this.hint.alpha = (Math.sin(this.hintPhase) + 1) / 2;
    } else {
      this.hintPhase = 0;
      if (this.hint.alpha > 0) this.hint.alpha = Math.max(0, this.hint.alpha - dt * 3);
    }

    const source = this.direction === "toTable" ? this.stack : this.table;
    if (source.length === 0) return;

    this.moveTimer += dt;
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

    card.visible = true;
    card.eventMode = "none";
    this.activateTopCard();
    this.playSlideSound();

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
    this.updateCounters();
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

      card.zIndex = 200 + Math.round(arc);

      card.x = startX + (tx - startX) * easePos;
      card.y = startY + (ty - startY) * easePos - arc;
      card.scale.set(CARD_SCALE * (1 + scaleBump));
      card.rotation = startRotation + (finalRotation - startRotation) * easeRot;

      if (t >= 1) {
        card.x = tx;
        card.y = ty;
        card.zIndex = destIndex;
        card.scale.set(CARD_SCALE);
        card.rotation = finalRotation;
        this.app.ticker.remove(update);
        this.inFlight--;
        this.checkDirectionSwitch();
      }
    };

    this.app.ticker.add(update);
  }

  private playSlideSound() {
    if (!this.slideSound) return;
    const s = this.slideSound.cloneNode() as HTMLAudioElement;
    s.volume = 0.3;
    // biome-ignore lint/suspicious/noEmptyBlockStatements: autoplay may be blocked
    s.play().catch(() => {});
  }

  private updateCounters() {
    this.stackCounter.text = String(this.stack.length);
    this.tableCounter.text = String(this.table.length);
  }

  private rebuildZOrder() {
    for (let i = 0; i < this.stack.length; i++) this.stack[i].zIndex = i;
    for (let i = 0; i < this.table.length; i++) this.table[i].zIndex = i;
  }

  private activateTopCard() {
    for (const card of this.stack) card.eventMode = "none";
    for (const card of this.table) card.eventMode = "none";

    const source = this.direction === "toTable" ? this.stack : this.table;
    if (source.length > 0) source[source.length - 1].eventMode = "static";
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

    this.rebuildZOrder();

    await delay(0.5);

    this.direction = this.direction === "toTable" ? "toStack" : "toTable";
    this.hovering = false;
    this.moveTimer = 0;
    this.tidying = false;
    this.activateTopCard();
  }

  private animateToNeat(card: Sprite, tx: number, ty: number, duration: number): Promise<void> {
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
