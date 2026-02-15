import { Text, type TextOptions } from "pixi.js";

/**
 * A Text that reveals its content character by character.
 * Layout should be based on full text dimensions (call `revealAll()` to measure,
 * then reset `revealedCount = 0` to start the animation).
 */
export class LetterAnimatedText extends Text {
  private readonly _fullText: string;
  private _revealed = 0;

  constructor(fullText: string, options?: Omit<TextOptions, "text">) {
    super({ ...options, text: "" });
    this._fullText = fullText;
  }

  get totalCharacters() {
    return this._fullText.length;
  }

  get revealedCount() {
    return this._revealed;
  }

  set revealedCount(value: number) {
    const clamped = Math.min(Math.max(0, value), this._fullText.length);
    if (clamped === this._revealed) return;
    this._revealed = clamped;
    this.text = this._fullText.slice(0, clamped);
  }

  get isFullyRevealed() {
    return this._revealed >= this._fullText.length;
  }

  revealAll() {
    this.revealedCount = this._fullText.length;
  }
}
