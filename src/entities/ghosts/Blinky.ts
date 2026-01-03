import { Vec2 } from '../../utils/types';
import { SCATTER_TARGETS } from '../../utils/constants';

export function getBlinkyTarget(
  pacmanTileX: number,
  pacmanTileY: number,
  isScatter: boolean
): Vec2 {
  if (isScatter) {
    return SCATTER_TARGETS.blinky;
  }
  return { x: pacmanTileX, y: pacmanTileY };
}
