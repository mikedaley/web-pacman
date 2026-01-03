import { GhostMode, GhostName } from '../utils/types';

export interface Component {
  readonly type: string;
}

export interface PositionComponent extends Component {
  type: 'position';
  x: number;
  y: number;
  tileX: number;
  tileY: number;
}

export interface VelocityComponent extends Component {
  type: 'velocity';
  speed: number;
  dx: number;
  dy: number;
}

export interface SpriteComponent extends Component {
  type: 'sprite';
  region: string;
  frameIndex: number;
  width: number;
  height: number;
  flipX: boolean;
  flipY: boolean;
  visible: boolean;
  offsetX: number;
  offsetY: number;
}

export interface AnimationComponent extends Component {
  type: 'animation';
  frames: number[];
  frameDuration: number;
  elapsed: number;
  loop: boolean;
  playing: boolean;
}

export interface GhostComponent extends Component {
  type: 'ghost';
  name: GhostName;
  mode: GhostMode;
  previousMode: 'scatter' | 'chase';
  targetX: number;
  targetY: number;
  dotCounter: number;
  elpikedElroy: boolean;
  elroyLevel: number;
  reverseQueued: boolean;
}

export interface PacmanComponent extends Component {
  type: 'pacman';
  nextDirection: 'up' | 'down' | 'left' | 'right' | 'none';
  currentDirection: 'up' | 'down' | 'left' | 'right' | 'none';
  pauseFrames: number;
  dying: boolean;
  dead: boolean;
}

export interface ColliderComponent extends Component {
  type: 'collider';
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}
