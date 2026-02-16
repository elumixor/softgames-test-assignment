import { texture } from "@utils";
import { ASSETS } from "@/assets";
import { UiButton } from "./button";

export class BackButton extends UiButton {
  constructor() {
    super(texture(ASSETS.UI_LEFT));
    this.clicked.subscribe(() => {
      location.hash = "";
    });
  }
}
