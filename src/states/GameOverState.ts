import { State } from './StateMachine';
import { WebGLRenderer } from '../renderer/WebGLRenderer';
import { InputManager } from '../core/InputManager';
import { TextRenderer } from '../ui/TextRenderer';
import { CANVAS_WIDTH } from '../utils/constants';

// Helper to center text (8px per character)
function centerX(text: string): number {
  return (CANVAS_WIDTH - text.length * 8) / 2;
}

export class GameOverState implements State {
  private renderer: WebGLRenderer;
  private input: InputManager;
  private textRenderer: TextRenderer;
  private onRestart: () => void;
  private score: number;
  private inputDelay = 0;

  constructor(
    renderer: WebGLRenderer,
    input: InputManager,
    textRenderer: TextRenderer,
    onRestart: () => void
  ) {
    this.renderer = renderer;
    this.input = input;
    this.textRenderer = textRenderer;
    this.onRestart = onRestart;
    this.score = 0;
  }

  setScore(score: number): void {
    this.score = score;
  }

  enter(): void {
    this.inputDelay = 1000;
  }

  update(dt: number): void {
    if (this.inputDelay > 0) {
      this.inputDelay -= dt;
    }
  }

  handleInput(): void {
    if (this.inputDelay > 0) return;

    if (this.input.isKeyDown('Space') || this.input.isKeyDown('Enter')) {
      this.onRestart();
    }
  }

  render(): void {
    this.renderer.clear();
    this.renderer.beginText();

    const gameOver = 'GAME OVER';
    const scoreText = `SCORE ${this.score}`;
    const pressSpace = 'PRESS SPACE TO PLAY AGAIN';

    this.textRenderer.draw(gameOver, centerX(gameOver), 100, 1, 0, 0);
    this.textRenderer.draw(scoreText, centerX(scoreText), 140);
    this.textRenderer.draw(pressSpace, centerX(pressSpace), 200);

    this.renderer.endBatch();
  }
}
