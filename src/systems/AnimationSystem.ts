import { Entity } from '../ecs/Entity';
import {
  SpriteComponent,
  AnimationComponent,
  VelocityComponent,
  GhostComponent,
  PacmanComponent,
} from '../ecs/Component';
import { getGhostSpriteRegion } from '../entities/Ghost';
import { GhostAISystem } from './GhostAISystem';
import { FRIGHTENED_DURATIONS } from '../utils/constants';

export class AnimationSystem {
  private powerBlinkTimer = 0;
  private powerBlinkState = false;

  update(entities: Entity[], dt: number): void {
    for (const entity of entities) {
      this.updateAnimation(entity, dt);
    }
  }

  updatePacmanSprite(pacman: Entity): void {
    const pac = pacman.get<PacmanComponent>('pacman');
    const sprite = pacman.get<SpriteComponent>('sprite');
    const vel = pacman.get<VelocityComponent>('velocity');

    if (!pac || !sprite || !vel) return;

    if (pac.dying) {
      sprite.region = 'pacman-death';
      return;
    }

    const dir = pac.currentDirection;
    if (dir !== 'none') {
      sprite.region = `pacman-${dir}`;
    }

    // stop animation when not moving
    const anim = pacman.get<AnimationComponent>('animation');
    if (anim) {
      anim.playing = vel.dx !== 0 || vel.dy !== 0;
    }
  }

  updateGhostSprite(ghost: Entity, ghostAI: GhostAISystem, level: number): void {
    const gc = ghost.get<GhostComponent>('ghost');
    const sprite = ghost.get<SpriteComponent>('sprite');

    if (!gc || !sprite) return;

    // Ghosts in house, entering, leaving, or eyes have their sprites set by GhostAISystem
    // Also reset frameIndex to 0 for eyes mode since eyes sprites only have 1 frame
    if (
      gc.mode === 'inHouse' ||
      gc.mode === 'leavingHouse' ||
      gc.mode === 'enteringHouse' ||
      gc.mode === 'eyes'
    ) {
      if (gc.mode === 'eyes') {
        sprite.frameIndex = 0;
      }
      return;
    }

    const dir = ghostAI.getGhostDirection(ghost.id);
    const frightenedTime = ghostAI.getFrightenedTimer();
    const blinkThreshold =
      FRIGHTENED_DURATIONS[Math.min(level - 1, FRIGHTENED_DURATIONS.length - 1)] ?? 6000;

    if (gc.mode === 'frightened') {
      // blink when almost over
      if (frightenedTime < blinkThreshold * 0.33 && this.powerBlinkState) {
        sprite.region = 'ghost-frightened-flash';
      } else {
        sprite.region = 'ghost-frightened';
      }
    } else {
      sprite.region = getGhostSpriteRegion(gc, dir === 'none' ? 'left' : dir);
    }
  }

  updatePowerBlink(dt: number): boolean {
    this.powerBlinkTimer += dt;
    if (this.powerBlinkTimer >= 200) {
      this.powerBlinkTimer = 0;
      this.powerBlinkState = !this.powerBlinkState;
    }
    return this.powerBlinkState;
  }

  private updateAnimation(entity: Entity, dt: number): void {
    const anim = entity.get<AnimationComponent>('animation');
    const sprite = entity.get<SpriteComponent>('sprite');

    if (!anim || !sprite || !anim.playing) return;

    anim.elapsed += dt;

    if (anim.elapsed >= anim.frameDuration) {
      anim.elapsed = 0;
      sprite.frameIndex++;

      if (sprite.frameIndex >= anim.frames.length) {
        if (anim.loop) {
          sprite.frameIndex = 0;
        } else {
          sprite.frameIndex = anim.frames.length - 1;
          anim.playing = false;
        }
      }
    }
  }

  getPowerBlinkState(): boolean {
    return this.powerBlinkState;
  }

  reset(): void {
    this.powerBlinkTimer = 0;
    this.powerBlinkState = false;
  }
}
