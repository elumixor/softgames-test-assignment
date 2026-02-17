import { Scene, type SceneResizeData } from "@scenes/scene";
import { ASSETS } from "@services/assets";
import { sound } from "@services/sounds";
import { texture } from "@utils";
import { Sprite, Text } from "pixi.js";
import { FireControls } from "./controls";
import { FireFilter } from "./fire-filter";
import { FireGround } from "./ground";
import { FireParticles } from "./particles";

function hash(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

function noise1D(t: number): number {
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
}

export class PhoenixFlameScene extends Scene {
  private readonly title = new Text({
    text: "Phoenix Flame",
    style: { fontSize: 28, fill: 0xffffff, fontFamily: "Anta" },
  });

  private readonly ground = new FireGround();
  private readonly fireMesh = new FireFilter();
  private readonly particles = new FireParticles();
  private readonly bloom = new Sprite({
    texture: texture(ASSETS.VFX_EFFECT),
    anchor: 0.5,
    blendMode: "add",
    scale: 3.0,
    tint: 0xff8844,
  });
  private bloomTime = 0;
  private controls?: FireControls;
  private readonly sound = sound(ASSETS.SOUND_FIRE, { volume: 0.4, loop: true });

  constructor() {
    super({
      // portrait: { minWidth: 450, minHeight: 1000 },
      // landscape: { minWidth: 1000, minHeight: 700 },
      minWidth: 50,
      minHeight: 100,
    });

    // Center title at top
    this.title.anchor.set(0.5);
    this.title.position.set(0, -450);

    this.addChild(this.ground, this.fireMesh, this.particles, this.bloom, this.title);

    this.app.ticker.add(this.tick, this);
    this.controls = new FireControls(this.fireMesh);
  }

  protected resize(data: SceneResizeData): void {
    super.resize(data);

    // Position effects relative to the fire (matching shader uCenter [0.5, 0.95])
    // const centerX = 0;
    // const centerY = fireSize * 0.35; // 0.85 - 0.5 = 0.35 offset from center
    // this.particles.reposition(centerX, centerY, fireSize * 0.3);
    // this.bloom.position.set(centerX, centerY);
    // const groundY = centerY - fireSize * 0.05;

    // Ground needs viewport coordinates for full-width rendering
    // const { localLeft, localTop, localWidth, localHeight } = data;
    // this.ground.resize(centerX, groundY, localLeft, localTop, localTop + localHeight, localWidth);
  }

  override destroy(): void {
    this.controls?.destroy();
    this.sound.stop();
    this.app.ticker.remove(this.tick, this);
    super.destroy();
  }

  private tick = (): void => {
    const dt = this.app.ticker.deltaMS / 1000;
    this.fireMesh.time += dt;
    this.particles.update(dt);
    this.bloomTime += dt;
    this.bloom.rotation = noise1D(this.bloomTime);
    this.bloom.alpha = noise1D(this.bloomTime * 20) * 0.3;
  };
}
