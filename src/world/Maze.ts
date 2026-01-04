import {
  TileData,
  TILE_EMPTY,
  TILE_WALL,
  TILE_PELLET,
  TILE_POWER,
  TILE_GATE,
  TILE_TUNNEL,
} from './Tile';
import { Direction, Vec2 } from '../utils/types';
import { TILE_SIZE } from '../utils/constants';
import { SpriteBatch } from '../renderer/SpriteBatch';
import { SpriteAtlas } from '../renderer/SpriteAtlas';

export interface LevelData {
  width: number;
  height: number;
  tiles: string[];
  noUpTurnZones: { x: number; y: number }[];
  tunnelRow: number;
  ghostHouse: { x: number; y: number; width: number; height: number };
  pacmanStart: { x: number; y: number };
  ghostStarts: Record<string, { x: number; y: number }>;
  fruitPosition: { x: number; y: number };
}

export class Maze {
  readonly width: number;
  readonly height: number;
  private tiles: TileData[][];
  private pellets: boolean[][];
  private pelletsRemaining = 0;
  private powerPelletsRemaining = 0;

  tunnelRow: number;
  ghostHouse: { x: number; y: number; width: number; height: number };
  pacmanStart: Vec2;
  ghostStarts: Record<string, Vec2>;
  fruitPosition: Vec2;

  constructor(data: LevelData) {
    this.width = data.width;
    this.height = data.height;
    this.tunnelRow = data.tunnelRow;
    this.ghostHouse = data.ghostHouse;
    this.pacmanStart = data.pacmanStart;
    this.ghostStarts = data.ghostStarts;
    this.fruitPosition = data.fruitPosition;

    this.tiles = [];
    this.pellets = [];

    for (let y = 0; y < this.height; y++) {
      const tileRow: TileData[] = [];
      const pelletRow: boolean[] = [];
      const row = data.tiles[y] || '';

      for (let x = 0; x < this.width; x++) {
        const char = row[x] || '_';
        pelletRow[x] = false;

        switch (char) {
          case 'X':
            tileRow[x] = { ...TILE_WALL };
            break;
          case '.':
            tileRow[x] = { ...TILE_PELLET };
            pelletRow[x] = true;
            this.pelletsRemaining++;
            break;
          case 'o':
            tileRow[x] = { ...TILE_POWER };
            pelletRow[x] = true;
            this.powerPelletsRemaining++;
            break;
          case '-':
            tileRow[x] = { ...TILE_GATE };
            break;
          case 'T':
            tileRow[x] = { ...TILE_TUNNEL };
            break;
          case ' ':
          case '_':
          default:
            tileRow[x] = { ...TILE_EMPTY };
            break;
        }
      }

      this.tiles[y] = tileRow;
      this.pellets[y] = pelletRow;
    }

    // mark no-up-turn zones
    for (const zone of data.noUpTurnZones) {
      const row = this.tiles[zone.y];
      if (row) {
        const tile = row[zone.x];
        if (tile) {
          tile.noUpTurn = true;
        }
      }
    }

    // mark tunnel zones (leftmost and rightmost 6 tiles on tunnel row)
    const tunnelTiles = this.tiles[this.tunnelRow];
    if (tunnelTiles) {
      for (let x = 0; x < 6; x++) {
        const leftTile = tunnelTiles[x];
        if (leftTile) {
          leftTile.slowdown = true;
        }
        const rightTile = tunnelTiles[this.width - 1 - x];
        if (rightTile) {
          rightTile.slowdown = true;
        }
      }
    }
  }

  getTile(x: number, y: number): TileData {
    if (y < 0 || y >= this.height) return TILE_WALL;
    if (x < 0) x = this.width - 1;
    if (x >= this.width) x = 0;
    const row = this.tiles[y];
    if (!row) return TILE_WALL;
    return row[x] || TILE_WALL;
  }

  isWall(x: number, y: number): boolean {
    return this.getTile(x, y).solid;
  }

  isGate(x: number, y: number): boolean {
    return this.getTile(x, y).type === 'gate';
  }

  canMove(x: number, y: number, isGhost: boolean, isEaten: boolean): boolean {
    const tile = this.getTile(x, y);
    if (tile.solid) return false;
    if (tile.type === 'gate' && isGhost && !isEaten) {
      return false;
    }
    return true;
  }

  hasPellet(x: number, y: number): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    const row = this.pellets[y];
    if (!row) return false;
    return row[x] || false;
  }

  isPowerPellet(x: number, y: number): boolean {
    return this.getTile(x, y).type === 'power' && this.hasPellet(x, y);
  }

  collectPellet(x: number, y: number): 'pellet' | 'power' | null {
    if (!this.hasPellet(x, y)) return null;

    const tile = this.getTile(x, y);
    const row = this.pellets[y];
    if (row) {
      row[x] = false;
    }

    if (tile.type === 'power') {
      this.powerPelletsRemaining--;
      return 'power';
    }

    this.pelletsRemaining--;
    return 'pellet';
  }

  getPelletsRemaining(): number {
    return this.pelletsRemaining + this.powerPelletsRemaining;
  }

  isSlowdownZone(x: number, y: number): boolean {
    return this.getTile(x, y).slowdown;
  }

  isNoUpTurn(x: number, y: number): boolean {
    return this.getTile(x, y).noUpTurn;
  }

  isInGhostHouse(x: number, y: number): boolean {
    const gh = this.ghostHouse;
    return x >= gh.x && x < gh.x + gh.width && y >= gh.y && y < gh.y + gh.height;
  }

  wrapPosition(x: number): number {
    if (x < -1) return this.width;
    if (x > this.width) return -1;
    return x;
  }

  getValidDirections(
    tileX: number,
    tileY: number,
    currentDir: Direction,
    isGhost: boolean,
    isEaten: boolean,
    respectNoUpTurn: boolean
  ): Direction[] {
    const dirs: Direction[] = [];
    const opposite: Record<Direction, Direction> = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left',
      none: 'none',
    };

    const checks: [Direction, number, number][] = [
      ['up', tileX, tileY - 1],
      ['left', tileX - 1, tileY],
      ['down', tileX, tileY + 1],
      ['right', tileX + 1, tileY],
    ];

    for (const [dir, nx, ny] of checks) {
      if (dir === opposite[currentDir] && currentDir !== 'none') continue;
      if (respectNoUpTurn && dir === 'up' && this.isNoUpTurn(tileX, tileY)) continue;

      let checkX = nx;
      if (checkX < 0) checkX = this.width - 1;
      if (checkX >= this.width) checkX = 0;

      if (this.canMove(checkX, ny, isGhost, isEaten)) {
        dirs.push(dir);
      }
    }

    return dirs;
  }

  render(batch: SpriteBatch, atlas: SpriteAtlas, flash = false): void {
    // Render the entire empty maze as a single image
    // The maze starts at row 3 (after the score/UI area)
    const startRow = 3;
    const mazeWidth = 224; // 28 tiles * 8 pixels
    const mazeHeight = 248; // 31 tiles * 8 pixels

    const frame = atlas.getFrame('maze-full', 0);
    if (frame) {
      // Flash white when level complete (boost colors to saturate to white)
      const tint = flash ? 10 : 1;
      batch.draw(frame, 0, startRow * TILE_SIZE, mazeWidth, mazeHeight, tint, tint, tint, 1);
    }
  }

  renderPellets(batch: SpriteBatch, atlas: SpriteAtlas, blinkPower: boolean): void {
    // draw pellets based on game state
    for (let y = 0; y < this.height; y++) {
      const pelletRow = this.pellets[y];
      const tileRow = this.tiles[y];
      if (!pelletRow || !tileRow) continue;

      for (let x = 0; x < this.width; x++) {
        const tile = tileRow[x];
        if (!tile) continue;

        const hasPellet = pelletRow[x];
        if (!hasPellet) continue;

        if (tile.type === 'power') {
          // power pellet - skip during blink phase
          if (blinkPower) continue;

          const frame = atlas.getFrame('power-pellet', 0);
          if (frame) {
            batch.draw(frame, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
        } else if (tile.type === 'pellet') {
          const frame = atlas.getFrame('pellet', 0);
          if (frame) {
            batch.draw(frame, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }
  }

  reset(): void {
    this.pelletsRemaining = 0;
    this.powerPelletsRemaining = 0;

    for (let y = 0; y < this.height; y++) {
      const tileRow = this.tiles[y];
      const pelletRow = this.pellets[y];
      if (!tileRow || !pelletRow) continue;

      for (let x = 0; x < this.width; x++) {
        const tile = tileRow[x];
        if (!tile) continue;

        if (tile.type === 'pellet') {
          pelletRow[x] = true;
          this.pelletsRemaining++;
        } else if (tile.type === 'power') {
          pelletRow[x] = true;
          this.powerPelletsRemaining++;
        }
      }
    }
  }
}
