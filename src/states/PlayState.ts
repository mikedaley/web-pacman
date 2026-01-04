import { State } from './StateMachine';
import { Entity } from '../ecs/Entity';
import { PacmanComponent, SpriteComponent, AnimationComponent } from '../ecs/Component';
import { WebGLRenderer } from '../renderer/WebGLRenderer';
import { InputManager } from '../core/InputManager';
import { Maze } from '../world/Maze';
import { MovementSystem } from '../systems/MovementSystem';
import { GhostAISystem } from '../systems/GhostAISystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { AnimationSystem } from '../systems/AnimationSystem';
import { RenderSystem } from '../systems/RenderSystem';
import { HUD } from '../ui/HUD';
import { createPacman, resetPacman } from '../entities/Pacman';
import { createGhost, resetGhost } from '../entities/Ghost';

import { HighScoreManager } from '../core/HighScoreManager';
import { LIVES_START, EXTRA_LIFE_SCORE } from '../utils/constants';
import { GhostName } from '../utils/types';

export class PlayState implements State {
  private renderer: WebGLRenderer;
  private input: InputManager;
  private maze: Maze;
  private hud: HUD;

  private movementSystem: MovementSystem;
  private ghostAISystem: GhostAISystem;
  private collisionSystem: CollisionSystem;
  private animationSystem: AnimationSystem;
  private renderSystem: RenderSystem;

  private pacman: Entity;
  private ghosts: Entity[] = [];
  private blinky!: Entity;

  private score = 0;
  private lives = LIVES_START;
  private level = 1;
  private extraLifeAwarded = false;
  private highScoreManager = new HighScoreManager();

  private readyTimer = 0;
  private deathTimer = 0;
  private levelCompleteTimer = 0;
  private levelFlashTimer = 0;
  private levelFlashState = false;
  private ghostEatenTimer = 0;
  private ghostEatenScore = 0;
  private ghostEatenX = 0;
  private ghostEatenY = 0;
  private ghostEatenEntity: Entity | null = null;
  private gameState: 'ready' | 'playing' | 'dying' | 'levelComplete' | 'gameOver' | 'ghostEaten' =
    'ready';

  private onGameOver: () => void;
  private onMenu: () => void;

  constructor(
    renderer: WebGLRenderer,
    input: InputManager,
    maze: Maze,
    hud: HUD,
    onGameOver: () => void,
    onMenu: () => void
  ) {
    this.renderer = renderer;
    this.input = input;
    this.maze = maze;
    this.hud = hud;
    this.onGameOver = onGameOver;
    this.onMenu = onMenu;

    this.movementSystem = new MovementSystem(maze);
    this.ghostAISystem = new GhostAISystem(maze);
    this.collisionSystem = new CollisionSystem(maze);
    this.animationSystem = new AnimationSystem();
    this.renderSystem = new RenderSystem(renderer);

    this.pacman = createPacman(this.level);
    this.createGhosts();
  }

  private createGhosts(): void {
    const names: GhostName[] = ['blinky', 'pinky', 'inky', 'clyde'];
    this.ghosts = names.map((name) => createGhost(name, this.level));
    this.blinky = this.ghosts[0]!;
  }

  private addScore(points: number): void {
    this.score += points;
    this.highScoreManager.updateHighScore(this.score);

    if (!this.extraLifeAwarded && this.score >= EXTRA_LIFE_SCORE) {
      this.lives++;
      this.extraLifeAwarded = true;
    }
  }

  enter(): void {
    this.score = 0;
    this.lives = LIVES_START;
    this.level = 1;
    this.extraLifeAwarded = false;
    this.gameState = 'ready';
    this.readyTimer = 2000;

    this.maze.reset();
    this.resetPositions();
    this.ghostAISystem.reset(this.level);
    this.animationSystem.reset();
  }

  private resetPositions(): void {
    resetPacman(this.pacman, this.level);
    this.ghosts.forEach((g) => resetGhost(g, this.level));
  }

  handleInput(): void {
    if (this.input.isKeyDown('Escape')) {
      this.onMenu();
      return;
    }

    if (this.gameState !== 'playing') return;

    const buffered = this.input.getBufferedDirection();
    if (buffered !== 'none') {
      const pac = this.pacman.get<PacmanComponent>('pacman');
      if (pac) {
        pac.nextDirection = buffered;
      }
    }
  }

  update(dt: number): void {
    switch (this.gameState) {
      case 'ready':
        this.updateReady(dt);
        break;
      case 'playing':
        this.updatePlaying(dt);
        break;
      case 'dying':
        this.updateDying(dt);
        break;
      case 'levelComplete':
        this.updateLevelComplete(dt);
        break;
      case 'ghostEaten':
        this.updateGhostEaten(dt);
        break;
      case 'gameOver':
        break;
    }
  }

  private updateReady(dt: number): void {
    this.readyTimer -= dt;
    if (this.readyTimer <= 0) {
      this.gameState = 'playing';
    }
  }

  private updatePlaying(dt: number): void {
    this.movementSystem.updatePacman(this.pacman, dt);
    this.ghostAISystem.update(this.ghosts, this.pacman, this.blinky, dt);

    const pelletResult = this.collisionSystem.checkPelletCollision(this.pacman);
    if (pelletResult) {
      this.addScore(pelletResult.score);
      if (pelletResult.type === 'pellet') {
        this.ghostAISystem.onPelletEaten(this.ghosts);
      } else if (pelletResult.type === 'power') {
        this.ghostAISystem.onPowerPelletEaten(this.ghosts);
        this.collisionSystem.resetPowerCounter();
      }
    }

    if (this.maze.getPelletsRemaining() === 0) {
      this.gameState = 'levelComplete';
      this.levelCompleteTimer = 2000;
      return;
    }

    const collisionResult = this.collisionSystem.checkGhostCollision(
      this.pacman,
      this.ghosts,
      this.ghostAISystem
    );
    if (collisionResult) {
      if (collisionResult.eaten) {
        // Ghost was eaten - pause and show score
        this.addScore(collisionResult.score);
        this.ghostEatenScore = collisionResult.score;
        this.ghostEatenX = collisionResult.x;
        this.ghostEatenY = collisionResult.y;
        this.ghostEatenEntity = collisionResult.ghost;
        // Hide the eaten ghost during score display
        const sprite = collisionResult.ghost.get<SpriteComponent>('sprite');
        if (sprite) sprite.visible = false;
        this.ghostEatenTimer = 1000;
        this.gameState = 'ghostEaten';
        return;
      } else if (this.collisionSystem.isDeadlyCollision(collisionResult.ghost)) {
        this.startDeath();
      }
    }

    this.animationSystem.updatePacmanSprite(this.pacman);
    this.animationSystem.update([this.pacman, ...this.ghosts], dt);
    this.ghosts.forEach((g) =>
      this.animationSystem.updateGhostSprite(g, this.ghostAISystem, this.level)
    );
    this.animationSystem.updatePowerBlink(dt);
  }

  private startDeath(): void {
    this.gameState = 'dying';
    this.deathTimer = 1500;

    const pac = this.pacman.get<PacmanComponent>('pacman');
    if (pac) {
      pac.dying = true;
      pac.currentDirection = 'none';
    }

    const sprite = this.pacman.get<SpriteComponent>('sprite');
    if (sprite) {
      sprite.region = 'pacman-death';
      sprite.frameIndex = 0;
    }

    const anim = this.pacman.get<AnimationComponent>('animation');
    if (anim) {
      anim.frames = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      anim.frameDuration = 120;
      anim.elapsed = 0;
      anim.loop = false;
      anim.playing = true;
    }

    this.ghosts.forEach((g) => {
      const s = g.get<SpriteComponent>('sprite');
      if (s) s.visible = false;
    });
  }

  private updateDying(dt: number): void {
    this.deathTimer -= dt;
    this.animationSystem.update([this.pacman], dt);

    if (this.deathTimer <= 0) {
      this.lives--;
      this.ghostAISystem.onPacmanDeath();

      if (this.lives <= 0) {
        this.gameState = 'gameOver';
        this.onGameOver();
      } else {
        this.resetPositions();
        this.gameState = 'ready';
        this.readyTimer = 2000;

        this.ghosts.forEach((g) => {
          const s = g.get<SpriteComponent>('sprite');
          if (s) s.visible = true;
        });
      }
    }
  }

  private updateGhostEaten(dt: number): void {
    this.ghostEatenTimer -= dt;
    if (this.ghostEatenTimer <= 0) {
      // Make the eaten ghost visible again (now shows as eyes)
      if (this.ghostEatenEntity) {
        const sprite = this.ghostEatenEntity.get<SpriteComponent>('sprite');
        if (sprite) sprite.visible = true;
        this.ghostEatenEntity = null;
      }
      this.gameState = 'playing';
    }
  }

  private updateLevelComplete(dt: number): void {
    this.levelCompleteTimer -= dt;

    // Flash the maze white
    this.levelFlashTimer += dt;
    if (this.levelFlashTimer >= 150) {
      this.levelFlashTimer = 0;
      this.levelFlashState = !this.levelFlashState;
    }

    if (this.levelCompleteTimer <= 0) {
      this.level++;
      this.maze.reset();
      this.resetPositions();
      this.ghostAISystem.reset(this.level);
      this.animationSystem.reset();
      this.levelFlashState = false;
      this.levelFlashTimer = 0;
      this.gameState = 'ready';
      this.readyTimer = 2000;
    }
  }

  render(): void {
    const powerBlink = this.animationSystem.getPowerBlinkState();
    const mazeFlash = this.gameState === 'levelComplete' && this.levelFlashState;

    const visibleEntities =
      this.gameState === 'ready'
        ? []
        : this.gameState === 'dying'
          ? [this.pacman]
          : this.gameState === 'levelComplete'
            ? [this.pacman]
            : this.gameState === 'ghostEaten'
              ? this.ghosts // Hide Pac-Man, show ghosts (eaten one shows score via renderSystem)
              : [this.pacman, ...this.ghosts];

    // Pass ghost eaten info to render system
    const ghostEatenInfo =
      this.gameState === 'ghostEaten'
        ? { score: this.ghostEatenScore, x: this.ghostEatenX, y: this.ghostEatenY }
        : null;

    this.renderSystem.render(this.maze, visibleEntities, powerBlink, mazeFlash, ghostEatenInfo);

    this.renderer.beginText();
    this.hud.renderText(this.score, this.highScoreManager.getHighScore());

    if (this.gameState === 'ready') {
      this.hud.drawReady();
    }

    // Switch to sprite atlas for lives and fruit icons
    this.renderer.switchToSpriteAtlas();
    this.hud.renderSprites(this.lives, this.level);

    this.renderer.endBatch();
  }

  getScore(): number {
    return this.score;
  }
}
