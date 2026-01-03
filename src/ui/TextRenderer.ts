import { SpriteBatch } from '../renderer/SpriteBatch';
import { SpriteAtlas } from '../renderer/SpriteAtlas';

export class TextRenderer {
  private batch: SpriteBatch;
  private atlas: SpriteAtlas;
  private charWidth = 8;
  private charHeight = 8;

  constructor(batch: SpriteBatch, atlas: SpriteAtlas) {
    this.batch = batch;
    this.atlas = atlas;
  }

  draw(text: string, x: number, y: number, r = 1, g = 1, b = 1, a = 1): void {
    const upper = text.toUpperCase();

    for (let i = 0; i < upper.length; i++) {
      const char = upper[i]!;
      const frame = this.atlas.getFrame(`char-${char}`, 0);

      if (frame) {
        this.batch.draw(
          frame,
          x + i * this.charWidth,
          y,
          this.charWidth,
          this.charHeight,
          r, g, b, a
        );
      }
    }
  }

  drawCentered(text: string, centerX: number, y: number, r = 1, g = 1, b = 1, a = 1): void {
    const width = text.length * this.charWidth;
    this.draw(text, centerX - width / 2, y, r, g, b, a);
  }

  getTextWidth(text: string): number {
    return text.length * this.charWidth;
  }
}
