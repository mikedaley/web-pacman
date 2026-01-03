export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpriteFrame {
  u: number;
  v: number;
  width: number;
  height: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

export type GhostMode =
  | 'inHouse'       // Inside ghost house, bouncing and waiting to exit
  | 'leavingHouse'  // Exiting the ghost house through the door
  | 'enteringHouse' // Eyes entering the house to regenerate
  | 'scatter'       // Move to corner target
  | 'chase'         // Chase Pacman (AI varies per ghost)
  | 'frightened'    // Blue, can be eaten by Pacman
  | 'eaten'         // Just eaten, showing score sprite (game paused)
  | 'eyes';         // Returning to ghost house after being eaten

export type GhostName = 'blinky' | 'pinky' | 'inky' | 'clyde';

export type TileType = 'wall' | 'pellet' | 'power' | 'empty' | 'gate' | 'tunnel';

export interface GameEvents {
  'pellet:eaten': { x: number; y: number };
  'power:eaten': { x: number; y: number };
  'ghost:eaten': { ghost: GhostName; x: number; y: number };
  'pacman:died': void;
  'level:complete': void;
  'game:over': void;
  'score:changed': { score: number };
  'lives:changed': { lives: number };
}
