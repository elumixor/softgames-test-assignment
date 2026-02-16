import { EventEmitter } from "@elumixor/event-emitter";
import gsap from "gsap";
import { Container, Sprite, type Texture } from "pixi.js";

const BUTTON_SIZE = 30;
const RESTING_ALPHA = 0.7;
const HOVER_ALPHA = 1.0;
const HOVER_SCALE = 1.15;
const ANIMATION_DURATION = 0.4;
const PADDING = 12;
const GAP = 8;

export class UiButton extends Container {
  readonly clicked = new EventEmitter();

  private readonly sprite: Sprite;

  constructor(texture: Texture) {
    super();

    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.scaleUniform = BUTTON_SIZE / texture.width;
    this.sprite.alpha = RESTING_ALPHA;

    this.addChild(this.sprite);

    this.eventMode = "static";
    this.cursor = "pointer";

    this.on("pointerenter", this.onHoverStart, this);
    this.on("pointerleave", this.onHoverEnd, this);
    this.on("pointerdown", () => this.clicked.emit());
  }

  /** Place at top-right corner. `index` 0 = rightmost, 1 = next left, etc. */
  placeTopRight(rightX: number, topY: number, index: number = 0): void {
    const half = BUTTON_SIZE / 2;
    this.position.set(rightX - PADDING - half - index * (BUTTON_SIZE + GAP), topY + PADDING + half);
  }

  get texture(): Texture {
    return this.sprite.texture;
  }

  set texture(value: Texture) {
    this.sprite.texture = value;
  }

  override destroy(): void {
    gsap.killTweensOf(this.sprite);
    super.destroy();
  }

  private onHoverStart(): void {
    gsap.to(this.sprite, {
      scaleUniform: HOVER_SCALE,
      alpha: HOVER_ALPHA,
      duration: ANIMATION_DURATION,
      ease: "back.out(1.7)",
      overwrite: true,
    });
  }

  private onHoverEnd(): void {
    gsap.to(this.sprite, {
      scaleUniform: 1,
      alpha: RESTING_ALPHA,
      duration: ANIMATION_DURATION,
      ease: "back.out(1.7)",
      overwrite: true,
    });
  }
}
