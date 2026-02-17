import gsap from "gsap";
import { Container, Graphics, type Ticker } from "pixi.js";

const SCROLL_DURATION = 0.3;
const WHEEL_SENSITIVITY = 0.4;
const TOUCH_DECEL = 0.95;
const TOUCH_MIN_VELOCITY = 0.5;
const OVERSCROLL_MAX = 120;
const OVERSCROLL_RESISTANCE = 0.3;
const BOUNCE_DURATION = 0.5;

export interface ScrollViewResizeData {
  left: number;
  top: number;
  width: number;
  height: number;
}

export class ScrollView extends Container {
  readonly content = new Container();
  private readonly scrollMask = new Graphics();
  private readonly scrollHit = new Graphics();

  private scrollY = 0;
  private scrollTarget = 0;
  private contentHeight = 0;

  // Dynamic viewport (updated in resize)
  private viewTop = 0;
  private viewHeight = 1000;

  // Touch drag state
  private dragging = false;
  private dragLastY = 0;
  private dragVelocity = 0;

  private readonly boundWheel: (e: WheelEvent) => void;
  private readonly ticker: Ticker;
  private readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, ticker: Ticker) {
    super();

    this.canvas = canvas;
    this.ticker = ticker;
    this.boundWheel = this.handleWheel.bind(this);

    // Mask (placeholder — redrawn in resize)
    this.scrollMask.rect(0, 0, 1000, 1000).fill({ color: 0xffffff });
    this.addChild(this.scrollMask);

    this.content.mask = this.scrollMask;
    this.addChild(this.content);

    // Hit area for touch/pointer scrolling (placeholder — redrawn in resize)
    this.scrollHit.rect(0, 0, 1000, 1000).fill({ color: 0x000000, alpha: 0 });
    this.scrollHit.eventMode = "static";
    this.scrollHit.cursor = "default";
    this.scrollHit.on("pointerdown", this.handlePointerDown, this);
    this.scrollHit.on("pointermove", this.handlePointerMove, this);
    this.scrollHit.on("pointerup", this.handlePointerUp, this);
    this.scrollHit.on("pointerupoutside", this.handlePointerUp, this);
    this.addChild(this.scrollHit);

    this.canvas.addEventListener("wheel", this.boundWheel, { passive: false });
    this.ticker.add(this.onTick);
  }

  resize({ left, top, width, height }: ScrollViewResizeData): void {
    this.viewTop = top;
    this.viewHeight = height;

    // Redraw mask to cover full viewport
    this.scrollMask.clear();
    this.scrollMask.rect(left, this.viewTop, width, this.viewHeight).fill({ color: 0xffffff });

    // Redraw hit area to cover full viewport
    this.scrollHit.clear();
    this.scrollHit.rect(left, top, width, height).fill({ color: 0x000000, alpha: 0 });

    // Re-clamp scroll
    this.scrollTarget = this.clampScroll(this.scrollTarget);
    this.scrollY = this.scrollTarget;
    gsap.set(this.content, { y: this.viewTop - this.scrollY });
  }

  override destroy(): void {
    this.ticker.remove(this.onTick);
    this.canvas.removeEventListener("wheel", this.boundWheel);
    gsap.killTweensOf(this);
    gsap.killTweensOf(this.content);
    super.destroy();
  }

  setContentHeight(height: number): void {
    this.contentHeight = height;
  }

  scrollTo(position: number): void {
    this.scrollTarget = this.clampScroll(position);
  }

  scrollToBottom(): void {
    this.scrollTarget = this.maxScroll;
  }

  get currentScroll(): number {
    return this.scrollY;
  }

  private get maxScroll(): number {
    return Math.max(0, this.contentHeight - this.viewHeight);
  }

  private clampScroll(v: number): number {
    return Math.max(0, Math.min(v, this.maxScroll));
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    let delta = e.deltaY * WHEEL_SENSITIVITY;
    if (this.scrollTarget < 0 || this.scrollTarget > this.maxScroll) delta *= OVERSCROLL_RESISTANCE;
    this.scrollTarget = Math.max(-OVERSCROLL_MAX, Math.min(this.scrollTarget + delta, this.maxScroll + OVERSCROLL_MAX));
    this.dragVelocity = 0;
  }

  private handlePointerDown(e: { globalY: number }): void {
    this.dragging = true;
    this.dragLastY = e.globalY;
    this.dragVelocity = 0;
  }

  private handlePointerMove(e: { globalY: number }): void {
    if (!this.dragging) return;
    const dy = this.dragLastY - e.globalY;
    const s = this.scale.x;
    let delta = dy / s;

    // Dampen movement when overscrolling
    if (this.scrollTarget < 0 || this.scrollTarget > this.maxScroll) delta *= OVERSCROLL_RESISTANCE;

    this.scrollTarget = Math.max(-OVERSCROLL_MAX, Math.min(this.scrollTarget + delta, this.maxScroll + OVERSCROLL_MAX));
    this.dragVelocity = delta;
    this.dragLastY = e.globalY;
  }

  private handlePointerUp(): void {
    this.dragging = false;
  }

  private readonly onTick = (): void => {
    // Inertia & bounce-back
    if (!this.dragging) {
      if (Math.abs(this.dragVelocity) > TOUCH_MIN_VELOCITY) {
        this.scrollTarget += this.dragVelocity;
        this.dragVelocity *= TOUCH_DECEL;
        // Extra deceleration when overscrolling via inertia
        if (this.scrollTarget < 0 || this.scrollTarget > this.maxScroll) this.dragVelocity *= OVERSCROLL_RESISTANCE;
      } else {
        this.dragVelocity = 0;
      }

      // Bounce back into valid range
      const clamped = this.clampScroll(this.scrollTarget);
      if (this.scrollTarget !== clamped) {
        gsap.to(this, {
          scrollTarget: clamped,
          duration: BOUNCE_DURATION,
          ease: "back.out(1.7)",
          overwrite: true,
        });
      }
    }

    // Smooth scroll
    const diff = this.scrollTarget - this.scrollY;
    if (Math.abs(diff) > 0.5) {
      gsap.to(this, {
        scrollY: this.scrollTarget,
        duration: SCROLL_DURATION,
        ease: "power2.out",
        overwrite: true,
        onUpdate: () => {
          this.content.y = this.viewTop - this.scrollY;
        },
      });
    }
  };
}
