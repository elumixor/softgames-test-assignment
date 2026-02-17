import { EventEmitter } from "@elumixor/event-emitter";
import { sprite } from "@utils";
import gsap from "gsap";
import { Container, type Sprite, type Texture } from "pixi.js";

const BUTTON_SIZE = 30;
const RESTING_ALPHA = 0.7;
const HOVER_ALPHA = 1.0;
const HOVER_SCALE = 1.15;
const ANIMATION_DURATION = 0.4;

export class UiButton extends Container {
  readonly clicked = new EventEmitter();

  private readonly sprite: Sprite;

  constructor(texture: Texture | string) {
    super();

    this.sprite = sprite(texture);
    this.sprite.anchor.set(0.5);
    this.scaleUniform = BUTTON_SIZE / this.sprite.width;
    this.sprite.alpha = RESTING_ALPHA;

    this.addChild(this.sprite);

    this.eventMode = "static";
    this.cursor = "pointer";

    this.on("pointerenter", this.onHoverStart, this);
    this.on("pointerleave", this.onHoverEnd, this);
    this.on("pointerdown", () => this.clicked.emit());
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
