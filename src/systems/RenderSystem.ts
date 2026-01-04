import { Entity } from '../ecs/Entity';
import { PositionComponent, SpriteComponent, AnimationComponent } from '../ecs/Component';
import { WebGLRenderer } from '../renderer/WebGLRenderer';
import { Maze } from '../world/Maze';

export interface GhostEatenInfo {
  score: number;
  x: number;
  y: number;
}

export class RenderSystem {
  private renderer: WebGLRenderer;

  constructor(renderer: WebGLRenderer) {
    this.renderer = renderer;
  }

  render(
    maze: Maze,
    entities: Entity[],
    powerBlink: boolean,
    mazeFlash = false,
    ghostEatenInfo: GhostEatenInfo | null = null
  ): void {
    this.renderer.clear();

    const batch = this.renderer.getBatch();

    // Render maze tiles using maze atlas
    this.renderer.beginMaze();
    const mazeAtlas = this.renderer.getMazeAtlas();
    maze.render(batch, mazeAtlas, mazeFlash);
    this.renderer.endBatch();

    // Render pellets and entities using sprite atlas (skip during flash)
    this.renderer.beginSprites();
    const spriteAtlas = this.renderer.getSpriteAtlas();
    if (!mazeFlash) {
      maze.renderPellets(batch, spriteAtlas, powerBlink);
    }

    for (const entity of entities) {
      this.renderEntity(entity);
    }

    // Render ghost eaten score sprite
    if (ghostEatenInfo) {
      const scoreRegion = this.getScoreRegion(ghostEatenInfo.score);
      const frame = spriteAtlas.getFrame(scoreRegion, 0);
      if (frame) {
        batch.draw(frame, ghostEatenInfo.x - 4, ghostEatenInfo.y - 4, 16, 16);
      }
    }

    this.renderer.endBatch();
  }

  private getScoreRegion(score: number): string {
    switch (score) {
      case 200:
        return 'score-200';
      case 400:
        return 'score-400';
      case 800:
        return 'score-800';
      case 1600:
        return 'score-1600';
      default:
        return 'score-200';
    }
  }

  private renderEntity(entity: Entity): void {
    const pos = entity.get<PositionComponent>('position');
    const sprite = entity.get<SpriteComponent>('sprite');

    if (!pos || !sprite || !sprite.visible) return;

    const anim = entity.get<AnimationComponent>('animation');
    const frameIndex = anim ? (anim.frames[sprite.frameIndex] ?? 0) : sprite.frameIndex;

    const batch = this.renderer.getBatch();
    const atlas = this.renderer.getSpriteAtlas();

    const frame = atlas.getFrame(sprite.region, frameIndex);
    if (!frame) return;

    batch.draw(
      frame,
      pos.x + sprite.offsetX,
      pos.y + sprite.offsetY,
      sprite.width,
      sprite.height,
      1,
      1,
      1,
      1,
      sprite.flipX,
      sprite.flipY
    );
  }
}
