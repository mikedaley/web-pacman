import { Entity } from '../ecs/Entity';
import { PositionComponent, SpriteComponent, AnimationComponent } from '../ecs/Component';
import { WebGLRenderer } from '../renderer/WebGLRenderer';
import { Maze } from '../world/Maze';

export class RenderSystem {
  private renderer: WebGLRenderer;

  constructor(renderer: WebGLRenderer) {
    this.renderer = renderer;
  }

  render(maze: Maze, entities: Entity[], powerBlink: boolean): void {
    this.renderer.clear();

    const batch = this.renderer.getBatch();

    // Render maze tiles using maze atlas
    this.renderer.beginMaze();
    const mazeAtlas = this.renderer.getMazeAtlas();
    maze.render(batch, mazeAtlas);
    this.renderer.endBatch();

    // Render pellets and entities using sprite atlas
    this.renderer.beginSprites();
    const spriteAtlas = this.renderer.getSpriteAtlas();
    maze.renderPellets(batch, spriteAtlas, powerBlink);

    for (const entity of entities) {
      this.renderEntity(entity);
    }

    this.renderer.endBatch();
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
      1, 1, 1, 1,
      sprite.flipX,
      sprite.flipY
    );
  }
}
