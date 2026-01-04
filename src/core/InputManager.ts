import { Direction } from '../utils/types';

export class InputManager {
  private keys = new Set<string>();
  private bufferedDirection: Direction = 'none';

  constructor() {
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.keys.add(e.code);

    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.bufferedDirection = 'up';
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.bufferedDirection = 'down';
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.bufferedDirection = 'left';
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.bufferedDirection = 'right';
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.code);
  }

  isKeyDown(code: string): boolean {
    return this.keys.has(code);
  }

  getBufferedDirection(): Direction {
    return this.bufferedDirection;
  }
}
