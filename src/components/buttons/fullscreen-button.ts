import { ASSETS } from "@services/assets";
import screenfull from "screenfull";
import { UiButton } from "./button";

export class FullscreenButton extends UiButton {
  constructor() {
    super(ASSETS.UI_FULLSCREEN);
    this.clicked.subscribe(() => {
      if (screenfull.isEnabled) void screenfull.toggle();
    });
  }
}
