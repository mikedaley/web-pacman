import { Vec2, Direction } from '../../utils/types';
import { SCATTER_TARGETS } from '../../utils/constants';
import { directionVectors } from '../../utils/math';

export function getInkyTarget(
  pacmanTileX: number,
  pacmanTileY: number,
  pacmanDirection: Direction,
  blinkyTileX: number,
  blinkyTileY: number,
  isScatter: boolean
): Vec2 {
  if (isScatter) {
    return SCATTER_TARGETS.inky;
  }

  const vec = directionVectors[pacmanDirection];
  let offsetX = pacmanTileX + vec.x * 2;
  const offsetY = pacmanTileY + vec.y * 2;

  // original overflow bug
  if (pacmanDirection === 'up') {
    offsetX -= 2;
  }

  // double the vector from blinky through the offset point
  const targetX = offsetX + (offsetX - blinkyTileX);
  const targetY = offsetY + (offsetY - blinkyTileY);

  return { x: targetX, y: targetY };
}
