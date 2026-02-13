# Softgames Game Developer Assignment

A PIXI.js v8 application with three interactive tasks accessible via an in-game menu.

## Tasks

1. **Ace of Shadows** - Card deck animation with 144 cards moving between two stacks every second
2. **Magic Words** - Animated text with random font sizes, styles, and colors appearing word by word, with dialogue data loaded from a JSON file
3. **Phoenix Flame** - Mixed content display combining text, images, and particle effects with random layout changes every 2 seconds

## Tech Stack

- **PIXI.js v8** - 2D rendering
- **TypeScript** - strict mode
- **Vite** - dev server and bundler
- **Bun** - package manager and runtime
- **Biome** - linting and formatting
- **@elumixor/di** - dependency injection
- **@elumixor/extensions** - array/set/string utilities
- **@elumixor/frontils** - front-end utilities

## Getting Started

```bash
bun install
bun run dev
```

## Scripts

| Command            | Description                   |
| ------------------ | ----------------------------- |
| `bun run dev`      | Start Vite dev server         |
| `bun run build`    | Production build              |
| `bun run preview`  | Preview production build      |
| `bun run lint`     | Check with Biome              |
| `bun run format`   | Auto-format with Biome        |
