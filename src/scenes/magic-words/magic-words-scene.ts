import { TilingBackground } from "@components/tiling-background";
import { Scene, type SceneResizeData } from "@scenes/scene";
import { ASSETS } from "@services/assets";
import { sound } from "@services/sounds";
import { random, texture } from "@utils";
import type { Texture, Ticker } from "pixi.js";
import dialogueData from "../../../data/magic-words.json";
import { RichText } from "./rich-text";
import { ScrollView } from "./scroll-view";
import { SpeakerEntry } from "./speaker-entry";
import { TextBubble } from "./text-bubble";

// Message layout (centered around origin, 1000-unit design space width)
const DESIGN_WIDTH = 750;
const PADDING = 40;
const AVATAR_SIZE = 56;
const BUBBLE_PAD = 12;
const BUBBLE_MAX_TEXT_W: number = DESIGN_WIDTH - AVATAR_SIZE * 2 - PADDING * 2 - BUBBLE_PAD * 2;
const MESSAGE_SPACING = 10;
const CONTENT_PAD_TOP = 100;
const CONTENT_PAD_BOTTOM = 300;

// Timing
const TYPING_SPEED = 80;
const PAUSE_AFTER_MESSAGE = 0.5;
const PAUSE_CHARS: Set<string> = new Set([".", "!", "?"]);
const PAUSE_CHAR_DURATION = 0.3;
const PAUSE_EMOJI_DURATION = 0.4;

// (Scrolling constants moved to ScrollView component)

interface ActiveMessage {
  entry: SpeakerEntry;
  textBubble: TextBubble;
}

export class MagicWordsScene extends Scene {
  private readonly background = new TilingBackground();
  private readonly scrollView: ScrollView;

  private emojiTextures = new Map<string, Texture>();
  private avatarTextures = new Map<string, Texture>();
  private avatarPositions = new Map<string, "left" | "right">();

  private currentIndex = 0;
  private nextY = CONTENT_PAD_TOP;

  // Typing state
  private activeMsg?: ActiveMessage;
  private typingAccum = 0;
  private pauseTimer = 0;
  private typing = false;
  private pausing = false;
  private charPausing = false;
  private charPauseTimer = 0;
  private charPauseDuration = 0;

  private typingSoundCounter = 0;

  constructor() {
    super({
      minHeight: 500,
      minWidth: DESIGN_WIDTH,
      maxWidth: DESIGN_WIDTH,
    });

    for (const avatar of dialogueData.avatars)
      this.avatarPositions.set(avatar.name, avatar.position as "left" | "right");

    for (const e of dialogueData.emojies)
      this.emojiTextures.set(e.name, texture(`assets/magic-words/emojis/${e.name}.png`));

    for (const a of dialogueData.avatars)
      this.avatarTextures.set(a.name, texture(`assets/magic-words/avatars/${a.name.toLowerCase()}.png`));

    this.addChild(this.background);

    this.scrollView = new ScrollView(this.app.canvas, this.app.ticker);
    this.addChild(this.scrollView);

    this.addNextMessage();
    this.app.ticker.add(this.onTick);
  }

  protected resize({ localLeft, localTop, localWidth, localHeight, scale }: SceneResizeData): void {
    // Tiling background covers full viewport
    // Normalize scale to ensure consistent tile size across all scenes
    this.background.position.set(localLeft, localTop);
    this.background.scale.set(1 / scale);
    this.background.width = localWidth * scale;
    this.background.height = localHeight * scale;

    // Update scroll view
    this.scrollView.resize({ left: localLeft, top: localTop, width: localWidth, height: localHeight });
  }

  override destroy(): void {
    this.app.ticker.remove(this.onTick);
    this.scrollView.destroy();
    super.destroy();
  }

  // --- Tick ---

  private onTick = (ticker: Ticker): void => {
    const dt = ticker.deltaMS / 1000;

    // Typing
    if (this.typing && this.activeMsg) {
      if (this.charPausing) {
        this.charPauseTimer += dt;
        if (this.charPauseTimer >= this.charPauseDuration) this.charPausing = false;
      } else {
        this.typingAccum += dt * TYPING_SPEED;
        const toReveal = Math.floor(this.typingAccum);
        if (toReveal > 0) {
          const rt = this.activeMsg.entry.richText;
          const prevCount = rt.revealedCount;
          rt.revealedCount += toReveal;
          this.typingAccum -= toReveal;
          this.updateBubble();

          this.typingSoundCounter++;
          if (this.typingSoundCounter % 4 === 0) sound(ASSETS.SOUND_CLICK, { volume: 0.3, rate: random(0.95, 1.05) });

          // Check last revealed character for pause
          const lastIdx = prevCount + toReveal - 1;
          if (rt.isEmoji(lastIdx)) {
            this.charPausing = true;
            this.charPauseTimer = 0;
            this.charPauseDuration = PAUSE_EMOJI_DURATION;
          } else if (PAUSE_CHARS.has(rt.charAt(lastIdx))) {
            this.charPausing = true;
            this.charPauseTimer = 0;
            this.charPauseDuration = PAUSE_CHAR_DURATION;
          }
        }

        if (this.activeMsg.entry.richText.isFullyRevealed) {
          this.typing = false;
          this.pausing = true;
          this.pauseTimer = 0;
        }
      }
    }

    if (this.pausing) {
      this.pauseTimer += dt;
      if (this.pauseTimer >= PAUSE_AFTER_MESSAGE) {
        this.pausing = false;
        this.addNextMessage();
      }
    }
  };

  private updateBubble(): void {
    if (!this.activeMsg) return;
    this.activeMsg.textBubble.updateBubbleSize();
  }

  private addNextMessage(): void {
    if (this.currentIndex >= dialogueData.dialogue.length) return;

    const dialogueEntry = dialogueData.dialogue[this.currentIndex];
    this.currentIndex++;

    const position = this.avatarPositions.get(dialogueEntry.name) ?? "left";
    const { entry, finalRowHeight } = this.createMessageRow(dialogueEntry.name, dialogueEntry.text, position);
    entry.position.set(0, this.nextY);
    this.scrollView.content.addChild(entry);

    this.activeMsg = { entry, textBubble: entry.textBubble };
    this.typingAccum = 0;
    this.typing = true;

    this.nextY += finalRowHeight + MESSAGE_SPACING;

    // Update content height and scroll to bottom for new messages
    this.scrollView.setContentHeight(this.nextY + CONTENT_PAD_BOTTOM);
    this.scrollView.scrollToBottom();
  }

  private createMessageRow(
    name: string,
    text: string,
    position: "left" | "right",
  ): { entry: SpeakerEntry; finalRowHeight: number } {
    const richText = new RichText(text, this.emojiTextures, {
      maxWidth: BUBBLE_MAX_TEXT_W,
      fontSize: 28,
      fill: 0xffffff,
    });

    richText.revealAll();
    richText.revealedCount = 0;

    const textBubble = new TextBubble(richText);
    const avatarTexture = this.avatarTextures.get(name);
    const entry = new SpeakerEntry(name, textBubble, avatarTexture, position, DESIGN_WIDTH);

    return { entry, finalRowHeight: entry.finalRowHeight };
  }
}
