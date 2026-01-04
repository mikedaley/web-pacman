import { Entity } from '../ecs/Entity';
import { PositionComponent, GhostComponent, PacmanComponent } from '../ecs/Component';
import { Maze } from '../world/Maze';
import { eventBus } from '../core/EventBus';
import { TILE_SIZE, POINTS, PELLET_PAUSE_FRAMES, POWER_PAUSE_FRAMES } from '../utils/constants';
import { GhostAISystem } from './GhostAISystem';

export class CollisionSystem {
  private maze: Maze;
  private ghostsEatenThisPower = 0;

  constructor(maze: Maze) {
    this.maze = maze;
  }

  checkPelletCollision(pacman: Entity): 'pellet' | 'power' | null {
    const pos = pacman.get<PositionComponent>('position');
    const pac = pacman.get<PacmanComponent>('pacman');
    if (!pos || !pac) return null;

    const result = this.maze.collectPellet(pos.tileX, pos.tileY);

    if (result === 'pellet') {
      pac.pauseFrames = PELLET_PAUSE_FRAMES;
      eventBus.emit('pellet:eaten', { x: pos.tileX, y: pos.tileY });
      eventBus.emit('score:changed', { score: POINTS.pellet });
    } else if (result === 'power') {
      pac.pauseFrames = POWER_PAUSE_FRAMES;
      this.ghostsEatenThisPower = 0;
      eventBus.emit('power:eaten', { x: pos.tileX, y: pos.tileY });
      eventBus.emit('score:changed', { score: POINTS.power });
    }

    if (this.maze.getPelletsRemaining() === 0) {
      eventBus.emit('level:complete', undefined);
    }

    return result;
  }

  checkGhostCollision(
    pacman: Entity,
    ghosts: Entity[],
    ghostAI: GhostAISystem
  ): { ghost: Entity; eaten: boolean; score: number; x: number; y: number } | null {
    const pacPos = pacman.get<PositionComponent>('position');
    const pacComp = pacman.get<PacmanComponent>('pacman');
    if (!pacPos || !pacComp || pacComp.dying) return null;

    for (const ghost of ghosts) {
      const ghostPos = ghost.get<PositionComponent>('position');
      const ghostComp = ghost.get<GhostComponent>('ghost');
      if (!ghostPos || !ghostComp) continue;

      // Skip ghosts that are in/entering/leaving the house
      if (
        ghostComp.mode === 'inHouse' ||
        ghostComp.mode === 'leavingHouse' ||
        ghostComp.mode === 'enteringHouse'
      )
        continue;

      const dx = Math.abs(pacPos.x - ghostPos.x);
      const dy = Math.abs(pacPos.y - ghostPos.y);

      if (dx < TILE_SIZE * 0.8 && dy < TILE_SIZE * 0.8) {
        if (ghostComp.mode === 'frightened') {
          // Ghost eaten - transition to 'eyes' mode (returns to house)
          // Use transitionToEyes to properly clear decision tile for immediate recalculation
          ghostAI.transitionToEyes(ghost);
          const points = POINTS.ghost[Math.min(this.ghostsEatenThisPower, 3)] ?? 200;
          this.ghostsEatenThisPower++;
          eventBus.emit('ghost:eaten', {
            ghost: ghostComp.name,
            x: ghostPos.tileX,
            y: ghostPos.tileY,
          });
          eventBus.emit('score:changed', { score: points });
          return { ghost, eaten: true, score: points, x: ghostPos.x, y: ghostPos.y };
        } else if (ghostComp.mode !== 'eaten' && ghostComp.mode !== 'eyes') {
          // Deadly collision with active ghost
          return { ghost, eaten: false, score: 0, x: ghostPos.x, y: ghostPos.y };
        }
      }
    }

    return null;
  }

  isDeadlyCollision(ghost: Entity): boolean {
    const gc = ghost.get<GhostComponent>('ghost');
    if (!gc) return false;
    // Not deadly if frightened, eaten (showing score), eyes (returning), entering, or in house
    return (
      gc.mode !== 'frightened' &&
      gc.mode !== 'eaten' &&
      gc.mode !== 'eyes' &&
      gc.mode !== 'inHouse' &&
      gc.mode !== 'leavingHouse' &&
      gc.mode !== 'enteringHouse'
    );
  }

  resetPowerCounter(): void {
    this.ghostsEatenThisPower = 0;
  }

  setMaze(maze: Maze): void {
    this.maze = maze;
  }
}
