import { ShaderProgram } from './ShaderProgram';
import { SpriteBatch } from './SpriteBatch';
import { SpriteAtlas } from './SpriteAtlas';
import { Camera } from './Camera';
import { AssetLoader } from '../core/AssetLoader';
import { CANVAS_WIDTH, CANVAS_HEIGHT, SCALE } from '../utils/constants';
import { MAZE_TILES } from '../world/MazeTiles';

export class WebGLRenderer {
  readonly canvas: HTMLCanvasElement;
  readonly gl: WebGLRenderingContext;
  readonly camera: Camera;

  private spriteShader!: ShaderProgram;
  private batch!: SpriteBatch;
  private spriteAtlas!: SpriteAtlas;
  private mazeAtlas!: SpriteAtlas;
  private textAtlas!: SpriteAtlas;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvas.width = CANVAS_WIDTH * SCALE;
    this.canvas.height = CANVAS_HEIGHT * SCALE;

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
    });

    if (!gl) {
      throw new Error('WebGL not supported');
    }

    this.gl = gl;
    this.camera = new Camera(CANVAS_WIDTH, CANVAS_HEIGHT);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  async init(assets: AssetLoader): Promise<void> {
    const vertSrc = assets.getShader('sprite.vert')!;
    const fragSrc = assets.getShader('sprite.frag')!;

    this.spriteShader = new ShaderProgram(this.gl, vertSrc, fragSrc);
    this.batch = new SpriteBatch(this.gl, this.spriteShader);

    const mazeImg = assets.getImage('maze')!;
    const textImg = assets.getImage('text')!;

    // Use maze.png for both maze tiles AND game sprites
    this.spriteAtlas = new SpriteAtlas(this.gl, mazeImg);
    this.mazeAtlas = new SpriteAtlas(this.gl, mazeImg);
    this.textAtlas = new SpriteAtlas(this.gl, textImg);

    this.setupSpriteRegions();
    this.setupMazeRegions();
    this.setupTextRegions();
  }

  private setupSpriteRegions(): void {
    const atlas = this.spriteAtlas;

    // maze.png sprite layout (sprites are in the right section starting at x=456)
    // Coordinates from reference implementation

    // Pacman sprites - each direction has: wide open, half open, closed at (488, 0)
    atlas.defineRegion('pacman-right', [
      { u: 488, v: 0, width: 16, height: 16 },  // frame 0: closed
      { u: 472, v: 0, width: 16, height: 16 },  // frame 1: half open
      { u: 456, v: 0, width: 16, height: 16 },  // frame 2: wide open
    ]);
    atlas.defineRegion('pacman-left', [
      { u: 488, v: 0, width: 16, height: 16 },  // frame 0: closed
      { u: 472, v: 16, width: 16, height: 16 }, // frame 1: half open
      { u: 456, v: 16, width: 16, height: 16 }, // frame 2: wide open
    ]);
    atlas.defineRegion('pacman-up', [
      { u: 488, v: 0, width: 16, height: 16 },  // frame 0: closed
      { u: 472, v: 32, width: 16, height: 16 }, // frame 1: half open
      { u: 456, v: 32, width: 16, height: 16 }, // frame 2: wide open
    ]);
    atlas.defineRegion('pacman-down', [
      { u: 488, v: 0, width: 16, height: 16 },  // frame 0: closed
      { u: 472, v: 48, width: 16, height: 16 }, // frame 1: half open
      { u: 456, v: 48, width: 16, height: 16 }, // frame 2: wide open
    ]);

    // Pacman death animation - 11 frames starting at (504, 0)
    atlas.defineGrid('pacman-death', 504, 0, 16, 16, 11, 11);

    // Ghost sprites - organized by color (row) and direction (columns)
    // Row y=64: Blinky (red), y=80: Pinky, y=96: Inky, y=112: Clyde
    // Each direction has 2 animation frames

    // Blinky (red ghost) - y=64
    atlas.defineGrid('ghost-blinky-right', 456, 64, 16, 16, 2, 2);
    atlas.defineGrid('ghost-blinky-left', 488, 64, 16, 16, 2, 2);
    atlas.defineGrid('ghost-blinky-up', 520, 64, 16, 16, 2, 2);
    atlas.defineGrid('ghost-blinky-down', 552, 64, 16, 16, 2, 2);

    // Pinky (pink ghost) - y=80
    atlas.defineGrid('ghost-pinky-right', 456, 80, 16, 16, 2, 2);
    atlas.defineGrid('ghost-pinky-left', 488, 80, 16, 16, 2, 2);
    atlas.defineGrid('ghost-pinky-up', 520, 80, 16, 16, 2, 2);
    atlas.defineGrid('ghost-pinky-down', 552, 80, 16, 16, 2, 2);

    // Inky (cyan ghost) - y=96
    atlas.defineGrid('ghost-inky-right', 456, 96, 16, 16, 2, 2);
    atlas.defineGrid('ghost-inky-left', 488, 96, 16, 16, 2, 2);
    atlas.defineGrid('ghost-inky-up', 520, 96, 16, 16, 2, 2);
    atlas.defineGrid('ghost-inky-down', 552, 96, 16, 16, 2, 2);

    // Clyde (orange ghost) - y=112
    atlas.defineGrid('ghost-clyde-right', 456, 112, 16, 16, 2, 2);
    atlas.defineGrid('ghost-clyde-left', 488, 112, 16, 16, 2, 2);
    atlas.defineGrid('ghost-clyde-up', 520, 112, 16, 16, 2, 2);
    atlas.defineGrid('ghost-clyde-down', 552, 112, 16, 16, 2, 2);

    // Frightened ghost (blue) - 2 frames
    atlas.defineGrid('ghost-frightened', 584, 64, 16, 16, 2, 2);
    // Frightened ghost flash (white) - 2 frames
    atlas.defineGrid('ghost-frightened-flash', 616, 64, 16, 16, 2, 2);

    // Ghost eyes - one frame each direction
    atlas.defineRegion('ghost-eyes-right', [{ u: 584, v: 80, width: 16, height: 16 }]);
    atlas.defineRegion('ghost-eyes-left', [{ u: 600, v: 80, width: 16, height: 16 }]);
    atlas.defineRegion('ghost-eyes-up', [{ u: 616, v: 80, width: 16, height: 16 }]);
    atlas.defineRegion('ghost-eyes-down', [{ u: 632, v: 80, width: 16, height: 16 }]);

    // Pellets - from the maze section
    atlas.defineRegion('pellet', [{ u: 8, v: 8, width: 8, height: 8 }]);
    atlas.defineRegion('power-pellet', [{ u: 8, v: 24, width: 8, height: 8 }]);

    // Fruits - in the sprite section at y=48
    atlas.defineRegion('fruit-cherry', [{ u: 488, v: 48, width: 16, height: 16 }]);
    atlas.defineRegion('fruit-strawberry', [{ u: 504, v: 48, width: 16, height: 16 }]);
    atlas.defineRegion('fruit-orange', [{ u: 520, v: 48, width: 16, height: 16 }]);
    atlas.defineRegion('fruit-apple', [{ u: 536, v: 48, width: 16, height: 16 }]);
    atlas.defineRegion('fruit-grapes', [{ u: 552, v: 48, width: 16, height: 16 }]);
    atlas.defineRegion('fruit-galaxian', [{ u: 568, v: 48, width: 16, height: 16 }]);
    atlas.defineRegion('fruit-bell', [{ u: 584, v: 48, width: 16, height: 16 }]);
    atlas.defineRegion('fruit-key', [{ u: 600, v: 48, width: 16, height: 16 }]);

    // Fruits array for level progression
    atlas.defineRegion('fruits', [
      { u: 488, v: 48, width: 16, height: 16 },  // cherry
      { u: 504, v: 48, width: 16, height: 16 },  // strawberry
      { u: 520, v: 48, width: 16, height: 16 },  // orange
      { u: 536, v: 48, width: 16, height: 16 },  // apple
      { u: 552, v: 48, width: 16, height: 16 },  // grapes
      { u: 568, v: 48, width: 16, height: 16 },  // galaxian
      { u: 584, v: 48, width: 16, height: 16 },  // bell
      { u: 600, v: 48, width: 16, height: 16 },  // key
    ]);
  }

  private setupMazeRegions(): void {
    const atlas = this.mazeAtlas;

    // Define the entire empty maze as a single region
    // The empty maze (without pellets) is in the middle section of maze.png
    // starting at x=228, full height of 248 pixels, width of 224 pixels (28 tiles * 8px)
    atlas.defineRegion('maze-full', [{ u: 228, v: 0, width: 224, height: 248 }]);

    // Also define individual tiles for any future use
    for (const tile of MAZE_TILES) {
      atlas.defineRegion(`maze-tile-${tile.index}`, [
        { u: tile.u, v: tile.v, width: 8, height: 8 },
      ]);
    }

    // Empty black tile for replacing eaten pellets
    atlas.defineRegion('empty-tile', [{ u: 252, v: 24, width: 8, height: 8 }]);
  }

  private setupTextRegions(): void {
    const atlas = this.textAtlas;

    // text.png is 128x224 with 8x8 character tiles
    // 16 chars per row, layout:
    // Row 0: A B C D E F G H I J K L M N O P
    // Row 1: Q R S T U V W X Y Z ! " # $ % &
    // Row 2: 0 1 2 3 4 5 6 7 8 9 / - * . : +
    // Row 3: (special characters)
    const charWidth = 8;
    const charHeight = 8;

    // Define the actual character layout from text.png
    // Row 0: ABCDEFGHIJKLMNO (15 chars, position 15 is empty/special)
    // Row 1: PQRSTUVWXYZ then symbols
    // Row 2: 0123456789 then symbols
    // Row 3: special characters
    const charMap: Record<string, [number, number]> = {
      // Row 0: Letters A-O (positions 0-14)
      'A': [0, 0], 'B': [1, 0], 'C': [2, 0], 'D': [3, 0],
      'E': [4, 0], 'F': [5, 0], 'G': [6, 0], 'H': [7, 0],
      'I': [8, 0], 'J': [9, 0], 'K': [10, 0], 'L': [11, 0],
      'M': [12, 0], 'N': [13, 0], 'O': [14, 0],

      // Row 1: Letters P-Z (positions 0-10) then symbols
      'P': [0, 1], 'Q': [1, 1], 'R': [2, 1], 'S': [3, 1],
      'T': [4, 1], 'U': [5, 1], 'V': [6, 1], 'W': [7, 1],
      'X': [8, 1], 'Y': [9, 1], 'Z': [10, 1],
      '/': [11, 1], '©': [12, 1],

      // Row 2: Numbers 0-9 (positions 0-9) then symbols
      '0': [0, 2], '1': [1, 2], '2': [2, 2], '3': [3, 2],
      '4': [4, 2], '5': [5, 2], '6': [6, 2], '7': [7, 2],
      '8': [8, 2], '9': [9, 2],
      '-': [11, 2], '"': [12, 2], '.': [13, 2],

      // Space - use empty black area
      ' ': [15, 0],
    };

    // Define regions for each character
    for (const [char, [col, row]] of Object.entries(charMap)) {
      atlas.defineRegion(`char-${char}`, [
        {
          u: col * charWidth,
          v: row * charHeight,
          width: charWidth,
          height: charHeight,
        },
      ]);
    }

    // Also define lowercase as uppercase (game typically uses uppercase)
    for (let i = 0; i < 26; i++) {
      const upper = String.fromCharCode(65 + i); // A-Z
      const lower = String.fromCharCode(97 + i); // a-z
      const pos = charMap[upper];
      if (pos) {
        atlas.defineRegion(`char-${lower}`, [
          {
            u: pos[0] * charWidth,
            v: pos[1] * charHeight,
            width: charWidth,
            height: charHeight,
          },
        ]);
      }
    }
  }

  clear(): void {
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  beginSprites(): void {
    this.spriteShader.use();
    this.spriteShader.setUniformMatrix4fv('u_projection', this.getScaledProjection());
    this.batch.setAtlas(this.spriteAtlas);
    this.batch.begin();
  }

  beginMaze(): void {
    this.spriteShader.use();
    this.spriteShader.setUniformMatrix4fv('u_projection', this.getScaledProjection());
    this.batch.setAtlas(this.mazeAtlas);
    this.batch.begin();
  }

  switchToSpriteAtlas(): void {
    this.batch.end();
    this.batch.setAtlas(this.spriteAtlas);
    this.batch.begin();
  }

  switchToMazeAtlas(): void {
    this.batch.end();
    this.batch.setAtlas(this.mazeAtlas);
    this.batch.begin();
  }

  beginText(): void {
    this.spriteShader.use();
    this.spriteShader.setUniformMatrix4fv('u_projection', this.getScaledProjection());
    this.batch.setAtlas(this.textAtlas);
    this.batch.begin();
  }

  private getScaledProjection(): Float32Array {
    return this.camera.getProjection();
  }

  endBatch(): void {
    this.batch.end();
  }

  getBatch(): SpriteBatch {
    return this.batch;
  }

  getSpriteAtlas(): SpriteAtlas {
    return this.spriteAtlas;
  }

  getMazeAtlas(): SpriteAtlas {
    return this.mazeAtlas;
  }

  getTextAtlas(): SpriteAtlas {
    return this.textAtlas;
  }
}
