import { Entity } from '../ecs/Entity';
import {
  PositionComponent,
  VelocityComponent,
  SpriteComponent,
  AnimationComponent,
  PacmanComponent,
  ColliderComponent,
} from '../ecs/Component';
import { TILE_SIZE, BASE_SPEED, LEVEL_SPEEDS, PACMAN_START } from '../utils/constants';
import { tileToPixel } from '../utils/math';

export function createPacman(level = 1): Entity {
  const entity = new Entity();
  const startPos = tileToPixel(PACMAN_START.x, PACMAN_START.y, TILE_SIZE);

  const speedMultiplier = LEVEL_SPEEDS[Math.min(level - 1, LEVEL_SPEEDS.length - 1)]?.pacman ?? 0.8;

  const position: PositionComponent = {
    type: 'position',
    x: startPos.x,
    y: startPos.y,
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
    region: 'pacman-right', // Default facing right (closed mouth)
    frameIndex: 2, // Closed mouth frame
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
    frameDuration: 50,
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
  const startPos = tileToPixel(PACMAN_START.x, PACMAN_START.y, TILE_SIZE);
  const speedMultiplier = LEVEL_SPEEDS[Math.min(level - 1, LEVEL_SPEEDS.length - 1)]?.pacman ?? 0.8;

  const pos = entity.get<PositionComponent>('position');
  if (pos) {
    pos.x = startPos.x;
    pos.y = startPos.y;
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
    sprite.frameIndex = 2; // Closed mouth
    sprite.visible = true;
  }

  const anim = entity.get<AnimationComponent>('animation');
  if (anim) {
    anim.frames = [0, 1, 2, 1]; // Normal chomping animation
    anim.frameDuration = 33;
    anim.elapsed = 0;
    anim.loop = true;
    anim.playing = true;
  }
}
