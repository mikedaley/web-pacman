import { State } from './StateMachine';
import { WebGLRenderer } from '../renderer/WebGLRenderer';
import { InputManager } from '../core/InputManager';
import { TextRenderer } from '../ui/TextRenderer';

export class PauseState implements State {
  private renderer: WebGLRenderer;
  private input: InputManager;
  private textRenderer: TextRenderer;
  private onResume: () => void;
  private renderBackground: () => void;
  private wasEscapeDown = false;

  constructor(
    renderer: WebGLRenderer,
    input: InputManager,
    textRenderer: TextRenderer,
    onResume: () => void,
    renderBackground: () => void
  ) {
    this.renderer = renderer;
    this.input = input;
    this.textRenderer = textRenderer;
    this.onResume = onResume;
    this.renderBackground = renderBackground;
  }

  enter(): void {
    this.wasEscapeDown = true;
  }

  update(_dt: number): void {}

  handleInput(): void {
    const escDown = this.input.isKeyDown('Escape');

    if (!escDown) {
      this.wasEscapeDown = false;
    }

    if (escDown && !this.wasEscapeDown) {
      this.onResume();
    }
  }

  render(): void {
    this.renderBackground();

    this.renderer.beginText();
    this.textRenderer.draw('PAUSED', 88, 140, 1, 1, 0);
    this.textRenderer.draw('PRESS ESC TO RESUME', 36, 180);
    this.renderer.endBatch();
  }
}
