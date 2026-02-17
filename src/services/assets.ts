/**
 * Centralized, type-safe asset manifest.
 * All assets referenced here will be preloaded during the loading screen.
 * Use these constants throughout the codebase for type-safe asset access.
 */
export const ASSETS = {
  // Fonts
  FONT_ANTA: "assets/fonts/anta.ttf",
  FONT_SOUR_GUMMY: "assets/fonts/sour-gummy.ttf",
  FONT_FIRESIDE: "assets/fonts/fireside.otf",

  // UI
  UI_LEFT: "assets/ui/left.png",
  UI_FULLSCREEN: "assets/ui/fullscreen.png",
  UI_SOUND: "assets/ui/sound.png",
  UI_NO_SOUND: "assets/ui/no-sound.png",

  // Cards
  CARD_GRADIENT: "assets/card-gradient.png",
  CARD_BARD: "assets/cards/bard.png",
  CARD_MAGE: "assets/cards/mage.png",
  CARD_ROGUE: "assets/cards/rogue.png",
  CARD_WARRIOR: "assets/cards/warrior.png",

  // VFX
  VFX_TRACE: "assets/vfx/trace_01_a.png",
  VFX_EFFECT: "assets/vfx/effect_03_a.png",

  // Magic Words - Avatars
  MAGIC_WORDS_AVATAR_SHELDON: "assets/magic-words/avatars/sheldon.png",
  MAGIC_WORDS_AVATAR_LEONARD: "assets/magic-words/avatars/leonard.png",
  MAGIC_WORDS_AVATAR_PENNY: "assets/magic-words/avatars/penny.png",

  // Magic Words - Emojis
  MAGIC_WORDS_EMOJI_NEUTRAL: "assets/magic-words/emojis/neutral.png",
  MAGIC_WORDS_EMOJI_SAD: "assets/magic-words/emojis/sad.png",
  MAGIC_WORDS_EMOJI_INTRIGUED: "assets/magic-words/emojis/intrigued.png",
  MAGIC_WORDS_EMOJI_LAUGHING: "assets/magic-words/emojis/laughing.png",
  MAGIC_WORDS_EMOJI_SATISFIED: "assets/magic-words/emojis/satisfied.png",

  // Backgrounds
  BG_BOARD: "assets/board.jpg",
  BG_GALAXY: "assets/galaxy.png",

  // Sounds
  SOUND_CARDS_SLIDE: "assets/sounds/cards-slide.mp3",
  SOUND_CLICK: "assets/sounds/click.mp3",
  SOUND_FIRE: "assets/sounds/fire.mp3",
} as const;
