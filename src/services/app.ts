import { di } from "@elumixor/di";
import { EventEmitter } from "@elumixor/event-emitter";
import { Application, type Container, type Rectangle, type Renderer, type Ticker } from "pixi.js";

export interface ResizeData {
  width: number;
  height: number;
}

@di.injectable
export class App {
  private readonly pixi = new Application();
  readonly resized = new EventEmitter<ResizeData>();

  constructor() {
    window.addEventListener("resize", this.resize);
  }

  get stage(): Container {
    return this.pixi.stage;
  }

  get screen(): Rectangle {
    return this.pixi.screen;
  }

  get ticker(): Ticker {
    return this.pixi.ticker;
  }

  get renderer(): Renderer {
    return this.pixi.renderer;
  }

  get canvas(): HTMLCanvasElement {
    return this.pixi.canvas;
  }

  async init(): Promise<void> {
    await this.pixi.init({
      background: "#1a1a2e",
      resizeTo: window,
      resolution: window.devicePixelRatio,
      useBackBuffer: true,
      antialias: true,
    });

    document.body.appendChild(this.canvas);

    // Emit initial resize to position all components correctly
    this.resize();
  }

  private readonly resize = (): void => {
    this.renderer.resize(window.innerWidth, window.innerHeight);
    this.resized.emit({ width: window.innerWidth, height: window.innerHeight });
  };
}
