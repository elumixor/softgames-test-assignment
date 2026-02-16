import { texture } from "@utils";
import screenfull from "screenfull";
import { ASSETS } from "@/assets";
import { UiButton } from "./button";

export class FullscreenButton extends UiButton {
  constructor() {
    super(texture(ASSETS.UI_FULLSCREEN));
    this.clicked.subscribe(() => {
      if (screenfull.isEnabled) void screenfull.toggle();
    });
  }
}
