# WebGL Pac-Man - Project Plan

## Overview

A faithful recreation of the original Pac-Man arcade game using WebGL and TypeScript, built with modern web development best practices.

## Tech Stack

- **Language**: TypeScript 5.x (strict mode)
- **Rendering**: WebGL 2.0 (with WebGL 1.0 fallback)
- **Build Tool**: Vite (fast HMR, native ES modules, optimized builds)
- **Package Manager**: npm
- **Testing**: Vitest (unit tests), Playwright (E2E)
- **Linting/Formatting**: ESLint + Prettier
- **Asset Pipeline**: Custom sprite atlas system

## Project Structure

```
web-pacman/
├── src/
│   ├── main.ts                 # Entry point
│   ├── Game.ts                 # Main game orchestrator
│   │
│   ├── core/                   # Core engine systems
│   │   ├── Engine.ts           # Game loop, timing
│   │   ├── InputManager.ts     # Keyboard/touch input
│   │   ├── AssetLoader.ts      # Asset loading with promises
│   │   ├── AudioManager.ts     # Sound effects, music
│   │   └── EventBus.ts         # Decoupled event system
│   │
│   ├── renderer/               # WebGL rendering
│   │   ├── WebGLRenderer.ts    # WebGL context, state management
│   │   ├── ShaderProgram.ts    # Shader compilation, uniforms
│   │   ├── SpriteBatch.ts      # Batched sprite rendering
│   │   ├── SpriteAtlas.ts      # Texture atlas management
│   │   ├── Camera.ts           # 2D orthographic camera
│   │   └── shaders/            # GLSL shader files
│   │       ├── sprite.vert
│   │       └── sprite.frag
│   │
│   ├── ecs/                    # Entity Component System (lightweight)
│   │   ├── Entity.ts           # Base entity class
│   │   ├── Component.ts        # Component interface
│   │   └── System.ts           # System base class
│   │
│   ├── entities/               # Game entities
│   │   ├── Pacman.ts           # Player character
│   │   ├── Ghost.ts            # Ghost base class
│   │   ├── ghosts/             # Individual ghost AI
│   │   │   ├── Blinky.ts       # Red ghost (shadow)
│   │   │   ├── Pinky.ts        # Pink ghost (speedy)
│   │   │   ├── Inky.ts         # Cyan ghost (bashful)
│   │   │   └── Clyde.ts        # Orange ghost (pokey)
│   │   ├── Pellet.ts           # Dots/pellets
│   │   └── PowerPellet.ts      # Energizers
│   │
│   ├── systems/                # Game systems
│   │   ├── MovementSystem.ts   # Entity movement
│   │   ├── CollisionSystem.ts  # Collision detection
│   │   ├── GhostAISystem.ts    # Ghost behavior/targeting
│   │   ├── AnimationSystem.ts  # Sprite animations
│   │   └── RenderSystem.ts     # Rendering pipeline
│   │
│   ├── world/                  # World/level management
│   │   ├── Maze.ts             # Maze structure and rendering
│   │   ├── MazeLoader.ts       # Load maze from data
│   │   ├── Tile.ts             # Tile types and properties
│   │   └── levels/             # Level data (JSON)
│   │       └── level1.json
│   │
│   ├── states/                 # Game state machine
│   │   ├── StateMachine.ts     # Generic state machine
│   │   ├── GameState.ts        # Base state interface
│   │   ├── PlayState.ts        # Main gameplay
│   │   ├── MenuState.ts        # Title/menu screen
│   │   ├── PauseState.ts       # Pause overlay
│   │   └── GameOverState.ts    # Game over screen
│   │
│   ├── ui/                     # UI components
│   │   ├── HUD.ts              # Score, lives display
│   │   ├── TextRenderer.ts     # Bitmap font rendering
│   │   └── fonts/              # Font atlas data
│   │
│   ├── utils/                  # Utility functions
│   │   ├── math.ts             # Vector math, lerp, etc.
│   │   ├── constants.ts        # Game constants
│   │   └── types.ts            # Shared type definitions
│   │
│   └── config/                 # Configuration
│       ├── gameConfig.ts       # Game settings
│       └── ghostConfig.ts      # Ghost behavior tuning
│
├── public/                     # Static assets
│   ├── sprites/                # Sprite images
│   ├── audio/                  # Sound effects, music
│   └── index.html              # HTML template
│
├── tests/                      # Test files
│   ├── unit/                   # Unit tests
│   └── e2e/                    # End-to-end tests
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .eslintrc.cjs
├── .prettierrc
└── README.md
```

## Architecture Decisions

### 1. Lightweight ECS (Entity Component System)

Using a simplified ECS pattern for:
- **Separation of concerns**: Data (components) separate from logic (systems)
- **Reusability**: Components can be mixed and matched
- **Testability**: Systems can be tested in isolation

### 2. WebGL Sprite Batching

All sprites rendered in minimal draw calls:
- Single texture atlas for all game sprites
- Batched rendering reduces GPU state changes
- Efficient for the 2D tile-based nature of Pac-Man

### 3. State Machine for Game Flow

Clean separation of game states:
- Each state handles its own update/render logic
- Easy to add new states (cutscenes, bonus stages)
- Prevents spaghetti code in game loop

### 4. Event-Driven Communication

Using an EventBus for decoupled communication:
- Entities don't need direct references to each other
- Easy to add new behaviors (achievements, analytics)
- Simplifies testing and debugging

### 5. Data-Driven Design

Maze layouts and ghost behaviors defined in JSON/config:
- Easy to modify without code changes
- Supports future level editor
- Clear separation of data and logic

## Implementation Phases

### Phase 1: Foundation
1. Project setup (Vite, TypeScript, ESLint, Prettier)
2. WebGL renderer with sprite batching
3. Asset loading system
4. Basic game loop

### Phase 2: Core Gameplay
1. Maze rendering from data
2. Pac-Man movement with wall collision
3. Pellet collection
4. Basic ghost movement

### Phase 3: Ghost AI
1. Ghost state machine (scatter, chase, frightened, eaten)
2. Individual ghost targeting algorithms
3. Ghost house behavior
4. Wave timing system

### Phase 4: Polish
1. Animations (Pac-Man chomp, ghost eyes, death)
2. Sound effects and music
3. UI (score, lives, level)
4. Game states (menu, pause, game over)

### Phase 5: Enhancements
1. Touch controls for mobile
2. High score persistence (localStorage)
3. Multiple levels with increasing difficulty
4. Bonus fruits

## Key Game Mechanics to Implement

### Pac-Man Movement
- Grid-based movement with tile alignment
- Pre-turning (input buffering for responsive controls)
- Cornering (slight speed boost around corners)
- Tunnel warping (wrap at maze edges)

### Ghost AI (Faithful to Original)
- **Scatter Mode**: Each ghost has a home corner
- **Chase Mode**: Each ghost has unique targeting
  - Blinky: Targets Pac-Man directly
  - Pinky: Targets 4 tiles ahead of Pac-Man
  - Inky: Complex targeting using Blinky's position
  - Clyde: Targets Pac-Man unless too close
- **Frightened Mode**: Random movement, slower speed
- **Eaten Mode**: Return to ghost house

### Timing and Difficulty
- Ghost mode alternates between scatter/chase
- Speed increases with level
- Frightened duration decreases with level

## Performance Considerations

1. **Object Pooling**: Reuse pellet/entity objects
2. **Spatial Hashing**: Efficient collision detection
3. **Texture Atlasing**: Single texture for all sprites
4. **Batch Rendering**: Minimize draw calls
5. **requestAnimationFrame**: Proper frame timing
6. **Fixed Timestep**: Consistent physics regardless of framerate

## Testing Strategy

### Unit Tests
- Ghost targeting algorithms
- Collision detection
- State machine transitions
- Math utilities

### Integration Tests
- Maze loading and rendering
- Input handling
- Game state flow

### E2E Tests
- Complete game flow
- Score tracking
- Level transitions

## File Naming Conventions

- **PascalCase**: Classes, interfaces, types, enums
- **camelCase**: Functions, variables, methods
- **kebab-case**: File names for assets
- **UPPER_SNAKE_CASE**: Constants

## Next Steps

After plan approval:
1. Initialize npm project with dependencies
2. Configure TypeScript, Vite, ESLint, Prettier
3. Implement core rendering pipeline
4. Build out from foundation systematically

---

*This plan prioritizes clean architecture, maintainability, and faithful recreation of the original Pac-Man gameplay.*
