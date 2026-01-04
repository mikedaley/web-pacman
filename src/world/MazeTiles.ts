// tile definitions extracted from the sprite sheet
// each tile is 8x8 pixels, located at (u, v) in the sprite sheet

export interface MazeTileDefinition {
  index: number;
  u: number;
  v: number;
}

export const MAZE_TILES: MazeTileDefinition[] = [
  { index: 0, u: 0, v: 0 },
  { index: 1, u: 8, v: 0 },
  { index: 2, u: 104, v: 0 },
  { index: 3, u: 112, v: 0 },
  { index: 4, u: 216, v: 0 },
  { index: 5, u: 0, v: 8 },
  { index: 6, u: 8, v: 8 },
  { index: 7, u: 104, v: 8 },
  { index: 8, u: 112, v: 8 },
  { index: 9, u: 216, v: 8 },
  { index: 10, u: 16, v: 16 },
  { index: 11, u: 24, v: 16 },
  { index: 12, u: 40, v: 16 },
  { index: 13, u: 8, v: 24 },
  { index: 14, u: 24, v: 24 },
  { index: 15, u: 16, v: 32 },
  { index: 16, u: 24, v: 32 },
  { index: 17, u: 40, v: 32 },
  { index: 18, u: 104, v: 56 },
  { index: 19, u: 112, v: 56 },
  { index: 20, u: 0, v: 72 },
  { index: 21, u: 8, v: 72 },
  { index: 22, u: 64, v: 72 },
  { index: 23, u: 152, v: 72 },
  { index: 24, u: 216, v: 72 },
  { index: 25, u: 80, v: 96 },
  { index: 26, u: 96, v: 96 },
  { index: 27, u: 104, v: 96 },
  { index: 28, u: 120, v: 96 },
  { index: 29, u: 136, v: 96 },
  { index: 30, u: 80, v: 128 },
  { index: 31, u: 136, v: 128 },
  { index: 32, u: 0, v: 192 },
  { index: 33, u: 216, v: 192 },
  { index: 34, u: 0, v: 200 },
  { index: 35, u: 216, v: 200 },
];
