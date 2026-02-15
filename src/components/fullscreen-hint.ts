import { di } from "@elumixor/di";
import { Assets, Container, Sprite, Text, type Ticker } from "pixi.js";
import screenfull from "screenfull";
import { App } from "../app";

const ICON_SIZE = 24;
const FONT_SIZE = 18;
const PULSE_SPEED = 1.5;
const ALPHA_MIN = 0.4;
const ALPHA_MAX = 0.7;
const HOVER_ALPHA = 1.0;
const HOVER_SCALE = 1.08;
const SPRING_STIFFNESS = 12;
const SPRING_DAMPING = 0.75;

export class FullscreenHint extends Container {
  private readonly app = di.inject(App);
  private readonly content = new Container();

  private phase = 0;
  private hovered = false;

  private scaleMul = 1;
  private scaleVelocity = 0;
  private scaleTarget = 1;

  private alphaBase = (ALPHA_MIN + ALPHA_MAX) / 2;
  private alphaVelocity = 0;

  constructor() {
    super();

    const enterFullscreen = () => {
      if (screenfull.isEnabled && !screenfull.isFullscreen) void screenfull.request();
    };

    const style = { fontSize: FONT_SIZE, fill: 0xffffff, fontFamily: "Anta" };

    const prefix = new Text({ text: "Press ", style });
    const icon = new Sprite(Assets.get("assets/ui/fullscreen.png"));
    icon.width = ICON_SIZE;
    icon.height = ICON_SIZE;
    const suffix = new Text({ text: " to enter fullscreen", style });

    icon.position.set(prefix.width, (prefix.height - ICON_SIZE) / 2);
    suffix.position.set(prefix.width + ICON_SIZE + 2, 0);

    this.content.addChild(prefix, icon, suffix);
    this.content.pivot.set(this.content.width / 2, this.content.height / 2);
    this.addChild(this.content);

    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerdown", enterFullscreen);
    this.on("pointerenter", this.onHoverStart, this);
    this.on("pointerleave", this.onHoverEnd, this);

    this.visible = !screenfull.isFullscreen;
    if (screenfull.isEnabled) screenfull.on("change", this.onFullscreenChange);
    this.app.ticker.add(this.onTick);
  }

  override destroy() {
    this.app.ticker.remove(this.onTick);
    if (screenfull.isEnabled) screenfull.off("change", this.onFullscreenChange);
    super.destroy();
  }

  private onHoverStart() {
    this.hovered = true;
  }

  private onHoverEnd() {
    this.hovered = false;
  }

  private onFullscreenChange = () => {
    this.visible = !screenfull.isFullscreen;
  };

  private onTick = (ticker: Ticker) => {
    const dt = ticker.deltaMS / 1000;

    // Pulse alpha when not hovered
    this.phase += dt * PULSE_SPEED;
    const pulse = ALPHA_MIN + ((Math.sin(this.phase) + 1) / 2) * (ALPHA_MAX - ALPHA_MIN);

    const alphaTarget = this.hovered ? HOVER_ALPHA : pulse;
    this.scaleTarget = this.hovered ? HOVER_SCALE : 1;

    // Spring scale
    this.scaleVelocity += (this.scaleTarget - this.scaleMul) * SPRING_STIFFNESS * dt;
    this.scaleVelocity *= SPRING_DAMPING;
    this.scaleMul += this.scaleVelocity;

    // Spring alpha
    this.alphaVelocity += (alphaTarget - this.alphaBase) * SPRING_STIFFNESS * dt;
    this.alphaVelocity *= SPRING_DAMPING;
    this.alphaBase += this.alphaVelocity;

    this.content.scale.set(this.scaleMul);
    this.alpha = this.alphaBase;
  };
}
