import { di } from "@elumixor/di";

const STORAGE_KEY = "sound-muted";

@di.injectable
export class SoundManager {
  private _muted = localStorage.getItem(STORAGE_KEY) === "true";

  get muted() {
    return this._muted;
  }

  toggle() {
    this._muted = !this._muted;
    localStorage.setItem(STORAGE_KEY, String(this._muted));
  }
}
