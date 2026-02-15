import { Assets } from "pixi.js";
import { UiButton } from "./ui-button";

export class BackButton extends UiButton {
  constructor(onClick: () => void) {
    super(Assets.get("assets/ui/left.png"), onClick);
  }
}
