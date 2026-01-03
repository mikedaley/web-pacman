import { ShaderProgram } from './ShaderProgram';
import { SpriteAtlas } from './SpriteAtlas';
import { SpriteFrame } from '../utils/types';

const MAX_SPRITES = 2048;
const FLOATS_PER_VERTEX = 8; // x, y, u, v, r, g, b, a
const VERTICES_PER_SPRITE = 6;
const FLOATS_PER_SPRITE = FLOATS_PER_VERTEX * VERTICES_PER_SPRITE;

export class SpriteBatch {
  private gl: WebGLRenderingContext;
  private shader: ShaderProgram;
  private atlas: SpriteAtlas | null = null;

  private vertexBuffer: WebGLBuffer;
  private vertexData: Float32Array;
  private spriteCount = 0;
  private drawing = false;

  constructor(gl: WebGLRenderingContext, shader: ShaderProgram) {
    this.gl = gl;
    this.shader = shader;

    this.vertexData = new Float32Array(MAX_SPRITES * FLOATS_PER_SPRITE);
    this.vertexBuffer = gl.createBuffer()!;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertexData.byteLength, gl.DYNAMIC_DRAW);
  }

  setAtlas(atlas: SpriteAtlas): void {
    this.atlas = atlas;
  }

  begin(): void {
    if (this.drawing) return;
    this.drawing = true;
    this.spriteCount = 0;
  }

  draw(
    frame: SpriteFrame,
    x: number,
    y: number,
    width?: number,
    height?: number,
    r = 1,
    g = 1,
    b = 1,
    a = 1,
    flipX = false,
    flipY = false
  ): void {
    if (!this.drawing || !this.atlas) return;
    if (this.spriteCount >= MAX_SPRITES) {
      this.flush();
    }

    const w = width ?? frame.width;
    const h = height ?? frame.height;
    const uv = this.atlas.getUV(frame);

    let u0 = uv.u0;
    let u1 = uv.u1;
    let v0 = uv.v0;
    let v1 = uv.v1;

    if (flipX) {
      const temp = u0;
      u0 = u1;
      u1 = temp;
    }
    if (flipY) {
      const temp = v0;
      v0 = v1;
      v1 = temp;
    }

    const x1 = x;
    const y1 = y;
    const x2 = x + w;
    const y2 = y + h;

    const i = this.spriteCount * FLOATS_PER_SPRITE;

    // triangle 1
    this.vertexData[i + 0] = x1;
    this.vertexData[i + 1] = y1;
    this.vertexData[i + 2] = u0;
    this.vertexData[i + 3] = v0;
    this.vertexData[i + 4] = r;
    this.vertexData[i + 5] = g;
    this.vertexData[i + 6] = b;
    this.vertexData[i + 7] = a;

    this.vertexData[i + 8] = x2;
    this.vertexData[i + 9] = y1;
    this.vertexData[i + 10] = u1;
    this.vertexData[i + 11] = v0;
    this.vertexData[i + 12] = r;
    this.vertexData[i + 13] = g;
    this.vertexData[i + 14] = b;
    this.vertexData[i + 15] = a;

    this.vertexData[i + 16] = x2;
    this.vertexData[i + 17] = y2;
    this.vertexData[i + 18] = u1;
    this.vertexData[i + 19] = v1;
    this.vertexData[i + 20] = r;
    this.vertexData[i + 21] = g;
    this.vertexData[i + 22] = b;
    this.vertexData[i + 23] = a;

    // triangle 2
    this.vertexData[i + 24] = x1;
    this.vertexData[i + 25] = y1;
    this.vertexData[i + 26] = u0;
    this.vertexData[i + 27] = v0;
    this.vertexData[i + 28] = r;
    this.vertexData[i + 29] = g;
    this.vertexData[i + 30] = b;
    this.vertexData[i + 31] = a;

    this.vertexData[i + 32] = x2;
    this.vertexData[i + 33] = y2;
    this.vertexData[i + 34] = u1;
    this.vertexData[i + 35] = v1;
    this.vertexData[i + 36] = r;
    this.vertexData[i + 37] = g;
    this.vertexData[i + 38] = b;
    this.vertexData[i + 39] = a;

    this.vertexData[i + 40] = x1;
    this.vertexData[i + 41] = y2;
    this.vertexData[i + 42] = u0;
    this.vertexData[i + 43] = v1;
    this.vertexData[i + 44] = r;
    this.vertexData[i + 45] = g;
    this.vertexData[i + 46] = b;
    this.vertexData[i + 47] = a;

    this.spriteCount++;
  }

  drawRegion(
    name: string,
    frameIndex: number,
    x: number,
    y: number,
    width?: number,
    height?: number,
    r = 1,
    g = 1,
    b = 1,
    a = 1,
    flipX = false,
    flipY = false
  ): void {
    if (!this.atlas) return;
    const frame = this.atlas.getFrame(name, frameIndex);
    if (frame) {
      this.draw(frame, x, y, width, height, r, g, b, a, flipX, flipY);
    }
  }

  flush(): void {
    if (this.spriteCount === 0) return;

    const gl = this.gl;

    this.shader.use();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertexData.subarray(0, this.spriteCount * FLOATS_PER_SPRITE));

    const stride = FLOATS_PER_VERTEX * 4;

    const posLoc = this.shader.getAttribLocation('a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, stride, 0);

    const texLoc = this.shader.getAttribLocation('a_texCoord');
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, stride, 8);

    const colorLoc = this.shader.getAttribLocation('a_color');
    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, stride, 16);

    if (this.atlas) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.atlas.texture);
      this.shader.setUniform1i('u_texture', 0);
    }

    gl.drawArrays(gl.TRIANGLES, 0, this.spriteCount * VERTICES_PER_SPRITE);
    this.spriteCount = 0;
  }

  end(): void {
    if (!this.drawing) return;
    this.flush();
    this.drawing = false;
  }
}
