import { di } from "@elumixor/di";
import { Assets, type Texture } from "pixi.js";
import { SoundManager } from "../sound-manager";
import { UiButton } from "./ui-button";

export class SoundButton extends UiButton {
  private readonly soundManager = di.inject(SoundManager);
  private readonly onTex: Texture = Assets.get("assets/ui/sound.png");
  private readonly offTex: Texture = Assets.get("assets/ui/no-sound.png");

  constructor() {
    super(Assets.get("assets/ui/sound.png"), () => {
      this.soundManager.toggle();
      this.sprite.texture = this.soundManager.muted ? this.offTex : this.onTex;
    });
  }
}
