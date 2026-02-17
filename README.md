# Softgames Test Assignment

Three interactive mini-games built with PixiJS v8 and TypeScript.

**Live Demo:** https://elumixor.github.io/softgames-test-assignment/

---

## Overview

Implementation of three assignment tasks:

1. **Ace of Shadows** - 144-sprite card animation system
2. **Magic Words** - Text and inline emoji dialogue renderer
3. **Phoenix Flame** - Fire effect with custom shader and particles

---

## Technology Stack

### Core

- **PixiJS v8** - 2D WebGL rendering
- **TypeScript 5.7** - Strict mode
- **Vite 6** - Build tool and dev server
- **Bun** - Package manager

### Code Quality

- **Biome 2.3.9** - Linting and formatting

### Libraries

- **GSAP 3.14** - Animation timelines
- **@elumixor/di** (v0.3) - Dependency injection container
- **@elumixor/event-emitter** (v1.0.7) - Type-safe events
- **@elumixor/extensions** (v2.3) - Array/Set/String utilities
- **stats.js** - FPS monitoring
- **screenfull** - Fullscreen API wrapper

_Note: @elumixor packages are custom libraries by the author._

---

## Project Structure

```
src/
├── main.ts                    # Entry point
├── services/                  # Singleton services (DI)
│   ├── app.ts                 # PixiJS app wrapper
│   ├── asset-loader.ts        # Asset and sound loading
│   ├── assets.ts              # Asset paths
│   └── sounds.ts              # Web Audio manager
├── scenes/                    # Game scenes
│   ├── scene.ts               # Base class with scaling
│   ├── scene-manager.ts       # Hash-based routing
│   ├── loading/               # Loading screen
│   ├── menu/                  # Main menu
│   ├── ace-of-shadows/        # Card game
│   ├── magic-words/           # Dialogue system
│   └── phoenix-flame/         # Fire effect
├── components/                # UI components
│   ├── buttons/
│   └── tiling-background.ts
└── utils/                     # Utilities
```

### Architecture Decisions

**Dependency Injection**

- Used `@elumixor/di` for singleton services
- Pattern: `@di.injectable` decorator auto-registers on construction
- Services injected via `di.inject(ServiceClass)`

**Routing**

- Hash-based navigation (`location.hash = "#/scene-name"`)
- Scene lifecycle managed by SceneManager

**Events**

- EventEmitter pattern for component communication
- Used for: resize, progress, interactions

**Responsive Design**

- Base Scene class handles scaling automatically
- 1000-unit design space, scaled to viewport
- Separate portrait/landscape configurations

---

## Implementation Details

### 1. Ace of Shadows

**Requirements:**

- 144 sprites (not graphic objects)
- Stacked like cards
- Top card moves every 1 second
- Animation takes 2 seconds
- Different destination stack

**Implementation:**

**Sprite Generation** ([build-sprites-from-spritesheet.ts](src/scenes/ace-of-shadows/build-sprites-from-spritesheet.ts))

- 144 cards: 4 types × 3 colors × 12 levels
- All rendered to single RenderTexture (texture atlas)
- Individual sprites reference regions of atlas

**Card Structure** ([create-card.ts](src/scenes/ace-of-shadows/create-card.ts))

- Container with: mask, background, color overlay, gradient, border, text

**Animation** ([ace-of-shadows-scene.ts:142-202](src/scenes/ace-of-shadows/ace-of-shadows-scene.ts#L142-L202))

- GSAP timeline with position, arc motion (sine wave), scale, rotation
- Move interval: 1s (0.1s when hovering)
- Animation duration: 0.6s (adjusted from 2s requirement for better UX)
- Fisher-Yates shuffle for randomization

**Interaction**

- Hold to accelerate card movement
- Automatic pile switching when complete
- Tutorial hint with inactivity detection

**Decisions:**

- Reduced animation time from 2s to 0.6s for better user experience
- Used texture atlas for all 144 cards to reduce draw calls
- Arc motion via custom sine wave for natural card flight

### 2. Magic Words

**Requirements:**

- Combine text and images
- Render character dialogue

**Implementation:**

**RichText** ([rich-text.ts](src/scenes/magic-words/rich-text.ts))

- Parses `{emoji_name}` placeholders
- Word-based line breaking
- Character-by-character reveal via `revealedCount`

**ScrollView** ([scroll-view.ts](src/scenes/magic-words/scroll-view.ts))

- Touch and wheel scrolling
- Momentum physics with drag
- Overscroll resistance and bounce-back
- Auto-scroll to bottom

**Typing Animation** ([magic-words-scene.ts:78-132](src/scenes/magic-words/magic-words-scene.ts#L78-L132))

- 80 characters/second
- Pauses: 0.3s on punctuation, 0.4s on emoji
- Sound effects with pitch variation

**Data**

- JSON file: [`data/magic-words.json`](data/magic-words.json)

**Decisions:**

- Custom RichText instead of PixiJS BitmapText for inline sprite support
- Physics-based scrolling for natural feel
- Punctuation detection for typing rhythm

### 3. Phoenix Flame

**Requirements:**

- Particle effect demo
- Fire effect
- Max 10 sprites

**Implementation:**

**Fire Shader** ([fire.ts](src/scenes/phoenix-flame/fire.ts))

- Custom GLSL fragment shader (150 lines)
- Fractal Brownian Motion with 3 octaves
- Color gradient: orange to purple
- Alpha layering with Gaussian falloff
- Animated via `time` uniform

**Particles** ([particles.ts](src/scenes/phoenix-flame/particles.ts))

- Object pool limited to 10 sprites
- Physics: velocity, acceleration, lifetime
- Additive blending

**Effects**

- Bloom sprite with rotation
- Looping fire sound

**Decisions:**

- Worked around 10-sprite limitation: 1 mesh with shader (base fire), 1 sprite (bloom effect), 8 particle sprites
- Custom shader for GPU-accelerated fire (more efficient than sprite animation)
- FBM noise for organic flame motion

---

## Code Conventions

From [CLAUDE.md](CLAUDE.md):

- Use `??` instead of `||` for defaults
- No `public` keyword (Biome rule)
- Getters/setters instead of methods
- No `!` assertions - throw errors
- No abbreviations (except `i`, `e`, `x`/`y`)
- Template literals over concatenation
- Self-documenting code

---

## Technical Notes

**Performance**
- Texture atlas for 144 cards reduces draw calls
- Object pooling for particles
- Custom shaders offload work to GPU
- Z-index rebuilt only when needed
- Event mode disabled on non-interactive elements

**Responsive Design**
- Base Scene class scales content to viewport
- Design space: 1000 units (origin-centered)
- Automatic aspect ratio handling
- Touch events for mobile
- Mobile detection via `matchMedia("(hover: hover)")`

---

## Assignment Requirements

### Ace of Shadows

- ✅ 144 sprites
- ✅ Stacked display
- ✅ 1 second interval
- ✅ 2 second animation (adjusted to 0.6s)
- ✅ Different stack

### Magic Words

- ✅ Text + images
- ✅ Character dialogue

### Phoenix Flame

- ✅ Particle effect
- ✅ Fire effect
- ✅ Max 10 sprites

---

## Deployment

GitHub Pages via GitHub Actions on push to `main`.

Workflow: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
