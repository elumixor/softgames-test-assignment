import { Scene, type SceneResizeData } from "@scenes/scene";
import { ASSETS } from "@services/assets";
import { sound } from "@services/sounds";
import { delay, sprite, texture } from "@utils";
import gsap from "gsap";
import { type Sprite, Text, type Ticker } from "pixi.js";
import { loadCardSprites } from "./build-sprites-from-spritesheet";

// Layout centered around origin (0, 0) in 1000x1000 design space
const CARD_SCALE = 1.0;
const STACK_X = -200; // 300 - 500 (center)
const TABLE_X = 160; // 660 - 500 (center)
const PILE_Y = 0; // 500 - 500 (center)
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
const HINT_FADE_DURATION = 1.5;
const HINT_INACTIVITY_DELAY = 1;

export class AceOfShadowsScene extends Scene {
  private readonly background = sprite(texture(ASSETS.BG_BOARD));
  private readonly stackCounter = new Text({
    text: "0",
    style: { fill: 0xffffff, fontSize: 48, fontFamily: "Sour Gummy", stroke: { color: 0x2a1a0a, width: 4 } },
  });
  private readonly tableCounter = new Text({
    text: "0",
    style: { fill: 0xffffff, fontSize: 48, fontFamily: "Sour Gummy", stroke: { color: 0x2a1a0a, width: 4 } },
  });
  private readonly hint = new Text({
    text: "Press on the deck to move faster",
    style: { fill: 0xffffff, fontSize: 32, fontFamily: "Sour Gummy", stroke: { color: 0x2a1a0a, width: 4 } },
  });

  private stack: Sprite[] = [];
  private table: Sprite[] = [];
  private moveTimer = 0;
  private hovering = false;
  private inFlight = 0;
  private tidying = false;
  private direction: "toTable" | "toStack" = "toTable";
  private hintVisible = false;
  private inactivityTimer = HINT_INACTIVITY_DELAY;
  private hintTween?: gsap.core.Tween;

  constructor() {
    super({
      minWidth: 750,
      minHeight: 900,
    });

    const cards = loadCardSprites();

    this.addChild(this.background);

    // Fisher-Yates shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    this.stack = cards;

    this.sortableChildren = true;
    this.background.zIndex = -1;

    for (const [i, card] of this.stack.entries()) {
      card.scale.set(CARD_SCALE);
      card.position.set(STACK_X + i * DEPTH_OFFSET, PILE_Y - i * DEPTH_OFFSET);
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
    this.stackCounter.position.set(STACK_X, PILE_Y + COUNTER_Y_OFFSET);
    this.stackCounter.zIndex = 9999;
    this.addChild(this.stackCounter);

    this.tableCounter.anchor.set(0.5, 0);
    this.tableCounter.position.set(TABLE_X, PILE_Y + COUNTER_Y_OFFSET);
    this.tableCounter.zIndex = 9999;
    this.addChild(this.tableCounter);

    this.hint.anchor.set(0.5);
    this.hint.position.set((STACK_X + TABLE_X) / 2, PILE_Y + COUNTER_Y_OFFSET + 130);
    this.hint.zIndex = 9999;
    this.hint.alpha = 0;
    this.addChild(this.hint);

    this.activateTopCard();
    this.updateCounters();
    this.app.ticker.add(this.onTick);
  }

  protected resize({ localLeft, localTop, localWidth, localHeight }: SceneResizeData): void {
    const localW = localWidth;
    const localH = localHeight;

    this.background.coverTo(localW, localH);
    this.background.position.set(
      localLeft + (localW - this.background.width) / 2,
      localTop + (localH - this.background.height) / 2,
    );
  }

  override destroy(): void {
    this.app.ticker.remove(this.onTick);
    gsap.killTweensOf(this.hint);
    for (const card of [...this.stack, ...this.table]) gsap.killTweensOf(card);
    super.destroy();
  }

  private onTick = (ticker: Ticker): void => {
    const dt = ticker.deltaMS / 1000;

    // Hint fade logic
    if (this.hovering) {
      this.hintVisible = false;
      this.inactivityTimer = 0;
      this.hintTween?.kill();
      gsap.to(this.hint, { alpha: 0, duration: 0.3, ease: "power2.out", overwrite: true });
    } else {
      this.inactivityTimer += dt;
      if (this.inactivityTimer >= HINT_INACTIVITY_DELAY && !this.hintVisible) {
        this.hintVisible = true;
        this.hintTween = gsap.to(this.hint, {
          alpha: 1,
          duration: HINT_FADE_DURATION / 2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          overwrite: true,
        });
      }
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

  private moveCard(): void {
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

    const startY = card.y;
    const toTable = this.direction === "toTable";
    const baseX = toTable ? TABLE_X : STACK_X;
    const baseY = toTable ? PILE_Y : PILE_Y;
    const tx = baseX + destIndex * DEPTH_OFFSET + (Math.random() - 0.5) * 2 * POSITION_SPREAD;
    const ty = baseY - destIndex * DEPTH_OFFSET + (Math.random() - 0.5) * 2 * POSITION_SPREAD;
    const finalRotation = ((Math.random() - 0.5) * 2 * ROTATION_SPREAD_DEG * Math.PI) / 180;

    // Reserve slot immediately for concurrent animations
    dest.push(card);
    this.updateCounters();
    this.inFlight++;

    const timeline = gsap.timeline({
      onComplete: () => {
        card.x = tx;
        card.y = ty;
        card.zIndex = destIndex;
        card.scale.set(CARD_SCALE);
        card.rotation = finalRotation;
        this.inFlight--;
        this.checkDirectionSwitch();
      },
    });

    // Animate position with custom ease
    timeline.to(
      card,
      {
        x: tx,
        y: ty,
        duration: ANIMATION_DURATION,
        ease: "power2.inOut",
      },
      0,
    );

    // Animate arc (lift) using a custom property
    const arcData = { value: 0 };
    timeline.to(
      arcData,
      {
        value: 1,
        duration: ANIMATION_DURATION,
        ease: "sine.inOut",
        onUpdate: () => {
          const arc = Math.sin(arcData.value * Math.PI) * LIFT_HEIGHT;
          const scaleBump = Math.sin(arcData.value * Math.PI) * (LIFT_SCALE_PEAK - 1);
          card.y = startY + (ty - startY) * arcData.value - arc;
          card.scale.set(CARD_SCALE * (1 + scaleBump));
          card.zIndex = 200 + Math.round(arc);
        },
      },
      0,
    );

    // Animate rotation
    timeline.to(
      card,
      {
        rotation: finalRotation,
        duration: ANIMATION_DURATION,
        ease: "power2.out",
      },
      0,
    );
  }

  private playSlideSound(): void {
    sound(ASSETS.SOUND_CARDS_SLIDE, { volume: 0.3 });
  }

  private updateCounters(): void {
    this.stackCounter.text = String(this.stack.length);
    this.tableCounter.text = String(this.table.length);
  }

  private rebuildZOrder(): void {
    for (let i = 0; i < this.stack.length; i++) this.stack[i].zIndex = i;
    for (let i = 0; i < this.table.length; i++) this.table[i].zIndex = i;
  }

  private activateTopCard(): void {
    for (const card of this.stack) card.eventMode = "none";
    for (const card of this.table) card.eventMode = "none";

    const source = this.direction === "toTable" ? this.stack : this.table;
    if (source.length > 0) source[source.length - 1].eventMode = "static";
  }

  private checkDirectionSwitch(): void {
    const source = this.direction === "toTable" ? this.stack : this.table;
    if (source.length > 0 || this.inFlight > 0 || this.tidying) return;

    void this.tidyAndSwitch();
  }

  private async tidyAndSwitch(): Promise<void> {
    this.tidying = true;

    // The pile that just received all cards
    const pile = this.direction === "toTable" ? this.table : this.stack;
    const baseX = this.direction === "toTable" ? TABLE_X : STACK_X;
    const baseY = this.direction === "toTable" ? PILE_Y : PILE_Y;

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

  private animateToNeat(card: Sprite, tx: number, ty: number, duration: number): gsap.core.Tween {
    return gsap.to(card, {
      x: tx,
      y: ty,
      rotation: 0,
      duration,
      ease: "power3.out",
    });
  }
}
