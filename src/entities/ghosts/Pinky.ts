import { Vec2, Direction } from '../../utils/types';
import { SCATTER_TARGETS } from '../../utils/constants';
import { directionVectors } from '../../utils/math';

export function getPinkyTarget(
  pacmanTileX: number,
  pacmanTileY: number,
  pacmanDirection: Direction,
  isScatter: boolean
): Vec2 {
  if (isScatter) {
    return SCATTER_TARGETS.pinky;
  }

  const vec = directionVectors[pacmanDirection];
  let targetX = pacmanTileX + vec.x * 4;
  const targetY = pacmanTileY + vec.y * 4;

  // original overflow bug when pacman faces up
  if (pacmanDirection === 'up') {
    targetX -= 4;
  }

  return { x: targetX, y: targetY };
}
