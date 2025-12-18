# Retro Tetris Clone

An early-80s Nintendo-inspired Tetris built with Next.js (App Router), React, Tailwind CSS v4, and TypeScript. Plays smoothly on desktop and mobile with on-screen controls.

## Getting Started

```bash
npm install   # already run by scaffolding, but safe to repeat
npm run dev   # start the dev server on http://localhost:3000
npm run lint  # lint the project
```

## Gameplay Features

- 10x20 grid, next-piece preview, ghost piece, and soft/hard drops
- Line clearing with score/level progression (speed increases as you level up)
- Pause and reset controls with a retro glass/pixel-styled UI and Nintendo palette
- Mobile-friendly on-screen buttons plus keyboard support

## Controls

- Keyboard: `←` / `→` move, `↓` soft drop, `↑` or `W` rotate, `Space` hard drop, `P` pause/resume, `R` reset
- Touch: on-screen buttons for move, rotate, soft/hard drop, pause, and reset

## Tech Stack

- Next.js 16 (App Router), React 19
- Tailwind CSS v4 with inline theming
- TypeScript + ESLint
