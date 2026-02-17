import { ASSETS } from "@services/assets";
import { random, range } from "@utils";
import { Container, Sprite, Texture } from "pixi.js";

const MAX_PARTICLES = 8;

interface Particle {
  sprite: Sprite;
  startX: number;
  startY: number;
  riseSpeed: number;
  swirlAmplitude: number;
  swirlFrequency: number;
  swirlPhase: number;
  age: number;
  lifetime: number;
}

export class FireParticles extends Container {
  private readonly particles: Particle[] = [];
  private readonly texture: Texture;
  private centerX = 500;
  private centerY = 1000;
  private spawnWidth = 500;

  constructor() {
    super();

    this.texture = Texture.from(ASSETS.VFX_TRACE);
    for (const _ of range(MAX_PARTICLES)) this.spawnParticle();
  }

  update(dt: number): void {
    for (const p of this.particles) {
      p.age += dt;

      const y = p.startY - p.age * p.riseSpeed;
      const x = p.startX + Math.sin(p.age * p.swirlFrequency + p.swirlPhase) * p.swirlAmplitude;
      p.sprite.position.set(x, y);

      // Align rotation to velocity direction
      const vx = Math.cos(p.age * p.swirlFrequency + p.swirlPhase) * p.swirlAmplitude * p.swirlFrequency;
      const vy = -p.riseSpeed;
      p.sprite.rotation = Math.atan2(vy, vx) - Math.PI / 2;

      // Fade in then out
      const t = p.age / p.lifetime;
      const alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
      p.sprite.alpha = Math.max(0, alpha) * 0.8;

      // Shrink slightly as it fades
      const shrink = dt * 0.01;
      p.sprite.scale.x = Math.max(0, p.sprite.scale.x - shrink);
      p.sprite.scale.y = Math.max(0, p.sprite.scale.y - shrink);

      if (p.age >= p.lifetime) this.resetParticle(p);
    }
  }

  reposition(centerX: number, centerY: number, spawnWidth: number): void {
    this.centerX = centerX;
    this.centerY = centerY;
    this.spawnWidth = spawnWidth;
  }

  private spawnParticle(): void {
    const sprite = new Sprite({ texture: this.texture });
    sprite.anchor.set(0.5, 0.1);
    sprite.alpha = 0;
    sprite.blendMode = "add";
    this.addChild(sprite);

    const p: Particle = {
      sprite,
      startX: 0,
      startY: 0,
      riseSpeed: 0,
      swirlAmplitude: 0,
      swirlFrequency: 0,
      swirlPhase: 0,
      age: 0,
      lifetime: 0,
    };
    this.resetParticle(p);
    p.age = random(0, p.lifetime);
    this.particles.push(p);
  }

  private resetParticle(p: Particle): void {
    p.age = 0;
    p.lifetime = random(2.5, 3.0);
    p.startX = this.centerX + random(-0.5, 0.5) * this.spawnWidth;
    p.startY = this.centerY;
    p.riseSpeed = random(200, 250);

    p.swirlAmplitude = random(20, 60);
    p.swirlFrequency = random(1.5, 4);
    p.swirlPhase = random(0, Math.PI * 2);

    const scale = random(0.5, 0.9);
    p.sprite.scale.set(scale * 0.2, scale * 0.1);
    p.sprite.tint = Math.random() < 0.5 ? 0xffcc66 : 0xff8833;
  }
}
