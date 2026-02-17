import { Container, Text, type Texture } from "pixi.js";
import { Avatar } from "./avatar";
import type { RichText } from "./rich-text";
import type { TextBubble } from "./text-bubble";

const PADDING = 40;
const AVATAR_SIZE = 56;
const GAP = 10;

const characterColors: Record<string, number> = {
  Sheldon: 0x6dbb58,
  Penny: 0xf55d81,
  Leonard: 0xf3b63a,
  Neighbour: 0x8888aa,
};
const defaultColor = 0x8888aa;

export class SpeakerEntry extends Container {
  readonly richText: RichText;
  readonly bubbleRightEdge: number;
  readonly finalRowHeight: number;

  private readonly nameLabel: Text;
  private readonly avatar: Avatar;

  constructor(
    name: string,
    readonly textBubble: TextBubble,
    avatarTexture: Texture | undefined,
    readonly side: "left" | "right",
    designWidth: number,
  ) {
    super();

    this.richText = textBubble.richText;

    const color = characterColors[name] ?? defaultColor;
    this.nameLabel = new Text({ text: name, style: { fontSize: 20, fill: color, fontFamily: "Sour Gummy" } });

    this.avatar = new Avatar(name, avatarTexture);

    const bubbleY = this.nameLabel.height + 4;
    const finalBubbleW = this.textBubble.finalBubbleWidth;
    const finalBubbleH = this.textBubble.finalBubbleHeight;

    if (side === "left") {
      const avatarX = -(designWidth / 2) + PADDING;
      const contentX = avatarX + AVATAR_SIZE + GAP;
      this.avatar.position.set(avatarX, bubbleY);
      this.nameLabel.position.set(contentX, 0);
      this.textBubble.position.set(contentX, bubbleY);
      this.bubbleRightEdge = contentX + finalBubbleW;
    } else {
      const avatarX = designWidth / 2 - PADDING - AVATAR_SIZE;
      this.bubbleRightEdge = avatarX - GAP;
      this.avatar.position.set(avatarX, bubbleY);
      this.nameLabel.anchor.set(1, 0);
      this.nameLabel.position.set(this.bubbleRightEdge, 0);
      this.textBubble.position.set(this.bubbleRightEdge - finalBubbleW, bubbleY);
    }

    this.addChild(this.avatar, this.nameLabel, this.textBubble);

    this.finalRowHeight = bubbleY + Math.max(AVATAR_SIZE, finalBubbleH);
  }
}
