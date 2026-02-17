import { Scene, type SceneResizeData } from "@scenes/scene";
import { ASSETS } from "@services/assets";
import { sound } from "@services/sounds";
import { isMobile, rectSprite, texture } from "@utils";
import { Sprite, Text } from "pixi.js";
import { Fire } from "./fire";
import { createFloor } from "./floor";
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

  private readonly background = rectSprite({ width: 2, height: 2, color: 0x000000 });
  private readonly floor = createFloor();
  private readonly fire = new Fire(100, 100);
  private readonly particles = new FireParticles();
  private readonly bloom = new Sprite({
    texture: texture(ASSETS.VFX_EFFECT),
    anchor: 0.5,
    blendMode: "add",
    scale: 1.5,
    tint: 0xff8844,
  });
  private bloomTime = 0;
  private readonly sound = sound(ASSETS.SOUND_FIRE, { volume: 0.4, loop: true });

  constructor() {
    super({
      minWidth: 300,
      minHeight: 600,
      maxHeight: 800,
    });

    this.title.anchor.set(0.5);
    this.floor.anchor.set(0.5, 0);
    this.fire.pivot.y = this.fire.height;

    // Use overlay blend mode only on non-mobile devices
    if (!isMobile) this.title.blendMode = "overlay";
    else this.title.alpha = 0.5;

    this.addChild(this.background, this.floor, this.fire, this.particles, this.bloom, this.title);

    this.app.ticker.add(this.tick, this);
  }

  protected resize(data: SceneResizeData): void {
    super.resize(data);

    // Scale background to fill the entire window
    this.background.width = data.localWidth;
    this.background.height = data.localHeight;
    this.background.position.set(data.localLeft, data.localTop);

    this.fire.y = data.localHeight / 2;
    this.fire.uniformHeight = data.localHeight;

    const effectCenterY = (data.localHeight * 0.75) / 2;
    this.bloom.y = effectCenterY;
    this.particles.reposition(0, effectCenterY, data.localHeight * 0.3);

    this.floor.coverTo(data.localWidth * 1.5, data.localHeight * 0.25);
    this.floor.y = data.localHeight * 0.25;
  }

  override destroy(): void {
    this.sound.stop();
    this.app.ticker.remove(this.tick, this);
    super.destroy();
  }

  private tick = (): void => {
    const dt = this.app.ticker.deltaMS / 1000;
    this.fire.time += dt;
    this.particles.update(dt);
    this.bloomTime += dt;
    this.bloom.rotation = noise1D(this.bloomTime);
    this.bloom.alpha = noise1D(this.bloomTime * 20) * 0.3;
  };
}
