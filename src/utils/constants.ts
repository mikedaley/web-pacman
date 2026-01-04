export const TILE_SIZE = 8;
export const MAZE_WIDTH = 28;
export const MAZE_HEIGHT = 36;

export const CANVAS_WIDTH = MAZE_WIDTH * TILE_SIZE;
export const CANVAS_HEIGHT = MAZE_HEIGHT * TILE_SIZE;
export const SCALE = 3;

// speeds as pixels per second (base speed ~75.75 px/s at 100%)
export const BASE_SPEED = 75.75;

// per-level speed multipliers (matches original arcade game)
// Ghost speeds: L1=75%, L2-4=85%, L5+=95%
// Tunnel speeds: L1=40%, L2-4=45%, L5+=50%
// Frightened: L1=50%, L2-4=55%, L5+=60%
export const LEVEL_SPEEDS = [
  { pacman: 0.8, ghost: 0.75, frightPacman: 0.9, frightGhost: 0.5, tunnel: 0.4 }, // Level 1
  { pacman: 0.9, ghost: 0.85, frightPacman: 0.95, frightGhost: 0.55, tunnel: 0.45 }, // Level 2
  { pacman: 0.9, ghost: 0.85, frightPacman: 0.95, frightGhost: 0.55, tunnel: 0.45 }, // Level 3
  { pacman: 0.9, ghost: 0.85, frightPacman: 0.95, frightGhost: 0.55, tunnel: 0.45 }, // Level 4
  { pacman: 1.0, ghost: 0.95, frightPacman: 1.0, frightGhost: 0.6, tunnel: 0.5 }, // Level 5+
];

// scatter/chase wave timing per level (in ms)
export const MODE_TIMINGS = [
  // level 1
  [
    { mode: 'scatter', duration: 7000 },
    { mode: 'chase', duration: 20000 },
    { mode: 'scatter', duration: 7000 },
    { mode: 'chase', duration: 20000 },
    { mode: 'scatter', duration: 5000 },
    { mode: 'chase', duration: 20000 },
    { mode: 'scatter', duration: 5000 },
    { mode: 'chase', duration: Infinity },
  ],
  // levels 2-4
  [
    { mode: 'scatter', duration: 7000 },
    { mode: 'chase', duration: 20000 },
    { mode: 'scatter', duration: 7000 },
    { mode: 'chase', duration: 20000 },
    { mode: 'scatter', duration: 5000 },
    { mode: 'chase', duration: 1037000 },
    { mode: 'scatter', duration: 1 },
    { mode: 'chase', duration: Infinity },
  ],
  // levels 5+
  [
    { mode: 'scatter', duration: 5000 },
    { mode: 'chase', duration: 20000 },
    { mode: 'scatter', duration: 5000 },
    { mode: 'chase', duration: 20000 },
    { mode: 'scatter', duration: 5000 },
    { mode: 'chase', duration: 1037000 },
    { mode: 'scatter', duration: 1 },
    { mode: 'chase', duration: Infinity },
  ],
];

// frightened durations per level (ms), 0 means instant reversal only
export const FRIGHTENED_DURATIONS = [
  6000, 5000, 4000, 3000, 2000, 5000, 2000, 2000, 1000, 5000, 2000, 1000, 1000, 3000, 1000, 1000, 0,
  1000, 0, 0,
];

// ghost house dot limits for release (level 1)
export const GHOST_DOT_LIMITS = {
  pinky: 0,
  inky: 30,
  clyde: 60,
};

// global dot counter after pacman death
export const GLOBAL_DOT_LIMITS = {
  pinky: 7,
  inky: 17,
  clyde: 32,
};

// elroy mode thresholds (dots remaining)
export const ELROY_DOTS = [
  { speed1: 20, speed2: 10 },
  { speed1: 30, speed2: 15 },
  { speed1: 40, speed2: 20 },
  { speed1: 40, speed2: 20 },
  { speed1: 40, speed2: 20 },
];

export const POINTS = {
  pellet: 10,
  power: 50,
  ghost: [200, 400, 800, 1600],
  fruit: [100, 300, 500, 500, 700, 700, 1000, 1000, 2000, 2000, 3000, 3000, 5000],
};

export const TOTAL_PELLETS = 240;
export const TOTAL_POWER_PELLETS = 4;

export const LIVES_START = 4;
export const EXTRA_LIFE_SCORE = 10000;

export const FRUIT_APPEAR_DOTS = [70, 170];

// frame pause when eating (at 60fps)
export const PELLET_PAUSE_FRAMES = 0;
export const POWER_PAUSE_FRAMES = 0;

// ghost scatter corners (tile coords)
export const SCATTER_TARGETS = {
  blinky: { x: 25, y: 0 },
  pinky: { x: 2, y: 0 },
  inky: { x: 27, y: 35 },
  clyde: { x: 0, y: 35 },
};

// ghost house positions based on reference implementation
// Gate spans x=13-14, house interior x=11-16, exit above gate at y=14
export const GHOST_HOUSE_CENTER = { x: 14, y: 17 };
export const GHOST_HOUSE_EXIT = { x: 14, y: 14 };

// Ghost start positions in PIXELS for precise positioning
// Positioned on tile BOUNDARIES (between tiles), not tile centers
// Boundary formula: tileX * 8 (not tileX * 8 + 4)
// House center is between tiles 13-14 at x=112
export const GHOST_START_PIXELS = {
  blinky: { x: 112, y: 116 }, // boundary 13-14, above gate
  pinky: { x: 112, y: 140 }, // boundary 13-14, center of house
  inky: { x: 96, y: 140 }, // boundary 11-12, left side of house
  clyde: { x: 128, y: 140 }, // boundary 15-16, right side of house
};

// Tile-based positions for logic (derived from pixels)
export const GHOST_START_POSITIONS = {
  blinky: { x: 14, y: 14 },
  pinky: { x: 14, y: 17 },
  inky: { x: 12, y: 17 },
  clyde: { x: 16, y: 17 },
};

export const PACMAN_START = { x: 14, y: 26 };
// Pac-Man starts dead center of the map (between tiles 13-14)
export const PACMAN_START_PIXELS = { x: 112, y: 212 };

// direction priority for tie-breaking: up, left, down, right
export const DIRECTION_PRIORITY = ['up', 'left', 'down', 'right'] as const;
