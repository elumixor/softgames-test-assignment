import { ASSETS } from "@services/assets";
import { sprite } from "@utils";
import gsap from "gsap";
import { Container, Text } from "pixi.js";
import screenfull from "screenfull";

const ICON_SIZE = 24;
const FONT_SIZE = 18;
const PULSE_DURATION = 1.5;
const ALPHA_MIN = 0.4;
const ALPHA_MAX = 0.7;
const HOVER_ALPHA = 1.0;
const HOVER_SCALE = 1.08;
const HOVER_DURATION = 0.4;

export class FullscreenHintText extends Container {
  private readonly content = new Container();

  constructor() {
    super();

    const style = { fontSize: FONT_SIZE, fill: 0xffffff, fontFamily: "Anta" };

    const prefix = new Text({ text: "Press ", style });
    const icon = sprite(ASSETS.UI_FULLSCREEN);
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
    this.on("pointerdown", () => {
      if (screenfull.isEnabled && !screenfull.isFullscreen) void screenfull.request();
    });
    this.on("pointerenter", this.onHoverStart, this);
    this.on("pointerleave", this.onHoverEnd, this);

    this.visible = !screenfull.isFullscreen;
    if (screenfull.isEnabled) screenfull.on("change", this.onFullscreenChange);

    this.content.alpha = ALPHA_MIN;
    this.startPulse();
  }

  override destroy(): void {
    gsap.killTweensOf(this);
    if (screenfull.isEnabled) screenfull.off("change", this.onFullscreenChange);
    super.destroy();
  }

  startPulse(): void {
    gsap.to(this.content, {
      alpha: ALPHA_MAX,
      duration: PULSE_DURATION / 2,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      overwrite: true,
    });
  }

  private onHoverStart(): void {
    gsap.to(this.content, {
      alpha: HOVER_ALPHA,
      scaleUniform: HOVER_SCALE,
      duration: HOVER_DURATION,
      ease: "back.out(1.7)",
      overwrite: true,
    });
  }

  private onHoverEnd(): void {
    gsap
      .to(this.content, {
        alpha: ALPHA_MIN,
        scaleUniform: 1,
        duration: HOVER_DURATION,
        ease: "back.out(1.7)",
        overwrite: true,
      })
      .then(() => {
        this.startPulse();
      });
  }

  private onFullscreenChange = (): void => {
    this.visible = !screenfull.isFullscreen;
  };
}
