# Web Pac-Man

A browser-based Pac-Man clone built with TypeScript and WebGL. You can play this here https://pac.retrotech71.co.uk

## What is this?

I wanted to see how close I could get to recreating the original 1980 arcade game using modern web tech. The goal was to nail the feel of the original - the ghost AI, the movement, the little details that made Pac-Man so addictive.

## Features

- Classic maze layout from the original game
- All four ghosts with their distinct personalities (Blinky chases, Pinky ambushes, Inky is unpredictable, Clyde does his own thing)
- Scatter/chase mode switching like the arcade
- Frightened mode when you eat a power pellet
- High score saved to your browser
- Attract mode on the title screen

## Controls

- Arrow keys to move
- Space or Enter to start
- Escape to return to menu

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

## Building for production

```bash
npm run build
```

Output goes to the `dist` folder.

## Tech

- TypeScript
- WebGL for rendering
- Vite for bundling

No game engine - just raw WebGL with a simple sprite batcher. The ghost AI follows the original arcade logic as closely as I could figure out from various sources online.
