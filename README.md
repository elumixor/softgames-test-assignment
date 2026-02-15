# Softgames Game Developer Assignment

A PIXI.js v8 application with three interactive tasks accessible via an in-game menu.

## Tasks

### 1. Ace of Shadows

Create 144 sprites (NOT graphic objects) that are stacked on top of each other like
cards in a deck. The top card must cover the bottom card, but not completely.
Every 1 second the top card should move to a different stack - the animation of the
movement should take 2 seconds.

### 2. Magic Words

Create a system that allows you to combine text and images like custom emojis.
Use it to render a dialogue between characters with the [data](./data//magic-words.json).

### 3. Phoenix Flame

Make a particle-effect demo showing a great fire effect. Keep the number of
images at max 10 sprites on the screen at the same time.

## Tech Stack

- **PIXI.js v8** - 2D rendering
- **TypeScript** - strict mode
- **Vite** - dev server and bundler
- **Bun** - package manager and runtime
- **Biome** - linting and formatting
- **@elumixor/di** - dependency injection
- **@elumixor/extensions** - array/set/string utilities

## Getting Started

```bash
bun install
bun run dev
```

## Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `bun run dev`     | Start Vite dev server    |
| `bun run build`   | Production build         |
| `bun run preview` | Preview production build |
| `bun run lint`    | Check with Biome         |
| `bun run format`  | Auto-format with Biome   |
