import { LetterAnimatedText } from "@utils";
import { Container, Sprite, type Texture } from "pixi.js";

type Segment = { type: "text"; content: string } | { type: "emoji"; name: string };

function parseSegments(raw: string): Segment[] {
  const result: Segment[] = [];
  const regex = /\{(\w+)\}/g;
  let lastIndex = 0;

  for (const match of raw.matchAll(regex)) {
    const idx = match.index;
    if (idx > lastIndex) result.push({ type: "text", content: raw.slice(lastIndex, idx) });
    result.push({ type: "emoji", name: match[1] });
    lastIndex = idx + match[0].length;
  }

  if (lastIndex < raw.length) result.push({ type: "text", content: raw.slice(lastIndex) });
  return result;
}

interface InlineItem {
  element: LetterAnimatedText | Sprite;
  chars: number;
}

/**
 * Renders text with inline emoji sprites. Placeholders like `{emoji_name}`
 * are replaced with the corresponding texture from the provided map.
 *
 * Supports character-by-character typing via `revealedCount`.
 * Use `visibleWidth` / `visibleHeight` to get the current extent of revealed content.
 */
export class RichText extends Container {
  private readonly items: InlineItem[] = [];
  private _totalCharacters = 0;
  private _revealedCount = 0;
  private _lineHeight = 0;

  get totalCharacters() {
    return this._totalCharacters;
  }

  get revealedCount() {
    return this._revealedCount;
  }

  set revealedCount(value: number) {
    const clamped = Math.min(Math.max(0, value), this._totalCharacters);
    this._revealedCount = clamped;

    let remaining = clamped;
    for (const item of this.items) {
      if (item.element instanceof LetterAnimatedText) {
        const reveal = Math.min(remaining, item.chars);
        item.element.revealedCount = reveal;
        remaining -= reveal;
      } else {
        item.element.visible = remaining >= item.chars;
        if (item.element.visible) remaining -= item.chars;
      }
    }
  }

  get isFullyRevealed() {
    return this._revealedCount >= this._totalCharacters;
  }

  revealAll() {
    this.revealedCount = this._totalCharacters;
  }

  get visibleWidth() {
    let maxRight = 0;
    for (const item of this.items) {
      const el = item.element;
      if (el instanceof LetterAnimatedText) {
        if (el.revealedCount === 0) continue;
      } else if (!el.visible) continue;
      maxRight = Math.max(maxRight, el.x + el.width);
    }
    return maxRight;
  }

  get visibleHeight() {
    let maxBottom = 0;
    for (const item of this.items) {
      const el = item.element;
      if (el instanceof LetterAnimatedText) {
        if (el.revealedCount === 0) continue;
      } else if (!el.visible) continue;
      maxBottom = Math.max(maxBottom, el.y + this._lineHeight);
    }
    return maxBottom;
  }

  constructor(
    text: string,
    emojiTextures: Map<string, Texture>,
    { maxWidth = 600, fontSize = 16, fill = 0xffffff }: { maxWidth?: number; fontSize?: number; fill?: number } = {},
  ) {
    super();

    this._lineHeight = fontSize * 1.4;
    const lineHeight = this._lineHeight;
    const emojiSize = lineHeight;
    const style = { fontSize, fill, fontFamily: "Arial" };
    const segments = parseSegments(text);

    let x = 0;
    let y = 0;

    for (const segment of segments) {
      if (segment.type === "emoji") {
        const texture = emojiTextures.get(segment.name);
        if (!texture) continue;

        if (x + emojiSize > maxWidth && x > 0) {
          x = 0;
          y += lineHeight;
        }

        const sprite = new Sprite(texture);
        sprite.width = emojiSize;
        sprite.height = emojiSize;
        sprite.position.set(x, y + (lineHeight - emojiSize) / 2 - 2);
        sprite.visible = false;
        this.addChild(sprite);
        this.items.push({ element: sprite, chars: 1 });
        this._totalCharacters += 1;
        x += emojiSize + 2;
      } else {
        const words = segment.content.split(/(\s+)/);
        for (const word of words) {
          if (!word) continue;

          const t = new LetterAnimatedText(word, { style });

          // Measure full width for layout positioning
          t.revealAll();
          const fullWidth = t.width;
          t.revealedCount = 0;

          if (x + fullWidth > maxWidth && x > 0 && word.trim()) {
            x = 0;
            y += lineHeight;
          }

          if (x === 0 && !word.trim()) {
            t.destroy();
            continue;
          }

          t.position.set(x, y);
          this.addChild(t);
          this.items.push({ element: t, chars: word.length });
          this._totalCharacters += word.length;
          x += fullWidth;
        }
      }
    }
  }
}
