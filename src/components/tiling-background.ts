import { ASSETS } from "@services/assets";
import { sprite, texture } from "@utils";
import gsap from "gsap";
import { Container, Graphics, TilingSprite } from "pixi.js";

const PARALLAX_AMOUNT = 15;
const PARALLAX_DURATION = 0.8;
const MOBILE_PARALLAX_AMOUNT = 5;

// Track current mouse position globally for initialization
let lastMouseX: number = window.innerWidth / 2;
let lastMouseY: number = window.innerHeight / 2;
window.addEventListener("mousemove", (e: MouseEvent) => {
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

export class TilingBackground extends TilingSprite {
  private readonly isMobile = !window.matchMedia("(hover: hover)").matches;

  constructor() {
    super();

    const iconTex = texture(ASSETS.BG_GALAXY);
    const iconSize = 32;
    const gap = 50;
    const cell = iconSize + gap;
    const tileSize = cell * 2;

    const tile = new Container();
    const bounds = new Graphics().rect(0, 0, tileSize, tileSize).fill({ color: 0, alpha: 0.001 });

    const first = sprite(iconTex);
    first.uniformWidth = iconSize;
    first.position.set(gap / 2, gap / 2);

    const second = sprite(iconTex);
    second.uniformWidth = iconSize;
    second.position.set(cell + gap / 2, cell + gap / 2);

    tile.addChild(bounds, first, second);
    this.texture = tile.toTexture();
    this.tint = 0x1a1a2e;

    if (!this.isMobile) {
      // Initialize parallax based on current mouse position
      const cx = lastMouseX / window.innerWidth - 0.5;
      const cy = lastMouseY / window.innerHeight - 0.5;
      this.tilePosition.set(-cx * PARALLAX_AMOUNT, -cy * PARALLAX_AMOUNT);

      window.addEventListener("mousemove", this.onMouseMove);
    } else {
      // Mobile: create looping parallax animation
      gsap.timeline({ repeat: -1, yoyo: true }).to(this.tilePosition, {
        x: MOBILE_PARALLAX_AMOUNT,
        y: MOBILE_PARALLAX_AMOUNT * 0.5,
        duration: 3.5,
        ease: "sine.inOut",
      });
    }
  }

  override destroy(): void {
    if (!this.isMobile) {
      window.removeEventListener("mousemove", this.onMouseMove);
    }
    gsap.killTweensOf(this.tilePosition);
    super.destroy();
  }

  private readonly onMouseMove = (e: MouseEvent): void => {
    const cx = e.clientX / window.innerWidth - 0.5;
    const cy = e.clientY / window.innerHeight - 0.5;
    const targetX = cx * PARALLAX_AMOUNT;
    const targetY = cy * PARALLAX_AMOUNT;

    gsap.to(this.tilePosition, {
      x: -targetX,
      y: -targetY,
      duration: PARALLAX_DURATION,
      ease: "power2.out",
      overwrite: true,
    });
  };
}
