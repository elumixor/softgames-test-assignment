import { di } from "@elumixor/di";
import { EventEmitter } from "@elumixor/event-emitter";
import { ASSETS } from "@services/assets";
import { Assets } from "pixi.js";
import { SoundManager } from "./sounds";

/** Unified asset loader for PixiJS assets and sounds */
@di.injectable
export class AssetLoader {
  private readonly soundManager = di.inject(SoundManager);
  private readonly audioContext = this.soundManager.context;
  private readonly soundAssets = [ASSETS.SOUND_CARDS_SLIDE, ASSETS.SOUND_CLICK, ASSETS.SOUND_FIRE];
  readonly progress = new EventEmitter<number>();

  private _pixiProgress = 0;
  private _soundProgress = 0;

  private set pixiProgress(value: number) {
    this._pixiProgress = value;
    this.updateProgress();
  }

  private set soundProgress(value: number) {
    this._soundProgress = value;
    this.updateProgress();
  }

  /** Load all assets with progress tracking */
  async load(): Promise<void> {
    const soundSet = new Set<string>(this.soundAssets);
    const pixiAssets = Object.values(ASSETS).filter((asset) => !soundSet.has(asset));

    const [loadedSounds] = await Promise.all([this.loadSounds(), this.loadPixiAssets(pixiAssets)]);

    for (const [src, buffer] of loadedSounds) this.soundManager.register(src, buffer);

    this.progress.emit(1);
  }

  private async loadPixiAssets(assets: readonly string[]): Promise<void> {
    await Assets.load([...assets], (progress) => {
      this.pixiProgress = progress;
    });
  }

  private async loadSounds(): Promise<Map<string, AudioBuffer>> {
    const buffers = new Map<string, AudioBuffer>();
    let loaded = 0;

    await Promise.all(
      this.soundAssets.map(async (src) => {
        const buffer = await this.loadSound(src);
        buffers.set(src, buffer);

        loaded++;
        this.soundProgress = loaded / this.soundAssets.length;
      }),
    );

    return buffers;
  }

  private async loadSound(src: string): Promise<AudioBuffer> {
    const response = await fetch(src);
    const arrayBuffer = await response.arrayBuffer();
    return await this.audioContext.decodeAudioData(arrayBuffer);
  }

  private updateProgress(): void {
    const total = (this._pixiProgress + this._soundProgress) / 2;
    this.progress.emit(total);
  }
}
