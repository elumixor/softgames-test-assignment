import { EventEmitter } from "@elumixor/event-emitter";
import gsap from "gsap";
import { Container, Graphics, Text } from "pixi.js";

const BUTTON_WIDTH = 240;
const BUTTON_HEIGHT = 50;
const BORDER_RADIUS = 12;
const RESTING_ALPHA = 0.8;
const HOVER_ALPHA = 1.0;
const HOVER_SCALE = 1.08;
const ANIMATION_DURATION = 0.4;

export class MenuButton extends Container {
  readonly clicked = new EventEmitter();

  private readonly content = new Container();

  constructor(label: string) {
    super();

    const bg = new Graphics()
      .roundRect(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT, BORDER_RADIUS)
      .fill({ color: 0x3a3a5c })
      .stroke({ color: 0x8888aa });
    const text = new Text({ text: label, style: { fontSize: 18, fill: 0xffffff, fontFamily: "Anta" } });
    text.anchor.set(0.5);
    text.position.set(BUTTON_WIDTH / 2, BUTTON_HEIGHT / 2);

    this.content.addChild(bg, text);
    this.content.pivot.set(BUTTON_WIDTH / 2, BUTTON_HEIGHT / 2);
    this.content.alpha = RESTING_ALPHA;
    this.addChild(this.content);

    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerenter", this.onHoverStart, this);
    this.on("pointerleave", this.onHoverEnd, this);
    this.on("pointerdown", () => this.clicked.emit());
  }

  override destroy(): void {
    gsap.killTweensOf(this);
    super.destroy();
  }

  private onHoverStart(): void {
    gsap.to(this.content, {
      alpha: HOVER_ALPHA,
      scaleUniform: HOVER_SCALE,
      duration: ANIMATION_DURATION,
      ease: "back.out(1.7)",
      overwrite: true,
    });
  }

  private onHoverEnd(): void {
    gsap.to(this.content, {
      alpha: RESTING_ALPHA,
      scaleUniform: 1,
      duration: ANIMATION_DURATION,
      ease: "back.out(1.7)",
      overwrite: true,
    });
  }
}
