import { Container, Graphics } from "pixi.js";
import type { RichText } from "./rich-text";

const BUBBLE_PAD = 12;
const BUBBLE_RADIUS = 10;
const BUBBLE_COLOR = 0x2a2a3e;

export class TextBubble extends Container {
  private readonly bubble = new Graphics();
  readonly richText: RichText;

  constructor(richText: RichText) {
    super();
    this.richText = richText;

    this.bubble.roundRect(0, 0, BUBBLE_PAD * 2, BUBBLE_PAD * 2, BUBBLE_RADIUS).fill({ color: BUBBLE_COLOR });
    this.richText.position.set(BUBBLE_PAD, BUBBLE_PAD);

    this.addChild(this.bubble, this.richText);
  }

  updateBubbleSize(): void {
    const vw = this.richText.visibleWidth;
    const vh = this.richText.visibleHeight;
    const bw = Math.max(vw + BUBBLE_PAD * 2, BUBBLE_PAD * 2);
    const bh = Math.max(vh + BUBBLE_PAD * 2, BUBBLE_PAD * 2);

    this.bubble.clear();
    this.bubble.roundRect(0, 0, bw, bh, BUBBLE_RADIUS).fill({ color: BUBBLE_COLOR });
  }

  get finalBubbleWidth(): number {
    return this.richText.fullWidth + BUBBLE_PAD * 2;
  }

  get finalBubbleHeight(): number {
    return this.richText.fullHeight + BUBBLE_PAD * 2;
  }
}
