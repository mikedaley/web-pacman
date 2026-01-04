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

## Architecture

The codebase is split into a few main areas:

### Core (`src/core/`)

Basic engine stuff - the game loop, input handling, asset loading. Nothing fancy, just the plumbing to get everything running. There's an event bus in here too for decoupling things like score updates.

### ECS (`src/ecs/`)

A simple entity-component-system setup. Entities are just IDs with components attached. Components are plain data objects (position, velocity, sprite info, etc). Kept it minimal since Pac-Man doesn't really need a full-blown ECS, but it helps keep things organized.

### Entities (`src/entities/`)

Factory functions for creating Pac-Man and the ghosts. Each ghost has its own targeting logic based on the original arcade behavior - Blinky targets Pac-Man directly, Pinky aims ahead, Inky does that weird thing where he uses Blinky's position, and Clyde runs away when he gets too close.

### Systems (`src/systems/`)

Where the actual game logic lives:

- **MovementSystem** - handles Pac-Man's tile-based movement with cornering and wall collision
- **GhostAISystem** - the big one. Manages scatter/chase modes, frightened state, the ghost house, pathfinding. Tried to match the original timing tables.
- **CollisionSystem** - pellet eating, ghost collisions, power pellet logic
- **AnimationSystem** - sprite frame updates, Pac-Man's chomping, ghost animations
- **RenderSystem** - draws everything using the sprite batcher

### Renderer (`src/renderer/`)

WebGL rendering with a sprite batch approach. Everything gets drawn to a single texture atlas to minimize draw calls. The `SpriteBatch` collects sprites and flushes them in one go. Shaders are dead simple - just textured quads with color tinting.

### States (`src/states/`)

Game states with a basic state machine. Menu, playing, game over. Each state handles its own input, update, and render. The attract mode runs in the menu state with a little animation sequence.

### World (`src/world/`)

Maze data and tile definitions. The maze is defined in JSON with tile types for walls, pellets, ghost house, etc. There's also the tile-to-pixel coordinate conversion stuff in here.

### UI (`src/ui/`)

HUD and text rendering. The text renderer uses a bitmap font from the sprite sheet. Nothing complicated - just draws characters from the atlas.
