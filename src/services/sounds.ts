import { di } from "@elumixor/di";

const STORAGE_KEY = "sound-muted";

interface SoundInstance {
  stop(): void;
}

@di.injectable
export class SoundManager {
  private _muted = localStorage.getItem(STORAGE_KEY) === "true";
  readonly context = new AudioContext();
  private readonly masterGain = this.context.createGain();
  private readonly buffers = new Map<string, AudioBuffer>();

  constructor() {
    this.masterGain.gain.value = this._muted ? 0 : 1;
    this.masterGain.connect(this.context.destination);

    // Resume context on first user gesture (autoplay policy)
    const resume = (): void => {
      void this.context.resume();
      document.removeEventListener("pointerdown", resume);
    };
    if (this.context.state === "suspended") document.addEventListener("pointerdown", resume);
  }

  get muted(): boolean {
    return this._muted;
  }

  set muted(value: boolean) {
    this._muted = value;
    localStorage.setItem(STORAGE_KEY, String(this._muted));
    this.masterGain.gain.value = this._muted ? 0 : 1;
  }

  /** Register a pre-loaded audio buffer */
  register(src: string, buffer: AudioBuffer): void {
    this.buffers.set(src, buffer);
  }

  play(src: string, options?: { volume?: number; loop?: boolean; rate?: number }): SoundInstance {
    const buffer = this.buffers.get(src);
    if (!buffer) {
      console.warn(`Sound not found: ${src}`);
      return {
        stop(): void {
          // No-op stop for missing sound
        },
      };
    }

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = options?.loop ?? false;
    source.playbackRate.value = options?.rate ?? 1;

    const gain = this.context.createGain();
    gain.gain.value = options?.volume ?? 1;
    source.connect(gain).connect(this.masterGain);

    source.start();
    return {
      stop(): void {
        source.stop();
      },
    };
  }
}

/** Utility alias for di.inject(SoundManager).play(...) */
export function sound(src: string, options?: { volume?: number; loop?: boolean; rate?: number }): SoundInstance {
  return di.inject(SoundManager).play(src, options);
}
