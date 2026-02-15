import { di } from "@elumixor/di";
import { Assets, Container, Graphics, Sprite, Text, type Texture, type Ticker } from "pixi.js";
import dialogueData from "../../../data/magic-words.json";
import { App } from "../../app";
import { BackButton } from "../../components/back-button";
import { Scene } from "../scene";
import { RichText } from "./rich-text";

// Message layout (in 1000-unit design space width)
const PADDING = 40;
const AVATAR_SIZE = 56;
const BUBBLE_PAD = 12;
const BUBBLE_MAX_TEXT_W = 520;
const BUBBLE_RADIUS = 10;
const BUBBLE_COLOR = 0x2a2a3e;
const GAP = 10;
const MESSAGE_SPACING = 10;
const FONT_SIZE = 16;
const VIEW_PAD = 10;

// Timing
const TYPING_SPEED = 80;
const PAUSE_AFTER_MESSAGE = 0.3;

// Scrolling
const SCROLL_LERP = 0.15;
const WHEEL_SENSITIVITY = 0.4;
const TOUCH_DECEL = 0.95;
const TOUCH_MIN_VELOCITY = 0.5;

const characterColors: Record<string, number> = {
  Sheldon: 0x6dbb58,
  Penny: 0xf55d81,
  Leonard: 0xf3b63a,
  Neighbour: 0x8888aa,
};
const defaultColor = 0x8888aa;

interface ActiveMessage {
  richText: RichText;
  bubble: Graphics;
  bubbleContainer: Container;
  position: "left" | "right";
  bubbleRightEdge: number;
  finalBubbleW: number;
}

export class MagicWordsScene extends Scene {
  private readonly app = di.inject(App);
  private readonly backButton = new BackButton(() => {
    location.hash = "";
  });
  private readonly messagesContainer = new Container();
  private readonly scrollMask = new Graphics();
  private readonly scrollHit = new Graphics();

  private emojiTextures = new Map<string, Texture>();
  private avatarTextures = new Map<string, Texture>();
  private avatarPositions = new Map<string, "left" | "right">();

  private currentIndex = 0;
  private nextY = 0;
  private scrollY = 0;
  private scrollTarget = 0;
  private autoScrollEnabled = true;

  // Dynamic viewport (updated in onResize)
  private viewTop = 0;
  private viewHeight = 1000;

  // Typing state
  private activeMsg?: ActiveMessage;
  private typingAccum = 0;
  private pauseTimer = 0;
  private typing = false;
  private pausing = false;

  // Touch drag state
  private dragging = false;
  private dragLastY = 0;
  private dragVelocity = 0;

  private boundWheel = this.handleWheel.bind(this);

  override async init() {
    for (const avatar of dialogueData.avatars)
      this.avatarPositions.set(avatar.name, avatar.position as "left" | "right");

    const emojiLoads = dialogueData.emojies.map(async (e) => {
      const texture = await Assets.load<Texture>(`magic-words/emojis/${e.name}.png`);
      this.emojiTextures.set(e.name, texture);
    });
    const avatarLoads = dialogueData.avatars.map(async (a) => {
      const texture = await Assets.load<Texture>(`magic-words/avatars/${a.name.toLowerCase()}.png`);
      this.avatarTextures.set(a.name, texture);
    });
    await Promise.all([...emojiLoads, ...avatarLoads]);

    // Mask (placeholder — redrawn immediately in onResize)
    this.scrollMask.rect(0, 0, 1000, 1000).fill({ color: 0xffffff });
    this.addChild(this.scrollMask);

    this.messagesContainer.mask = this.scrollMask;
    this.addChild(this.messagesContainer);

    // Hit area for touch/pointer scrolling (placeholder — redrawn in onResize)
    this.scrollHit.rect(0, 0, 1000, 1000).fill({ color: 0x000000, alpha: 0 });
    this.scrollHit.eventMode = "static";
    this.scrollHit.cursor = "default";
    this.scrollHit.on("pointerdown", this.handlePointerDown, this);
    this.scrollHit.on("pointermove", this.handlePointerMove, this);
    this.scrollHit.on("pointerup", this.handlePointerUp, this);
    this.scrollHit.on("pointerupoutside", this.handlePointerUp, this);
    this.addChild(this.scrollHit);

    this.addChild(this.backButton);

    this.app.renderer.canvas.addEventListener("wheel", this.boundWheel, { passive: false });

    this.addNextMessage();
    this.app.ticker.add(this.onTick);
  }

  override onResize(screenWidth: number, screenHeight: number) {
    const s = this.scale.x;
    const localLeft = -this.position.x / s;
    const localTop = -this.position.y / s;
    const localWidth = screenWidth / s;
    const localHeight = screenHeight / s;

    this.viewTop = localTop + VIEW_PAD;
    this.viewHeight = localHeight - VIEW_PAD * 2;

    // Redraw mask to cover full viewport
    this.scrollMask.clear();
    this.scrollMask.rect(localLeft, this.viewTop, localWidth, this.viewHeight).fill({ color: 0xffffff });

    // Redraw hit area to cover full viewport
    this.scrollHit.clear();
    this.scrollHit.rect(localLeft, localTop, localWidth, localHeight).fill({ color: 0x000000, alpha: 0 });

    // Re-clamp scroll
    this.scrollTarget = this.clampScroll(this.scrollTarget);
    this.scrollY = this.scrollTarget;
    this.messagesContainer.y = this.viewTop - this.scrollY;

    this.backButton.placeTopRight(localLeft + localWidth, localTop);
  }

  override destroy() {
    this.app.ticker.remove(this.onTick);
    this.app.renderer.canvas.removeEventListener("wheel", this.boundWheel);
    super.destroy();
  }

  private get maxScroll() {
    return Math.max(0, this.nextY - this.viewHeight);
  }

  private clampScroll(v: number) {
    return Math.max(0, Math.min(v, this.maxScroll));
  }

  // --- Input handlers ---

  private handleWheel(e: WheelEvent) {
    e.preventDefault();
    this.autoScrollEnabled = false;
    this.scrollTarget = this.clampScroll(this.scrollTarget + e.deltaY * WHEEL_SENSITIVITY);
    this.dragVelocity = 0;
  }

  private handlePointerDown(e: { globalY: number }) {
    this.dragging = true;
    this.dragLastY = e.globalY;
    this.dragVelocity = 0;
    this.autoScrollEnabled = false;
  }

  private handlePointerMove(e: { globalY: number }) {
    if (!this.dragging) return;
    const dy = this.dragLastY - e.globalY;
    const s = this.scale.x;
    this.dragVelocity = dy / s;
    this.scrollTarget = this.clampScroll(this.scrollTarget + this.dragVelocity);
    this.dragLastY = e.globalY;
  }

  private handlePointerUp() {
    this.dragging = false;
  }

  // --- Tick ---

  private onTick = (ticker: Ticker) => {
    const dt = ticker.deltaMS / 1000;

    // Typing
    if (this.typing && this.activeMsg) {
      this.typingAccum += dt * TYPING_SPEED;
      const toReveal = Math.floor(this.typingAccum);
      if (toReveal > 0) {
        this.activeMsg.richText.revealedCount += toReveal;
        this.typingAccum -= toReveal;
        this.updateBubble();
      }

      if (this.activeMsg.richText.isFullyRevealed) {
        this.typing = false;
        this.pausing = true;
        this.pauseTimer = 0;
      }
    }

    if (this.pausing) {
      this.pauseTimer += dt;
      if (this.pauseTimer >= PAUSE_AFTER_MESSAGE) {
        this.pausing = false;
        this.addNextMessage();
      }
    }

    // Inertia
    if (!this.dragging && Math.abs(this.dragVelocity) > TOUCH_MIN_VELOCITY) {
      this.scrollTarget = this.clampScroll(this.scrollTarget + this.dragVelocity);
      this.dragVelocity *= TOUCH_DECEL;
    } else if (!this.dragging) {
      this.dragVelocity = 0;
    }

    // Smooth scroll
    const diff = this.scrollTarget - this.scrollY;
    if (Math.abs(diff) > 0.5) {
      this.scrollY += diff * SCROLL_LERP;
      this.messagesContainer.y = this.viewTop - this.scrollY;
    }
  };

  private updateBubble() {
    if (!this.activeMsg) return;
    const { richText, bubble } = this.activeMsg;

    const vw = richText.visibleWidth;
    const vh = richText.visibleHeight;
    const bw = Math.max(vw + BUBBLE_PAD * 2, BUBBLE_PAD * 2);
    const bh = Math.max(vh + BUBBLE_PAD * 2, BUBBLE_PAD * 2);

    bubble.clear();
    bubble.roundRect(0, 0, bw, bh, BUBBLE_RADIUS).fill({ color: BUBBLE_COLOR });
  }

  private addNextMessage() {
    if (this.currentIndex >= dialogueData.dialogue.length) return;

    const entry = dialogueData.dialogue[this.currentIndex];
    this.currentIndex++;

    const position = this.avatarPositions.get(entry.name) ?? "left";
    const msg = this.createMessageRow(entry.name, entry.text, position);
    msg.row.position.set(0, this.nextY);
    msg.row.alpha = 0;
    this.messagesContainer.addChild(msg.row);

    const fadeIn = (t: Ticker) => {
      msg.row.alpha += t.deltaMS / 200;
      if (msg.row.alpha >= 1) {
        msg.row.alpha = 1;
        this.app.ticker.remove(fadeIn);
      }
    };
    this.app.ticker.add(fadeIn);

    this.activeMsg = msg;
    this.typingAccum = 0;
    this.typing = true;

    this.nextY += msg.finalRowHeight + MESSAGE_SPACING;

    if (this.autoScrollEnabled) {
      const overflow = this.nextY - this.viewHeight;
      if (overflow > 0) this.scrollTarget = overflow;
    }
  }

  private createMessageRow(
    name: string,
    text: string,
    position: "left" | "right",
  ): ActiveMessage & { row: Container; finalRowHeight: number } {
    const row = new Container();
    const color = characterColors[name] ?? defaultColor;

    const nameLabel = new Text({ text: name, style: { fontSize: 13, fill: color, fontFamily: "Arial" } });

    const richText = new RichText(text, this.emojiTextures, {
      maxWidth: BUBBLE_MAX_TEXT_W,
      fontSize: FONT_SIZE,
      fill: 0xffffff,
    });

    richText.revealAll();
    const finalTextW = richText.visibleWidth;
    const finalTextH = richText.visibleHeight;
    richText.revealedCount = 0;

    const finalBubbleW = finalTextW + BUBBLE_PAD * 2;
    const finalBubbleH = finalTextH + BUBBLE_PAD * 2;

    const bubble = new Graphics()
      .roundRect(0, 0, BUBBLE_PAD * 2, BUBBLE_PAD * 2, BUBBLE_RADIUS)
      .fill({ color: BUBBLE_COLOR });
    richText.position.set(BUBBLE_PAD, BUBBLE_PAD);

    const bubbleContainer = new Container();
    bubbleContainer.addChild(bubble, richText);

    const avatarContainer = this.createAvatar(name);

    const bubbleY = nameLabel.height + 4;
    let bubbleRightEdge = 0;

    if (position === "left") {
      avatarContainer.position.set(PADDING, bubbleY);
      nameLabel.position.set(PADDING + AVATAR_SIZE + GAP, 0);
      bubbleContainer.position.set(PADDING + AVATAR_SIZE + GAP, bubbleY);
      bubbleRightEdge = PADDING + AVATAR_SIZE + GAP + finalBubbleW;
    } else {
      const avatarX = 1000 - PADDING - AVATAR_SIZE;
      bubbleRightEdge = avatarX - GAP;
      avatarContainer.position.set(avatarX, bubbleY);
      nameLabel.anchor.set(1, 0);
      nameLabel.position.set(bubbleRightEdge, 0);
      bubbleContainer.position.set(bubbleRightEdge - finalBubbleW, bubbleY);
    }

    row.addChild(avatarContainer, nameLabel, bubbleContainer);

    const finalRowHeight = bubbleY + Math.max(AVATAR_SIZE, finalBubbleH);

    return { row, richText, bubble, bubbleContainer, position, bubbleRightEdge, finalBubbleW, finalRowHeight };
  }

  private createAvatar(name: string): Container {
    const texture = this.avatarTextures.get(name);
    if (texture) {
      const sprite = new Sprite(texture);
      sprite.width = AVATAR_SIZE;
      sprite.height = AVATAR_SIZE;
      return sprite;
    }

    const container = new Container();
    const circle = new Graphics()
      .circle(AVATAR_SIZE / 2, AVATAR_SIZE / 2, AVATAR_SIZE / 2)
      .fill({ color: characterColors[name] ?? defaultColor });
    const initial = new Text({
      text: name[0],
      style: { fontSize: 24, fill: 0xffffff, fontFamily: "Arial" },
    });
    initial.anchor.set(0.5);
    initial.position.set(AVATAR_SIZE / 2, AVATAR_SIZE / 2);
    container.addChild(circle, initial);
    return container;
  }
}
