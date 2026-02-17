import { di } from "@elumixor/di";
import { ASSETS } from "@services/assets";
import { SoundManager } from "@services/sounds";
import { texture } from "@utils";
import { UiButton } from "./button";

export class SoundButton extends UiButton {
  private readonly soundManager = di.inject(SoundManager);
  private readonly onTexture = texture(ASSETS.UI_SOUND);
  private readonly offTexture = texture(ASSETS.UI_NO_SOUND);

  constructor() {
    super(ASSETS.UI_SOUND);
    this.clicked.subscribe(() => {
      this.soundManager.muted = !this.soundManager.muted;
      this.texture = this.soundManager.muted ? this.offTexture : this.onTexture;
    });
  }
}
