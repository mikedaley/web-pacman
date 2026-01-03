import { State } from './StateMachine';
import { WebGLRenderer } from '../renderer/WebGLRenderer';
import { InputManager } from '../core/InputManager';
import { TextRenderer } from '../ui/TextRenderer';
import { HighScoreManager } from '../core/HighScoreManager';
import { CANVAS_WIDTH } from '../utils/constants';

// Helper to center text (8px per character)
function centerX(text: string): number {
  return (CANVAS_WIDTH - text.length * 8) / 2;
}

interface GhostIntro {
  nickname: string;
  name: string;
  color: { r: number; g: number; b: number };
  spriteRegion: string;
}

const GHOST_INTROS: GhostIntro[] = [
  {
    nickname: 'SHADOW',
    name: 'BLINKY',
    color: { r: 1, g: 0, b: 0 },
    spriteRegion: 'ghost-blinky-right',
  },
  {
    nickname: 'SPEEDY',
    name: 'PINKY',
    color: { r: 1, g: 0.72, b: 1 },
    spriteRegion: 'ghost-pinky-right',
  },
  {
    nickname: 'BASHFUL',
    name: 'INKY',
    color: { r: 0, g: 1, b: 1 },
    spriteRegion: 'ghost-inky-right',
  },
  {
    nickname: 'POKEY',
    name: 'CLYDE',
    color: { r: 1, g: 0.72, b: 0.32 },
    spriteRegion: 'ghost-clyde-right',
  },
];

type AttractPhase = 'title' | 'ghostIntro' | 'chase' | 'points';

export class MenuState implements State {
  private renderer: WebGLRenderer;
  private input: InputManager;
  private textRenderer: TextRenderer;
  private highScoreManager: HighScoreManager;
  private onStart: () => void;

  // Timing
  private phaseTimer = 0;
  private blinkTimer = 0;
  private showPress = true;
  private animTimer = 0;

  // Attract mode state
  private phase: AttractPhase = 'title';
  private ghostIntroIndex = 0;
  private ghostIntroStep = 0; // 0=dash, 1=nickname, 2=name

  // Chase demo state
  private chaseX = 0;
  private chasePacmanFrame = 0;
  private chaseGhostFrame = 0;
  private chasePhase: 'chase' | 'turn' | 'hunt' = 'chase';
  private powerPelletVisible = true;
  private ghostsEaten = 0;

  constructor(
    renderer: WebGLRenderer,
    input: InputManager,
    textRenderer: TextRenderer,
    onStart: () => void
  ) {
    this.renderer = renderer;
    this.input = input;
    this.textRenderer = textRenderer;
    this.highScoreManager = new HighScoreManager();
    this.onStart = onStart;
  }

  enter(): void {
    this.phase = 'title';
    this.phaseTimer = 0;
    this.blinkTimer = 0;
    this.showPress = true;
    this.animTimer = 0;
    this.ghostIntroIndex = 0;
    this.ghostIntroStep = 0;
    this.resetChase();
  }

  private resetChase(): void {
    this.chaseX = CANVAS_WIDTH + 16;
    this.chasePacmanFrame = 0;
    this.chaseGhostFrame = 0;
    this.chasePhase = 'chase';
    this.powerPelletVisible = true;
    this.ghostsEaten = 0;
  }

  update(dt: number): void {
    // Blink "PRESS SPACE" text
    this.blinkTimer += dt;
    if (this.blinkTimer >= 400) {
      this.blinkTimer = 0;
      this.showPress = !this.showPress;
    }

    // Animation timer for sprite frames
    this.animTimer += dt;
    if (this.animTimer >= 100) {
      this.animTimer = 0;
      this.chasePacmanFrame = (this.chasePacmanFrame + 1) % 3;
      this.chaseGhostFrame = (this.chaseGhostFrame + 1) % 2;
    }

    this.phaseTimer += dt;

    switch (this.phase) {
      case 'title':
        if (this.phaseTimer >= 3000) {
          this.phase = 'ghostIntro';
          this.phaseTimer = 0;
          this.ghostIntroIndex = 0;
          this.ghostIntroStep = 0;
        }
        break;

      case 'ghostIntro':
        this.updateGhostIntro();
        break;

      case 'chase':
        this.updateChase(dt);
        break;

      case 'points':
        if (this.phaseTimer >= 4000) {
          this.phase = 'title';
          this.phaseTimer = 0;
        }
        break;
    }
  }

  private updateGhostIntro(): void {
    const stepDuration = 500;

    if (this.phaseTimer >= stepDuration) {
      this.phaseTimer = 0;
      this.ghostIntroStep++;

      if (this.ghostIntroStep > 2) {
        this.ghostIntroStep = 0;
        this.ghostIntroIndex++;

        if (this.ghostIntroIndex >= GHOST_INTROS.length) {
          this.phase = 'chase';
          this.phaseTimer = 0;
          this.resetChase();
        }
      }
    }
  }

  private updateChase(dt: number): void {
    const speed = 0.08 * dt;
    const pelletX = 32;

    if (this.chasePhase === 'chase') {
      this.chaseX -= speed;

      // Pac-Man is at chaseX - 80, pellet is at pelletX (32)
      // Eat pellet when Pac-Man reaches it
      const pacmanX = this.chaseX - 80;
      if (pacmanX <= pelletX && this.powerPelletVisible) {
        this.powerPelletVisible = false;
        this.chasePhase = 'turn';
        this.phaseTimer = 0;
      }
    } else if (this.chasePhase === 'turn') {
      // Brief pause then reverse
      if (this.phaseTimer >= 200) {
        this.chasePhase = 'hunt';
      }
    } else if (this.chasePhase === 'hunt') {
      this.chaseX += speed;

      // Pac-Man eats ghosts one by one
      const pacmanX = this.chaseX - 80;
      for (let i = this.ghostsEaten; i < 4; i++) {
        const ghostX = this.chaseX + i * 18;
        if (pacmanX >= ghostX - 8) {
          this.ghostsEaten++;
        }
      }

      if (this.chaseX > CANVAS_WIDTH + 100) {
        this.phase = 'points';
        this.phaseTimer = 0;
      }
    }
  }

  handleInput(): void {
    if (this.input.isKeyDown('Space') || this.input.isKeyDown('Enter')) {
      this.onStart();
    }
  }

  render(): void {
    this.renderer.clear();

    switch (this.phase) {
      case 'title':
        this.renderTitle();
        break;
      case 'ghostIntro':
        this.renderGhostIntro();
        break;
      case 'chase':
        this.renderChase();
        break;
      case 'points':
        this.renderPoints();
        break;
    }

    this.renderer.endBatch();
  }

  private renderTitle(): void {
    const batch = this.renderer.getBatch();
    const atlas = this.renderer.getSpriteAtlas();

    // Start with text
    this.renderer.beginText();

    // High score at top
    this.textRenderer.draw('HIGH SCORE', centerX('HIGH SCORE'), 0);
    const highScore = this.highScoreManager.getHighScore();
    if (highScore > 0) {
      const scoreStr = highScore.toString().padStart(6, ' ');
      this.textRenderer.draw(scoreStr, centerX(scoreStr), 8);
    }

    // Character / Nickname header
    this.textRenderer.draw('CHARACTER / NICKNAME', centerX('CHARACTER / NICKNAME'), 48);

    // Draw all ghost intros
    for (let i = 0; i < GHOST_INTROS.length; i++) {
      const ghost = GHOST_INTROS[i]!;
      const y = 72 + i * 24;

      // Switch to sprites for ghost
      this.renderer.switchToSpriteAtlas();
      const frame = atlas.getFrame(ghost.spriteRegion, this.chaseGhostFrame);
      if (frame) {
        batch.draw(frame, 32, y, 16, 16);
      }

      // Switch back to text
      this.renderer.endBatch();
      this.renderer.beginText();

      // Dash, nickname, name
      this.textRenderer.draw('-', 56, y + 4, ghost.color.r, ghost.color.g, ghost.color.b);
      this.textRenderer.draw(
        ghost.nickname,
        72,
        y + 4,
        ghost.color.r,
        ghost.color.g,
        ghost.color.b
      );
      this.textRenderer.draw(
        `"${ghost.name}"`,
        152,
        y + 4,
        ghost.color.r,
        ghost.color.g,
        ghost.color.b
      );
    }

    // Point values
    this.renderPointValues(180);

    // Bottom text
    if (this.showPress) {
      this.textRenderer.draw('PUSH SPACE', centerX('PUSH SPACE'), 232);
    }
    this.textRenderer.draw('1 PLAYER ONLY', centerX('1 PLAYER ONLY'), 248);
  }

  private renderGhostIntro(): void {
    const batch = this.renderer.getBatch();
    const atlas = this.renderer.getSpriteAtlas();

    this.renderer.beginText();

    // High score
    this.textRenderer.draw('HIGH SCORE', centerX('HIGH SCORE'), 0);
    const highScore = this.highScoreManager.getHighScore();
    if (highScore > 0) {
      const scoreStr = highScore.toString().padStart(6, ' ');
      this.textRenderer.draw(scoreStr, centerX(scoreStr), 8);
    }

    this.textRenderer.draw('CHARACTER / NICKNAME', centerX('CHARACTER / NICKNAME'), 48);

    // Draw ghosts up to current index
    for (let i = 0; i <= this.ghostIntroIndex && i < GHOST_INTROS.length; i++) {
      const ghost = GHOST_INTROS[i]!;
      const y = 72 + i * 24;
      const isCurrent = i === this.ghostIntroIndex;

      // Ghost sprite
      this.renderer.switchToSpriteAtlas();
      const frame = atlas.getFrame(ghost.spriteRegion, this.chaseGhostFrame);
      if (frame) {
        batch.draw(frame, 32, y, 16, 16);
      }

      this.renderer.endBatch();
      this.renderer.beginText();

      if (isCurrent) {
        // Animate current ghost's text
        if (this.ghostIntroStep >= 0) {
          this.textRenderer.draw('-', 56, y + 4, ghost.color.r, ghost.color.g, ghost.color.b);
        }
        if (this.ghostIntroStep >= 1) {
          this.textRenderer.draw(
            ghost.nickname,
            72,
            y + 4,
            ghost.color.r,
            ghost.color.g,
            ghost.color.b
          );
        }
        if (this.ghostIntroStep >= 2) {
          this.textRenderer.draw(
            `"${ghost.name}"`,
            152,
            y + 4,
            ghost.color.r,
            ghost.color.g,
            ghost.color.b
          );
        }
      } else {
        // Past ghosts show full text
        this.textRenderer.draw('-', 56, y + 4, ghost.color.r, ghost.color.g, ghost.color.b);
        this.textRenderer.draw(
          ghost.nickname,
          72,
          y + 4,
          ghost.color.r,
          ghost.color.g,
          ghost.color.b
        );
        this.textRenderer.draw(
          `"${ghost.name}"`,
          152,
          y + 4,
          ghost.color.r,
          ghost.color.g,
          ghost.color.b
        );
      }
    }

    // Bottom text
    if (this.showPress) {
      this.textRenderer.draw('PUSH SPACE', centerX('PUSH SPACE'), 232);
    }
    this.textRenderer.draw('1 PLAYER ONLY', centerX('1 PLAYER ONLY'), 248);
  }

  private renderChase(): void {
    const batch = this.renderer.getBatch();
    const atlas = this.renderer.getSpriteAtlas();

    // Start with text for header
    this.renderer.beginText();

    this.textRenderer.draw('HIGH SCORE', centerX('HIGH SCORE'), 0);
    const highScore = this.highScoreManager.getHighScore();
    if (highScore > 0) {
      const scoreStr = highScore.toString().padStart(6, ' ');
      this.textRenderer.draw(scoreStr, centerX(scoreStr), 8);
    }

    // Switch to sprites for chase animation
    this.renderer.switchToSpriteAtlas();

    const y = 140;

    // Power pellet
    if (this.powerPelletVisible) {
      const pelletFrame = atlas.getFrame('power-pellet', 0);
      if (pelletFrame) {
        batch.draw(pelletFrame, 32, y + 4, 8, 8);
      }
    }

    if (this.chasePhase === 'chase') {
      // Pac-Man being chased (facing left)
      const pacFrame = atlas.getFrame('pacman-left', this.chasePacmanFrame);
      if (pacFrame) {
        batch.draw(pacFrame, this.chaseX - 80, y, 16, 16);
      }

      // Ghosts chasing
      for (let i = 0; i < 4; i++) {
        const ghost = GHOST_INTROS[i]!;
        const ghostFrame = atlas.getFrame(
          ghost.spriteRegion.replace('-right', '-left'),
          this.chaseGhostFrame
        );
        if (ghostFrame) {
          batch.draw(ghostFrame, this.chaseX + i * 18, y, 16, 16);
        }
      }
    } else {
      // Pac-Man hunting (facing right)
      const pacFrame = atlas.getFrame('pacman-right', this.chasePacmanFrame);
      if (pacFrame) {
        batch.draw(pacFrame, this.chaseX - 80, y, 16, 16);
      }

      // Frightened/eaten ghosts
      for (let i = 0; i < 4; i++) {
        if (i < this.ghostsEaten) continue; // Ghost eaten

        const ghostFrame = atlas.getFrame('ghost-frightened', this.chaseGhostFrame);
        if (ghostFrame) {
          batch.draw(ghostFrame, this.chaseX + i * 18, y, 16, 16);
        }
      }
    }

    // Switch back to text for bottom
    this.renderer.endBatch();
    this.renderer.beginText();

    if (this.showPress) {
      this.textRenderer.draw('PUSH SPACE', centerX('PUSH SPACE'), 232);
    }
    this.textRenderer.draw('1 PLAYER ONLY', centerX('1 PLAYER ONLY'), 248);
  }

  private renderPoints(): void {
    this.renderer.beginText();

    // High score
    this.textRenderer.draw('HIGH SCORE', centerX('HIGH SCORE'), 0);
    const highScore = this.highScoreManager.getHighScore();
    if (highScore > 0) {
      const scoreStr = highScore.toString().padStart(6, ' ');
      this.textRenderer.draw(scoreStr, centerX(scoreStr), 8);
    }

    this.renderPointValues(80);

    // Bottom text
    if (this.showPress) {
      this.textRenderer.draw('PUSH SPACE', centerX('PUSH SPACE'), 232);
    }
    this.textRenderer.draw('1 PLAYER ONLY', centerX('1 PLAYER ONLY'), 248);
  }

  private renderPointValues(startY: number): void {
    const batch = this.renderer.getBatch();
    const atlas = this.renderer.getSpriteAtlas();

    // Center the pellet + text combo
    // "o 10 PTS" - pellet(8) + space(8) + "10 PTS"(48) = 64px total
    const comboWidth = 8 + 8 + 48; // pellet + gap + text
    const comboX = (CANVAS_WIDTH - comboWidth) / 2;

    // Switch to sprites for pellets
    this.renderer.switchToSpriteAtlas();

    // Pellet
    const pelletFrame = atlas.getFrame('pellet', 0);
    if (pelletFrame) {
      batch.draw(pelletFrame, comboX, startY, 8, 8);
    }

    // Power pellet
    const powerFrame = atlas.getFrame('power-pellet', 0);
    if (powerFrame) {
      batch.draw(powerFrame, comboX, startY + 16, 8, 8);
    }

    // Switch back to text
    this.renderer.endBatch();
    this.renderer.beginText();

    this.textRenderer.draw('10 PTS', comboX + 16, startY);
    this.textRenderer.draw('50 PTS', comboX + 16, startY + 16);

    // Copyright
    const copyright = '@ 1980 MIDWAY MFG.CO.';
    this.textRenderer.draw(copyright, centerX(copyright), startY + 40);
  }
}
