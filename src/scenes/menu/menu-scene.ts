import { TilingBackground } from "@components/tiling-background";
import { Scene } from "@scenes/scene";
import type { ResizeData } from "@services/app";
import gsap from "gsap";
import { Container, Text } from "pixi.js";
import { FullscreenHintText } from "./fullscreen-hint";
import { MenuButton } from "./menu-button";

interface MenuEntry {
  label: string;
  route: "ace-of-shadows" | "magic-words" | "phoenix-flame";
}

const entries: MenuEntry[] = [
  { label: "Ace of Shadows", route: "ace-of-shadows" },
  { label: "Magic Words", route: "magic-words" },
  { label: "Phoenix Flame", route: "phoenix-flame" },
];

export class MenuScene extends Scene {
  private readonly background = new TilingBackground();
  private readonly title = new Text({
    text: "Softgames Assignment",
    style: { fontSize: 32, fill: 0xffffff, fontFamily: "Anta" },
  });
  private readonly buttons = new Container();
  private readonly fullscreenHint = new FullscreenHintText();

  constructor() {
    super({
      minWidth: 450,
      minHeight: 500,
      maxHeight: 800,
    });
    this.addChild(this.background);

    // Center title (300 units above center in 1000x1000 design space)
    this.title.anchor.set(0.5);
    this.title.position.set(0, -150);
    this.addChild(this.title);

    // Center buttons vertically around origin
    const buttonSpacing = 70;
    const totalHeight = (entries.length - 1) * buttonSpacing;
    const startY = -totalHeight / 2;

    for (let i = 0; i < entries.length; i++) {
      const button = new MenuButton(entries[i].label);
      button.clicked.subscribe(() => {
        location.hash = `#/${entries[i].route}`;
      });
      button.position.set(0, startY + i * buttonSpacing);
      this.buttons.addChild(button);
    }

    this.addChild(this.buttons);

    // Position fullscreen hint below buttons
    this.fullscreenHint.position.set(0, startY + entries.length * buttonSpacing + 40);
    this.addChild(this.fullscreenHint);

    // Start with everything invisible
    this.background.alpha = 0;
    this.title.alpha = 0;
    for (const child of this.buttons.children) child.alpha = 0;
    this.fullscreenHint.alpha = 0;

    // Animated sequence
    const timeline = gsap.timeline();
    timeline.to(this.background, { alpha: 1, duration: 0.6, ease: "power2.out" }, 0);
    timeline.to(this.title, { alpha: 1, duration: 0.5, ease: "power2.out" }, 0.2);

    // Stagger buttons
    for (let i = 0; i < this.buttons.children.length; i++)
      timeline.to(this.buttons.children[i], { alpha: 1, duration: 0.4, ease: "power2.out" }, 0.5 + i * 0.1);

    // Fullscreen hint last
    const lastButtonDelay = 0.5 + (this.buttons.children.length - 1) * 0.1 + 0.2;
    timeline.to(this.fullscreenHint, { alpha: 1, duration: 0.4, ease: "power2.out" }, lastButtonDelay);

    // Start pulsing only after fade-in completes
    timeline.call(() => this.fullscreenHint.startPulse());
  }

  protected resize({ width, height }: ResizeData): void {
    super.resize({ width, height });

    // Background needs to fill the entire viewport
    const s = this.scale.x;
    const localLeft = -(width / 2) / s;
    const localTop = -(height / 2) / s;

    this.background.position.set(localLeft, localTop);
    this.background.width = width / s;
    this.background.height = height / s;
  }

  override destroy(): void {
    gsap.killTweensOf(this.background);
    gsap.killTweensOf(this.title);
    for (const child of this.buttons.children) gsap.killTweensOf(child);
    gsap.killTweensOf(this.fullscreenHint);
    super.destroy();
  }
}
