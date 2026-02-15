import { Assets } from "pixi.js";
import screenfull from "screenfull";
import { UiButton } from "./ui-button";

export class FullscreenButton extends UiButton {
  constructor() {
    super(Assets.get("assets/ui/fullscreen.png"), () => {
      if (screenfull.isEnabled) void screenfull.toggle();
    });
  }
}
