import { Direction } from '../utils/types';

export class InputManager {
  private keys = new Set<string>();
  private bufferedDirection: Direction = 'none';
  private currentDirection: Direction = 'none';

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

  consumeBufferedDirection(): Direction {
    const dir = this.bufferedDirection;
    this.bufferedDirection = 'none';
    return dir;
  }

  setCurrentDirection(dir: Direction): void {
    this.currentDirection = dir;
  }

  getCurrentDirection(): Direction {
    return this.currentDirection;
  }

  clearBuffer(): void {
    this.bufferedDirection = 'none';
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown.bind(this));
    window.removeEventListener('keyup', this.onKeyUp.bind(this));
  }
}
