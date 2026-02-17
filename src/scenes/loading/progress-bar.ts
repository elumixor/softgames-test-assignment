import gsap from "gsap";
import { Container, Graphics, Text } from "pixi.js";

const BAR_WIDTH = 400;
const BAR_HEIGHT = 20;
const BAR_RADIUS = 20;

export class ProgressBar extends Container {
  private readonly fill = new Graphics();
  private readonly border = new Graphics();
  private readonly text = new Text({
    text: "Loading... 0%",
    style: {
      fill: 0xffffff,
      fontSize: 32,
      fontFamily: "Arial",
    },
  });

  private _progress = 0;

  constructor() {
    super();

    // Setup border (centered)
    this.border
      .roundRect(-BAR_WIDTH / 2, -BAR_HEIGHT / 2, BAR_WIDTH, BAR_HEIGHT, BAR_RADIUS)
      .stroke({ width: 3, color: 0x4a5568 });
    this.addChild(this.border);

    // Setup fill
    this.addChild(this.fill);

    // Setup text label (centered above the bar)
    this.text.anchor.set(0.5);
    this.text.position.set(0, -BAR_HEIGHT / 2 - 60);
    this.addChild(this.text);
  }

  get progress(): number {
    return this._progress;
  }

  set progress(value: number) {
    const clampedValue = Math.max(0, Math.min(1, value));
    gsap.to(this, {
      _progress: clampedValue,
      duration: 0.3,
      ease: "power2.out",
    });

    // Update text
    const percentage = Math.round(this._progress * 100);
    this.text.text = `Loading... ${percentage}%`;

    // Update progress bar fill (centered)
    const fillWidth = (BAR_WIDTH - 8) * this._progress;
    this.fill.clear();
    if (fillWidth > 0)
      this.fill
        .roundRect(-BAR_WIDTH / 2 + 4, -BAR_HEIGHT / 2 + 4, fillWidth, BAR_HEIGHT - 8, BAR_RADIUS - 2)
        .fill({ color: 0x6366f1 });
  }

  override destroy(): void {
    gsap.killTweensOf(this);
    super.destroy();
  }
}
