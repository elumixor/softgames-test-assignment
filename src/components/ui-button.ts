import { di } from "@elumixor/di";
import { Container, Sprite, type Texture, type Ticker } from "pixi.js";
import { App } from "../app";

const BUTTON_SIZE = 30;
const RESTING_ALPHA = 0.7;
const HOVER_ALPHA = 1.0;
const HOVER_SCALE = 1.15;
const SPRING_STIFFNESS = 12;
const SPRING_DAMPING = 0.75;
const SETTLE_THRESHOLD = 0.001;
const PADDING = 12;
const GAP = 8;

export class UiButton extends Container {
  protected readonly app = di.inject(App);
  readonly sprite: Sprite;

  private baseScale = 1;
  private scaleMul = 1;
  private scaleVelocity = 0;
  private scaleTarget = 1;

  private alphaValue = RESTING_ALPHA;
  private alphaVelocity = 0;
  private alphaTarget = RESTING_ALPHA;

  private animating = false;

  constructor(texture: Texture, onClick: () => void) {
    super();

    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.baseScale = BUTTON_SIZE / texture.width;
    this.sprite.scale.set(this.baseScale);
    this.addChild(this.sprite);

    this.alpha = RESTING_ALPHA;
    this.eventMode = "static";
    this.cursor = "pointer";

    this.on("pointerenter", this.onHoverStart, this);
    this.on("pointerleave", this.onHoverEnd, this);
    this.on("pointerdown", onClick);
  }

  /** Place at top-right corner. `index` 0 = rightmost, 1 = next left, etc. */
  placeTopRight(rightX: number, topY: number, index = 0) {
    const half = BUTTON_SIZE / 2;
    this.position.set(rightX - PADDING - half - index * (BUTTON_SIZE + GAP), topY + PADDING + half);
  }

  override destroy() {
    if (this.animating) {
      this.app.ticker.remove(this.onTick);
      this.animating = false;
    }
    super.destroy();
  }

  private onHoverStart() {
    this.scaleTarget = HOVER_SCALE;
    this.alphaTarget = HOVER_ALPHA;
    this.startAnimating();
  }

  private onHoverEnd() {
    this.scaleTarget = 1;
    this.alphaTarget = RESTING_ALPHA;
    this.startAnimating();
  }

  private startAnimating() {
    if (this.animating) return;
    this.animating = true;
    this.app.ticker.add(this.onTick);
  }

  private onTick = (ticker: Ticker) => {
    const dt = ticker.deltaMS / 1000;

    this.scaleVelocity += (this.scaleTarget - this.scaleMul) * SPRING_STIFFNESS * dt;
    this.scaleVelocity *= SPRING_DAMPING;
    this.scaleMul += this.scaleVelocity;

    this.alphaVelocity += (this.alphaTarget - this.alphaValue) * SPRING_STIFFNESS * dt;
    this.alphaVelocity *= SPRING_DAMPING;
    this.alphaValue += this.alphaVelocity;

    this.sprite.scale.set(this.baseScale * this.scaleMul);
    this.alpha = this.alphaValue;

    const settled =
      Math.abs(this.scaleVelocity) < SETTLE_THRESHOLD &&
      Math.abs(this.scaleMul - this.scaleTarget) < SETTLE_THRESHOLD &&
      Math.abs(this.alphaVelocity) < SETTLE_THRESHOLD &&
      Math.abs(this.alphaValue - this.alphaTarget) < SETTLE_THRESHOLD;

    if (settled) {
      this.scaleMul = this.scaleTarget;
      this.alphaValue = this.alphaTarget;
      this.sprite.scale.set(this.baseScale * this.scaleMul);
      this.alpha = this.alphaValue;
      this.animating = false;
      this.app.ticker.remove(this.onTick);
    }
  };
}
