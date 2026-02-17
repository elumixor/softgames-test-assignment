import { di } from "@elumixor/di";
import { Scene } from "@scenes/scene";
import { AssetLoader } from "@services/asset-loader";
import gsap from "gsap";
import { ProgressBar } from "./progress-bar";

export class LoadingScene extends Scene {
  private readonly assetLoader = di.inject(AssetLoader);
  private readonly progressBar = new ProgressBar();

  constructor() {
    super({
      minWidth: 450,
      minHeight: 600,
      maxHeight: 800,
    });

    this.addChild(this.progressBar);
  }

  async load(): Promise<void> {
    this.assetLoader.progress.subscribe((progress) => {
      this.progressBar.progress = progress;
    });

    await this.assetLoader.load();
  }

  async fadeOut(): Promise<void> {
    await gsap.to(this, { alpha: 0, duration: 0.5, ease: "power2.inOut" });
  }

  override destroy(): void {
    gsap.killTweensOf(this);
    super.destroy();
  }
}
