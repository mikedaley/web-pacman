import { Entity } from '../ecs/Entity';
import { PositionComponent, VelocityComponent, PacmanComponent } from '../ecs/Component';
import { Maze } from '../world/Maze';
import { Direction } from '../utils/types';
import { TILE_SIZE, MAZE_WIDTH } from '../utils/constants';
import { directionVectors, pixelToTile } from '../utils/math';

export class MovementSystem {
  private maze: Maze;

  constructor(maze: Maze) {
    this.maze = maze;
  }

  updatePacman(entity: Entity, dt: number): void {
    const pos = entity.get<PositionComponent>('position');
    const vel = entity.get<VelocityComponent>('velocity');
    const pac = entity.get<PacmanComponent>('pacman');

    if (!pos || !vel || !pac) return;

    if (pac.pauseFrames > 0) {
      pac.pauseFrames--;
      return;
    }

    if (pac.dying || pac.dead) return;

    const dtSeconds = dt / 1000;
    const tileCenter = this.getTileCenter(pos.tileX, pos.tileY);

    // Calculate distance to current tile center
    const distToCenter = Math.abs(pos.x - tileCenter.x) + Math.abs(pos.y - tileCenter.y);

    // Handle direction changes
    if (pac.nextDirection !== 'none' && pac.nextDirection !== pac.currentDirection) {
      const canTurn = this.canMoveDirection(pos.tileX, pos.tileY, pac.nextDirection);

      // Check for immediate reversal (always allowed)
      const isReversal = this.isOppositeDirection(pac.currentDirection, pac.nextDirection);

      if (isReversal) {
        // Reversals are always allowed immediately
        pac.currentDirection = pac.nextDirection;
        pac.nextDirection = 'none';
      } else if (canTurn && distToCenter <= 4) {
        // Can turn at or near tile center (pre-turning within 4 pixels)
        pac.currentDirection = pac.nextDirection;
        pac.nextDirection = 'none';
        // Snap to center when turning
        if (distToCenter <= 2) {
          pos.x = tileCenter.x;
          pos.y = tileCenter.y;
        }
      }
    } else if (pac.nextDirection === pac.currentDirection) {
      // Same direction - just clear the buffer, keep moving
      pac.nextDirection = 'none';
    }

    // If still no direction and there's a queued one, try to start moving
    if (pac.currentDirection === 'none' && pac.nextDirection !== 'none') {
      if (this.canMoveDirection(pos.tileX, pos.tileY, pac.nextDirection)) {
        pac.currentDirection = pac.nextDirection;
        pac.nextDirection = 'none';
      }
    }

    if (pac.currentDirection === 'none') {
      vel.dx = 0;
      vel.dy = 0;
      return;
    }

    const dir = directionVectors[pac.currentDirection];
    const moveAmount = vel.speed * dtSeconds;

    // Calculate new position
    let newX = pos.x + dir.x * moveAmount;
    let newY = pos.y + dir.y * moveAmount;

    // Keep Pac-Man centered on the perpendicular axis (lane centering)
    // Use the tile center based on CURRENT position, not stored tile
    const currentTileX = Math.floor(pos.x / TILE_SIZE);
    const currentTileY = Math.floor(pos.y / TILE_SIZE);
    const currentTileCenter = this.getTileCenter(currentTileX, currentTileY);

    if (dir.x !== 0) {
      // Moving horizontally - snap Y to lane center
      newY = currentTileCenter.y;
    } else if (dir.y !== 0) {
      // Moving vertically - snap X to lane center
      newX = currentTileCenter.x;
    }

    // Tunnel wrapping - Pac-Man walks fully off-screen before appearing on other side
    const tunnelBuffer = TILE_SIZE * 2; // Walk 2 tiles off-screen
    if (newX < -tunnelBuffer) {
      newX = MAZE_WIDTH * TILE_SIZE + tunnelBuffer - TILE_SIZE;
    } else if (newX > MAZE_WIDTH * TILE_SIZE + tunnelBuffer - TILE_SIZE) {
      newX = -tunnelBuffer;
    }

    // Check wall collision - look ahead from current position
    const aheadTileX = Math.floor((pos.x + dir.x * TILE_SIZE) / TILE_SIZE);
    const aheadTileY = Math.floor((pos.y + dir.y * TILE_SIZE) / TILE_SIZE);
    const wallAhead = this.maze.isWall(aheadTileX, aheadTileY);

    if (wallAhead) {
      // There's a wall ahead - stop at current tile center
      const stopX = currentTileCenter.x;
      const stopY = currentTileCenter.y;

      // Only clamp if we would pass the stop point
      if (dir.x > 0 && newX > stopX) {
        newX = stopX;
      } else if (dir.x < 0 && newX < stopX) {
        newX = stopX;
      } else if (dir.y > 0 && newY > stopY) {
        newY = stopY;
      } else if (dir.y < 0 && newY < stopY) {
        newY = stopY;
      }
    }

    // Check if we actually moved
    const didMove = newX !== pos.x || newY !== pos.y;

    // Update position
    pos.x = newX;
    pos.y = newY;

    // Update velocity direction only if moving
    if (didMove) {
      vel.dx = dir.x;
      vel.dy = dir.y;
    } else {
      vel.dx = 0;
      vel.dy = 0;
    }

    // Update tile coordinates
    pos.tileX = Math.floor(pos.x / TILE_SIZE);
    pos.tileY = Math.floor(pos.y / TILE_SIZE);
  }

  private isOppositeDirection(dir1: Direction, dir2: Direction): boolean {
    return (
      (dir1 === 'up' && dir2 === 'down') ||
      (dir1 === 'down' && dir2 === 'up') ||
      (dir1 === 'left' && dir2 === 'right') ||
      (dir1 === 'right' && dir2 === 'left')
    );
  }

  updateGhost(
    entity: Entity,
    currentDirection: Direction,
    dt: number,
    _isEaten: boolean,
    _inHouse: boolean
  ): { newDir: Direction; changedTile: boolean } {
    const pos = entity.get<PositionComponent>('position');
    const vel = entity.get<VelocityComponent>('velocity');

    if (!pos || !vel) return { newDir: currentDirection, changedTile: false };

    const dtSeconds = dt / 1000;
    const dir = directionVectors[currentDirection] ?? { x: 0, y: 0 };

    let newX = pos.x + dir.x * vel.speed * dtSeconds;
    const newY = pos.y + dir.y * vel.speed * dtSeconds;

    // tunnel wrapping
    if (newX < -TILE_SIZE) {
      newX = MAZE_WIDTH * TILE_SIZE;
    } else if (newX > MAZE_WIDTH * TILE_SIZE) {
      newX = -TILE_SIZE;
    }

    const prevTileX = pos.tileX;
    const prevTileY = pos.tileY;

    pos.x = newX;
    pos.y = newY;

    const newTile = pixelToTile(pos.x, pos.y, TILE_SIZE);
    pos.tileX = newTile.x;
    pos.tileY = newTile.y;
    vel.dx = dir.x;
    vel.dy = dir.y;

    const changedTile = pos.tileX !== prevTileX || pos.tileY !== prevTileY;

    return { newDir: currentDirection, changedTile };
  }

  private canMoveDirection(tileX: number, tileY: number, dir: Direction): boolean {
    const next = this.getNextTile(tileX, tileY, dir);
    return !this.maze.isWall(next.x, next.y);
  }

  private getNextTile(tileX: number, tileY: number, dir: Direction): { x: number; y: number } {
    const vec = directionVectors[dir];
    let nx = tileX + vec.x;
    const ny = tileY + vec.y;

    // wrap
    if (nx < 0) nx = MAZE_WIDTH - 1;
    if (nx >= MAZE_WIDTH) nx = 0;

    return { x: nx, y: ny };
  }

  private getTileCenter(tileX: number, tileY: number): { x: number; y: number } {
    return {
      x: tileX * TILE_SIZE + TILE_SIZE / 2,
      y: tileY * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  setMaze(maze: Maze): void {
    this.maze = maze;
  }
}
