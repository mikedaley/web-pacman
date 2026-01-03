import { TextRenderer } from './TextRenderer';
import { SpriteBatch } from '../renderer/SpriteBatch';
import { SpriteAtlas } from '../renderer/SpriteAtlas';
import { CANVAS_WIDTH } from '../utils/constants';

export class HUD {
  private textRenderer: TextRenderer;
  private batch: SpriteBatch;
  private atlas: SpriteAtlas;

  constructor(textRenderer: TextRenderer, batch: SpriteBatch, atlas: SpriteAtlas) {
    this.textRenderer = textRenderer;
    this.batch = batch;
    this.atlas = atlas;
  }

  render(score: number, lives: number, level: number, highScore: number): void {
    this.renderText(score, highScore);
    this.renderSprites(lives, level);
  }

  renderText(score: number, highScore: number): void {
    this.textRenderer.draw('1UP', 24, 0);
    this.textRenderer.draw(this.formatScore(score), 8, 8);
    this.textRenderer.draw('HIGH SCORE', 72, 0);
    this.textRenderer.draw(this.formatScore(highScore), 88, 8);
  }

  renderSprites(lives: number, level: number): void {
    this.drawLives(lives);
    this.drawLevel(level);
  }

  private formatScore(score: number): string {
    return score.toString().padStart(6, ' ');
  }

  private drawLives(lives: number): void {
    const y = 272;
    for (let i = 0; i < lives - 1; i++) {
      const frame = this.atlas.getFrame('pacman-left', 1);
      if (frame) {
        this.batch.draw(frame, 16 + i * 16, y, 16, 16);
      }
    }
  }

  private drawLevel(level: number): void {
    const y = 272;
    // Show up to 7 fruits representing level history (like original arcade)
    // Fruit order: cherry, strawberry, orange, orange, apple, apple, melon, melon, galaxian, bell, key...
    const fruitForLevel = (lvl: number): number => {
      if (lvl <= 0) return 0;
      if (lvl === 1) return 0; // cherry
      if (lvl === 2) return 1; // strawberry
      if (lvl <= 4) return 2; // orange
      if (lvl <= 6) return 3; // apple
      if (lvl <= 8) return 4; // melon
      if (lvl <= 10) return 5; // galaxian
      if (lvl <= 12) return 6; // bell
      return 7; // key (level 13+)
    };

    // Show last 7 levels' fruits, right-aligned
    const maxFruits = 7;
    const startLevel = Math.max(1, level - maxFruits + 1);
    const numFruits = Math.min(level, maxFruits);

    for (let i = 0; i < numFruits; i++) {
      const lvl = startLevel + i;
      const fruitIndex = fruitForLevel(lvl);
      const frame = this.atlas.getFrame('fruits', fruitIndex);
      if (frame) {
        // Draw from right to left, current level on the right
        const x = CANVAS_WIDTH - 16 - (numFruits - 1 - i) * 16;
        this.batch.draw(frame, x, y, 16, 16);
      }
    }
  }

  drawReady(): void {
    this.textRenderer.draw('READY!', 88, 160, 1, 1, 0);
  }

  drawGameOver(): void {
    this.textRenderer.draw('GAME OVER', 72, 160, 1, 0, 0);
  }
}
