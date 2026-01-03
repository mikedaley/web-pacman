import { Game } from './Game';

declare global {
  interface Window {
    game: Game;
  }
}

async function main(): Promise<void> {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas not found');
  }

  const game = new Game(canvas);
  window.game = game;
  await game.init();
  game.start();
}

main().catch(console.error);
