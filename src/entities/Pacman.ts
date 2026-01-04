import { Entity } from '../ecs/Entity';
import {
  PositionComponent,
  VelocityComponent,
  SpriteComponent,
  AnimationComponent,
  PacmanComponent,
  ColliderComponent,
} from '../ecs/Component';
import {
  BASE_SPEED,
  LEVEL_SPEEDS,
  PACMAN_START,
  PACMAN_START_PIXELS,
  PACMAN_ANIM_FRAME_DURATION,
} from '../utils/constants';

export function createPacman(level = 1): Entity {
  const entity = new Entity();

  const speedMultiplier = LEVEL_SPEEDS[Math.min(level - 1, LEVEL_SPEEDS.length - 1)]?.pacman ?? 0.8;

  const position: PositionComponent = {
    type: 'position',
    x: PACMAN_START_PIXELS.x,
    y: PACMAN_START_PIXELS.y,
    tileX: PACMAN_START.x,
    tileY: PACMAN_START.y,
  };

  const velocity: VelocityComponent = {
    type: 'velocity',
    speed: BASE_SPEED * speedMultiplier,
    dx: 0,
    dy: 0,
  };

  const sprite: SpriteComponent = {
    type: 'sprite',
    region: 'pacman-right',
    frameIndex: 0, // Closed mouth (full circle)
    width: 16,
    height: 16,
    flipX: false,
    flipY: false,
    visible: true,
    offsetX: -8,
    offsetY: -8,
  };

  const animation: AnimationComponent = {
    type: 'animation',
    frames: [0, 1, 2, 1],
    frameDuration: PACMAN_ANIM_FRAME_DURATION,
    elapsed: 0,
    loop: true,
    playing: true,
  };

  const pacman: PacmanComponent = {
    type: 'pacman',
    nextDirection: 'none',
    currentDirection: 'none', // Start stationary until player input
    pauseFrames: 0,
    dying: false,
    dead: false,
  };

  const collider: ColliderComponent = {
    type: 'collider',
    width: 13,
    height: 13,
    offsetX: -6.5,
    offsetY: -6.5,
  };

  entity.add(position);
  entity.add(velocity);
  entity.add(sprite);
  entity.add(animation);
  entity.add(pacman);
  entity.add(collider);

  return entity;
}

export function resetPacman(entity: Entity, level = 1): void {
  const speedMultiplier = LEVEL_SPEEDS[Math.min(level - 1, LEVEL_SPEEDS.length - 1)]?.pacman ?? 0.8;

  const pos = entity.get<PositionComponent>('position');
  if (pos) {
    pos.x = PACMAN_START_PIXELS.x;
    pos.y = PACMAN_START_PIXELS.y;
    pos.tileX = PACMAN_START.x;
    pos.tileY = PACMAN_START.y;
  }

  const vel = entity.get<VelocityComponent>('velocity');
  if (vel) {
    vel.speed = BASE_SPEED * speedMultiplier;
    vel.dx = 0;
    vel.dy = 0;
  }

  const pac = entity.get<PacmanComponent>('pacman');
  if (pac) {
    pac.nextDirection = 'none';
    pac.currentDirection = 'none'; // Start stationary until player input
    pac.pauseFrames = 0;
    pac.dying = false;
    pac.dead = false;
  }

  const sprite = entity.get<SpriteComponent>('sprite');
  if (sprite) {
    sprite.region = 'pacman-right';
    sprite.frameIndex = 0; // Closed mouth (full circle)
    sprite.visible = true;
  }

  const anim = entity.get<AnimationComponent>('animation');
  if (anim) {
    anim.frames = [0, 1, 2, 1]; // Normal chomping animation
    anim.frameDuration = PACMAN_ANIM_FRAME_DURATION;
    anim.elapsed = 0;
    anim.loop = true;
    anim.playing = true;
  }
}
