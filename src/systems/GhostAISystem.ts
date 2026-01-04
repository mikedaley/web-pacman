/*
 * Ghost AI System
 *
 * Each ghost has unique targeting behavior during chase mode:
 *
 * BLINKY (Red) - "Shadow"
 *   The most aggressive ghost. Directly targets Pac-Man's current tile.
 *   When few dots remain, enters "Cruise Elroy" mode and speeds up.
 *
 * PINKY (Pink) - "Speedy"
 *   Tries to ambush Pac-Man by targeting 4 tiles ahead of his current direction.
 *   Due to an overflow bug in the original, targeting up also offsets 4 tiles left.
 *
 * INKY (Cyan) - "Bashful"
 *   The most unpredictable. Uses Blinky's position to calculate target:
 *   Draws a vector from Blinky through a point 2 tiles ahead of Pac-Man,
 *   then doubles it. This makes Inky's behavior depend on Blinky's position.
 *
 * CLYDE (Orange) - "Pokey"
 *   Shy and indecisive. When more than 8 tiles from Pac-Man, targets him directly.
 *   When closer than 8 tiles, retreats to his scatter corner instead.
 *
 * Ghosts alternate between scatter mode (retreat to corners) and chase mode.
 * When Pac-Man eats a power pellet, ghosts enter frightened mode and flee randomly.
 *
 * Information relating to the AI was taken from https://pacman.holenet.info/
 */

import { Entity } from '../ecs/Entity';
import {
  PositionComponent,
  VelocityComponent,
  GhostComponent,
  PacmanComponent,
  SpriteComponent,
} from '../ecs/Component';
import { Maze } from '../world/Maze';
import { Direction, Vec2 } from '../utils/types';
import {
  TILE_SIZE,
  MAZE_WIDTH,
  BASE_SPEED,
  LEVEL_SPEEDS,
  DIRECTION_PRIORITY,
  MODE_TIMINGS,
  FRIGHTENED_DURATIONS,
  GHOST_DOT_LIMITS,
  GLOBAL_DOT_LIMITS,
  GHOST_HOUSE_CENTER,
  GHOST_START_PIXELS,
  SCATTER_TARGETS,
} from '../utils/constants';
import { distanceVec2, directionVectors, pixelToTile, tileToPixel } from '../utils/math';
import { getBlinkyTarget } from '../entities/ghosts/Blinky';
import { getPinkyTarget } from '../entities/ghosts/Pinky';
import { getInkyTarget } from '../entities/ghosts/Inky';
import { getClydeTarget } from '../entities/ghosts/Clyde';
import { setGhostMode } from '../entities/Ghost';

export class GhostAISystem {
  private maze: Maze;
  private level = 1;
  private modeTimer = 0;
  private modeIndex = 0;
  private globalMode: 'scatter' | 'chase' = 'scatter';
  private frightenedTimer = 0;
  private globalDotCounter = 0;
  private useGlobalDotCounter = false;
  private dotsSinceLastRelease = 0;
  private releaseTimer = 0;
  private ghostDirections = new Map<number, Direction>();
  private ghostDecisionTiles = new Map<number, { x: number; y: number }>();
  private ghostBounceDir = new Map<number, number>(); // 1 = down, -1 = up

  constructor(maze: Maze) {
    this.maze = maze;
  }

  reset(level: number): void {
    this.level = level;
    this.modeTimer = 0;
    this.modeIndex = 0;
    this.globalMode = 'scatter';
    this.frightenedTimer = 0;
    this.globalDotCounter = 0;
    this.useGlobalDotCounter = false;
    this.dotsSinceLastRelease = 0;
    this.releaseTimer = 0;
    this.ghostDirections.clear();
    this.ghostDecisionTiles.clear();
    this.ghostBounceDir.clear();
  }

  update(ghosts: Entity[], pacman: Entity, blinkyEntity: Entity, dt: number): void {
    this.updateModeTimer(ghosts, dt);
    this.updateFrightenedTimer(ghosts, dt);
    this.updateReleaseTimer(ghosts, dt);

    const pacPos = pacman.get<PositionComponent>('position');
    const pacComp = pacman.get<PacmanComponent>('pacman');
    if (!pacPos || !pacComp) return;

    const blinkyPos = blinkyEntity.get<PositionComponent>('position');

    for (const ghost of ghosts) {
      this.updateGhost(
        ghost,
        pacPos.tileX,
        pacPos.tileY,
        pacComp.currentDirection,
        blinkyPos?.tileX ?? 14,
        blinkyPos?.tileY ?? 14,
        dt
      );
    }
  }

  private updateModeTimer(ghosts: Entity[], dt: number): void {
    if (this.frightenedTimer > 0) return;

    this.modeTimer += dt;

    const timings = this.getModeTiming();
    const current = timings[this.modeIndex];
    if (!current) return;

    if (this.modeTimer >= current.duration) {
      this.modeTimer = 0;
      this.modeIndex++;

      const next = timings[this.modeIndex];
      if (next) {
        this.globalMode = next.mode as 'scatter' | 'chase';
        for (const ghost of ghosts) {
          setGhostMode(ghost, this.globalMode);
        }
      }
    }
  }

  private updateFrightenedTimer(ghosts: Entity[], dt: number): void {
    if (this.frightenedTimer <= 0) return;

    this.frightenedTimer -= dt;

    if (this.frightenedTimer <= 0) {
      this.frightenedTimer = 0;
      for (const ghost of ghosts) {
        const gc = ghost.get<GhostComponent>('ghost');
        if (gc && gc.mode === 'frightened') {
          gc.mode = gc.previousMode;
        }
      }
    }
  }

  private updateReleaseTimer(ghosts: Entity[], dt: number): void {
    this.releaseTimer += dt;

    // force release if no dots eaten for ~4 seconds
    if (this.releaseTimer > 4000) {
      this.releaseTimer = 0;
      for (const ghost of ghosts) {
        const gc = ghost.get<GhostComponent>('ghost');
        if (gc && gc.mode === 'inHouse') {
          // Set dotCounter high enough to trigger exit in updateInHouseMovement
          gc.dotCounter = this.getDotLimit(gc.name);
          break;
        }
      }
    }
  }

  private updateGhost(
    ghost: Entity,
    pacTileX: number,
    pacTileY: number,
    pacDir: Direction,
    blinkyTileX: number,
    blinkyTileY: number,
    dt: number
  ): void {
    const gc = ghost.get<GhostComponent>('ghost');
    const pos = ghost.get<PositionComponent>('position');
    const vel = ghost.get<VelocityComponent>('velocity');
    if (!gc || !pos || !vel) return;

    this.updateGhostSpeed(gc, vel, pos);

    // Handle house-related modes
    if (gc.mode === 'inHouse') {
      this.updateInHouseMovement(ghost, pos, vel, dt, blinkyTileY);
      return;
    }

    if (gc.mode === 'leavingHouse') {
      this.updateLeavingHouseMovement(ghost, pos, vel, dt);
      return;
    }

    if (gc.mode === 'enteringHouse') {
      this.updateEnteringHouseMovement(ghost, pos, vel, dt);
      return;
    }

    // 'eaten' mode means just eaten, showing score - game is paused, no movement
    if (gc.mode === 'eaten') {
      return;
    }

    const currentDir = this.ghostDirections.get(ghost.id) || 'left';
    const isEyes = gc.mode === 'eyes';

    if (gc.reverseQueued) {
      gc.reverseQueued = false;
      const opposite = this.getOpposite(currentDir);
      this.ghostDirections.set(ghost.id, opposite);
      this.ghostDecisionTiles.delete(ghost.id);
    }

    // Get current tile center
    const tileCenter = tileToPixel(pos.tileX, pos.tileY, TILE_SIZE);

    // Check if we need to make a decision (at or past tile center, haven't decided for this tile yet)
    const lastDecisionTile = this.ghostDecisionTiles.get(ghost.id);
    const needsDecision =
      !lastDecisionTile || lastDecisionTile.x !== pos.tileX || lastDecisionTile.y !== pos.tileY;

    // Check if ghost has reached or passed tile center
    const dir = this.ghostDirections.get(ghost.id) || 'left';
    const vec = directionVectors[dir];
    const passedCenterX =
      vec.x > 0 ? pos.x >= tileCenter.x : vec.x < 0 ? pos.x <= tileCenter.x : true;
    const passedCenterY =
      vec.y > 0 ? pos.y >= tileCenter.y : vec.y < 0 ? pos.y <= tileCenter.y : true;
    const atOrPastCenter = passedCenterX && passedCenterY;

    if (needsDecision && atOrPastCenter) {
      // Make direction decision at tile center
      const target = this.getTarget(gc, pos, pacTileX, pacTileY, pacDir, blinkyTileX, blinkyTileY);
      gc.targetX = target.x;
      gc.targetY = target.y;

      const newDir = this.chooseDirection(
        pos.tileX,
        pos.tileY,
        target,
        dir,
        gc.mode === 'frightened',
        isEyes,
        gc.mode !== 'frightened' && !isEyes
      );

      this.ghostDirections.set(ghost.id, newDir);
      this.ghostDecisionTiles.set(ghost.id, { x: pos.tileX, y: pos.tileY });
    }

    // Always move (no snapping)
    const moveDir = this.ghostDirections.get(ghost.id) || 'left';
    this.moveInDirection(pos, vel, moveDir, dt, isEyes);

    // Update eyes sprite based on movement direction
    if (isEyes) {
      const sprite = ghost.get<SpriteComponent>('sprite');
      if (sprite) {
        sprite.region = `ghost-eyes-${moveDir === 'none' ? 'left' : moveDir}`;
      }
    }

    // check if eyes ghost reached house entrance (use pixel-based detection for accuracy)
    if (gc.mode === 'eyes') {
      const entranceX = GHOST_HOUSE_CENTER.x * TILE_SIZE + TILE_SIZE / 2; // center X = 112
      const entranceY = (GHOST_HOUSE_CENTER.y - 3) * TILE_SIZE + TILE_SIZE / 2;

      // Check if eyes are close to entrance (within 4 pixels)
      if (Math.abs(pos.x - entranceX) < 4 && Math.abs(pos.y - entranceY) < 4) {
        // Snap to entrance and start entering house
        pos.x = entranceX;
        pos.y = entranceY;
        gc.mode = 'enteringHouse';
      }
    }
  }

  private updateInHouseMovement(
    ghost: Entity,
    pos: PositionComponent,
    vel: VelocityComponent,
    dt: number,
    blinkyTileY: number
  ): void {
    const gc = ghost.get<GhostComponent>('ghost');
    if (!gc) return;

    // Check if this ghost should be released based on dot counter
    const dotLimit = this.getDotLimit(gc.name);
    const shouldExit = gc.dotCounter >= dotLimit;

    if (shouldExit) {
      // Pinky can't leave until Blinky has cleared the doorway (tile Y < 14)
      if (gc.name === 'pinky' && blinkyTileY >= 14) {
        // Blinky hasn't cleared the doorway yet, keep waiting
      } else {
        // Transition to leaving house mode
        gc.mode = 'leavingHouse';
        return;
      }
    }

    // Ghost is waiting - bob up and down at their X position
    // Bounce limits for ghosts in the house
    // Ghost sprites are 16x16, so they extend 8px above/below center
    // House interior is roughly y=136 to y=152, so safe centers are 144 +/- 4
    const bounceTop = 137; // Upper limit (ghost top edge at 129)
    const bounceBottom = 143; // Lower limit (ghost bottom edge at 151)
    const bounceSpeed = vel.speed * 0.4; // Slower bounce speed

    const startPixels = GHOST_START_PIXELS[gc.name as keyof typeof GHOST_START_PIXELS];

    // Keep X fixed at starting position
    pos.x = startPixels.x;

    // Initialize bounce direction if not set
    if (!this.ghostBounceDir.has(ghost.id)) {
      this.ghostBounceDir.set(ghost.id, 1); // Start moving down
    }

    const bounceDir = this.ghostBounceDir.get(ghost.id) || 1;
    pos.y += bounceDir * bounceSpeed * (dt / 1000);

    // Reverse direction at bounds
    if (pos.y >= bounceBottom) {
      pos.y = bounceBottom;
      this.ghostBounceDir.set(ghost.id, -1); // Move up
    } else if (pos.y <= bounceTop) {
      pos.y = bounceTop;
      this.ghostBounceDir.set(ghost.id, 1); // Move down
    }

    // Update sprite to match bounce direction - re-read AFTER any reversal
    const currentBounceDir = this.ghostBounceDir.get(ghost.id) || 1;
    const sprite = ghost.get<SpriteComponent>('sprite');
    if (sprite) {
      const dir = currentBounceDir > 0 ? 'down' : 'up';
      sprite.region = `ghost-${gc.name}-${dir}`;
    }
  }

  private updateLeavingHouseMovement(
    ghost: Entity,
    pos: PositionComponent,
    vel: VelocityComponent,
    dt: number
  ): void {
    const gc = ghost.get<GhostComponent>('ghost');
    if (!gc) return;

    // Ghost is exiting - use center X for exit path
    const centerX = 112; // Boundary between tiles 13-14
    const exitY = (GHOST_HOUSE_CENTER.y - 3) * TILE_SIZE + TILE_SIZE / 2;

    const sprite = ghost.get<SpriteComponent>('sprite');

    // move to center X first
    if (Math.abs(pos.x - centerX) > 1) {
      const dir = pos.x < centerX ? 1 : -1;
      pos.x += dir * vel.speed * (dt / 1000);
      // Update sprite to face direction of horizontal movement
      if (sprite) {
        sprite.region = `ghost-${gc.name}-${dir > 0 ? 'right' : 'left'}`;
      }
      return;
    }

    // snap to center X
    pos.x = centerX;

    // then move up to exit
    if (pos.y > exitY) {
      pos.y -= vel.speed * (dt / 1000);
      // Update sprite to face up while moving up
      if (sprite) {
        sprite.region = `ghost-${gc.name}-up`;
      }
      return;
    }

    // snap to exit position and update tile coordinates
    pos.x = centerX;
    pos.y = exitY;
    pos.tileX = Math.floor(pos.x / TILE_SIZE);
    pos.tileY = Math.floor(pos.y / TILE_SIZE);

    // Now fully exited - enter scatter or chase mode
    gc.mode = this.globalMode;
    this.ghostDirections.set(ghost.id, 'left');
    // Clear decision tile so ghost will make a new decision immediately
    this.ghostDecisionTiles.delete(ghost.id);
  }

  private updateEnteringHouseMovement(
    ghost: Entity,
    pos: PositionComponent,
    vel: VelocityComponent,
    dt: number
  ): void {
    const gc = ghost.get<GhostComponent>('ghost');
    if (!gc) return;

    // Eyes entering the house - move down to center, then regenerate
    const centerX = GHOST_HOUSE_CENTER.x * TILE_SIZE + TILE_SIZE / 2; // 112
    const centerY = GHOST_HOUSE_CENTER.y * TILE_SIZE + TILE_SIZE / 2; // ~140

    // Ensure X is centered
    pos.x = centerX;

    // Update sprite to show eyes facing down while entering
    const sprite = ghost.get<SpriteComponent>('sprite');
    if (sprite) {
      sprite.region = `ghost-eyes-down`;
    }

    // Move down into the house
    if (pos.y < centerY) {
      pos.y += vel.speed * (dt / 1000);
      if (pos.y >= centerY) {
        pos.y = centerY;
      }
      return;
    }

    // Reached center - regenerate and start leaving
    // Change sprite back to normal ghost
    if (sprite) {
      sprite.region = `ghost-${gc.name}-up`;
    }

    gc.mode = 'leavingHouse';
  }

  private updateGhostSpeed(
    gc: GhostComponent,
    vel: VelocityComponent,
    pos: PositionComponent
  ): void {
    const speeds = LEVEL_SPEEDS[Math.min(this.level - 1, LEVEL_SPEEDS.length - 1)]!;

    if (gc.mode === 'eyes' || gc.mode === 'enteringHouse') {
      // Eyes move at 1.5x speed to return to house (not too fast to overshoot)
      vel.speed = BASE_SPEED * 1.5;
    } else if (gc.mode === 'eaten') {
      // Just eaten - no movement (game paused showing score)
      vel.speed = 0;
    } else if (gc.mode === 'frightened') {
      vel.speed = BASE_SPEED * speeds.frightGhost;
    } else if (this.maze.isSlowdownZone(pos.tileX, pos.tileY)) {
      vel.speed = BASE_SPEED * speeds.tunnel;
    } else {
      vel.speed = BASE_SPEED * speeds.ghost;
    }
  }

  private getTarget(
    gc: GhostComponent,
    pos: PositionComponent,
    pacTileX: number,
    pacTileY: number,
    pacDir: Direction,
    blinkyTileX: number,
    blinkyTileY: number
  ): Vec2 {
    if (gc.mode === 'eyes') {
      // Target the house entrance to return
      return { x: GHOST_HOUSE_CENTER.x, y: GHOST_HOUSE_CENTER.y - 3 };
    }

    if (gc.mode === 'frightened') {
      return { x: pos.tileX, y: pos.tileY };
    }

    const isScatter = gc.mode === 'scatter';

    switch (gc.name) {
      case 'blinky':
        return getBlinkyTarget(pacTileX, pacTileY, isScatter);
      case 'pinky':
        return getPinkyTarget(pacTileX, pacTileY, pacDir, isScatter);
      case 'inky':
        return getInkyTarget(pacTileX, pacTileY, pacDir, blinkyTileX, blinkyTileY, isScatter);
      case 'clyde':
        return getClydeTarget(pos.tileX, pos.tileY, pacTileX, pacTileY, isScatter);
      default:
        return SCATTER_TARGETS.blinky;
    }
  }

  private chooseDirection(
    tileX: number,
    tileY: number,
    target: Vec2,
    currentDir: Direction,
    isFrightened: boolean,
    isEaten: boolean,
    respectNoUpTurn: boolean
  ): Direction {
    const validDirs = this.maze.getValidDirections(
      tileX,
      tileY,
      currentDir,
      true,
      isEaten,
      respectNoUpTurn
    );

    if (validDirs.length === 0) {
      return currentDir;
    }

    if (validDirs.length === 1) {
      return validDirs[0]!;
    }

    if (isFrightened) {
      return validDirs[Math.floor(Math.random() * validDirs.length)]!;
    }

    // pick direction with shortest distance to target
    let bestDir = validDirs[0]!;
    let bestDist = Infinity;

    for (const priority of DIRECTION_PRIORITY) {
      if (!validDirs.includes(priority)) continue;

      const next = this.getNextTile(tileX, tileY, priority);
      const dist = distanceVec2(next, target);

      if (dist < bestDist) {
        bestDist = dist;
        bestDir = priority;
      }
    }

    return bestDir;
  }

  private getNextTile(tileX: number, tileY: number, dir: Direction): Vec2 {
    const vec = directionVectors[dir];
    return { x: tileX + vec.x, y: tileY + vec.y };
  }

  private moveInDirection(
    pos: PositionComponent,
    vel: VelocityComponent,
    dir: Direction,
    dt: number,
    isEaten = false
  ): void {
    const vec = directionVectors[dir];
    let newX = pos.x + vec.x * vel.speed * (dt / 1000);
    let newY = pos.y + vec.y * vel.speed * (dt / 1000);

    // Tunnel wrapping
    const mazePixelWidth = MAZE_WIDTH * TILE_SIZE;
    if (newX < -TILE_SIZE / 2) {
      newX = mazePixelWidth - TILE_SIZE / 2;
    } else if (newX > mazePixelWidth - TILE_SIZE / 2) {
      newX = -TILE_SIZE / 2;
    }

    // Keep ghost centered on the perpendicular axis to prevent wall overlap
    const tileCenter = tileToPixel(pos.tileX, pos.tileY, TILE_SIZE);
    if (vec.x !== 0) {
      // Moving horizontally - snap Y to tile center
      newY = tileCenter.y;
    } else if (vec.y !== 0) {
      // Moving vertically - snap X to tile center
      newX = tileCenter.x;
    }

    // Check if new position would be in a wall or gate (eaten ghosts can pass through gates)
    const newTile = pixelToTile(newX, newY, TILE_SIZE);

    // Wrap tile coordinates for tunnel
    if (newTile.x < 0) newTile.x = MAZE_WIDTH - 1;
    else if (newTile.x >= MAZE_WIDTH) newTile.x = 0;

    const hitWall = this.maze.isWall(newTile.x, newTile.y);
    const hitGate = !isEaten && this.maze.isGate(newTile.x, newTile.y);

    if (hitWall || hitGate) {
      // Stop at tile center instead of moving into wall
      pos.x = tileCenter.x;
      pos.y = tileCenter.y;
      vel.dx = 0;
      vel.dy = 0;
      return;
    }

    pos.x = newX;
    pos.y = newY;
    vel.dx = vec.x;
    vel.dy = vec.y;

    pos.tileX = newTile.x;
    pos.tileY = newTile.y;
  }

  private getOpposite(dir: Direction): Direction {
    const opposites: Record<Direction, Direction> = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left',
      none: 'none',
    };
    return opposites[dir];
  }

  private getModeTiming(): { mode: string; duration: number }[] {
    if (this.level === 1) return MODE_TIMINGS[0]!;
    if (this.level < 5) return MODE_TIMINGS[1]!;
    return MODE_TIMINGS[2]!;
  }

  onPelletEaten(ghosts: Entity[]): void {
    this.releaseTimer = 0;
    this.dotsSinceLastRelease++;
    this.globalDotCounter++;

    if (this.useGlobalDotCounter) {
      this.checkGlobalDotRelease(ghosts);
    } else {
      this.checkIndividualDotRelease(ghosts);
    }
  }

  private checkIndividualDotRelease(ghosts: Entity[]): void {
    for (const ghost of ghosts) {
      const gc = ghost.get<GhostComponent>('ghost');
      if (!gc || gc.mode !== 'inHouse') continue;

      gc.dotCounter++;
      // Only increment one ghost's counter per pellet
      // Don't change mode here - let updateInHouseMovement handle the exit
      // when shouldExit becomes true (dotCounter >= limit)
      break;
    }
  }

  private checkGlobalDotRelease(ghosts: Entity[]): void {
    const limits = GLOBAL_DOT_LIMITS;

    for (const ghost of ghosts) {
      const gc = ghost.get<GhostComponent>('ghost');
      if (!gc || gc.mode !== 'inHouse') continue;

      const limit = limits[gc.name as keyof typeof limits];
      if (this.globalDotCounter >= limit) {
        // Set dotCounter high enough to trigger exit in updateInHouseMovement
        gc.dotCounter = this.getDotLimit(gc.name);
        this.globalDotCounter = 0;
        break;
      }
    }
  }

  private getDotLimit(name: string): number {
    if (this.level === 1) {
      return GHOST_DOT_LIMITS[name as keyof typeof GHOST_DOT_LIMITS] ?? 0;
    }
    if (this.level === 2) {
      if (name === 'inky') return 0;
      if (name === 'clyde') return 50;
    }
    return 0;
  }

  onPowerPelletEaten(ghosts: Entity[]): void {
    const duration =
      FRIGHTENED_DURATIONS[Math.min(this.level - 1, FRIGHTENED_DURATIONS.length - 1)] ?? 0;

    if (duration > 0) {
      this.frightenedTimer = duration;
      for (const ghost of ghosts) {
        setGhostMode(ghost, 'frightened');
      }
    } else {
      // just reverse direction
      for (const ghost of ghosts) {
        const gc = ghost.get<GhostComponent>('ghost');
        if (
          gc &&
          gc.mode !== 'eyes' &&
          gc.mode !== 'eaten' &&
          gc.mode !== 'inHouse' &&
          gc.mode !== 'leavingHouse'
        ) {
          gc.reverseQueued = true;
        }
      }
    }
  }

  onPacmanDeath(): void {
    this.useGlobalDotCounter = true;
    this.globalDotCounter = 0;
  }

  isFrightened(): boolean {
    return this.frightenedTimer > 0;
  }

  getFrightenedTimer(): number {
    return this.frightenedTimer;
  }

  getGhostDirection(ghostId: number): Direction {
    return this.ghostDirections.get(ghostId) || 'left';
  }

  /**
   * Transition ghost to 'eyes' mode (returning to house).
   * Clears decision tile so ghost recalculates direction immediately.
   */
  transitionToEyes(ghost: Entity): void {
    const gc = ghost.get<GhostComponent>('ghost');
    if (!gc) return;

    gc.mode = 'eyes';
    // Clear decision tile so ghost recalculates direction towards house
    this.ghostDecisionTiles.delete(ghost.id);
  }

  /**
   * Check if a ghost is in a state that should be ignored for gameplay
   * (eaten showing score, or eyes returning home)
   */
  isGhostInactive(ghost: Entity): boolean {
    const gc = ghost.get<GhostComponent>('ghost');
    if (!gc) return true;
    return gc.mode === 'eaten' || gc.mode === 'eyes';
  }

  setMaze(maze: Maze): void {
    this.maze = maze;
  }
}
