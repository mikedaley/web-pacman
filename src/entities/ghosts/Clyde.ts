import { Vec2 } from '../../utils/types';
import { SCATTER_TARGETS } from '../../utils/constants';
import { distanceVec2 } from '../../utils/math';

export function getClydeTarget(
  clydeTileX: number,
  clydeTileY: number,
  pacmanTileX: number,
  pacmanTileY: number,
  isScatter: boolean
): Vec2 {
  if (isScatter) {
    return SCATTER_TARGETS.clyde;
  }

  const distance = distanceVec2(
    { x: clydeTileX, y: clydeTileY },
    { x: pacmanTileX, y: pacmanTileY }
  );

  // if within 8 tiles, retreat to scatter corner
  if (distance < 8) {
    return SCATTER_TARGETS.clyde;
  }

  return { x: pacmanTileX, y: pacmanTileY };
}
