import { Engine } from './core/Engine';
import { InputManager } from './core/InputManager';
import { AssetLoader } from './core/AssetLoader';
import { AudioManager } from './core/AudioManager';
import { WebGLRenderer } from './renderer/WebGLRenderer';
import { Maze, LevelData } from './world/Maze';
import { StateMachine } from './states/StateMachine';
import { MenuState } from './states/MenuState';
import { PlayState } from './states/PlayState';
import { GameOverState } from './states/GameOverState';
import { TextRenderer } from './ui/TextRenderer';
import { HUD } from './ui/HUD';
import level1Data from './world/levels/level1.json';

export class Game {
  private engine: Engine;
  private input: InputManager;
  private assets: AssetLoader;
  private audio: AudioManager;
  private renderer!: WebGLRenderer;
  private stateMachine: StateMachine;
  private maze!: Maze;
  private textRenderer!: TextRenderer;
  private hud!: HUD;
  private playState!: PlayState;
  private gameOverState!: GameOverState;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine();
    this.input = new InputManager();
    this.assets = new AssetLoader();
    this.audio = new AudioManager(this.assets);
    this.renderer = new WebGLRenderer(canvas);
    this.stateMachine = new StateMachine();
  }

  async init(): Promise<void> {
    await this.assets.loadAll({
      images: [
        { name: 'maze', url: '/sprites/maze.png' },
        { name: 'text', url: '/sprites/text.png' },
      ],
      shaders: [
        { name: 'sprite.vert', url: '/shaders/sprite.vert' },
        { name: 'sprite.frag', url: '/shaders/sprite.frag' },
      ],
    });

    await this.renderer.init(this.assets);
    this.audio.init();

    this.maze = new Maze(level1Data as LevelData);

    this.textRenderer = new TextRenderer(this.renderer.getBatch(), this.renderer.getTextAtlas());

    this.hud = new HUD(this.textRenderer, this.renderer.getBatch(), this.renderer.getSpriteAtlas());

    this.setupStates();

    this.engine.onUpdate(this.update.bind(this));
    this.engine.onRender(this.render.bind(this));
  }

  private setupStates(): void {
    const menuState = new MenuState(this.renderer, this.input, this.textRenderer, () =>
      this.stateMachine.change('play')
    );

    this.playState = new PlayState(
      this.renderer,
      this.input,
      this.maze,
      this.hud,
      () => {
        this.gameOverState.setScore(this.playState.getScore());
        this.stateMachine.change('gameOver');
      },
      () => {
        this.stateMachine.change('menu');
      }
    );

    this.gameOverState = new GameOverState(this.renderer, this.input, this.textRenderer, () =>
      this.stateMachine.change('play')
    );

    this.stateMachine.add('menu', menuState);
    this.stateMachine.add('play', this.playState);
    this.stateMachine.add('gameOver', this.gameOverState);

    this.stateMachine.change('menu');
  }

  private update(dt: number): void {
    this.stateMachine.update(dt);
  }

  private render(): void {
    this.stateMachine.render();
  }

  start(): void {
    this.engine.start();
  }
}
