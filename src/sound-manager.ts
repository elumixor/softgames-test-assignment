import { di } from "@elumixor/di";

@di.injectable
export class SoundManager {
  private _muted = false;

  get muted() {
    return this._muted;
  }

  toggle() {
    this._muted = !this._muted;
  }
}
