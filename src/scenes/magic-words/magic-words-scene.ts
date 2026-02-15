import { di } from "@elumixor/di";
import { Assets, Container, Graphics, Sprite, Text, type Texture, type Ticker, TilingSprite } from "pixi.js";
import dialogueData from "../../../data/magic-words.json";
import { App } from "../../app";
import { BackButton } from "../../components/back-button";
import { FullscreenButton } from "../../components/fullscreen-button";
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
const VIEW_PAD_TOP = 0;
const VIEW_PAD_BOTTOM = 0;
const CONTENT_PAD_TOP = 100;
const CONTENT_PAD_BOTTOM = 300;

// Timing
const TYPING_SPEED = 80;
const PAUSE_AFTER_MESSAGE = 0.5;
const PAUSE_CHARS = new Set([".", "!", "?"]);
const PAUSE_CHAR_DURATION = 0.3;
const PAUSE_EMOJI_DURATION = 0.4;

// Scrolling
const SCROLL_LERP = 0.15;
const WHEEL_SENSITIVITY = 0.4;
const TOUCH_DECEL = 0.95;
const TOUCH_MIN_VELOCITY = 0.5;
const OVERSCROLL_MAX = 120;
const OVERSCROLL_RESISTANCE = 0.3;
const BOUNCE_BACK_LERP = 0.15;

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
  private readonly fullscreenButton = new FullscreenButton();
  private readonly messagesContainer = new Container();
  private readonly background = new TilingSprite();
  private readonly scrollMask = new Graphics();
  private readonly scrollHit = new Graphics();

  private emojiTextures = new Map<string, Texture>();
  private avatarTextures = new Map<string, Texture>();
  private avatarPositions = new Map<string, "left" | "right">();

  private currentIndex = 0;
  private nextY = CONTENT_PAD_TOP;
  private scrollY = 0;
  private scrollTarget = 0;

  // Dynamic viewport (updated in onResize)
  private viewTop = 0;
  private viewHeight = 1000;

  // Typing state
  private activeMsg?: ActiveMessage;
  private typingAccum = 0;
  private pauseTimer = 0;
  private typing = false;
  private pausing = false;
  private charPausing = false;
  private charPauseTimer = 0;
  private charPauseDuration = 0;

  // Typing sound
  private typingSoundSrc = "";
  private typingSoundCounter = 0;

  // Touch drag state
  private dragging = false;
  private dragLastY = 0;
  private dragVelocity = 0;

  private boundWheel = this.handleWheel.bind(this);

  override async init() {
    for (const avatar of dialogueData.avatars)
      this.avatarPositions.set(avatar.name, avatar.position as "left" | "right");

    const emojiLoads = dialogueData.emojies.map(async (e) => {
      const texture = await Assets.load<Texture>(`assets/magic-words/emojis/${e.name}.png`);
      this.emojiTextures.set(e.name, texture);
    });
    const avatarLoads = dialogueData.avatars.map(async (a) => {
      const texture = await Assets.load<Texture>(`assets/magic-words/avatars/${a.name.toLowerCase()}.png`);
      this.avatarTextures.set(a.name, texture);
    });
    const bgTexturePromise = Assets.load<Texture>("assets/galaxy.png");
    await Promise.all([...emojiLoads, ...avatarLoads, Assets.load("assets/fonts/sour-gummy.ttf"), bgTexturePromise]);

    // Build checkerboard tile: 2x2 grid with icons at (0,0) and (1,1)
    const iconTex = await bgTexturePromise;
    const iconSize = 32;
    const gap = 50;
    const cell = iconSize + gap;
    const tileSize = cell * 2;
    const tile = new Container();
    // Invisible rect to define exact tile bounds for seamless tiling
    const bounds = new Graphics().rect(0, 0, tileSize, tileSize).fill({ color: 0, alpha: 0.001 });
    const s0 = new Sprite(iconTex);
    s0.width = s0.height = iconSize;
    s0.position.set(gap / 2, gap / 2);
    const s1 = new Sprite(iconTex);
    s1.width = s1.height = iconSize;
    s1.position.set(cell + gap / 2, cell + gap / 2);
    tile.addChild(bounds, s0, s1);
    this.background.texture = this.app.renderer.generateTexture({ target: tile, resolution: 2 });
    this.background.tint = 0x1a1a2e;
    this.addChild(this.background);

    this.typingSoundSrc = "assets/sounds/click.mp3";

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

    this.addChild(this.backButton, this.fullscreenButton);

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

    this.viewTop = localTop + VIEW_PAD_TOP;
    this.viewHeight = localHeight - VIEW_PAD_TOP - VIEW_PAD_BOTTOM;

    // Tiling background covers full viewport
    this.background.position.set(localLeft, localTop);
    this.background.width = localWidth;
    this.background.height = localHeight;

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

    this.fullscreenButton.placeTopRight(localLeft + localWidth, localTop, 0);
    this.backButton.placeTopRight(localLeft + localWidth, localTop, 1);
  }

  override destroy() {
    this.app.ticker.remove(this.onTick);
    this.app.renderer.canvas.removeEventListener("wheel", this.boundWheel);
    super.destroy();
  }

  private get maxScroll() {
    return Math.max(0, this.nextY + CONTENT_PAD_BOTTOM - this.viewHeight);
  }

  private clampScroll(v: number) {
    return Math.max(0, Math.min(v, this.maxScroll));
  }

  // --- Input handlers ---

  private handleWheel(e: WheelEvent) {
    e.preventDefault();
    let delta = e.deltaY * WHEEL_SENSITIVITY;
    if (this.scrollTarget < 0 || this.scrollTarget > this.maxScroll) delta *= OVERSCROLL_RESISTANCE;
    this.scrollTarget = Math.max(-OVERSCROLL_MAX, Math.min(this.scrollTarget + delta, this.maxScroll + OVERSCROLL_MAX));
    this.dragVelocity = 0;
  }

  private handlePointerDown(e: { globalY: number }) {
    this.dragging = true;
    this.dragLastY = e.globalY;
    this.dragVelocity = 0;
  }

  private handlePointerMove(e: { globalY: number }) {
    if (!this.dragging) return;
    const dy = this.dragLastY - e.globalY;
    const s = this.scale.x;
    let delta = dy / s;

    // Dampen movement when overscrolling
    if (this.scrollTarget < 0 || this.scrollTarget > this.maxScroll) delta *= OVERSCROLL_RESISTANCE;

    this.scrollTarget = Math.max(-OVERSCROLL_MAX, Math.min(this.scrollTarget + delta, this.maxScroll + OVERSCROLL_MAX));
    this.dragVelocity = delta;
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
      if (this.charPausing) {
        this.charPauseTimer += dt;
        if (this.charPauseTimer >= this.charPauseDuration) this.charPausing = false;
      } else {
        this.typingAccum += dt * TYPING_SPEED;
        const toReveal = Math.floor(this.typingAccum);
        if (toReveal > 0) {
          const prevCount = this.activeMsg.richText.revealedCount;
          this.activeMsg.richText.revealedCount += toReveal;
          this.typingAccum -= toReveal;
          this.updateBubble();

          this.typingSoundCounter++;
          if (this.typingSoundSrc && this.typingSoundCounter % 4 === 0) {
            const sound = new Audio(this.typingSoundSrc);
            sound.volume = 0.3;
            sound.playbackRate = 1 + Math.random() * 0.4;
            sound.play().catch(() => {
              // Autoplay blocked
            });
          }

          // Check last revealed character for pause
          const lastIdx = prevCount + toReveal - 1;
          const rt = this.activeMsg.richText;
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

        if (this.activeMsg.richText.isFullyRevealed) {
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

    // Inertia & bounce-back
    if (!this.dragging) {
      if (Math.abs(this.dragVelocity) > TOUCH_MIN_VELOCITY) {
        this.scrollTarget += this.dragVelocity;
        this.dragVelocity *= TOUCH_DECEL;
        // Extra deceleration when overscrolling via inertia
        if (this.scrollTarget < 0 || this.scrollTarget > this.maxScroll) this.dragVelocity *= OVERSCROLL_RESISTANCE;
      } else {
        this.dragVelocity = 0;
      }

      // Bounce back into valid range
      const clamped = this.clampScroll(this.scrollTarget);
      if (this.scrollTarget !== clamped) {
        this.scrollTarget += (clamped - this.scrollTarget) * BOUNCE_BACK_LERP;
        if (Math.abs(this.scrollTarget - clamped) < 0.5) this.scrollTarget = clamped;
      }
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

    // Always scroll to bottom for new messages
    this.scrollTarget = this.maxScroll;
  }

  private createMessageRow(
    name: string,
    text: string,
    position: "left" | "right",
  ): ActiveMessage & { row: Container; finalRowHeight: number } {
    const row = new Container();
    const color = characterColors[name] ?? defaultColor;

    const nameLabel = new Text({ text: name, style: { fontSize: 13, fill: color, fontFamily: "Sour Gummy" } });

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
    const container = new Container();
    const color = characterColors[name] ?? defaultColor;
    const r = AVATAR_SIZE / 2;

    const circleBg = new Graphics().circle(r, r, r).fill({ color: 0xfff5e0 }).stroke({ color: 0x3b2414, width: 3 });

    const texture = this.avatarTextures.get(name);
    if (texture) {
      const sprite = new Sprite(texture);
      sprite.width = AVATAR_SIZE;
      sprite.height = AVATAR_SIZE;
      const mask = new Graphics().circle(r, r, r).fill({ color: 0xffffff });
      container.addChild(circleBg, sprite, mask);
      sprite.mask = mask;
    } else {
      const initial = new Text({
        text: name[0],
        style: { fontSize: 24, fill: 0xffffff, fontFamily: "Sour Gummy" },
      });
      initial.anchor.set(0.5);
      initial.position.set(r, r);
      container.addChild(circleBg, initial);
    }

    return container;
  }
}
