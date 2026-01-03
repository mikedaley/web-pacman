import { TileType } from '../utils/types';

export interface TileData {
  type: TileType;
  spriteIndex: number;
  solid: boolean;
  slowdown: boolean; // tunnel slowdown zones
  noUpTurn: boolean; // red zones where ghosts can't turn up
}

export const TILE_EMPTY: TileData = {
  type: 'empty',
  spriteIndex: -1,
  solid: false,
  slowdown: false,
  noUpTurn: false,
};

export const TILE_PELLET: TileData = {
  type: 'pellet',
  spriteIndex: -1,
  solid: false,
  slowdown: false,
  noUpTurn: false,
};

export const TILE_POWER: TileData = {
  type: 'power',
  spriteIndex: -1,
  solid: false,
  slowdown: false,
  noUpTurn: false,
};

export const TILE_WALL: TileData = {
  type: 'wall',
  spriteIndex: 0,
  solid: true,
  slowdown: false,
  noUpTurn: false,
};

export const TILE_GATE: TileData = {
  type: 'gate',
  spriteIndex: -1,
  solid: false,
  slowdown: false,
  noUpTurn: false,
};

export const TILE_TUNNEL: TileData = {
  type: 'tunnel',
  spriteIndex: -1,
  solid: false,
  slowdown: true,
  noUpTurn: false,
};
