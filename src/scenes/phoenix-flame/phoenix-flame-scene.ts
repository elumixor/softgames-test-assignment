import { di } from "@elumixor/di";
import { Graphics, Sprite, Text, Texture } from "pixi.js";
import { App } from "../../app";
import { BackButton } from "../../components/back-button";
import { FullscreenButton } from "../../components/fullscreen-button";
import { SoundButton } from "../../components/sound-button";
import { SoundManager } from "../../sound-manager";
import { Scene } from "../scene";
import { FireControls } from "./fire-controls";
import { FireFilter } from "./fire-filter";
import { FireGround } from "./fire-ground";
import { FireParticles } from "./fire-particles";

function hash(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

function noise1D(t: number) {
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
}

export class PhoenixFlameScene extends Scene {
  private readonly app = di.inject(App);
  private readonly title = new Text({
    text: "Phoenix Flame",
    style: { fontSize: 28, fill: 0xffffff, fontFamily: "Anta" },
  });
  private readonly backButton = new BackButton(() => {
    location.hash = "";
  });
  private readonly fullscreenButton = new FullscreenButton();
  private readonly soundButton = new SoundButton();
  private readonly soundManager = di.inject(SoundManager);

  private readonly ground = new FireGround();
  private readonly fireBase = new Graphics();
  private readonly fireFilter = new FireFilter();
  private readonly particles = new FireParticles();
  private readonly bloom = new Sprite({
    texture: Texture.from("assets/vfx/effect_03_a.png"),
    anchor: 0.5,
    blendMode: "add",
    scale: 3.0,
    tint: 0xff8844,
  });
  private bloomTime = 0;
  private readonly fireSound = new Audio("assets/sounds/fire.mp3");
  private controls?: FireControls;

  override init() {
    this.title.anchor.set(0.5);
    this.title.position.set(500, 50);

    this.fireBase.filters = [this.fireFilter];

    this.addChild(
      this.ground,
      this.fireBase,
      this.particles,
      this.bloom,
      this.title,
      this.backButton,
      this.fullscreenButton,
      this.soundButton,
    );

    this.fireSound.loop = true;
    this.fireSound.volume = 0.4;
    // biome-ignore lint/suspicious/noEmptyBlockStatements: autoplay may be blocked
    if (!this.soundManager.muted) this.fireSound.play().catch(() => {});

    this.app.ticker.add(this.tick, this);
    this.controls = new FireControls(this.fireFilter);
  }

  override onResize(screenWidth: number, screenHeight: number) {
    const s = this.scale.x;
    const localLeft = -this.position.x / s;
    const localTop = -this.position.y / s;
    const localWidth = screenWidth / s;
    const localHeight = screenHeight / s;
    const localRight = localLeft + localWidth;

    // Scale fire to fit min(min(0.8 * width, 500), 0.8 * height) in screen pixels
    const fireSize = Math.min(Math.min(0.8 * screenWidth, 1000), 0.8 * screenHeight) / s;
    const fireLeft = localLeft + (localWidth - fireSize) / 2;
    const fireTop = localTop + (localHeight - fireSize) / 2;
    this.fireBase.clear();
    this.fireBase.rect(0, 0, fireSize, fireSize).fill(0xffffff);
    this.fireBase.position.set(fireLeft, fireTop);

    // Position effects relative to the fire sprite (matching shader uCenter [0.5, 0.95])
    const centerX = fireLeft + fireSize * 0.5;
    const centerY = fireTop + fireSize * 0.85;
    this.particles.reposition(centerX, centerY, fireSize * 0.3);
    this.bloom.position.set(centerX, centerY);
    const groundY = centerY - fireSize * 0.05;
    this.ground.resize(centerX, groundY, localLeft, localTop, localTop + localHeight, localWidth);

    this.fullscreenButton.placeTopRight(localRight, localTop, 0);
    this.soundButton.placeTopRight(localRight, localTop, 1);
    this.backButton.placeTopRight(localRight, localTop, 2);
  }

  override destroy() {
    this.fireSound.pause();
    this.controls?.destroy();
    this.app.ticker.remove(this.tick, this);
    super.destroy();
  }

  private tick = () => {
    const dt = this.app.ticker.deltaMS / 1000;
    this.fireFilter.time += dt;
    this.particles.update(dt);
    this.bloomTime += dt;
    this.bloom.rotation = noise1D(this.bloomTime);
    this.bloom.alpha = noise1D(this.bloomTime * 20) * 0.3;

    // Sync sound with mute state
    if (this.soundManager.muted && !this.fireSound.paused) this.fireSound.pause();
    // biome-ignore lint/suspicious/noEmptyBlockStatements: autoplay may be blocked
    else if (!this.soundManager.muted && this.fireSound.paused) this.fireSound.play().catch(() => {});
  };
}
