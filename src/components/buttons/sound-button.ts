import { di } from "@elumixor/di";
import { SoundManager } from "@services/sound-manager";
import { texture } from "@utils";
import { ASSETS } from "@/assets";
import { UiButton } from "./button";

export class SoundButton extends UiButton {
  private readonly soundManager = di.inject(SoundManager);
  private readonly onTex = texture(ASSETS.UI_SOUND);
  private readonly offTex = texture(ASSETS.UI_NO_SOUND);

  constructor() {
    super(texture(ASSETS.UI_SOUND));
    this.clicked.subscribe(() => {
      this.soundManager.muted = !this.soundManager.muted;
      this.texture = this.soundManager.muted ? this.offTex : this.onTex;
    });
  }
}
