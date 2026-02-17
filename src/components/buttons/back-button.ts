import { ASSETS } from "@services/assets";
import { UiButton } from "./button";

export class BackButton extends UiButton {
  constructor() {
    super(ASSETS.UI_LEFT);
    this.clicked.subscribe(() => {
      location.hash = "";
    });
  }
}
