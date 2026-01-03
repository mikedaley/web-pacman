import { Entity } from '../ecs/Entity';
import { PositionComponent, VelocityComponent, SpriteComponent, AnimationComponent, GhostComponent, ColliderComponent } from '../ecs/Component';
import { GhostName, GhostMode, Direction } from '../utils/types';
import { BASE_SPEED, LEVEL_SPEEDS, GHOST_START_POSITIONS, GHOST_START_PIXELS, SCATTER_TARGETS } from '../utils/constants';

export function createGhost(name: GhostName, level = 1): Entity {
  const entity = new Entity();
  const startTile = GHOST_START_POSITIONS[name];
  const startPixels = GHOST_START_PIXELS[name];

  const speeds = LEVEL_SPEEDS[Math.min(level - 1, LEVEL_SPEEDS.length - 1)];
  const speedMultiplier = speeds?.ghost ?? 0.75;

  const position: PositionComponent = {
    type: 'position',
    x: startPixels.x,
    y: startPixels.y,
    tileX: startTile.x,
    tileY: startTile.y,
  };

  const velocity: VelocityComponent = {
    type: 'velocity',
    speed: BASE_SPEED * speedMultiplier,
    dx: 0,
    dy: 0,
  };

  const sprite: SpriteComponent = {
    type: 'sprite',
    region: `ghost-${name}-right`,
    frameIndex: 0,
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
    frames: [0, 1],
    frameDuration: 100,
    elapsed: 0,
    loop: true,
    playing: true,
  };

  const initialMode: GhostMode = name === 'blinky' ? 'scatter' : 'inHouse';

  const ghost: GhostComponent = {
    type: 'ghost',
    name,
    mode: initialMode,
    previousMode: 'scatter',
    targetX: SCATTER_TARGETS[name].x,
    targetY: SCATTER_TARGETS[name].y,
    dotCounter: 0,
    elpikedElroy: false,
    elroyLevel: 0,
    reverseQueued: false,
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
  entity.add(ghost);
  entity.add(collider);

  return entity;
}

export function resetGhost(entity: Entity, level = 1): void {
  const ghost = entity.get<GhostComponent>('ghost');
  if (!ghost) return;

  const startTile = GHOST_START_POSITIONS[ghost.name];
  const startPixels = GHOST_START_PIXELS[ghost.name];
  const speeds = LEVEL_SPEEDS[Math.min(level - 1, LEVEL_SPEEDS.length - 1)];

  const pos = entity.get<PositionComponent>('position');
  if (pos) {
    pos.x = startPixels.x;
    pos.y = startPixels.y;
    pos.tileX = startTile.x;
    pos.tileY = startTile.y;
  }

  const vel = entity.get<VelocityComponent>('velocity');
  if (vel) {
    vel.speed = BASE_SPEED * (speeds?.ghost ?? 0.75);
    vel.dx = 0;
    vel.dy = 0;
  }

  ghost.mode = ghost.name === 'blinky' ? 'scatter' : 'inHouse';
  ghost.previousMode = 'scatter';
  ghost.targetX = SCATTER_TARGETS[ghost.name].x;
  ghost.targetY = SCATTER_TARGETS[ghost.name].y;
  ghost.dotCounter = 0;
  ghost.elpikedElroy = false;
  ghost.elroyLevel = 0;
  ghost.reverseQueued = false;

  const sprite = entity.get<SpriteComponent>('sprite');
  if (sprite) {
    sprite.region = `ghost-${ghost.name}-right`;
    sprite.visible = true;
  }
}

export function getGhostSpriteRegion(ghost: GhostComponent, direction: Direction): string {
  if (ghost.mode === 'frightened') {
    return 'ghost-frightened';
  }

  // Eyes mode - show eyes returning to house
  if (ghost.mode === 'eyes') {
    return `ghost-eyes-${direction === 'none' ? 'right' : direction}`;
  }

  // Eaten mode - could show score sprite (handled elsewhere) or eyes
  if (ghost.mode === 'eaten') {
    return `ghost-eyes-${direction === 'none' ? 'right' : direction}`;
  }

  const dir = direction === 'none' ? 'right' : direction;
  return `ghost-${ghost.name}-${dir}`;
}

export function setGhostMode(entity: Entity, mode: GhostMode, force = false): void {
  const ghost = entity.get<GhostComponent>('ghost');
  if (!ghost) return;

  // Eyes mode ghosts can only transition to inHouse (when reaching house)
  if (ghost.mode === 'eyes' && mode !== 'inHouse' && !force) return;

  if (mode === 'frightened') {
    // Can't frighten ghosts that are in house, leaving, eaten, or eyes
    if (ghost.mode !== 'eyes' && ghost.mode !== 'eaten' &&
        ghost.mode !== 'inHouse' && ghost.mode !== 'leavingHouse') {
      ghost.previousMode = ghost.mode as 'scatter' | 'chase';
      ghost.mode = 'frightened';
      ghost.reverseQueued = true;
    }
  } else if (mode === 'eaten') {
    // Transition to eaten (showing score, game pauses)
    ghost.mode = 'eaten';
  } else if (mode === 'eyes') {
    // Transition to eyes (returning to house)
    ghost.mode = 'eyes';
  } else if (mode === 'scatter' || mode === 'chase') {
    // Only change mode if ghost is actively in the maze
    if (ghost.mode !== 'frightened' && ghost.mode !== 'eyes' && ghost.mode !== 'eaten' &&
        ghost.mode !== 'inHouse' && ghost.mode !== 'leavingHouse') {
      if (ghost.mode !== mode) {
        ghost.reverseQueued = true;
      }
      ghost.mode = mode;
      ghost.previousMode = mode;
    }
  } else {
    ghost.mode = mode;
  }
}
